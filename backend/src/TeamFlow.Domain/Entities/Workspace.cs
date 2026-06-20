using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>The tenant root. Every tenant-owned entity belongs to exactly one workspace.</summary>
public class Workspace : Entity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>Short uppercase key used to build card references, e.g. "ENG" → ENG-42.</summary>
    public string Key { get; set; } = string.Empty;

    public Guid OwnerId { get; set; }
    public User? Owner { get; set; }

    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
    public ICollection<Board> Boards { get; set; } = new List<Board>();
}
