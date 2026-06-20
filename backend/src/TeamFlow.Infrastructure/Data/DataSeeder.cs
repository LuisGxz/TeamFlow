using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Infrastructure.Data;

/// <summary>
/// Idempotent demo seed: two workspaces (engineering + marketing) that share users — so the
/// multi-tenant story (one account, several workspaces, a role per workspace) is visible immediately.
/// </summary>
public static class DataSeeder
{
    private static readonly PasswordHasher<User> Hasher = new();

    public static async Task SeedAsync(TeamFlowDbContext db, DateOnly today, CancellationToken ct = default)
    {
        if (await db.Workspaces.IgnoreQueryFilters().AnyAsync(ct)) return;

        // ── Users ───────────────────────────────────────────────────────────────
        var alex = NewUser("owner@teamflow.app", "Alex Rivera", "Owner123!", 250);
        var sam = NewUser("member@teamflow.app", "Sam Chen", "Member123!", 190);
        var jordan = NewUser("viewer@teamflow.app", "Jordan Lee", "Viewer123!", 20);
        var priya = NewUser("priya@teamflow.app", "Priya Nair", "Demo123!", 330);
        var marco = NewUser("marco@teamflow.app", "Marco Rossi", "Demo123!", 130);
        var dana = NewUser("dana@teamflow.app", "Dana White", "Demo123!", 95);
        db.Users.AddRange(alex, sam, jordan, priya, marco, dana);

        // ── Workspace 1 · Acme Engineering ───────────────────────────────────────
        var eng = new Workspace { Name = "Acme Engineering", Slug = "acme-engineering", Key = "ENG", OwnerId = alex.Id };
        db.Workspaces.Add(eng);
        db.WorkspaceMembers.AddRange(
            Member(eng, alex, WorkspaceRole.Owner),
            Member(eng, sam, WorkspaceRole.Member),
            Member(eng, priya, WorkspaceRole.Member),
            Member(eng, marco, WorkspaceRole.Member),
            Member(eng, jordan, WorkspaceRole.Viewer));

        // ── Workspace 2 · Northwind Marketing (shares Alex + Jordan) ──────────────
        var mkt = new Workspace { Name = "Northwind Marketing", Slug = "northwind-marketing", Key = "MKT", OwnerId = dana.Id };
        db.Workspaces.Add(mkt);
        db.WorkspaceMembers.AddRange(
            Member(mkt, dana, WorkspaceRole.Owner),
            Member(mkt, alex, WorkspaceRole.Admin),
            Member(mkt, jordan, WorkspaceRole.Member));

        // ── Boards ───────────────────────────────────────────────────────────────
        var sprint = NewBoard(eng, "Sprint Board", "sprint-board", "Current two-week sprint across the engineering team.", 0);
        var bugs = NewBoard(eng, "Bugs & Support", "bugs-support", "Incoming defects and customer support escalations.", 1);
        var campaigns = NewBoard(mkt, "Q3 Campaigns", "q3-campaigns", "Marketing campaigns and content for the third quarter.", 0);
        db.Boards.AddRange(sprint, bugs, campaigns);

        // labels (per board)
        var (engFeat, engBug, engChore, engDesign, engRes) = SeedLabels(db, sprint);
        var (bFeat, bBug, bChore, _, _) = SeedLabels(db, bugs);
        var (mFeat, _, mChore, mDesign, mRes) = SeedLabels(db, campaigns);

        // columns
        var sBacklog = Col(sprint, "Backlog", 0);
        var sTodo = Col(sprint, "To do", 1);
        var sProg = Col(sprint, "In progress", 2, wip: 4);
        var sReview = Col(sprint, "In review", 3, wip: 3);
        var sDone = Col(sprint, "Done", 4, isDone: true);
        db.BoardColumns.AddRange(sBacklog, sTodo, sProg, sReview, sDone);

        var bTriage = Col(bugs, "Triage", 0);
        var bOpen = Col(bugs, "Open", 1);
        var bFixing = Col(bugs, "Fixing", 2, wip: 3);
        var bClosed = Col(bugs, "Closed", 3, isDone: true);
        db.BoardColumns.AddRange(bTriage, bOpen, bFixing, bClosed);

        var cIdeas = Col(campaigns, "Ideas", 0);
        var cPlanned = Col(campaigns, "Planned", 1);
        var cProducing = Col(campaigns, "Producing", 2);
        var cLive = Col(campaigns, "Live", 3, isDone: true);
        db.BoardColumns.AddRange(cIdeas, cPlanned, cProducing, cLive);

        // ── Cards · Sprint Board ──────────────────────────────────────────────────
        var cards = new List<Card>
        {
            Card(sprint, sProg, "Implement multi-tenant row filtering", priya.Id, Priority.High, today.AddDays(2), [engFeat], "Global EF query filter scoping every read to the active workspace."),
            Card(sprint, sProg, "OAuth2 sign-in (Google)", alex.Id, Priority.Medium, today.AddDays(5), [engFeat]),
            Card(sprint, sReview, "Card drag & drop reordering", sam.Id, Priority.High, today.AddDays(1), [engFeat, engDesign], "Fractional positions so reordering is a single update."),
            Card(sprint, sReview, "Rate-limit the auth endpoints", marco.Id, Priority.Medium, null, [engChore]),
            Card(sprint, sTodo, "Board activity feed", priya.Id, Priority.Medium, today.AddDays(6), [engFeat]),
            Card(sprint, sTodo, "Keyboard shortcuts (C, /, G B)", sam.Id, Priority.Low, null, [engFeat, engDesign]),
            Card(sprint, sTodo, "Workspace switcher", alex.Id, Priority.Medium, today.AddDays(4), [engFeat]),
            Card(sprint, sBacklog, "Investigate virtual scroll for big boards", null, Priority.Low, null, [engRes]),
            Card(sprint, sBacklog, "Dark mode polish pass", jordan.Id, Priority.Low, null, [engDesign]),
            Card(sprint, sBacklog, "Card due-date reminders", null, Priority.None, null, [engFeat]),
            Card(sprint, sDone, "JWT auth with rotating refresh", alex.Id, Priority.High, today.AddDays(-3), [engFeat], completed: true),
            Card(sprint, sDone, "Per-workspace RBAC", priya.Id, Priority.High, today.AddDays(-1), [engFeat], completed: true),
            Card(sprint, sDone, "Seed realistic demo data", marco.Id, Priority.Medium, today.AddDays(-2), [engChore], completed: true),
        };

        // ── Cards · Bugs & Support ────────────────────────────────────────────────
        cards.AddRange(
        [
            Card(bugs, bFixing, "Drag ghost flickers on Safari", marco.Id, Priority.Urgent, today, [bBug]),
            Card(bugs, bOpen, "Avatar colors collide for some users", sam.Id, Priority.Low, null, [bBug]),
            Card(bugs, bOpen, "Slow board load over 500 cards", priya.Id, Priority.High, today.AddDays(3), [bBug, bChore]),
            Card(bugs, bTriage, "Customer: export to CSV request", null, Priority.Medium, null, [bFeat]),
            Card(bugs, bClosed, "Login error message was misleading", alex.Id, Priority.Medium, today.AddDays(-4), [bBug], completed: true),
        ]);

        // ── Cards · Q3 Campaigns (other tenant) ───────────────────────────────────
        cards.AddRange(
        [
            Card(campaigns, cProducing, "Launch video for v2", dana.Id, Priority.High, today.AddDays(7), [mDesign]),
            Card(campaigns, cPlanned, "Email drip: onboarding", jordan.Id, Priority.Medium, today.AddDays(10), [mFeat]),
            Card(campaigns, cIdeas, "Customer story: Acme", null, Priority.Low, null, [mRes]),
            Card(campaigns, cLive, "Q3 landing page refresh", alex.Id, Priority.Medium, today.AddDays(-5), [mChore], completed: true),
        ]);

        db.Cards.AddRange(cards);

        // ── Comments + activity (a touch of life on a couple of cards) ─────────────
        var ddCard = cards.First(c => c.Title.StartsWith("Card drag"));
        db.Comments.AddRange(
            Comment(ddCard, alex.Id, "Let's use fractional indexing so a move is one UPDATE."),
            Comment(ddCard, sam.Id, "Done — positions are doubles now, midpoint on insert."));

        db.Activities.AddRange(
            Activity(eng, sprint, alex, ActivityType.BoardCreated, "created the board Sprint Board"),
            Activity(eng, sprint, priya, ActivityType.CardCompleted, "completed ENG-12 Per-workspace RBAC"),
            Activity(eng, sprint, sam, ActivityType.CommentAdded, "commented on ENG-3 Card drag & drop reordering"),
            Activity(mkt, campaigns, dana, ActivityType.CardMoved, "moved MKT-1 to Producing"));

        await db.SaveChangesAsync(ct);
    }

