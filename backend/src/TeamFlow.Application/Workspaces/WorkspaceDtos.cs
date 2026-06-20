using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Workspaces;

// ---- Requests ----

public record InviteRequest(string Email, WorkspaceRole Role);

public record ChangeRoleRequest(WorkspaceRole Role);

public record AcceptInviteRequest(string Token);

// ---- Responses ----

public record MemberDto(Guid MemberId, Guid UserId, string DisplayName, string Email, int AvatarHue, WorkspaceRole Role, DateTimeOffset JoinedAt);

public record InvitationDto(Guid Id, string Email, WorkspaceRole Role, InvitationStatus Status, DateTimeOffset ExpiresAt, string InvitedBy, DateTimeOffset CreatedAt);

/// <summary>Result of creating an invite. <see cref="AcceptUrl"/> embeds the raw token (shown once, dev/demo use).</summary>
public record InvitationCreatedDto(InvitationDto Invitation, string Token, string AcceptUrl);

public record AcceptInviteResultDto(Guid WorkspaceId, string WorkspaceName, WorkspaceRole Role);
