namespace TeamFlow.Application.Boards;

/// <summary>Board structure for the active workspace: boards, their columns, and their labels.</summary>
public interface IBoardService
{
    Task<IReadOnlyList<BoardSummaryDto>> ListBoardsAsync(CancellationToken ct = default);
    Task<BoardDetailDto> GetBoardAsync(Guid boardId, CancellationToken ct = default);
    Task<BoardDetailDto> CreateBoardAsync(CreateBoardRequest request, CancellationToken ct = default);
    Task<BoardDetailDto> UpdateBoardAsync(Guid boardId, UpdateBoardRequest request, CancellationToken ct = default);
    Task DeleteBoardAsync(Guid boardId, CancellationToken ct = default);

    Task<ColumnDto> CreateColumnAsync(Guid boardId, CreateColumnRequest request, CancellationToken ct = default);
    Task<ColumnDto> UpdateColumnAsync(Guid columnId, UpdateColumnRequest request, CancellationToken ct = default);
    Task DeleteColumnAsync(Guid columnId, CancellationToken ct = default);
    Task ReorderColumnsAsync(Guid boardId, ReorderColumnsRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<LabelDto>> ListLabelsAsync(Guid boardId, CancellationToken ct = default);
    Task<LabelDto> CreateLabelAsync(Guid boardId, CreateLabelRequest request, CancellationToken ct = default);
    Task<LabelDto> UpdateLabelAsync(Guid labelId, UpdateLabelRequest request, CancellationToken ct = default);
    Task DeleteLabelAsync(Guid labelId, CancellationToken ct = default);
}