    // ── helpers ───────────────────────────────────────────────────────────────────
    private static User NewUser(string email, string name, string pwd, int hue)
    {
        var u = new User { Email = email, DisplayName = name, AvatarHue = hue };
        u.PasswordHash = Hasher.HashPassword(u, pwd);
        return u;
    }

    private static WorkspaceMember Member(Workspace ws, User u, WorkspaceRole role) =>
        new() { WorkspaceId = ws.Id, UserId = u.Id, Role = role };

    private static Board NewBoard(Workspace ws, string name, string slug, string desc, int pos) =>
        new() { WorkspaceId = ws.Id, Name = name, Slug = slug, Description = desc, Position = pos };

    private static BoardColumn Col(Board board, string name, int pos, int? wip = null, bool isDone = false) =>
        new() { WorkspaceId = board.WorkspaceId, BoardId = board.Id, Name = name, Position = pos, WipLimit = wip, IsDone = isDone };

    private static (Label feat, Label bug, Label chore, Label design, Label res) SeedLabels(TeamFlowDbContext db, Board board)
    {
        Label L(string n, string c) => new() { WorkspaceId = board.WorkspaceId, BoardId = board.Id, Name = n, Color = c };
        var feat = L("Feature", "#5B5BD6");
        var bug = L("Bug", "#E01B24");
        var chore = L("Chore", "#6B7080");
        var design = L("Design", "#9A4DCC");
        var res = L("Research", "#26A269");
        db.Labels.AddRange(feat, bug, chore, design, res);
        return (feat, bug, chore, design, res);
    }

