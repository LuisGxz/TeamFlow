using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Infrastructure.Multitenancy;

/// <summary>
/// Scoped holder for the current request's workspace and the caller's role within it, set by the
/// tenant-resolution middleware. Serves both <see cref="ITenantContext"/> (consumed by the DbContext's
/// row-level filter) and <see cref="IWorkspaceContext"/> (consumed by RBAC), so they never disagree.
/// </summary>
public class TenantContext : ITenantContext, IWorkspaceContext
{
    public Guid? WorkspaceId { get; private set; }
    public WorkspaceRole? Role { get; private set; }

    public void Set(Guid? workspaceId) => WorkspaceId = workspaceId;

    public void SetRole(WorkspaceRole? role) => Role = role;
}
