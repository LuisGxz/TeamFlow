using TeamFlow.Domain.Entities;

namespace TeamFlow.Application.Common.Interfaces;

/// <summary>Hashes and verifies user passwords (adapter over ASP.NET Identity's PasswordHasher).</summary>
public interface IPasswordHasher
{
    string Hash(User user, string password);

    /// <summary>True when the password matches; the hasher may also flag the stored hash for rehash.</summary>
    bool Verify(User user, string passwordHash, string password);
}
