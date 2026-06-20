using TeamFlow.Domain.Common;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Domain.Entities;

/// <summary>An invitation to join a workspace at a given role. The raw token is emailed; only its hash is stored.</summary>
public class Invitation : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    public string Email { get; set; } = string.Empty;
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;

    public string TokenHash { get; set; } = string.Empty;
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }

    public Guid InvitedById { get; set; }
    public User? InvitedBy { get; set; }

    public bool IsRedeemable(DateTimeOffset now) => Status == InvitationStatus.Pending && now < ExpiresAt;
}
