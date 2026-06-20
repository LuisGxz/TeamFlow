using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>A column (status lane) on a board, holding an ordered list of cards.</summary>
public class BoardColumn : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Guid BoardId { get; set; }
    public Board? Board { get; set; }

    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }

    /// <summary>Optional work-in-progress limit; null means unlimited.</summary>
    public int? WipLimit { get; set; }

    /// <summary>Marks the "done" lane — cards moved here are flagged completed.</summary>
    public bool IsDone { get; set; }

    public ICollection<Card> Cards { get; set; } = new List<Card>();
}
