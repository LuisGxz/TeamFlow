using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Common;

/// <summary>Default recorder: stamps the current actor; WorkspaceId is auto-applied by the DbContext on save.</summary>
public sealed class ActivityRecorder(IAppDbContext db, ICurrentUser currentUser) : IActivityRecorder
{
    public void Record(ActivityType type, string summary, Guid? boardId = null, Guid? cardId = null)
    {
        var actorId = currentUser.UserId ?? throw new UnauthorizedException("Authentication required.");
        db.Activities.Add(new Activity
        {
            Type = type,
            Summary = summary,
            BoardId = boardId,
            CardId = cardId,
            ActorId = actorId,
        });
    }
}
