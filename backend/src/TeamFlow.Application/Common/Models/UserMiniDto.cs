namespace TeamFlow.Application.Common.Models;

/// <summary>Compact user projection for assignees, comment authors, and activity actors.</summary>
public record UserMiniDto(Guid Id, string DisplayName, string Email, int AvatarHue);
