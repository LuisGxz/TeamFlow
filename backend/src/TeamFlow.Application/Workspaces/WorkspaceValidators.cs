using FluentValidation;
using TeamFlow.Domain.Enums;

namespace TeamFlow.Application.Workspaces;

public sealed class InviteRequestValidator : AbstractValidator<InviteRequest>
{
    public InviteRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Role)
            .IsInEnum()
            .NotEqual(WorkspaceRole.Owner).WithMessage("Ownership can't be granted via invitation.");
    }
}

public sealed class ChangeRoleRequestValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleRequestValidator() => RuleFor(x => x.Role).IsInEnum();
}

public sealed class AcceptInviteRequestValidator : AbstractValidator<AcceptInviteRequest>
{
    public AcceptInviteRequestValidator() => RuleFor(x => x.Token).NotEmpty();
}
