using FluentValidation;

namespace TeamFlow.Application.Boards;

public sealed class CreateBoardRequestValidator : AbstractValidator<CreateBoardRequest>
{
    public CreateBoardRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).MaximumLength(2000);
    }
}

public sealed class UpdateBoardRequestValidator : AbstractValidator<UpdateBoardRequest>
{
    public UpdateBoardRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Description).MaximumLength(2000);
    }
}

public sealed class CreateColumnRequestValidator : AbstractValidator<CreateColumnRequest>
{
    public CreateColumnRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.WipLimit).GreaterThan(0).When(x => x.WipLimit.HasValue);
    }
}

public sealed class UpdateColumnRequestValidator : AbstractValidator<UpdateColumnRequest>
{
    public UpdateColumnRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(80);
        RuleFor(x => x.WipLimit).GreaterThan(0).When(x => x.WipLimit.HasValue);
    }
}

public sealed class CreateLabelRequestValidator : AbstractValidator<CreateLabelRequest>
{
    public CreateLabelRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Color).NotEmpty().Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a hex value like #5B5BD6.");
    }
}

public sealed class UpdateLabelRequestValidator : AbstractValidator<UpdateLabelRequest>
{
    public UpdateLabelRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Color).NotEmpty().Matches("^#[0-9A-Fa-f]{6}$").WithMessage("Color must be a hex value like #5B5BD6.");
    }
}
