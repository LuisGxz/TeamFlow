using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamFlow.Api.Authorization;
using TeamFlow.Application.Cards;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Api.Controllers;

/// <summary>
/// Cards, their labels and comments, plus the activity feed. Reads need any membership (Viewer+);
/// card and comment changes require Member+ (Viewers are read-only). Comment deletion is owner-or-Admin.
/// </summary>
[ApiController]
[Authorize]
[Route("api")]
public sealed class CardsController(ICardService cards) : ControllerBase
{
    [HttpGet("cards/{cardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<CardDetailDto>> Get(Guid cardId, CancellationToken ct)
        => Ok(await cards.GetCardAsync(cardId, ct));

    [HttpPost("cards")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<ActionResult<CardDetailDto>> Create(CreateCardRequest request, CancellationToken ct)
        => Ok(await cards.CreateCardAsync(request, ct));

    [HttpPut("cards/{cardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<ActionResult<CardDetailDto>> Update(Guid cardId, UpdateCardRequest request, CancellationToken ct)
        => Ok(await cards.UpdateCardAsync(cardId, request, ct));

    [HttpPatch("cards/{cardId:guid}/move")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<ActionResult<CardDetailDto>> Move(Guid cardId, MoveCardRequest request, CancellationToken ct)
        => Ok(await cards.MoveCardAsync(cardId, request, ct));

    [HttpPut("cards/{cardId:guid}/labels")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<ActionResult<CardDetailDto>> SetLabels(Guid cardId, SetCardLabelsRequest request, CancellationToken ct)
        => Ok(await cards.SetCardLabelsAsync(cardId, request, ct));

    [HttpDelete("cards/{cardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<IActionResult> Delete(Guid cardId, CancellationToken ct)
    {
        await cards.DeleteCardAsync(cardId, ct);
        return NoContent();
    }

    [HttpPost("cards/{cardId:guid}/comments")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<ActionResult<CommentDto>> AddComment(Guid cardId, AddCommentRequest request, CancellationToken ct)
        => Ok(await cards.AddCommentAsync(cardId, request, ct));

    [HttpDelete("comments/{commentId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Member)]
    public async Task<IActionResult> DeleteComment(Guid commentId, CancellationToken ct)
    {
        await cards.DeleteCommentAsync(commentId, ct);
        return NoContent();
    }

    [HttpGet("activity")]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<IReadOnlyList<ActivityDto>>> Activity(
        [FromQuery] Guid? boardId, [FromQuery] int take, CancellationToken ct)
        => Ok(await cards.ListActivityAsync(boardId, take == 0 ? 30 : take, ct));
}
