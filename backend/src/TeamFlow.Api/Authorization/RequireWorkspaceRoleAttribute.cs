using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TeamFlow.Application.Common.Interfaces;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Api.Authorization;

/// <summary>
/// Authorizes a controller action against the caller's role in the resolved workspace. Requires a workspace
/// to be selected (400 if absent) and a role at least <c>minRole</c> (403 otherwise). Roles are ordered
/// Viewer &lt; Member &lt; Admin &lt; Owner.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class RequireWorkspaceRoleAttribute(WorkspaceRole minRole) : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var workspace = context.HttpContext.RequestServices.GetRequiredService<IWorkspaceContext>();

        if (workspace.WorkspaceId is null)
        {
            context.Result = new ObjectResult(new
            {
                code = "no_workspace",
                message = "No workspace selected. Send the X-Workspace-Id header.",
            })
            { StatusCode = StatusCodes.Status400BadRequest };
            return;
        }

        if (workspace.Role is null || workspace.Role < minRole)
        {
            context.Result = new ObjectResult(new
            {
                code = "forbidden",
                message = $"This action requires the {minRole} role or higher.",
            })
            { StatusCode = StatusCodes.Status403Forbidden };
        }
    }
}
