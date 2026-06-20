using FluentValidation;
using Microsoft.EntityFrameworkCore;
using TeamFlow.Application.Boards;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Cards;

public sealed class CardService(
    IAppDbContext db,
    IClock clock,
    IActivityRecorder activity,
    ICurrentUser currentUser,
    IWorkspaceContext workspace,
    IValidator<CreateCardRequest> createValidator,
    IValidator<UpdateCardRequest> updateValidator,
    IValidator<MoveCardRequest> moveValidator,
    IValidator<AddCommentRequest> commentValidator) : ICardService
{
    public async Task<CardDetailDto> GetCardAsync(Guid cardId, CancellationToken ct = default)
        => ToDetail(await LoadCardAsync(cardId, ct), await WorkspaceKeyAsync(ct));

    public async Task<CardDetailDto> CreateCardAsync(CreateCardRequest request, CancellationToken ct = default)
    {
        await createValidator.ValidateAndThrowAsync(request, ct);

        var column = await db.BoardColumns.Include(c => c.Board)
            .FirstOrDefaultAsync(c => c.Id == request.ColumnId, ct)
            ?? throw new NotFoundException("Column not found.");
        var board = column.Board!;

        await EnsureAssigneeAsync(request.AssigneeId, ct);

        var card = new Card
        {
            BoardId = board.Id,
            ColumnId = column.Id,
            Number = ++board.CardCounter,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Priority = request.Priority ?? Priority.None,
            DueDate = request.DueDate,
            AssigneeId = request.AssigneeId,
            Position = await EndPositionAsync(column.Id, ct),
            IsCompleted = column.IsDone,
            CompletedAt = column.IsDone ? clock.UtcNow : null,
            UpdatedAt = clock.UtcNow,
        };

        if (request.LabelIds is { Count: > 0 })
        {
            await EnsureLabelsOnBoardAsync(request.LabelIds, board.Id, ct);
            foreach (var labelId in request.LabelIds.Distinct())
                card.CardLabels.Add(new CardLabel { LabelId = labelId });
        }

        db.Cards.Add(card);
        board.UpdatedAt = clock.UtcNow;
        var key = await WorkspaceKeyAsync(ct);
        activity.Record(ActivityType.CardCreated, $"created {key}-{card.Number}: {card.Title}", board.Id, card.Id);
        await db.SaveChangesAsync(ct);

        return await GetCardAsync(card.Id, ct);
    }

    public async Task<CardDetailDto> UpdateCardAsync(Guid cardId, UpdateCardRequest request, CancellationToken ct = default)
    {
        await updateValidator.ValidateAndThrowAsync(request, ct);

        var card = await db.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct)
            ?? throw new NotFoundException("Card not found.");
        await EnsureAssigneeAsync(request.AssigneeId, ct);

        var assigneeChanged = card.AssigneeId != request.AssigneeId;

        card.Title = request.Title.Trim();
        card.Description = request.Description?.Trim() ?? string.Empty;
        card.Priority = request.Priority;
        card.DueDate = request.DueDate;
        card.AssigneeId = request.AssigneeId;
        card.UpdatedAt = clock.UtcNow;

        var key = await WorkspaceKeyAsync(ct);
        if (assigneeChanged)
        {
            var who = request.AssigneeId is null
                ? "unassigned"
                : "assigned " + await db.Users.Where(u => u.Id == request.AssigneeId).Select(u => u.DisplayName).FirstOrDefaultAsync(ct);
            activity.Record(ActivityType.CardAssigned, $"{who} {key}-{card.Number}", card.BoardId, card.Id);
        }
        else
        {
            activity.Record(ActivityType.CardUpdated, $"updated {key}-{card.Number}", card.BoardId, card.Id);
        }
        await db.SaveChangesAsync(ct);

        return await GetCardAsync(card.Id, ct);
    }

    public async Task<CardDetailDto> MoveCardAsync(Guid cardId, MoveCardRequest request, CancellationToken ct = default)
    {
        await moveValidator.ValidateAndThrowAsync(request, ct);

        var card = await db.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct)
            ?? throw new NotFoundException("Card not found.");
        var target = await db.BoardColumns.FirstOrDefaultAsync(c => c.Id == request.TargetColumnId, ct)
            ?? throw new NotFoundException("Target column not found.");
        if (target.BoardId != card.BoardId)
            throw new BadRequestException("Cards can't be moved across boards.", "cross_board_move");

        card.ColumnId = target.Id;
        card.Position = request.Position;
        card.UpdatedAt = clock.UtcNow;

        var key = await WorkspaceKeyAsync(ct);
        if (target.IsDone && !card.IsCompleted)
        {
            card.IsCompleted = true;
            card.CompletedAt = clock.UtcNow;
            activity.Record(ActivityType.CardCompleted, $"completed {key}-{card.Number}", card.BoardId, card.Id);
        }
        else if (!target.IsDone && card.IsCompleted)
        {
            card.IsCompleted = false;
            card.CompletedAt = null;
            activity.Record(ActivityType.CardReopened, $"reopened {key}-{card.Number}", card.BoardId, card.Id);
        }
        activity.Record(ActivityType.CardMoved, $"moved {key}-{card.Number} to {target.Name}", card.BoardId, card.Id);
        await db.SaveChangesAsync(ct);

        return await GetCardAsync(card.Id, ct);
    }

    public async Task<CardDetailDto> SetCardLabelsAsync(Guid cardId, SetCardLabelsRequest request, CancellationToken ct = default)
    {
        var card = await db.Cards.Include(c => c.CardLabels).FirstOrDefaultAsync(c => c.Id == cardId, ct)
            ?? throw new NotFoundException("Card not found.");

        var wanted = (request.LabelIds ?? []).Distinct().ToHashSet();
        await EnsureLabelsOnBoardAsync(wanted, card.BoardId, ct);

        foreach (var stale in card.CardLabels.Where(cl => !wanted.Contains(cl.LabelId)).ToList())
            card.CardLabels.Remove(stale);
        var existing = card.CardLabels.Select(cl => cl.LabelId).ToHashSet();
        foreach (var labelId in wanted.Where(id => !existing.Contains(id)))
            card.CardLabels.Add(new CardLabel { CardId = card.Id, LabelId = labelId });

        card.UpdatedAt = clock.UtcNow;
        await db.SaveChangesAsync(ct);

        return await GetCardAsync(card.Id, ct);
    }

    public async Task DeleteCardAsync(Guid cardId, CancellationToken ct = default)
    {
        var card = await db.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct)
            ?? throw new NotFoundException("Card not found.");
        db.Cards.Remove(card);
        await db.SaveChangesAsync(ct);
    }

    public async Task<CommentDto> AddCommentAsync(Guid cardId, AddCommentRequest request, CancellationToken ct = default)
    {
        await commentValidator.ValidateAndThrowAsync(request, ct);

        var card = await db.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct)
            ?? throw new NotFoundException("Card not found.");
        var authorId = currentUser.UserId ?? throw new UnauthorizedException("Authentication required.");

        var comment = new Comment { CardId = card.Id, AuthorId = authorId, Body = request.Body.Trim() };
        db.Comments.Add(comment);

        var key = await WorkspaceKeyAsync(ct);
        activity.Record(ActivityType.CommentAdded, $"commented on {key}-{card.Number}", card.BoardId, card.Id);
        await db.SaveChangesAsync(ct);

        var author = await db.Users.FirstAsync(u => u.Id == authorId, ct);
        return new CommentDto(comment.Id, comment.Body, CardMapper.ToMini(author), comment.CreatedAt);
    }

    public async Task DeleteCommentAsync(Guid commentId, CancellationToken ct = default)
    {
        var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == commentId, ct)
            ?? throw new NotFoundException("Comment not found.");

        var userId = currentUser.UserId;
        var isAdmin = workspace.Role >= WorkspaceRole.Admin;
        if (comment.AuthorId != userId && !isAdmin)
            throw new ForbiddenException("You can only delete your own comments.");

        db.Comments.Remove(comment);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<ActivityDto>> ListActivityAsync(Guid? boardId, int take, CancellationToken ct = default)
    {
        var query = db.Activities.AsQueryable();
        if (boardId is { } id)
            query = query.Where(a => a.BoardId == id);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(Math.Clamp(take, 1, 100))
            .Select(a => new ActivityDto(
                a.Id, a.Type, a.Summary,
                new Common.Models.UserMiniDto(a.Actor!.Id, a.Actor.DisplayName, a.Actor.Email, a.Actor.AvatarHue),
                a.BoardId, a.CardId, a.CreatedAt))
            .ToListAsync(ct);
    }

    // ---- helpers ----

    private async Task<Card> LoadCardAsync(Guid cardId, CancellationToken ct) =>
        await db.Cards
            .Include(c => c.Assignee)
            .Include(c => c.CardLabels).ThenInclude(cl => cl.Label)
            .Include(c => c.Comments).ThenInclude(cm => cm.Author)
            .FirstOrDefaultAsync(c => c.Id == cardId, ct)
        ?? throw new NotFoundException("Card not found.");

    private static CardDetailDto ToDetail(Card card, string key) => new(
        card.Id,
        card.Number,
        $"{key}-{card.Number}",
        card.Title,
        card.Description,
        card.BoardId,
        card.ColumnId,
        card.Position,
        card.Priority,
        card.DueDate,
        card.Assignee is null ? null : CardMapper.ToMini(card.Assignee),
        card.IsCompleted,
        card.CompletedAt,
        card.CardLabels.Where(cl => cl.Label is not null)
            .Select(cl => new LabelDto(cl.Label!.Id, cl.Label.Name, cl.Label.Color)).ToList(),
        card.Comments.OrderBy(cm => cm.CreatedAt)
            .Select(cm => new CommentDto(cm.Id, cm.Body, CardMapper.ToMini(cm.Author!), cm.CreatedAt)).ToList(),
        card.CreatedAt,
        card.UpdatedAt);

    private async Task EnsureAssigneeAsync(Guid? assigneeId, CancellationToken ct)
    {
        if (assigneeId is not { } id)
            return;
        var ok = await db.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == workspace.WorkspaceId && m.UserId == id, ct);
        if (!ok)
            throw new BadRequestException("Assignee must be a member of this workspace.", "invalid_assignee");
    }

    private async Task EnsureLabelsOnBoardAsync(IEnumerable<Guid> labelIds, Guid boardId, CancellationToken ct)
    {
        var ids = labelIds.Distinct().ToList();
        if (ids.Count == 0)
            return;
        var valid = await db.Labels.CountAsync(l => l.BoardId == boardId && ids.Contains(l.Id), ct);
        if (valid != ids.Count)
            throw new BadRequestException("One or more labels don't belong to this board.", "invalid_label");
    }

    private async Task<double> EndPositionAsync(Guid columnId, CancellationToken ct)
    {
        var max = await db.Cards.Where(c => c.ColumnId == columnId).Select(c => (double?)c.Position).MaxAsync(ct);
        return (max ?? 0) + 1;
    }

    private async Task<string> WorkspaceKeyAsync(CancellationToken ct) =>
        await db.Workspaces.Where(w => w.Id == workspace.WorkspaceId).Select(w => w.Key).FirstOrDefaultAsync(ct) ?? "WS";
}
