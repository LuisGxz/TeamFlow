using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Auth;

// ---- Requests ----

/// <summary>Create a new account and a first workspace (the registrant becomes its Owner).</summary>
public record RegisterRequest(string Email, string Password, string DisplayName, string WorkspaceName);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

// ---- Responses ----

public record UserDto(Guid Id, string Email, string DisplayName, int AvatarHue);

public record WorkspaceSummaryDto(Guid Id, string Name, string Slug, string Key, WorkspaceRole Role);

public record AuthTokens(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken, DateTimeOffset RefreshTokenExpiresAt);

/// <summary>Returned by register/login/refresh: the user, their token pair, and the workspaces they belong to.</summary>
public record AuthResponse(UserDto User, AuthTokens Tokens, IReadOnlyList<WorkspaceSummaryDto> Workspaces);

/// <summary>Returned by /me: identity plus workspace memberships (no fresh tokens).</summary>
public record MeResponse(UserDto User, IReadOnlyList<WorkspaceSummaryDto> Workspaces);
