/** Mirrors of the backend DTOs (TeamFlow.Application.*). Kept in one file for an easy mental map. */

export type WorkspaceRole = 'Viewer' | 'Member' | 'Admin' | 'Owner';
export type Priority = 'None' | 'Low' | 'Medium' | 'High' | 'Urgent';

export type ActivityType =
  | 'CardCreated' | 'CardMoved' | 'CardUpdated' | 'CardAssigned' | 'CardCompleted'
  | 'CardReopened' | 'CommentAdded' | 'MemberJoined' | 'BoardCreated';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarHue: number;
}

export interface UserMiniDto {
  id: string;
  displayName: string;
  email: string;
  avatarHue: number;
}

export interface WorkspaceSummaryDto {
  id: string;
  name: string;
  slug: string;
  key: string;
  role: WorkspaceRole;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse {
  user: UserDto;
  tokens: AuthTokens;
  workspaces: WorkspaceSummaryDto[];
}

export interface MeResponse {
  user: UserDto;
  workspaces: WorkspaceSummaryDto[];
}

export interface MemberDto {
  memberId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarHue: number;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface InvitationDto {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: 'Pending' | 'Accepted' | 'Revoked' | 'Expired';
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

export interface InvitationCreatedDto {
  invitation: InvitationDto;
  token: string;
  acceptUrl: string;
}

export interface AcceptInviteResultDto {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

export interface LabelDto {
  id: string;
  name: string;
  color: string;
}

export interface CardSummaryDto {
  id: string;
  number: number;
  reference: string;
  title: string;
  columnId: string;
  position: number;
  priority: Priority;
  dueDate: string | null;
  assignee: UserMiniDto | null;
  isCompleted: boolean;
  labels: LabelDto[];
  commentCount: number;
  updatedAt: string;
}

export interface ColumnDto {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  isDone: boolean;
  cards: CardSummaryDto[];
}

export interface BoardSummaryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  cardCount: number;
  updatedAt: string;
}

export interface BoardDetailDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  workspaceKey: string;
  columns: ColumnDto[];
  labels: LabelDto[];
}

export interface CommentDto {
  id: string;
  body: string;
  author: UserMiniDto;
  createdAt: string;
}

export interface CardDetailDto {
  id: string;
  number: number;
  reference: string;
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  position: number;
  priority: Priority;
  dueDate: string | null;
  assignee: UserMiniDto | null;
  isCompleted: boolean;
  completedAt: string | null;
  labels: LabelDto[];
  comments: CommentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDto {
  id: string;
  type: ActivityType;
  summary: string;
  actor: UserMiniDto;
  boardId: string | null;
  cardId: string | null;
  createdAt: string;
}

/** Normalized API error shape from the backend ExceptionHandlingMiddleware. */
export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]> | null;
}

/** Role precedence helper (matches the backend enum ordering). */
export const ROLE_RANK: Record<WorkspaceRole, number> = {
  Viewer: 0,
  Member: 1,
  Admin: 2,
  Owner: 3,
};

export function roleAtLeast(role: WorkspaceRole | null | undefined, min: WorkspaceRole): boolean {
  return role != null && ROLE_RANK[role] >= ROLE_RANK[min];
}
