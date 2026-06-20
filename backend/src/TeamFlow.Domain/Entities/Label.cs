using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>A colored label scoped to a board, attachable to cards.</summary>
public class Label : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }
    public Guid BoardId { get; set; }
    public Board? Board { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Hex color (e.g. "#5B5BD6").</summary>
    public string Color { get; set; } = "#5B5BD6";

    public ICollection<CardLabel> CardLabels { get; set; } = new List<CardLabel>();
}
