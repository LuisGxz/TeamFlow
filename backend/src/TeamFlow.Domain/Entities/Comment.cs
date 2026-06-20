using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>A comment on a card.</summary>
public class Comment : Entity, ITenantOwned
{
    public Guid WorkspaceId { get; set; }

    public Guid CardId { get; set; }
    public Card? Card { get; set; }

    public Guid AuthorId { get; set; }
    public User? Author { get; set; }

    public string Body { get; set; } = string.Empty;
}
