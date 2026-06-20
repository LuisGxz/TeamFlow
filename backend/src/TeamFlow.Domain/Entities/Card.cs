using TeamFlow.Domain.Common;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Domain.Entities;

/// <summary>A task card. Position orders it within its column; Number builds the reference (e.g. ENG-42).</summary>
public class Card : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Guid BoardId { get; set; }
    public Board? Board { get; set; }

    public Guid ColumnId { get; set; }
    public BoardColumn? Column { get; set; }

    public int Number { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Fractional-friendly position within the column (gaps allow cheap reordering).</summary>
    public double Position { get; set; }

    public Priority Priority { get; set; } = Priority.None;
    public DateOnly? DueDate { get; set; }

    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }

    public bool IsCompleted { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CardLabel> CardLabels { get; set; } = new List<CardLabel>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
