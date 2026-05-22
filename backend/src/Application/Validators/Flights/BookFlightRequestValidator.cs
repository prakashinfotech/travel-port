using FluentValidation;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Application.Validators.Flights;

public class BookFlightRequestValidator : AbstractValidator<BookFlightRequest>
{
    public BookFlightRequestValidator()
    {
        RuleFor(x => x.FlightId)
            .NotEmpty()
            .WithMessage("FlightId is required.");

        RuleFor(x => x.CabinClass)
            .NotEmpty()
            .Must(c => c is "Economy" or "Business")
            .WithMessage("CabinClass must be Economy or Business.");

        RuleFor(x => x.Passengers)
            .InclusiveBetween(1, 9)
            .WithMessage("Passengers must be between 1 and 9.");

        RuleFor(x => x.GuestEmail)
            .EmailAddress()
            .WithMessage("Guest email must be a valid email address.")
            .When(x => !string.IsNullOrWhiteSpace(x.GuestEmail));

        RuleFor(x => x.GuestPhone)
            .Matches(@"^\d{10}$")
            .WithMessage("Guest phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.GuestPhone));
    }
}
