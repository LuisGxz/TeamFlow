using System.Security.Cryptography;
using System.Text;
using TeamFlow.Application.Common.Interfaces;

namespace TeamFlow.Infrastructure.Auth;

/// <summary>Generates URL-safe random tokens and hashes them with SHA-256 for at-rest storage.</summary>
public sealed class TokenHasher : ITokenHasher
{
    public string GenerateRawToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlEncode(bytes);
    }

    public string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
