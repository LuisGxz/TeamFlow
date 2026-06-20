using TeamFlow.Application.Common.Models;
using TeamFlow.Domain.Entities;

namespace TeamFlow.Application.Boards;

/// <summary>Shared mapping from a loaded <see cref="Card"/> to its summary DTO (reference = KEY-number).</summary>
public static class CardMapper
{
    public static CardSummaryDto ToSummary(Card card, string workspaceKey) => new(
        card.Id,
        card.Number,
        $"{workspaceKey}-{card.Number}",
        card.Title,
        card.ColumnId,
        card.Position,
        card.Priority,
        card.DueDate,
        card.Assignee is null ? null : ToMini(card.Assignee),
        card.IsCompleted,
        card.CardLabels
            .Where(cl => cl.Label is not null)
            .Select(cl => new LabelDto(cl.Label!.Id, cl.Label.Name, cl.Label.Color))
            .ToList(),
        card.Comments.Count,
        card.UpdatedAt);

    public static UserMiniDto ToMini(User u) => new(u.Id, u.DisplayName, u.Email, u.AvatarHue);
}
