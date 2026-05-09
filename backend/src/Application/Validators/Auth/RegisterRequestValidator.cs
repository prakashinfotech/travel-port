using FluentValidation;
using TravelPort.Application.DTOs.Auth;

namespace TravelPort.Application.Validators.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^\d{10}$").WithMessage("Phone must be 10 digits.");
        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain a digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}
