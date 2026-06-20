using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using TeamFlow.Application.Common.Interfaces;

namespace TeamFlow.Api.Auth;

/// <summary>Reads the authenticated user's id from the request's JWT claims.</summary>
public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid? UserId
    {
        get
        {
            var principal = accessor.HttpContext?.User;
            var raw = principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
