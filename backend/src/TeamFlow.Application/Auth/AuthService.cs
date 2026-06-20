using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Auth;

/// <summary>
/// Account lifecycle: registration (with a first workspace), password login with brute-force lockout,
/// and refresh-token rotation. Token secrets are stored only as hashes; rotation revokes the prior token.
/// </summary>
public sealed class AuthService(
    IAppDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwt,
    ITokenHasher tokenHasher,
    IClock clock,
    IOptions<AuthSettings> authSettings,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<RefreshRequest> refreshValidator) : IAuthService
{
    private readonly AuthSettings _auth = authSettings.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        await registerValidator.ValidateAndThrowAsync(request, ct);

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("That email is already registered.", "email_taken");

        var user = new User
        {
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            AvatarHue = HueFor(email),
        };
        user.PasswordHash = passwordHasher.Hash(user, request.Password);
        db.Users.Add(user);

        var workspace = await BuildWorkspaceAsync(request.WorkspaceName.Trim(), user.Id, ct);
        db.Workspaces.Add(workspace);
        db.WorkspaceMembers.Add(new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            Role = WorkspaceRole.Owner,
        });

        var tokens = await IssueTokensAsync(user, ct);
        await db.SaveChangesAsync(ct);

        return new AuthResponse(ToDto(user), tokens, await WorkspacesForAsync(user.Id, ct));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        await loginValidator.ValidateAndThrowAsync(request, ct);

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Uniform error for unknown email vs. wrong password to avoid user enumeration.
        if (user is null)
            throw new UnauthorizedException("Invalid email or password.", "invalid_credentials");

        var now = clock.UtcNow;
        if (user.IsLockedOut(now))
            throw new UnauthorizedException("Account temporarily locked. Try again later.", "locked_out");

        if (!passwordHasher.Verify(user, user.PasswordHash, request.Password))
        {
            user.RegisterFailedLogin(now);
            await db.SaveChangesAsync(ct);
            throw new UnauthorizedException("Invalid email or password.", "invalid_credentials");
        }

        user.RegisterSuccessfulLogin();
        var tokens = await IssueTokensAsync(user, ct);
        await db.SaveChangesAsync(ct);

        return new AuthResponse(ToDto(user), tokens, await WorkspacesForAsync(user.Id, ct));
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        await refreshValidator.ValidateAndThrowAsync(request, ct);

        var hash = tokenHasher.Hash(request.RefreshToken);
        var token = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        var now = clock.UtcNow;
        if (token is null || token.User is null || !token.IsActive(now))
            throw new UnauthorizedException("Invalid or expired refresh token.", "invalid_refresh_token");

        // Rotate: mint the replacement first so we can record the link, then revoke the old token.
        var tokens = await IssueTokensAsync(token.User, ct);
        token.Revoke(now, tokenHasher.Hash(tokens.RefreshToken));
        await db.SaveChangesAsync(ct);

        return new AuthResponse(ToDto(token.User), tokens, await WorkspacesForAsync(token.User.Id, ct));
    }

    public async Task LogoutAsync(LogoutRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return;

        var hash = tokenHasher.Hash(request.RefreshToken);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is { RevokedAt: null })
        {
            token.Revoke(clock.UtcNow);
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<MeResponse> GetMeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("User not found.");
        return new MeResponse(ToDto(user), await WorkspacesForAsync(userId, ct));
    }

    // ---- helpers ----

    private async Task<AuthTokens> IssueTokensAsync(User user, CancellationToken ct)
    {
        var (accessToken, accessExpires) = jwt.CreateAccessToken(user);

        var rawRefresh = tokenHasher.GenerateRawToken();
        var refreshExpires = clock.UtcNow.AddDays(_auth.RefreshTokenDays);
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokenHasher.Hash(rawRefresh),
            ExpiresAt = refreshExpires,
        });

        // Caller persists (SaveChanges) so token issuance commits atomically with the surrounding op.
        await Task.CompletedTask;
        return new AuthTokens(accessToken, accessExpires, rawRefresh, refreshExpires);
    }

    private async Task<Workspace> BuildWorkspaceAsync(string name, Guid ownerId, CancellationToken ct)
    {
        var baseSlug = Slugger.ToSlug(name);
        var slug = baseSlug;
        for (var i = 2; await db.Workspaces.AnyAsync(w => w.Slug == slug, ct); i++)
            slug = $"{baseSlug}-{i}";

        var baseKey = Slugger.ToKey(name);
        var key = baseKey;
        for (var i = 2; await db.Workspaces.AnyAsync(w => w.Key == key, ct); i++)
            key = $"{baseKey[..Math.Min(3, baseKey.Length)]}{i}";

        return new Workspace { Name = name, Slug = slug, Key = key, OwnerId = ownerId };
    }

    private async Task<IReadOnlyList<WorkspaceSummaryDto>> WorkspacesForAsync(Guid userId, CancellationToken ct) =>
        await db.WorkspaceMembers
            .Where(m => m.UserId == userId)
            .OrderBy(m => m.Workspace!.Name)
            .Select(m => new WorkspaceSummaryDto(
                m.Workspace!.Id, m.Workspace.Name, m.Workspace.Slug, m.Workspace.Key, m.Role))
            .ToListAsync(ct);

    private static UserDto ToDto(User u) => new(u.Id, u.Email, u.DisplayName, u.AvatarHue);

    /// <summary>Deterministic 0–359 hue so a user's generated avatar colour is stable across sessions.</summary>
    private static int HueFor(string email)
    {
        var hash = 0;
        foreach (var ch in email)
            hash = unchecked(hash * 31 + ch);
        return Math.Abs(hash) % 360;
    }
}
