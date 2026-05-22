using FluentValidation;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Validators.Transport;

public class BookBusRequestValidator : AbstractValidator<BookBusRequest>
{
    public BookBusRequestValidator()
    {
        RuleFor(x => x.BusId)
            .NotEmpty()
            .WithMessage("BusId is required.");

        RuleFor(x => x.Operator)
            .NotEmpty()
            .WithMessage("Operator is required.");

        RuleFor(x => x.BusType)
            .NotEmpty()
            .WithMessage("Bus type is required.");

        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.");

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.");

        RuleFor(x => x.DepartureTime)
            .NotEmpty()
            .WithMessage("Departure time is required.");

        RuleFor(x => x.ArrivalTime)
            .NotEmpty()
            .WithMessage("Arrival time is required.")
            .GreaterThan(x => x.DepartureTime)
            .WithMessage("Arrival time must be after departure time.");

        RuleFor(x => x.Price)
            .GreaterThan(0)
            .WithMessage("Price must be greater than zero.");

        RuleFor(x => x.Seats)
            .InclusiveBetween(1, 10)
            .WithMessage("Seats must be between 1 and 10.");

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
