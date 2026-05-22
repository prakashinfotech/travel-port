using FluentValidation;
using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Validators.Admin;

public class RegisterFlightOperatorRequestValidator : AbstractValidator<RegisterFlightOperatorRequest>
{
    public RegisterFlightOperatorRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(200);

        RuleFor(x => x.IataCode)
            .NotEmpty().WithMessage("IATA code is required.")
            .Length(2, 3).WithMessage("IATA code must be 2 or 3 characters.")
            .Matches(@"^[A-Z0-9]+$").WithMessage("IATA code must contain only uppercase letters and digits.");

        RuleFor(x => x.ContactPhone)
            .Matches(@"^\d{10}$").WithMessage("Contact phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));

        RuleFor(x => x.ManagerName)
            .NotEmpty().WithMessage("Manager name is required.")
            .MaximumLength(100);

        RuleFor(x => x.ManagerEmail)
            .NotEmpty().WithMessage("Manager email is required.")
            .EmailAddress().WithMessage("Manager email must be a valid email address.")
            .MaximumLength(255);

        RuleFor(x => x.ManagerPassword)
            .NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain a digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}

public class RegisterBusOperatorRequestValidator : AbstractValidator<RegisterBusOperatorRequest>
{
    public RegisterBusOperatorRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(200);

        RuleFor(x => x.ContactPhone)
            .Matches(@"^\d{10}$").WithMessage("Contact phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));

        RuleFor(x => x.ManagerName)
            .NotEmpty().WithMessage("Manager name is required.")
            .MaximumLength(100);

        RuleFor(x => x.ManagerEmail)
            .NotEmpty().WithMessage("Manager email is required.")
            .EmailAddress().WithMessage("Manager email must be a valid email address.")
            .MaximumLength(255);

        RuleFor(x => x.ManagerPassword)
            .NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain a digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}

public class RegisterCabOperatorRequestValidator : AbstractValidator<RegisterCabOperatorRequest>
{
    public RegisterCabOperatorRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company name is required.")
            .MaximumLength(200);

        RuleFor(x => x.ContactPhone)
            .Matches(@"^\d{10}$").WithMessage("Contact phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.ContactPhone));

        RuleFor(x => x.DriverLicenseNumber)
            .NotEmpty().WithMessage("Driver license number is required for individual drivers.")
            .MaximumLength(20)
            .When(x => x.IsIndividualDriver);

        RuleFor(x => x.ManagerName)
            .NotEmpty().WithMessage("Manager name is required.")
            .MaximumLength(100);

        RuleFor(x => x.ManagerEmail)
            .NotEmpty().WithMessage("Manager email is required.")
            .EmailAddress().WithMessage("Manager email must be a valid email address.")
            .MaximumLength(255);

        RuleFor(x => x.ManagerPassword)
            .NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain a digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}
