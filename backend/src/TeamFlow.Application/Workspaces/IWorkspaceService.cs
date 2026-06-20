namespace TeamFlow.Application.Workspaces;

/// <summary>
/// Membership and invitation management for the current workspace (tenant). All read/write operations are
/// scoped by the tenant context; the finer Owner/Admin rules are enforced here against the caller's role.
/// </summary>
public interface IWorkspaceService
{
    Task<IReadOnlyList<MemberDto>> ListMembersAsync(CancellationToken ct = default);

    Task<MemberDto> ChangeMemberRoleAsync(Guid memberId, ChangeRoleRequest request, CancellationToken ct = default);

    Task RemoveMemberAsync(Guid memberId, CancellationToken ct = default);

    Task<IReadOnlyList<InvitationDto>> ListInvitationsAsync(CancellationToken ct = default);

    Task<InvitationCreatedDto> CreateInvitationAsync(InviteRequest request, CancellationToken ct = default);

    Task RevokeInvitationAsync(Guid invitationId, CancellationToken ct = default);

    /// <summary>Redeems an invitation for the authenticated user (tenant-independent: no workspace header needed).</summary>
    Task<AcceptInviteResultDto> AcceptInvitationAsync(AcceptInviteRequest request, CancellationToken ct = default);
}
