using FluentValidation;
using TravelPort.Application.DTOs.Admin;

namespace TravelPort.Application.Validators.Admin;

public class UpdateAnnouncementRequestValidator : AbstractValidator<UpdateAnnouncementRequest>
{
    private static readonly string[] ValidTypes = ["info", "warning", "success"];

    public UpdateAnnouncementRequestValidator()
    {
        RuleFor(x => x.Message)
            .MaximumLength(500)
            .WithMessage("Message cannot exceed 500 characters.")
            .When(x => x.Message is not null);

        RuleFor(x => x.Type)
            .Must(t => ValidTypes.Contains(t?.ToLowerInvariant()))
            .WithMessage("Type must be one of: info, warning, success.")
            .When(x => x.Type is not null);
    }
}
