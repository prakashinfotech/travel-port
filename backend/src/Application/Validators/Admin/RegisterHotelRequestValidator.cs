using FluentValidation;
using TravelPort.Application.DTOs.HotelManager;

namespace TravelPort.Application.Validators.Admin;

public class RegisterHotelRequestValidator : AbstractValidator<RegisterHotelRequest>
{
    public RegisterHotelRequestValidator()
    {
        RuleFor(x => x.HotelName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.StarRating).InclusiveBetween(1m, 5m)
            .WithMessage("Star rating must be between 1 and 5.");
        RuleFor(x => x.ManagerName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ManagerEmail).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.ManagerPassword)
            .NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches(@"[0-9]").WithMessage("Password must contain a digit.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain a special character.");
    }
}
