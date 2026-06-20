using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamFlow.Api.Authorization;
using TeamFlow.Application.Workspaces;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Api.Controllers;

/// <summary>Member management for the active workspace (resolved from the X-Workspace-Id header).</summary>
[ApiController]
[Authorize]
[Route("api/workspace/members")]
public sealed class MembersController(IWorkspaceService workspaces) : ControllerBase
{
    [HttpGet]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<IReadOnlyList<MemberDto>>> List(CancellationToken ct)
        => Ok(await workspaces.ListMembersAsync(ct));

    [HttpPatch("{memberId:guid}/role")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<MemberDto>> ChangeRole(Guid memberId, ChangeRoleRequest request, CancellationToken ct)
        => Ok(await workspaces.ChangeMemberRoleAsync(memberId, request, ct));

    [HttpDelete("{memberId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> Remove(Guid memberId, CancellationToken ct)
    {
        await workspaces.RemoveMemberAsync(memberId, ct);
        return NoContent();
    }
}
