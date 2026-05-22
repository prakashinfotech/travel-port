using FluentValidation;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Validators.Transport;

public class BookTrainRequestValidator : AbstractValidator<BookTrainRequest>
{
    public BookTrainRequestValidator()
    {
        RuleFor(x => x.TrainId)
            .NotEmpty()
            .WithMessage("TrainId is required.");

        RuleFor(x => x.TrainNumber)
            .NotEmpty()
            .WithMessage("Train number is required.");

        RuleFor(x => x.TrainName)
            .NotEmpty()
            .WithMessage("Train name is required.");

        RuleFor(x => x.Class)
            .NotEmpty()
            .WithMessage("Class is required.");

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
