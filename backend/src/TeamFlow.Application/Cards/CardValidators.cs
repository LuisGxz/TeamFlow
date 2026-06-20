using FluentValidation;

namespace TeamFlow.Application.Cards;

public sealed class CreateCardRequestValidator : AbstractValidator<CreateCardRequest>
{
    public CreateCardRequestValidator()
    {
        RuleFor(x => x.ColumnId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(8000);
        RuleFor(x => x.Priority).IsInEnum().When(x => x.Priority.HasValue);
    }
}

public sealed class UpdateCardRequestValidator : AbstractValidator<UpdateCardRequest>
{
    public UpdateCardRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(8000);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public sealed class MoveCardRequestValidator : AbstractValidator<MoveCardRequest>
{
    public MoveCardRequestValidator() => RuleFor(x => x.TargetColumnId).NotEmpty();
}

public sealed class AddCommentRequestValidator : AbstractValidator<AddCommentRequest>
{
    public AddCommentRequestValidator() => RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
}
