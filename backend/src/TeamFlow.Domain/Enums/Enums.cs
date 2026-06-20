namespace TeamFlow.Domain.Enums;

/// <summary>Role within a workspace (tenant). Owner &gt; Admin &gt; Member &gt; Viewer.</summary>
public enum WorkspaceRole
{
    Viewer = 0,
    Member = 1,
    Admin = 2,
    Owner = 3,
}

public enum Priority
{
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4,
}

public enum InvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Revoked = 2,
    Expired = 3,
}

/// <summary>Kinds of board activity recorded in the feed.</summary>
public enum ActivityType
{
    CardCreated = 0,
    CardMoved = 1,
    CardUpdated = 2,
    CardAssigned = 3,
    CardCompleted = 4,
    CardReopened = 5,
    CommentAdded = 6,
    MemberJoined = 7,
    BoardCreated = 8,
}
