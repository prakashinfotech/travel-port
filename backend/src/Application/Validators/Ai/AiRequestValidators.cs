using FluentValidation;
using TravelPort.Application.DTOs.Ai;

namespace TravelPort.Application.Validators.Ai;

public class AiChatRequestValidator : AbstractValidator<AiChatRequest>
{
    public AiChatRequestValidator()
    {
        RuleFor(x => x.Messages)
            .NotEmpty()
            .WithMessage("At least one message is required.");

        RuleForEach(x => x.Messages).SetValidator(new AiMessageValidator());
    }
}

public class AiMessageValidator : AbstractValidator<AiMessage>
{
    private static readonly string[] ValidRoles = ["user", "assistant"];

    public AiMessageValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("Message role is required.")
            .Must(r => ValidRoles.Contains(r))
            .WithMessage("Role must be 'user' or 'assistant'.");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Message content is required.")
            .MaximumLength(4000)
            .WithMessage("Message content cannot exceed 4000 characters.");
    }
}

public class NlSearchRequestValidator : AbstractValidator<NlSearchRequest>
{
    public NlSearchRequestValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty()
            .WithMessage("Search query is required.")
            .MaximumLength(500)
            .WithMessage("Query cannot exceed 500 characters.");
    }
}

public class TripPlanRequestValidator : AbstractValidator<TripPlanRequest>
{
    public TripPlanRequestValidator()
    {
        RuleFor(x => x.Brief)
            .NotEmpty()
            .WithMessage("Trip brief is required.")
            .MaximumLength(1000)
            .WithMessage("Trip brief cannot exceed 1000 characters.");
    }
}
