using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Common.Interfaces;

/// <summary>
/// The current request's workspace plus the caller's role within it. Set by the tenant-resolution
/// middleware after it confirms membership; consumed by RBAC checks. Shares its backing instance with
/// <see cref="ITenantContext"/> so the row-level filter and authorization see the same workspace.
/// </summary>
public interface IWorkspaceContext
{
    Guid? WorkspaceId { get; }
    WorkspaceRole? Role { get; }
}
