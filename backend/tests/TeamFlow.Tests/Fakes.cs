using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;

namespace TeamFlow.Tests;

internal sealed class FakeClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset UtcNow { get; set; } = now;
}

internal sealed class FakeCurrentUser : ICurrentUser
{
    public Guid? UserId { get; set; }
}

/// <summary>Deterministic stand-in for the real JWT service — tests don't assert on token contents.</summary>
internal sealed class FakeJwt(IClock clock) : IJwtTokenService
{
    public (string Token, DateTimeOffset ExpiresAt) CreateAccessToken(User user)
        => ($"access-{user.Id}", clock.UtcNow.AddMinutes(15));
}
