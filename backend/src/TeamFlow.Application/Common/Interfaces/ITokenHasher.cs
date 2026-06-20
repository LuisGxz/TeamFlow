namespace TeamFlow.Application.Common.Interfaces;

/// <summary>
/// Generates and hashes opaque secrets (refresh tokens, invitation tokens). The raw value is returned to
/// the caller once; only its SHA-256 hash is persisted, so a database leak can't reveal usable tokens.
/// </summary>
public interface ITokenHasher
{
    /// <summary>A cryptographically-random URL-safe token (the raw secret to hand to the client).</summary>
    string GenerateRawToken();

    /// <summary>Deterministic SHA-256 hash of a raw token, for storage and lookup.</summary>
    string Hash(string rawToken);
}
