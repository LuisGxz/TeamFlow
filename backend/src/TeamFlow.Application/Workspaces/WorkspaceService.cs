using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Workspaces;

public sealed class WorkspaceService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IWorkspaceContext workspace,
    ITokenHasher tokenHasher,
    IClock clock,
    IOptions<AuthSettings> authSettings,
    IValidator<InviteRequest> inviteValidator,
    IValidator<ChangeRoleRequest> changeRoleValidator,
    IValidator<AcceptInviteRequest> acceptValidator) : IWorkspaceService
{
    private readonly AuthSettings _auth = authSettings.Value;

    private Guid WorkspaceId => workspace.WorkspaceId
        ?? throw new BadRequestException("No workspace selected. Send the X-Workspace-Id header.", "no_workspace");
    private WorkspaceRole ActingRole => workspace.Role
        ?? throw new ForbiddenException("Not a member of this workspace.");
    private Guid UserId => currentUser.UserId
        ?? throw new UnauthorizedException("Authentication required.");

    public async Task<IReadOnlyList<MemberDto>> ListMembersAsync(CancellationToken ct = default) =>
        await db.WorkspaceMembers
            .Where(m => m.WorkspaceId == WorkspaceId)
            .OrderByDescending(m => m.Role)
            .ThenBy(m => m.User!.DisplayName)
            .Select(m => new MemberDto(
                m.Id, m.UserId, m.User!.DisplayName, m.User.Email, m.User.AvatarHue, m.Role, m.CreatedAt))
            .ToListAsync(ct);

    public async Task<MemberDto> ChangeMemberRoleAsync(Guid memberId, ChangeRoleRequest request, CancellationToken ct = default)
    {
        await changeRoleValidator.ValidateAndThrowAsync(request, ct);

        var member = await db.WorkspaceMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == memberId && m.WorkspaceId == WorkspaceId, ct)
            ?? throw new NotFoundException("Member not found.");

        var newRole = request.Role;

        // Owner is involved on either side → only an Owner may make the change.
        if ((member.Role == WorkspaceRole.Owner || newRole == WorkspaceRole.Owner) && ActingRole != WorkspaceRole.Owner)
            throw new ForbiddenException("Only an Owner can manage Owner-level roles.");

        // Never strip the last Owner of their ownership.
        if (member.Role == WorkspaceRole.Owner && newRole != WorkspaceRole.Owner && await IsLastOwnerAsync(ct))
            throw new ConflictException("A workspace must keep at least one Owner.", "last_owner");

        member.Role = newRole;
        await db.SaveChangesAsync(ct);

        return new MemberDto(member.Id, member.UserId, member.User!.DisplayName, member.User.Email,
            member.User.AvatarHue, member.Role, member.CreatedAt);
    }

    public async Task RemoveMemberAsync(Guid memberId, CancellationToken ct = default)
    {
        var member = await db.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.Id == memberId && m.WorkspaceId == WorkspaceId, ct)
            ?? throw new NotFoundException("Member not found.");

        // Removing an Admin/Owner requires Owner authority; removing the last Owner is never allowed.
        if (member.Role >= WorkspaceRole.Admin && ActingRole != WorkspaceRole.Owner)
            throw new ForbiddenException("Only an Owner can remove Admins or Owners.");
        if (member.Role == WorkspaceRole.Owner && await IsLastOwnerAsync(ct))
            throw new ConflictException("A workspace must keep at least one Owner.", "last_owner");

        db.WorkspaceMembers.Remove(member);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<InvitationDto>> ListInvitationsAsync(CancellationToken ct = default) =>
        await db.Invitations
            .Where(i => i.Status == InvitationStatus.Pending)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvitationDto(
                i.Id, i.Email, i.Role, i.Status, i.ExpiresAt, i.InvitedBy!.DisplayName, i.CreatedAt))
            .ToListAsync(ct);

    public async Task<InvitationCreatedDto> CreateInvitationAsync(InviteRequest request, CancellationToken ct = default)
    {
        await inviteValidator.ValidateAndThrowAsync(request, ct);

        // Granting Admin is an Owner-only action.
        if (request.Role == WorkspaceRole.Admin && ActingRole != WorkspaceRole.Owner)
            throw new ForbiddenException("Only an Owner can invite Admins.");

        var email = request.Email.Trim().ToLowerInvariant();

        var alreadyMember = await db.WorkspaceMembers
            .AnyAsync(m => m.WorkspaceId == WorkspaceId && m.User!.Email == email, ct);
        if (alreadyMember)
            throw new ConflictException("That person is already a member of this workspace.", "already_member");

        // Supersede any outstanding pending invite for the same email.
        var pending = await db.Invitations.Where(i => i.Email == email && i.Status == InvitationStatus.Pending).ToListAsync(ct);
        foreach (var old in pending)
            old.Status = InvitationStatus.Revoked;

        var raw = tokenHasher.GenerateRawToken();
        var invitation = new Invitation
        {
            WorkspaceId = WorkspaceId,
            Email = email,
            Role = request.Role,
            TokenHash = tokenHasher.Hash(raw),
            ExpiresAt = clock.UtcNow.AddDays(_auth.InvitationDays),
            InvitedById = UserId,
        };
        db.Invitations.Add(invitation);
        await db.SaveChangesAsync(ct);

        var inviterName = await db.Users.Where(u => u.Id == UserId).Select(u => u.DisplayName).FirstOrDefaultAsync(ct) ?? "A teammate";
        var dto = new InvitationDto(invitation.Id, invitation.Email, invitation.Role, invitation.Status,
            invitation.ExpiresAt, inviterName, invitation.CreatedAt);
        var acceptUrl = $"{_auth.WebAppBaseUrl.TrimEnd('/')}/invite?token={raw}";
        return new InvitationCreatedDto(dto, raw, acceptUrl);
    }

    public async Task RevokeInvitationAsync(Guid invitationId, CancellationToken ct = default)
    {
        var invitation = await db.Invitations.FirstOrDefaultAsync(i => i.Id == invitationId, ct)
            ?? throw new NotFoundException("Invitation not found.");
        if (invitation.Status == InvitationStatus.Pending)
        {
            invitation.Status = InvitationStatus.Revoked;
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<AcceptInviteResultDto> AcceptInvitationAsync(AcceptInviteRequest request, CancellationToken ct = default)
    {
        await acceptValidator.ValidateAndThrowAsync(request, ct);

        var hash = tokenHasher.Hash(request.Token);
        // No tenant is selected when accepting, so bypass the row filter to find the invite by token.
        var invitation = await db.Invitations.IgnoreQueryFilters()
            .Include(i => i.Workspace)
            .FirstOrDefaultAsync(i => i.TokenHash == hash, ct)
            ?? throw new NotFoundException("Invitation not found.", "invalid_invite");

        var now = clock.UtcNow;
        if (!invitation.IsRedeemable(now))
            throw new BadRequestException("This invitation is no longer valid.", "invite_not_redeemable");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == UserId, ct)
            ?? throw new UnauthorizedException("Authentication required.");
        if (!string.Equals(user.Email, invitation.Email, StringComparison.OrdinalIgnoreCase))
            throw new ForbiddenException("This invitation was issued to a different email address.", "invite_email_mismatch");

        var existing = await db.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == invitation.WorkspaceId && m.UserId == UserId, ct);
        if (existing is null)
        {
            db.WorkspaceMembers.Add(new WorkspaceMember
            {
                WorkspaceId = invitation.WorkspaceId,
                UserId = UserId,
                Role = invitation.Role,
            });
        }

        invitation.Status = InvitationStatus.Accepted;
        invitation.AcceptedAt = now;
        await db.SaveChangesAsync(ct);

        var role = existing?.Role ?? invitation.Role;
        return new AcceptInviteResultDto(invitation.WorkspaceId, invitation.Workspace!.Name, role);
    }

    private async Task<bool> IsLastOwnerAsync(CancellationToken ct) =>
        await db.WorkspaceMembers.CountAsync(m => m.WorkspaceId == WorkspaceId && m.Role == WorkspaceRole.Owner, ct) <= 1;
}
