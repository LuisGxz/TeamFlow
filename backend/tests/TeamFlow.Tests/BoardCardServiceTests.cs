using Microsoft.EntityFrameworkCore;
using TeamFlow.Application.Boards;
using TeamFlow.Application.Cards;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Tests;

public class BoardCardServiceTests
{
    private sealed record Ctx(
        BoardService Boards, CardService Cards, TeamFlowDbContext Db, TenantContext Tenant, FakeCurrentUser User,
        Guid WorkspaceId, Guid AlexId, Guid SamId, Guid BoardId, Guid TodoColId, Guid DoneColId);

    private static Ctx Setup()
    {
        var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var tenant = new TenantContext();
        var user = new FakeCurrentUser();
        var db = new TeamFlowDbContext(
            new DbContextOptionsBuilder<TeamFlowDbContext>()
                .UseInMemoryDatabase($"tf-bc-{Guid.NewGuid()}").Options,
            tenant);

        var alex = new User { Email = "alex@acme.test", DisplayName = "Alex", PasswordHash = "x" };
        var sam = new User { Email = "sam@acme.test", DisplayName = "Sam", PasswordHash = "x" };
        var ws = new Workspace { Name = "Acme", Slug = "acme", Key = "ENG", OwnerId = alex.Id };
        var board = new Board { WorkspaceId = ws.Id, Name = "Engineering", Slug = "engineering", CardCounter = 0 };
        var todo = new BoardColumn { WorkspaceId = ws.Id, BoardId = board.Id, Name = "To do", Position = 0 };
        var done = new BoardColumn { WorkspaceId = ws.Id, BoardId = board.Id, Name = "Done", Position = 1, IsDone = true };
        db.Users.AddRange(alex, sam);
        db.Workspaces.Add(ws);
        db.WorkspaceMembers.AddRange(
            new WorkspaceMember { WorkspaceId = ws.Id, UserId = alex.Id, Role = WorkspaceRole.Owner },
            new WorkspaceMember { WorkspaceId = ws.Id, UserId = sam.Id, Role = WorkspaceRole.Member });
        db.Boards.Add(board);
        db.BoardColumns.AddRange(todo, done);
        db.SaveChanges();

        var recorder = new ActivityRecorder(db, user);
        var boards = new BoardService(db, clock, recorder, tenant,
            new CreateBoardRequestValidator(), new UpdateBoardRequestValidator(),
            new CreateColumnRequestValidator(), new UpdateColumnRequestValidator(),
            new CreateLabelRequestValidator(), new UpdateLabelRequestValidator());
        var cards = new CardService(db, clock, recorder, user, tenant,
            new CreateCardRequestValidator(), new UpdateCardRequestValidator(),
            new MoveCardRequestValidator(), new AddCommentRequestValidator());

        tenant.Set(ws.Id);
        tenant.SetRole(WorkspaceRole.Owner);
        user.UserId = alex.Id;

        return new Ctx(boards, cards, db, tenant, user, ws.Id, alex.Id, sam.Id, board.Id, todo.Id, done.Id);
    }

