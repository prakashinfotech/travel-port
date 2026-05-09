using FluentValidation;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Application.Validators.Flights;

public class BookFlightRequestValidator : AbstractValidator<BookFlightRequest>
{
    public BookFlightRequestValidator()
    {
        RuleFor(x => x.FlightId).NotEmpty();
        RuleFor(x => x.CabinClass).NotEmpty().Must(c => c is "Economy" or "Business")
            .WithMessage("CabinClass must be Economy or Business.");
        RuleFor(x => x.Passengers).InclusiveBetween(1, 9);
    }
}
