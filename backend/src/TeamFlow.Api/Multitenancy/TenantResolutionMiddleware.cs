using Microsoft.EntityFrameworkCore;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Infrastructure.Data;
using TeamFlow.Infrastructure.Multitenancy;

namespace TeamFlow.Api.Multitenancy;

/// <summary>
/// Resolves the active workspace from the <c>X-Workspace-Id</c> header for authenticated requests. Confirms
/// the user is a member, then stamps the workspace and the member's role onto the scoped tenant context so
/// the DbContext row filter and RBAC see them. A header naming a workspace the user doesn't belong to is 403.
/// </summary>
public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Workspace-Id";

    public async Task InvokeAsync(HttpContext context, ICurrentUser currentUser, TenantContext tenant, TeamFlowDbContext db)
    {
        if (currentUser.UserId is { } userId
            && context.Request.Headers.TryGetValue(HeaderName, out var raw)
            && Guid.TryParse(raw, out var workspaceId))
        {
            var member = await db.WorkspaceMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId, context.RequestAborted);

            if (member is null)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    code = "not_a_member",
                    message = "You are not a member of the selected workspace.",
                });
                return;
            }

            tenant.Set(workspaceId);
            tenant.SetRole(member.Role);
        }

        await next(context);
    }
}
