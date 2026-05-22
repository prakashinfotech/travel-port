using FluentValidation;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Validators.Transport;

public class BookCabRequestValidator : AbstractValidator<BookCabRequest>
{
    public BookCabRequestValidator()
    {
        RuleFor(x => x.CabId)
            .NotEmpty()
            .WithMessage("CabId is required.");

        RuleFor(x => x.Provider)
            .NotEmpty()
            .WithMessage("Provider is required.");

        RuleFor(x => x.CabType)
            .NotEmpty()
            .WithMessage("Cab type is required.");

        RuleFor(x => x.CarModel)
            .NotEmpty()
            .WithMessage("Car model is required.");

        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.");

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.");

        RuleFor(x => x.PickupDateTime)
            .NotEmpty()
            .WithMessage("Pickup date/time is required.");

        RuleFor(x => x.DistanceKm)
            .GreaterThan(0)
            .WithMessage("Distance must be greater than zero.");

        RuleFor(x => x.Price)
            .GreaterThan(0)
            .WithMessage("Price must be greater than zero.");

        RuleFor(x => x.DriverRating)
            .InclusiveBetween(0m, 5m)
            .WithMessage("Driver rating must be between 0 and 5.")
            .When(x => x.DriverRating.HasValue);

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
