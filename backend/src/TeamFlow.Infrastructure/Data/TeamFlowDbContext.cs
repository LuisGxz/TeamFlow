using Microsoft.EntityFrameworkCore;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Common;
using TeamFlow.Domain.Entities;

namespace TeamFlow.Infrastructure.Data;

public class TeamFlowDbContext(DbContextOptions<TeamFlowDbContext> options, ITenantContext tenant)
    : DbContext(options), IAppDbContext
{
    private readonly ITenantContext _tenant = tenant;

    // Instance members referenced by the global query filter. EF re-reads these per query, so tenant
    // scope follows the request without baking a value into the cached model.
    private bool TenantScoped => _tenant.WorkspaceId.HasValue;
    private Guid CurrentWorkspaceId => _tenant.WorkspaceId ?? Guid.Empty;

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<BoardColumn> BoardColumns => Set<BoardColumn>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<CardLabel> CardLabels => Set<CardLabel>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Activity> Activities => Set<Activity>();

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Stamp the current tenant onto new tenant-owned rows so handlers can't forget it.
        if (_tenant.WorkspaceId is { } workspaceId)
        {
            foreach (var entry in ChangeTracker.Entries<ITenantOwned>())
                if (entry.State == EntityState.Added && entry.Entity.WorkspaceId == Guid.Empty)
                    entry.Entity.WorkspaceId = workspaceId;
        }
        return base.SaveChangesAsync(ct);
    }

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
            e.Property(x => x.ExternalProvider).HasMaxLength(40);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasIndex(x => x.TokenHash);
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.Property(x => x.ReplacedByTokenHash).HasMaxLength(128);
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Workspace>(e =>
        {
            e.ToTable("workspaces");
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            e.Property(x => x.Key).HasMaxLength(8).IsRequired();
            e.HasOne(x => x.Owner).WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<WorkspaceMember>(e =>
        {
            e.ToTable("workspace_members");
            e.HasIndex(x => new { x.WorkspaceId, x.UserId }).IsUnique();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Workspace).WithMany(w => w.Members).HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(u => u.Memberships).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<Invitation>(e =>
        {
            e.ToTable("invitations");
            e.HasIndex(x => new { x.WorkspaceId, x.Email });
            e.HasIndex(x => x.TokenHash);
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Workspace).WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.InvitedBy).WithMany().HasForeignKey(x => x.InvitedById).OnDelete(DeleteBehavior.NoAction);
            ApplyTenantFilter(e);
        });

        b.Entity<Board>(e =>
        {
            e.ToTable("boards");
            e.HasIndex(x => new { x.WorkspaceId, x.Slug }).IsUnique();
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000);
            e.HasOne(x => x.Workspace).WithMany(w => w.Boards).HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            ApplyTenantFilter(e);
        });

        b.Entity<BoardColumn>(e =>
        {
            e.ToTable("board_columns");
            e.HasIndex(x => x.BoardId);
            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.HasOne(x => x.Board).WithMany(bd => bd.Columns).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
            ApplyTenantFilter(e);
        });

        b.Entity<Card>(e =>
        {
            e.ToTable("cards");
            e.HasIndex(x => new { x.BoardId, x.ColumnId });
            e.HasIndex(x => new { x.BoardId, x.Number });
            e.Property(x => x.Title).HasMaxLength(300).IsRequired();
            e.Property(x => x.Description).HasMaxLength(8000);
            e.Property(x => x.Priority).HasConversion<string>().HasMaxLength(10);
            e.HasOne(x => x.Column).WithMany(c => c.Cards).HasForeignKey(x => x.ColumnId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Board).WithMany().HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.Assignee).WithMany().HasForeignKey(x => x.AssigneeId).OnDelete(DeleteBehavior.NoAction);
            ApplyTenantFilter(e);
        });

        b.Entity<Label>(e =>
        {
            e.ToTable("labels");
            e.HasIndex(x => x.BoardId);
            e.Property(x => x.Name).HasMaxLength(60).IsRequired();
            e.Property(x => x.Color).HasMaxLength(9).IsRequired();
            e.HasOne(x => x.Board).WithMany(bd => bd.Labels).HasForeignKey(x => x.BoardId).OnDelete(DeleteBehavior.Cascade);
            ApplyTenantFilter(e);
        });

        b.Entity<CardLabel>(e =>
        {
            e.ToTable("card_labels");
            e.HasKey(x => new { x.CardId, x.LabelId });
            e.HasOne(x => x.Card).WithMany(c => c.CardLabels).HasForeignKey(x => x.CardId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Label).WithMany(l => l.CardLabels).HasForeignKey(x => x.LabelId).OnDelete(DeleteBehavior.NoAction);
            ApplyTenantFilter(e);
        });

        b.Entity<Comment>(e =>
        {
            e.ToTable("comments");
            e.HasIndex(x => x.CardId);
            e.Property(x => x.Body).HasMaxLength(4000).IsRequired();
            e.HasOne(x => x.Card).WithMany(c => c.Comments).HasForeignKey(x => x.CardId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Author).WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.NoAction);
            ApplyTenantFilter(e);
        });

        b.Entity<Activity>(e =>
        {
            e.ToTable("activities");
            e.HasIndex(x => new { x.WorkspaceId, x.BoardId });
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Summary).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Actor).WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne<Workspace>().WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            ApplyTenantFilter(e);
        });
    }

    private void ApplyTenantFilter<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<T> e)
        where T : class, ITenantOwned
        => e.HasQueryFilter(x => !TenantScoped || x.WorkspaceId == CurrentWorkspaceId);
}
