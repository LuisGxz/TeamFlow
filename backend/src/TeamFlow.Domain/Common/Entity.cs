namespace TeamFlow.Domain.Common;

/// <summary>Base for persisted aggregates: surrogate Guid key + creation timestamp.</summary>
public abstract class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Marks an entity as owned by a tenant (workspace). A global EF query filter scopes every read to the
/// current workspace, so tenant isolation can't be forgotten at the call site.
/// </summary>
public interface ITenantOwned
{
    Guid WorkspaceId { get; set; }
}
