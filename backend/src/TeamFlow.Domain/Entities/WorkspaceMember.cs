using TeamFlow.Domain.Common;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Domain.Entities;

/// <summary>Join entity carrying a user's role within a workspace (per-tenant RBAC).</summary>
public class WorkspaceMember : Entity
{
    public Guid WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
}
