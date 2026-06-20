using TeamFlow.Domain.Common;

namespace TeamFlow.Domain.Entities;

/// <summary>A global user account. Membership in workspaces is governed by <see cref="WorkspaceMember"/>.</summary>
public class User : Entity
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>HSL hue (0–360) for the generated avatar, kept stable per user.</summary>
    public int AvatarHue { get; set; }

    /// <summary>External identity provider when signed up via OAuth (e.g. "google"); null for password accounts.</summary>
    public string? ExternalProvider { get; set; }

    // Lockout (brute-force protection).
    public int FailedLoginCount { get; set; }
    public DateTimeOffset? LockedOutUntil { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<WorkspaceMember> Memberships { get; set; } = new List<WorkspaceMember>();

    public const int MaxFailedLogins = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public bool IsLockedOut(DateTimeOffset now) => LockedOutUntil is { } until && until > now;

    public void RegisterFailedLogin(DateTimeOffset now)
    {
        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedLogins)
        {
            LockedOutUntil = now.Add(LockoutDuration);
            FailedLoginCount = 0;
        }
    }

    public void RegisterSuccessfulLogin()
    {
        FailedLoginCount = 0;
        LockedOutUntil = null;
    }
}
