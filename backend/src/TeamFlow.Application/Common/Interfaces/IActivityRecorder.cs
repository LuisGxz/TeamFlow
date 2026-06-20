using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Common.Interfaces;

/// <summary>
/// Appends an entry to the workspace activity feed. The entry is added to the change tracker but not saved;
/// the calling operation commits it together with its own changes so the feed never diverges from reality.
/// </summary>
public interface IActivityRecorder
{
    void Record(ActivityType type, string summary, Guid? boardId = null, Guid? cardId = null);
}
