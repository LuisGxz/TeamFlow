using TeamFlow.Application.Boards;
using TeamFlow.Application.Common.Models;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Cards;

// ---- Projections ----

public record CommentDto(Guid Id, string Body, UserMiniDto Author, DateTimeOffset CreatedAt);

public record ActivityDto(Guid Id, ActivityType Type, string Summary, UserMiniDto Actor, Guid? BoardId, Guid? CardId, DateTimeOffset CreatedAt);

public record CardDetailDto(
    Guid Id,
    int Number,
    string Reference,
    string Title,
    string Description,
    Guid BoardId,
    Guid ColumnId,
    double Position,
    Priority Priority,
    DateOnly? DueDate,
    UserMiniDto? Assignee,
    bool IsCompleted,
    DateTimeOffset? CompletedAt,
    IReadOnlyList<LabelDto> Labels,
    IReadOnlyList<CommentDto> Comments,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

// ---- Requests ----

public record CreateCardRequest(
    Guid ColumnId,
    string Title,
    string? Description,
    Priority? Priority,
    DateOnly? DueDate,
    Guid? AssigneeId,
    IReadOnlyList<Guid>? LabelIds);

public record UpdateCardRequest(
    string Title,
    string? Description,
    Priority Priority,
    DateOnly? DueDate,
    Guid? AssigneeId);

/// <summary>Move a card to a column at a fractional position (client picks the midpoint of its neighbours).</summary>
public record MoveCardRequest(Guid TargetColumnId, double Position);

public record SetCardLabelsRequest(IReadOnlyList<Guid> LabelIds);

public record AddCommentRequest(string Body);