    [Fact]
    public async Task CreateCard_AssignsSequentialNumberAndReference()
    {
        var c = Setup();

        var first = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "First", null, null, null, null, null));
        var second = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Second", null, null, null, null, null));

        Assert.Equal(1, first.Number);
        Assert.Equal("ENG-1", first.Reference);
        Assert.False(first.IsCompleted);
        Assert.Equal(2, second.Number);
        Assert.True(second.Position > first.Position);
    }

    [Fact]
    public async Task CreateCard_InDoneColumn_MarksCompleted()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.DoneColId, "Shipped", null, null, null, null, null));
        Assert.True(card.IsCompleted);
        Assert.NotNull(card.CompletedAt);
    }

    [Fact]
    public async Task CreateCard_InvalidAssignee_Throws()
    {
        var c = Setup();
        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "X", null, null, null, Guid.NewGuid(), null)));
        Assert.Equal("invalid_assignee", ex.Code);
    }

    [Fact]
    public async Task MoveCard_ToDone_CompletesAndRecordsActivity()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));

        var moved = await c.Cards.MoveCardAsync(card.Id, new MoveCardRequest(c.DoneColId, 1.0));

        Assert.True(moved.IsCompleted);
        Assert.Equal(c.DoneColId, moved.ColumnId);
        var types = await c.Db.Activities.Select(a => a.Type).ToListAsync();
        Assert.Contains(ActivityType.CardCompleted, types);
        Assert.Contains(ActivityType.CardMoved, types);
    }

    [Fact]
    public async Task MoveCard_OutOfDone_Reopens()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.DoneColId, "Done one", null, null, null, null, null));

        var moved = await c.Cards.MoveCardAsync(card.Id, new MoveCardRequest(c.TodoColId, 1.0));

        Assert.False(moved.IsCompleted);
        Assert.Null(moved.CompletedAt);
        Assert.Contains(ActivityType.CardReopened, await c.Db.Activities.Select(a => a.Type).ToListAsync());
    }

    [Fact]
    public async Task MoveCard_CrossBoard_Throws()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));
        var other = await c.Boards.CreateBoardAsync(new CreateBoardRequest("Marketing", null));
        var otherColumn = other.Columns[0].Id;

        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            c.Cards.MoveCardAsync(card.Id, new MoveCardRequest(otherColumn, 1.0)));
        Assert.Equal("cross_board_move", ex.Code);
    }

    [Fact]
    public async Task SetCardLabels_LabelFromOtherBoard_Throws()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));
        var other = await c.Boards.CreateBoardAsync(new CreateBoardRequest("Other", null));
        var foreignLabel = await c.Boards.CreateLabelAsync(other.Id, new CreateLabelRequest("Bug", "#E01B24"));

        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            c.Cards.SetCardLabelsAsync(card.Id, new SetCardLabelsRequest([foreignLabel.Id])));
        Assert.Equal("invalid_label", ex.Code);
    }

    [Fact]
    public async Task SetCardLabels_SameBoard_Applies()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));
        var label = await c.Boards.CreateLabelAsync(c.BoardId, new CreateLabelRequest("Feature", "#26A269"));

        var updated = await c.Cards.SetCardLabelsAsync(card.Id, new SetCardLabelsRequest([label.Id]));

        Assert.Single(updated.Labels);
        Assert.Equal("Feature", updated.Labels[0].Name);
    }

    [Fact]
    public async Task AddComment_CreatesCommentAndActivity()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));

        var comment = await c.Cards.AddCommentAsync(card.Id, new AddCommentRequest("Looks good"));

        Assert.Equal("Looks good", comment.Body);
        Assert.Equal("Alex", comment.Author.DisplayName);
        Assert.Contains(ActivityType.CommentAdded, await c.Db.Activities.Select(a => a.Type).ToListAsync());
    }

    [Fact]
    public async Task DeleteComment_NonAuthorNonAdmin_Throws()
    {
        var c = Setup();
        var card = await c.Cards.CreateCardAsync(new CreateCardRequest(c.TodoColId, "Task", null, null, null, null, null));
        var comment = await c.Cards.AddCommentAsync(card.Id, new AddCommentRequest("Mine"));

        // Act as Sam (Member, not the author).
        c.User.UserId = c.SamId;
        c.Tenant.SetRole(WorkspaceRole.Member);

        await Assert.ThrowsAsync<ForbiddenException>(() => c.Cards.DeleteCommentAsync(comment.Id));
    }

    [Fact]
    public async Task CreateBoard_CreatesFourDefaultColumns()
    {
        var c = Setup();
        var board = await c.Boards.CreateBoardAsync(new CreateBoardRequest("Design", "Design work"));
        Assert.Equal(4, board.Columns.Count);
        Assert.Contains(board.Columns, col => col.IsDone);
    }

    [Fact]
    public async Task DeleteColumn_LastColumn_Throws()
    {
        var c = Setup();
        var solo = await c.Boards.CreateBoardAsync(new CreateBoardRequest("Solo", null));
        // remove all but one
        foreach (var col in solo.Columns.Skip(1))
            await c.Boards.DeleteColumnAsync(col.Id, default);

        var ex = await Assert.ThrowsAsync<ConflictException>(() => c.Boards.DeleteColumnAsync(solo.Columns[0].Id, default));
        Assert.Equal("last_column", ex.Code);
    }
}
