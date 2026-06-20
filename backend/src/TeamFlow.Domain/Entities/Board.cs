using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>A Kanban board: an ordered set of columns holding cards. Tenant-owned.</summary>
public class Board : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Position { get; set; }

    /// <summary>Monotonic counter for card references within this board (ENG-1, ENG-2, …).</summary>
    public int CardCounter { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<BoardColumn> Columns { get; set; } = new List<BoardColumn>();
    public ICollection<Label> Labels { get; set; } = new List<Label>();
}
