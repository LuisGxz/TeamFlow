using Microsoft.AspNetCore.Identity;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Entities;

namespace TeamFlow.Infrastructure.Auth;

/// <summary>Adapts ASP.NET Identity's <see cref="PasswordHasher{TUser}"/> to the Application abstraction.</summary>
public sealed class PasswordHasherAdapter : IPasswordHasher
{
    private readonly PasswordHasher<User> _inner = new();

    public string Hash(User user, string password) => _inner.HashPassword(user, password);

    public bool Verify(User user, string passwordHash, string password)
        => _inner.VerifyHashedPassword(user, passwordHash, password) != PasswordVerificationResult.Failed;
}
