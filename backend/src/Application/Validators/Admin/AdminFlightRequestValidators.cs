using FluentValidation;
using TravelPort.Application.DTOs.Admin;

namespace TravelPort.Application.Validators.Admin;

public class AdminUpdateFlightRequestValidator : AbstractValidator<AdminUpdateFlightRequest>
{
    public AdminUpdateFlightRequestValidator()
    {
        RuleFor(x => x.EconomyPrice)
            .GreaterThan(0)
            .WithMessage("Economy price must be greater than zero.")
            .When(x => x.EconomyPrice.HasValue);

        RuleFor(x => x.BusinessPrice)
            .GreaterThan(0)
            .WithMessage("Business price must be greater than zero.")
            .When(x => x.BusinessPrice.HasValue);

        RuleFor(x => x.TotalSeats)
            .GreaterThan(0)
            .WithMessage("Total seats must be greater than zero.")
            .When(x => x.TotalSeats.HasValue);

        RuleFor(x => x.AvailableSeats)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Available seats cannot be negative.")
            .When(x => x.AvailableSeats.HasValue);

        When(x => x.DepartureTime.HasValue && x.ArrivalTime.HasValue, () =>
        {
            RuleFor(x => x.ArrivalTime)
                .GreaterThan(x => x.DepartureTime)
                .WithMessage("Arrival time must be after departure time.");
        });
    }
}
