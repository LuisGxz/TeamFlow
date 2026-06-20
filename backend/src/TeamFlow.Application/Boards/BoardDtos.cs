using TeamFlow.Application.Common.Models;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Boards;

// ---- Shared projections (also used by the Cards feature) ----

public record LabelDto(Guid Id, string Name, string Color);

public record CardSummaryDto(
    Guid Id,
    int Number,
    string Reference,
    string Title,
    Guid ColumnId,
    double Position,
    Priority Priority,
    DateOnly? DueDate,
    UserMiniDto? Assignee,
    bool IsCompleted,
    IReadOnlyList<LabelDto> Labels,
    int CommentCount,
    DateTimeOffset UpdatedAt);

// ---- Board projections ----

public record BoardSummaryDto(Guid Id, string Name, string Slug, string Description, int Position, int CardCount, DateTimeOffset UpdatedAt);

public record ColumnDto(Guid Id, string Name, int Position, int? WipLimit, bool IsDone, IReadOnlyList<CardSummaryDto> Cards);

public record BoardDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    string WorkspaceKey,
    IReadOnlyList<ColumnDto> Columns,
    IReadOnlyList<LabelDto> Labels);

// ---- Requests ----

public record CreateBoardRequest(string Name, string? Description);

public record UpdateBoardRequest(string Name, string? Description);

public record CreateColumnRequest(string Name, int? WipLimit, bool IsDone);

public record UpdateColumnRequest(string Name, int? WipLimit, bool IsDone);

public record ReorderColumnsRequest(IReadOnlyList<Guid> ColumnIds);

public record CreateLabelRequest(string Name, string Color);

public record UpdateLabelRequest(string Name, string Color);
