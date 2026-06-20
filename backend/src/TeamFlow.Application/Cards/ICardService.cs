namespace TeamFlow.Application.Cards;

/// <summary>Card lifecycle, commenting, and the activity feed for the active workspace.</summary>
public interface ICardService
{
    Task<CardDetailDto> GetCardAsync(Guid cardId, CancellationToken ct = default);
    Task<CardDetailDto> CreateCardAsync(CreateCardRequest request, CancellationToken ct = default);
    Task<CardDetailDto> UpdateCardAsync(Guid cardId, UpdateCardRequest request, CancellationToken ct = default);
    Task<CardDetailDto> MoveCardAsync(Guid cardId, MoveCardRequest request, CancellationToken ct = default);
    Task<CardDetailDto> SetCardLabelsAsync(Guid cardId, SetCardLabelsRequest request, CancellationToken ct = default);
    Task DeleteCardAsync(Guid cardId, CancellationToken ct = default);

    Task<CommentDto> AddCommentAsync(Guid cardId, AddCommentRequest request, CancellationToken ct = default);
    Task DeleteCommentAsync(Guid commentId, CancellationToken ct = default);

    Task<IReadOnlyList<ActivityDto>> ListActivityAsync(Guid? boardId, int take, CancellationToken ct = default);
}
