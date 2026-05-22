using FluentValidation;
using TravelPort.Application.DTOs.Users;

namespace TravelPort.Application.Validators.Users;

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .Matches(@"^\d{10}$").WithMessage("Phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));
    }
}

public class AddTravellerRequestValidator : AbstractValidator<AddTravellerRequest>
{
    public AddTravellerRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Traveller name is required.")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email must be a valid email address.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Phone)
            .Matches(@"^\d{10}$").WithMessage("Phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));

        RuleFor(x => x.PassportNo)
            .MaximumLength(20).WithMessage("Passport number cannot exceed 20 characters.")
            .When(x => x.PassportNo is not null);
    }
}

public class WalletTopUpRequestValidator : AbstractValidator<WalletTopUpRequest>
{
    public WalletTopUpRequestValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Top-up amount must be greater than zero.")
            .LessThanOrEqualTo(100000).WithMessage("Top-up amount cannot exceed ₹1,00,000 per transaction.");
    }
}

public class AddSavedCardRequestValidator : AbstractValidator<AddSavedCardRequest>
{
    private static readonly string[] ValidCardTypes = ["credit", "debit"];

    public AddSavedCardRequestValidator()
    {
        RuleFor(x => x.CardHolderName)
            .NotEmpty().WithMessage("Card holder name is required.")
            .MaximumLength(100).WithMessage("Card holder name cannot exceed 100 characters.");

        RuleFor(x => x.CardNumber)
            .NotEmpty().WithMessage("Card number is required.")
            .Matches(@"^\d{16}$").WithMessage("Card number must be exactly 16 digits.");

        RuleFor(x => x.ExpiryMonth)
            .InclusiveBetween(1, 12).WithMessage("Expiry month must be between 1 and 12.");

        RuleFor(x => x.ExpiryYear)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Year)
            .WithMessage("Card has expired.");

        RuleFor(x => x.CardType)
            .NotEmpty().WithMessage("Card type is required.")
            .Must(t => ValidCardTypes.Contains(t?.ToLowerInvariant()))
            .WithMessage("Card type must be 'credit' or 'debit'.");

        RuleFor(x => x.NickName)
            .MaximumLength(50).WithMessage("Nickname cannot exceed 50 characters.")
            .When(x => x.NickName is not null);
    }
}
