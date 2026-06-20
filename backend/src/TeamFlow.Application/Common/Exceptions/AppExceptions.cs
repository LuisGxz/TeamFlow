namespace TeamFlow.Application.Common.Exceptions;

/// <summary>Base for expected, client-facing failures mapped to an HTTP status by the API layer.</summary>
public abstract class AppException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    /// <summary>Short machine-readable code surfaced to clients (e.g. "email_taken").</summary>
    public abstract string Code { get; }
}

/// <summary>400 — request was well-formed but semantically invalid.</summary>
public sealed class BadRequestException(string message, string code = "bad_request") : AppException(message, 400)
{
    public override string Code { get; } = code;
}

/// <summary>401 — authentication failed or credentials were rejected.</summary>
public sealed class UnauthorizedException(string message, string code = "unauthorized") : AppException(message, 401)
{
    public override string Code { get; } = code;
}

/// <summary>403 — authenticated but not permitted (insufficient workspace role).</summary>
public sealed class ForbiddenException(string message, string code = "forbidden") : AppException(message, 403)
{
    public override string Code { get; } = code;
}

/// <summary>404 — the addressed resource does not exist (or isn't visible to this tenant).</summary>
public sealed class NotFoundException(string message, string code = "not_found") : AppException(message, 404)
{
    public override string Code { get; } = code;
}

/// <summary>409 — the request conflicts with current state (e.g. duplicate email / already a member).</summary>
public sealed class ConflictException(string message, string code = "conflict") : AppException(message, 409)
{
    public override string Code { get; } = code;
}
