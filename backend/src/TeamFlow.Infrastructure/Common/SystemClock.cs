using TeamFlow.Application.Common.Interfaces;

namespace TeamFlow.Infrastructure.Common;

public class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
