using FluentValidation;
using TravelPort.Application.DTOs.Admin;

namespace TravelPort.Application.Validators.Admin;

public class CreateAnnouncementRequestValidator : AbstractValidator<CreateAnnouncementRequest>
{
    private static readonly string[] ValidTypes = ["info", "warning", "success"];

    public CreateAnnouncementRequestValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty()
            .WithMessage("Message is required.")
            .MaximumLength(500)
            .WithMessage("Message cannot exceed 500 characters.");

        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Type is required.")
            .Must(t => ValidTypes.Contains(t?.ToLowerInvariant()))
            .WithMessage("Type must be one of: info, warning, success.");
    }
}
