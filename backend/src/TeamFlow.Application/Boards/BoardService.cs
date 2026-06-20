using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Boards;

public sealed class BoardService(
    IAppDbContext db,
    IClock clock,
    IActivityRecorder activity,
    IWorkspaceContext workspace,
    IValidator<CreateBoardRequest> createBoardValidator,
    IValidator<UpdateBoardRequest> updateBoardValidator,
    IValidator<CreateColumnRequest> createColumnValidator,
    IValidator<UpdateColumnRequest> updateColumnValidator,
    IValidator<CreateLabelRequest> createLabelValidator,
    IValidator<UpdateLabelRequest> updateLabelValidator) : IBoardService
{
    private static readonly (string Name, bool IsDone)[] DefaultColumns =
        [("Backlog", false), ("To do", false), ("In progress", false), ("Done", true)];

    public async Task<IReadOnlyList<BoardSummaryDto>> ListBoardsAsync(CancellationToken ct = default) =>
        await db.Boards
            .OrderBy(b => b.Position)
            .Select(b => new BoardSummaryDto(
                b.Id, b.Name, b.Slug, b.Description, b.Position,
                db.Cards.Count(c => c.BoardId == b.Id), b.UpdatedAt))
            .ToListAsync(ct);

    public async Task<BoardDetailDto> GetBoardAsync(Guid boardId, CancellationToken ct = default)
    {
        var board = await LoadBoardGraphAsync(boardId, ct);
        var key = await WorkspaceKeyAsync(ct);
        return ToDetail(board, key);
    }

    public async Task<BoardDetailDto> CreateBoardAsync(CreateBoardRequest request, CancellationToken ct = default)
    {
        await createBoardValidator.ValidateAndThrowAsync(request, ct);

        var name = request.Name.Trim();
        var board = new Board
        {
            Name = name,
            Slug = await UniqueBoardSlugAsync(name, ct),
            Description = request.Description?.Trim() ?? string.Empty,
            Position = await NextPositionAsync(db.Boards.Select(b => b.Position), ct),
        };
        for (var i = 0; i < DefaultColumns.Length; i++)
            board.Columns.Add(new BoardColumn { Name = DefaultColumns[i].Name, Position = i, IsDone = DefaultColumns[i].IsDone });

        db.Boards.Add(board);
        activity.Record(ActivityType.BoardCreated, $"created board {name}", board.Id);
        await db.SaveChangesAsync(ct);

        return await GetBoardAsync(board.Id, ct);
    }

    public async Task<BoardDetailDto> UpdateBoardAsync(Guid boardId, UpdateBoardRequest request, CancellationToken ct = default)
    {
        await updateBoardValidator.ValidateAndThrowAsync(request, ct);

        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct)
            ?? throw new NotFoundException("Board not found.");
        board.Name = request.Name.Trim();
        board.Description = request.Description?.Trim() ?? string.Empty;
        board.UpdatedAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);

        return await GetBoardAsync(board.Id, ct);
    }

    public async Task DeleteBoardAsync(Guid boardId, CancellationToken ct = default)
    {
        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct)
            ?? throw new NotFoundException("Board not found.");
        db.Boards.Remove(board);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ColumnDto> CreateColumnAsync(Guid boardId, CreateColumnRequest request, CancellationToken ct = default)
    {
        await createColumnValidator.ValidateAndThrowAsync(request, ct);

        var board = await db.Boards.FirstOrDefaultAsync(b => b.Id == boardId, ct)
            ?? throw new NotFoundException("Board not found.");

        var column = new BoardColumn
        {
            BoardId = board.Id,
            Name = request.Name.Trim(),
            WipLimit = request.WipLimit,
            IsDone = request.IsDone,
            Position = await NextPositionAsync(db.BoardColumns.Where(c => c.BoardId == boardId).Select(c => c.Position), ct),
        };
        db.BoardColumns.Add(column);
        await db.SaveChangesAsync(ct);

        return new ColumnDto(column.Id, column.Name, column.Position, column.WipLimit, column.IsDone, []);
    }

    public async Task<ColumnDto> UpdateColumnAsync(Guid columnId, UpdateColumnRequest request, CancellationToken ct = default)
    {
        await updateColumnValidator.ValidateAndThrowAsync(request, ct);

        var column = await db.BoardColumns.FirstOrDefaultAsync(c => c.Id == columnId, ct)
            ?? throw new NotFoundException("Column not found.");
        column.Name = request.Name.Trim();
        column.WipLimit = request.WipLimit;
        column.IsDone = request.IsDone;
        await db.SaveChangesAsync(ct);

        return new ColumnDto(column.Id, column.Name, column.Position, column.WipLimit, column.IsDone, []);
    }

    public async Task DeleteColumnAsync(Guid columnId, CancellationToken ct = default)
    {
        var column = await db.BoardColumns.FirstOrDefaultAsync(c => c.Id == columnId, ct)
            ?? throw new NotFoundException("Column not found.");

        var remaining = await db.BoardColumns.CountAsync(c => c.BoardId == column.BoardId, ct);
        if (remaining <= 1)
            throw new ConflictException("A board must keep at least one column.", "last_column");

        db.BoardColumns.Remove(column); // cascades to its cards
        await db.SaveChangesAsync(ct);
    }

    public async Task ReorderColumnsAsync(Guid boardId, ReorderColumnsRequest request, CancellationToken ct = default)
    {
        var columns = await db.BoardColumns.Where(c => c.BoardId == boardId).ToListAsync(ct);
        var order = request.ColumnIds.Select((id, index) => (id, index)).ToDictionary(x => x.id, x => x.index);
        foreach (var column in columns)
            if (order.TryGetValue(column.Id, out var position))
                column.Position = position;
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<LabelDto>> ListLabelsAsync(Guid boardId, CancellationToken ct = default) =>
        await db.Labels
            .Where(l => l.BoardId == boardId)
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto(l.Id, l.Name, l.Color))
            .ToListAsync(ct);

    public async Task<LabelDto> CreateLabelAsync(Guid boardId, CreateLabelRequest request, CancellationToken ct = default)
    {
        await createLabelValidator.ValidateAndThrowAsync(request, ct);

        if (!await db.Boards.AnyAsync(b => b.Id == boardId, ct))
            throw new NotFoundException("Board not found.");

        var label = new Label { BoardId = boardId, Name = request.Name.Trim(), Color = request.Color };
        db.Labels.Add(label);
        await db.SaveChangesAsync(ct);

        return new LabelDto(label.Id, label.Name, label.Color);
    }

    public async Task<LabelDto> UpdateLabelAsync(Guid labelId, UpdateLabelRequest request, CancellationToken ct = default)
    {
        await updateLabelValidator.ValidateAndThrowAsync(request, ct);

        var label = await db.Labels.FirstOrDefaultAsync(l => l.Id == labelId, ct)
            ?? throw new NotFoundException("Label not found.");
        label.Name = request.Name.Trim();
        label.Color = request.Color;
        await db.SaveChangesAsync(ct);

        return new LabelDto(label.Id, label.Name, label.Color);
    }

    public async Task DeleteLabelAsync(Guid labelId, CancellationToken ct = default)
    {
        var label = await db.Labels.FirstOrDefaultAsync(l => l.Id == labelId, ct)
            ?? throw new NotFoundException("Label not found.");
        db.Labels.Remove(label); // cascades to its card_labels
        await db.SaveChangesAsync(ct);
    }

    // ---- helpers ----

    private async Task<Board> LoadBoardGraphAsync(Guid boardId, CancellationToken ct) =>
        await db.Boards
            .Include(b => b.Labels)
            .Include(b => b.Columns).ThenInclude(c => c.Cards).ThenInclude(card => card.Assignee)
            .Include(b => b.Columns).ThenInclude(c => c.Cards).ThenInclude(card => card.CardLabels).ThenInclude(cl => cl.Label)
            .Include(b => b.Columns).ThenInclude(c => c.Cards).ThenInclude(card => card.Comments)
            .FirstOrDefaultAsync(b => b.Id == boardId, ct)
        ?? throw new NotFoundException("Board not found.");

    private static BoardDetailDto ToDetail(Board board, string key) => new(
        board.Id, board.Name, board.Slug, board.Description, key,
        board.Columns
            .OrderBy(c => c.Position)
            .Select(c => new ColumnDto(
                c.Id, c.Name, c.Position, c.WipLimit, c.IsDone,
                c.Cards.OrderBy(card => card.Position).Select(card => CardMapper.ToSummary(card, key)).ToList()))
            .ToList(),
        board.Labels.OrderBy(l => l.Name).Select(l => new LabelDto(l.Id, l.Name, l.Color)).ToList());

    private async Task<string> WorkspaceKeyAsync(CancellationToken ct)
    {
        var wsId = workspace.WorkspaceId;
        return await db.Workspaces.Where(w => w.Id == wsId).Select(w => w.Key).FirstOrDefaultAsync(ct) ?? "WS";
    }

    private async Task<string> UniqueBoardSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = Slugger.ToSlug(name);
        var slug = baseSlug;
        for (var i = 2; await db.Boards.AnyAsync(b => b.Slug == slug, ct); i++)
            slug = $"{baseSlug}-{i}";
        return slug;
    }

    private static async Task<int> NextPositionAsync(IQueryable<int> positions, CancellationToken ct) =>
        await positions.AnyAsync(ct) ? await positions.MaxAsync(ct) + 1 : 0;
}
