namespace TeamFlow.Application.Common.Interfaces;

/// <summary>
/// The workspace (tenant) the current request operates in. Resolved per-request from the
/// authenticated user's membership; null for non-tenant operations (auth, workspace listing, seeding).
/// </summary>
public interface ITenantContext
{
    Guid? WorkspaceId { get; }
    void Set(Guid? workspaceId);
}
