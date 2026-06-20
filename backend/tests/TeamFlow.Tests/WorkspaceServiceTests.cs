using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Workspaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;
using TeamFlow.Infrastructure.Auth;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Tests;

public class WorkspaceServiceTests
{
    private sealed record Ctx(
        WorkspaceService Svc, TeamFlowDbContext Db, TenantContext Tenant, FakeCurrentUser User,
        Guid WorkspaceId, Guid AlexId, Guid AlexMemberId, Guid SamId, Guid SamMemberId);

    private static Ctx Setup()
    {
        var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var tenant = new TenantContext();
        var user = new FakeCurrentUser();
        var db = new TeamFlowDbContext(
            new DbContextOptionsBuilder<TeamFlowDbContext>()
                .UseInMemoryDatabase($"tf-ws-{Guid.NewGuid()}").Options,
            tenant);

        var alex = new User { Email = "alex@acme.test", DisplayName = "Alex", PasswordHash = "x" };
        var sam = new User { Email = "sam@acme.test", DisplayName = "Sam", PasswordHash = "x" };
        var ws = new Workspace { Name = "Acme", Slug = "acme", Key = "ACME", OwnerId = alex.Id };
        var alexMember = new WorkspaceMember { WorkspaceId = ws.Id, UserId = alex.Id, Role = WorkspaceRole.Owner };
        var samMember = new WorkspaceMember { WorkspaceId = ws.Id, UserId = sam.Id, Role = WorkspaceRole.Member };
        db.Users.AddRange(alex, sam);
        db.Workspaces.Add(ws);
        db.WorkspaceMembers.AddRange(alexMember, samMember);
        db.SaveChanges();

        var svc = new WorkspaceService(
            db, user, tenant, new TokenHasher(), clock, Options.Create(new AuthSettings()),
            new InviteRequestValidator(), new ChangeRoleRequestValidator(), new AcceptInviteRequestValidator());

        return new Ctx(svc, db, tenant, user, ws.Id, alex.Id, alexMember.Id, sam.Id, samMember.Id);
    }

    private static void ActAs(Ctx c, Guid userId, WorkspaceRole role)
    {
        c.User.UserId = userId;
        c.Tenant.Set(c.WorkspaceId);
        c.Tenant.SetRole(role);
    }

    [Fact]
    public async Task CreateInvitation_AsOwner_CreatesPendingInvite()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);

        var created = await c.Svc.CreateInvitationAsync(new InviteRequest("newbie@acme.test", WorkspaceRole.Member));

        Assert.False(string.IsNullOrWhiteSpace(created.Token));
        Assert.Contains("token=", created.AcceptUrl);
        var invite = await c.Db.Invitations.SingleAsync();
        Assert.Equal("newbie@acme.test", invite.Email);
        Assert.Equal(InvitationStatus.Pending, invite.Status);
        Assert.Equal(c.WorkspaceId, invite.WorkspaceId);
    }

    [Fact]
    public async Task CreateInvitation_AdminCannotInviteAdmin()
    {
        var c = Setup();
        ActAs(c, c.SamId, WorkspaceRole.Admin);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => c.Svc.CreateInvitationAsync(new InviteRequest("boss@acme.test", WorkspaceRole.Admin)));
    }

    [Fact]
    public async Task CreateInvitation_ExistingMember_Throws()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => c.Svc.CreateInvitationAsync(new InviteRequest("sam@acme.test", WorkspaceRole.Member)));
        Assert.Equal("already_member", ex.Code);
    }

    [Fact]
    public async Task AcceptInvitation_JoinsWorkspace()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);
        var created = await c.Svc.CreateInvitationAsync(new InviteRequest("newbie@acme.test", WorkspaceRole.Member));

        var newbie = new User { Email = "newbie@acme.test", DisplayName = "Newbie", PasswordHash = "x" };
        c.Db.Users.Add(newbie);
        await c.Db.SaveChangesAsync();

        // Accepting is tenant-independent: clear the workspace context.
        c.User.UserId = newbie.Id;
        c.Tenant.Set(null);
        c.Tenant.SetRole(null);

        var result = await c.Svc.AcceptInvitationAsync(new AcceptInviteRequest(created.Token));

        Assert.Equal(c.WorkspaceId, result.WorkspaceId);
        Assert.Equal(WorkspaceRole.Member, result.Role);
        var membership = await c.Db.WorkspaceMembers
            .IgnoreQueryFilters()
            .SingleAsync(m => m.WorkspaceId == c.WorkspaceId && m.UserId == newbie.Id);
        Assert.Equal(WorkspaceRole.Member, membership.Role);

        var invite = await c.Db.Invitations.IgnoreQueryFilters().SingleAsync();
        Assert.Equal(InvitationStatus.Accepted, invite.Status);
    }

    [Fact]
    public async Task AcceptInvitation_EmailMismatch_Throws()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);
        var created = await c.Svc.CreateInvitationAsync(new InviteRequest("newbie@acme.test", WorkspaceRole.Member));

        var other = new User { Email = "intruder@acme.test", DisplayName = "Intruder", PasswordHash = "x" };
        c.Db.Users.Add(other);
        await c.Db.SaveChangesAsync();

        c.User.UserId = other.Id;
        c.Tenant.Set(null);
        c.Tenant.SetRole(null);

        var ex = await Assert.ThrowsAsync<ForbiddenException>(
            () => c.Svc.AcceptInvitationAsync(new AcceptInviteRequest(created.Token)));
        Assert.Equal("invite_email_mismatch", ex.Code);
    }

    [Fact]
    public async Task ChangeMemberRole_DemotingLastOwner_Throws()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);

        var ex = await Assert.ThrowsAsync<ConflictException>(
            () => c.Svc.ChangeMemberRoleAsync(c.AlexMemberId, new ChangeRoleRequest(WorkspaceRole.Member)));
        Assert.Equal("last_owner", ex.Code);
    }

    [Fact]
    public async Task ChangeMemberRole_PromoteMember_Succeeds()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);

        var updated = await c.Svc.ChangeMemberRoleAsync(c.SamMemberId, new ChangeRoleRequest(WorkspaceRole.Admin));

        Assert.Equal(WorkspaceRole.Admin, updated.Role);
    }

    [Fact]
    public async Task RemoveMember_AdminCannotRemoveOwner()
    {
        var c = Setup();
        ActAs(c, c.SamId, WorkspaceRole.Admin);

        await Assert.ThrowsAsync<ForbiddenException>(() => c.Svc.RemoveMemberAsync(c.AlexMemberId));
    }

    [Fact]
    public async Task RemoveMember_OwnerRemovesMember_Succeeds()
    {
        var c = Setup();
        ActAs(c, c.AlexId, WorkspaceRole.Owner);

        await c.Svc.RemoveMemberAsync(c.SamMemberId);

        Assert.False(await c.Db.WorkspaceMembers.AnyAsync(m => m.Id == c.SamMemberId));
    }
}
