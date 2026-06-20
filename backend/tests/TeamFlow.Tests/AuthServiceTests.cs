using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeamFlow.Application.Auth;
using TeamFlow.Application.Common;
using TeamFlow.Application.Common.Exceptions;
using TeamFlow.Domain.Enums;
using TeamFlow.Infrastructure.Auth;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Tests;

public class AuthServiceTests
{
    private static (AuthService svc, TeamFlowDbContext db, FakeClock clock) NewService()
    {
        var clock = new FakeClock(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        var tenant = new TenantContext();
        var db = new TeamFlowDbContext(
            new DbContextOptionsBuilder<TeamFlowDbContext>()
                .UseInMemoryDatabase($"tf-auth-{Guid.NewGuid()}").Options,
            tenant);

        var svc = new AuthService(
            db,
            new PasswordHasherAdapter(),
            new FakeJwt(clock),
            new TokenHasher(),
            clock,
            Options.Create(new AuthSettings()),
            new RegisterRequestValidator(),
            new LoginRequestValidator(),
            new RefreshRequestValidator());

        return (svc, db, clock);
    }

    private static RegisterRequest ValidRegister(string email = "alex@acme.test") =>
        new(email, "Sup3rSecret", "Alex Rivera", "Acme Engineering");

    [Fact]
    public async Task Register_CreatesUserWorkspaceAndOwnerMembership()
    {
        var (svc, db, _) = NewService();

        var result = await svc.RegisterAsync(ValidRegister());

        Assert.Equal("alex@acme.test", result.User.Email);
        Assert.False(string.IsNullOrWhiteSpace(result.Tokens.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(result.Tokens.RefreshToken));

        var membership = await db.WorkspaceMembers.SingleAsync();
        Assert.Equal(WorkspaceRole.Owner, membership.Role);
        var ws = Assert.Single(result.Workspaces);
        Assert.Equal(WorkspaceRole.Owner, ws.Role);
        Assert.Equal("ACME", ws.Key);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Throws()
    {
        var (svc, _, _) = NewService();
        await svc.RegisterAsync(ValidRegister());

        var ex = await Assert.ThrowsAsync<ConflictException>(() => svc.RegisterAsync(ValidRegister()));
        Assert.Equal("email_taken", ex.Code);
    }

    [Fact]
    public async Task Login_WrongPassword_FiveTimes_LocksAccount()
    {
        var (svc, _, _) = NewService();
        await svc.RegisterAsync(ValidRegister());

        for (var i = 0; i < 5; i++)
            await Assert.ThrowsAsync<UnauthorizedException>(
                () => svc.LoginAsync(new LoginRequest("alex@acme.test", "wrong-password")));

        // Even the correct password is rejected while locked out.
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(
            () => svc.LoginAsync(new LoginRequest("alex@acme.test", "Sup3rSecret")));
        Assert.Equal("locked_out", ex.Code);
    }

    [Fact]
    public async Task Login_CorrectPassword_ReturnsTokensAndWorkspaces()
    {
        var (svc, _, _) = NewService();
        await svc.RegisterAsync(ValidRegister());

        var result = await svc.LoginAsync(new LoginRequest("alex@acme.test", "Sup3rSecret"));

        Assert.Single(result.Workspaces);
        Assert.False(string.IsNullOrWhiteSpace(result.Tokens.RefreshToken));
    }

    [Fact]
    public async Task Refresh_RotatesToken_RevokingTheOldOne()
    {
        var (svc, db, _) = NewService();
        var reg = await svc.RegisterAsync(ValidRegister());
        var oldRaw = reg.Tokens.RefreshToken;

        var refreshed = await svc.RefreshAsync(new RefreshRequest(oldRaw));

        Assert.NotEqual(oldRaw, refreshed.Tokens.RefreshToken);

        var hasher = new TokenHasher();
        var oldToken = await db.RefreshTokens.SingleAsync(t => t.TokenHash == hasher.Hash(oldRaw));
        Assert.NotNull(oldToken.RevokedAt);
        Assert.Equal(hasher.Hash(refreshed.Tokens.RefreshToken), oldToken.ReplacedByTokenHash);

        // The rotated-out token can no longer be used.
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshAsync(new RefreshRequest(oldRaw)));
        Assert.Equal("invalid_refresh_token", ex.Code);
    }

    [Fact]
    public async Task Refresh_UnknownToken_Throws()
    {
        var (svc, _, _) = NewService();
        await Assert.ThrowsAsync<UnauthorizedException>(() => svc.RefreshAsync(new RefreshRequest("nope")));
    }
}
