using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamFlow.Api.Authorization;
using TeamFlow.Application.Boards;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Api.Controllers;

/// <summary>
/// Boards, their columns, and their labels for the active workspace. Reads need any membership (Viewer+);
/// structural changes (boards, columns, labels) require Admin+.
/// </summary>
[ApiController]
[Authorize]
[Route("api")]
public sealed class BoardsController(IBoardService boards) : ControllerBase
{
    // ---- Boards ----

    [HttpGet("boards")]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<IReadOnlyList<BoardSummaryDto>>> List(CancellationToken ct)
        => Ok(await boards.ListBoardsAsync(ct));

    [HttpGet("boards/{boardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<BoardDetailDto>> Get(Guid boardId, CancellationToken ct)
        => Ok(await boards.GetBoardAsync(boardId, ct));

    [HttpPost("boards")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<BoardDetailDto>> Create(CreateBoardRequest request, CancellationToken ct)
        => Ok(await boards.CreateBoardAsync(request, ct));

    [HttpPut("boards/{boardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<BoardDetailDto>> Update(Guid boardId, UpdateBoardRequest request, CancellationToken ct)
        => Ok(await boards.UpdateBoardAsync(boardId, request, ct));

    [HttpDelete("boards/{boardId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> Delete(Guid boardId, CancellationToken ct)
    {
        await boards.DeleteBoardAsync(boardId, ct);
        return NoContent();
    }

    // ---- Columns ----

    [HttpPost("boards/{boardId:guid}/columns")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<ColumnDto>> CreateColumn(Guid boardId, CreateColumnRequest request, CancellationToken ct)
        => Ok(await boards.CreateColumnAsync(boardId, request, ct));

    [HttpPut("boards/{boardId:guid}/columns/order")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> ReorderColumns(Guid boardId, ReorderColumnsRequest request, CancellationToken ct)
    {
        await boards.ReorderColumnsAsync(boardId, request, ct);
        return NoContent();
    }

    [HttpPut("columns/{columnId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<ColumnDto>> UpdateColumn(Guid columnId, UpdateColumnRequest request, CancellationToken ct)
        => Ok(await boards.UpdateColumnAsync(columnId, request, ct));

    [HttpDelete("columns/{columnId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> DeleteColumn(Guid columnId, CancellationToken ct)
    {
        await boards.DeleteColumnAsync(columnId, ct);
        return NoContent();
    }

    // ---- Labels ----

    [HttpGet("boards/{boardId:guid}/labels")]
    [RequireWorkspaceRole(WorkspaceRole.Viewer)]
    public async Task<ActionResult<IReadOnlyList<LabelDto>>> ListLabels(Guid boardId, CancellationToken ct)
        => Ok(await boards.ListLabelsAsync(boardId, ct));

    [HttpPost("boards/{boardId:guid}/labels")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<LabelDto>> CreateLabel(Guid boardId, CreateLabelRequest request, CancellationToken ct)
        => Ok(await boards.CreateLabelAsync(boardId, request, ct));

    [HttpPut("labels/{labelId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<ActionResult<LabelDto>> UpdateLabel(Guid labelId, UpdateLabelRequest request, CancellationToken ct)
        => Ok(await boards.UpdateLabelAsync(labelId, request, ct));

    [HttpDelete("labels/{labelId:guid}")]
    [RequireWorkspaceRole(WorkspaceRole.Admin)]
    public async Task<IActionResult> DeleteLabel(Guid labelId, CancellationToken ct)
    {
        await boards.DeleteLabelAsync(labelId, ct);
        return NoContent();
    }
}
