using Microsoft.EntityFrameworkCore;
using TeamFlow.Domain.Entities;

namespace TeamFlow.Application.Common.Interfaces;

/// <summary>Abstraction over the persistence context so Application handlers stay free of EF wiring.</summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Workspace> Workspaces { get; }
    DbSet<WorkspaceMember> WorkspaceMembers { get; }
    DbSet<Invitation> Invitations { get; }
    DbSet<Board> Boards { get; }
    DbSet<BoardColumn> BoardColumns { get; }
    DbSet<Card> Cards { get; }
    DbSet<Label> Labels { get; }
    DbSet<CardLabel> CardLabels { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Activity> Activities { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
