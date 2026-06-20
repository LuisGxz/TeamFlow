namespace TeamFlow.Application.Common;

/// <summary>Lifetimes for refresh tokens and invitations (bound from the "Auth" config section).</summary>
public class AuthSettings
{
    public const string SectionName = "Auth";

    public int RefreshTokenDays { get; set; } = 7;
    public int InvitationDays { get; set; } = 14;

    /// <summary>Frontend origin used to build invitation accept links.</summary>
    public string WebAppBaseUrl { get; set; } = "http://localhost:4200";
}