    private static Card Card(Board board, BoardColumn col, string title, Guid? assignee, Priority priority,
        DateOnly? due, Label[] labels, string description = "", bool completed = false)
    {
        var card = new Card
        {
            WorkspaceId = board.WorkspaceId,
            BoardId = board.Id,
            ColumnId = col.Id,
            Number = ++board.CardCounter,
            Title = title,
            Description = description,
            Position = (col.Cards.Count + 1) * 1000.0,
            Priority = priority,
            DueDate = due,
            AssigneeId = assignee,
            IsCompleted = completed,
            CompletedAt = completed ? DateTimeOffset.UtcNow.AddDays(-1) : null,
        };
        col.Cards.Add(card);
        foreach (var l in labels)
            card.CardLabels.Add(new CardLabel { WorkspaceId = board.WorkspaceId, CardId = card.Id, LabelId = l.Id });
        return card;
    }

    private static Comment Comment(Card card, Guid authorId, string body) =>
        new() { WorkspaceId = card.WorkspaceId, CardId = card.Id, AuthorId = authorId, Body = body };

    private static Activity Activity(Workspace ws, Board board, User actor, ActivityType type, string summary) =>
        new() { WorkspaceId = ws.Id, BoardId = board.Id, ActorId = actor.Id, Type = type, Summary = summary };
}
