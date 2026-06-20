using TeamFlow.Domain.Entities;

namespace TeamFlow.Tests;

public class UserLockoutTests
{
    private static readonly DateTimeOffset Now = new(2026, 6, 18, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ReachingThreshold_LocksAndResetsCounter()
    {
        var u = new User();
        for (var i = 0; i < User.MaxFailedLogins; i++) u.RegisterFailedLogin(Now);

        Assert.True(u.IsLockedOut(Now));
        Assert.Equal(0, u.FailedLoginCount);
        Assert.False(u.IsLockedOut(Now.Add(User.LockoutDuration).AddSeconds(1)));
    }

    [Fact]
    public void SuccessfulLogin_ClearsFailuresAndLock()
    {
        var u = new User();
        u.RegisterFailedLogin(Now);
        u.RegisterSuccessfulLogin();
        Assert.Equal(0, u.FailedLoginCount);
        Assert.Null(u.LockedOutUntil);
    }
}

public class RefreshTokenTests
{
    private static readonly DateTimeOffset Now = new(2026, 6, 18, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Active_WhenNotRevokedAndNotExpired()
    {
        var t = new RefreshToken { ExpiresAt = Now.AddDays(1) };
        Assert.True(t.IsActive(Now));
    }

    [Fact]
    public void Revoke_MarksInactive_AndRecordsReplacement()
    {
        var t = new RefreshToken { ExpiresAt = Now.AddDays(1) };
        t.Revoke(Now, "next");
        Assert.False(t.IsActive(Now));
        Assert.Equal("next", t.ReplacedByTokenHash);
    }
}
