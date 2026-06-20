using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>Join between a card and a label (many-to-many).</summary>
public class CardLabel : ITenantOwned
{
    public Guid WorkspaceId { get; set; }

    public Guid CardId { get; set; }
    public Card? Card { get; set; }

    public Guid LabelId { get; set; }
    public Label? Label { get; set; }
}
