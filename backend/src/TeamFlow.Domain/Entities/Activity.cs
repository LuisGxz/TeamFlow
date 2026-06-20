using TeamFlow.Domain.Common;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Domain.Entities;

/// <summary>An entry in the workspace/board activity feed.</summary>
public class Activity : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Guid? BoardId { get; set; }
    public Guid? CardId { get; set; }

    public Guid ActorId { get; set; }
    public User? Actor { get; set; }

    public ActivityType Type { get; set; }

    /// <summary>Human-readable summary, prebuilt at write time (e.g. "moved ENG-12 to In progress").</summary>
    public string Summary { get; set; } = string.Empty;
}
