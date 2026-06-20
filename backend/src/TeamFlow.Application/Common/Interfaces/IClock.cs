namespace TeamFlow.Application.Common.Interfaces;

/// <summary>Abstracts the system clock so time-dependent logic (lockout, token/invite expiry) is testable.</summary>
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
