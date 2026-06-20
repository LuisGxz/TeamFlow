using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamFlow.Api.Authorization;
using TeamFlow.Application.Workspaces;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workspace/invitations")]
public sealed class InvitationsController(IWorkspaceService workspaces) : ControllerBase
{
    [HttpGet]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<IReadOnlyList<InvitationDto>>> List(CancellationToken ct)
        => Ok(await workspaces.ListInvitationsAsync(ct));

    [HttpPost]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<InvitationCreatedDto>> Create(InviteRequest request, CancellationToken ct)
        => Ok(await workspaces.CreateInvitationAsync(request, ct));

    [HttpDelete("{invitationId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> Revoke(Guid invitationId, CancellationToken ct)
    {
        await workspaces.RevokeInvitationAsync(invitationId, ct);
        return NoContent();
    }

    /// <summary>Redeem an invitation for the signed-in user. No workspace header required.</summary>
    [HttpPost("/api/invitations/accept")]
    public async Task<ActionResult<AcceptInviteResultDto>> Accept(AcceptInviteRequest request, CancellationToken ct)
        => Ok(await workspaces.AcceptInvitationAsync(request, ct));
}
