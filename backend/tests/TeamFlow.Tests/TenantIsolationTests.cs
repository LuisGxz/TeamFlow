using Microsoft.EntityFrameworkCore;
using TeamFlow.Domain.Entities;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Tests;

public class TenantIsolationTests
{
    private static (TeamFlowDbContext db, TenantContext tenant, Guid wsA, Guid wsB) NewDb()
    {
        var tenant = new TenantContext();
        var db = new TeamFlowDbContext(
            new DbContextOptionsBuilder<TeamFlowDbContext>()
                .UseInMemoryDatabase($"tf-{Guid.NewGuid()}").Options,
            tenant);

        var a = new Workspace { Name = "A", Slug = "a", Key = "A", OwnerId = Guid.NewGuid() };
        var b = new Workspace { Name = "B", Slug = "b", Key = "B", OwnerId = Guid.NewGuid() };
        db.Workspaces.AddRange(a, b);
        db.Boards.AddRange(
            new Board { WorkspaceId = a.Id, Name = "A1", Slug = "a1" },
            new Board { WorkspaceId = a.Id, Name = "A2", Slug = "a2" },
            new Board { WorkspaceId = b.Id, Name = "B1", Slug = "b1" });
        db.SaveChanges();
        return (db, tenant, a.Id, b.Id);
    }

    [Fact]
    public async Task NoTenant_SeesAllBoards()
    {
        var (db, _, _, _) = NewDb();
        Assert.Equal(3, await db.Boards.CountAsync());
    }

    [Fact]
    public async Task ScopedTenant_SeesOnlyItsOwnBoards()
    {
        var (db, tenant, wsA, wsB) = NewDb();

        tenant.Set(wsA);
        var a = await db.Boards.Select(x => x.Name).ToListAsync();
        Assert.Equal(new[] { "A1", "A2" }, a.OrderBy(x => x));

        tenant.Set(wsB);
        var b = await db.Boards.Select(x => x.Name).ToListAsync();
        Assert.Equal(new[] { "B1" }, b);
    }

    [Fact]
    public async Task AddedTenantEntity_IsStampedWithCurrentWorkspace()
    {
        var (db, tenant, wsA, _) = NewDb();
        tenant.Set(wsA);

        db.Boards.Add(new Board { Name = "New", Slug = "new" }); // no WorkspaceId set
        await db.SaveChangesAsync();

        var stamped = await db.Boards.IgnoreQueryFilters().SingleAsync(b => b.Slug == "new");
        Assert.Equal(wsA, stamped.WorkspaceId);
    }
}
