using FluentValidation;
using TravelPort.Application.DTOs.Operator;

namespace TravelPort.Application.Validators.Operator;

public class CreateFlightRequestValidator : AbstractValidator<CreateFlightRequest>
{
    public CreateFlightRequestValidator()
    {
        RuleFor(x => x.FlightNumber)
            .NotEmpty().WithMessage("Flight number is required.")
            .MaximumLength(10).WithMessage("Flight number cannot exceed 10 characters.");

        RuleFor(x => x.Source)
            .NotEmpty().WithMessage("Source is required.")
            .MaximumLength(100);

        RuleFor(x => x.Destination)
            .NotEmpty().WithMessage("Destination is required.")
            .MaximumLength(100);

        RuleFor(x => x.DepartureTime)
            .NotEmpty().WithMessage("Departure time is required.");

        RuleFor(x => x.ArrivalTime)
            .NotEmpty().WithMessage("Arrival time is required.")
            .GreaterThan(x => x.DepartureTime)
            .WithMessage("Arrival time must be after departure time.");

        RuleFor(x => x.TotalSeats)
            .GreaterThan(0).WithMessage("Total seats must be greater than zero.")
            .LessThanOrEqualTo(500).WithMessage("Total seats cannot exceed 500.");

        RuleFor(x => x.EconomyPrice)
            .GreaterThan(0).WithMessage("Economy price must be greater than zero.");

        RuleFor(x => x.BusinessPrice)
            .GreaterThan(0).WithMessage("Business price must be greater than zero.")
            .When(x => x.BusinessPrice.HasValue);

        RuleFor(x => x.Stops)
            .InclusiveBetween(0, 2).WithMessage("Stops must be 0, 1, or 2.");

        RuleFor(x => x.LayoverDurationMinutes)
            .GreaterThan(0).WithMessage("Layover duration must be greater than zero.")
            .When(x => x.LayoverDurationMinutes.HasValue);
    }
}

public class UpdateFlightRequestValidator : AbstractValidator<UpdateFlightRequest>
{
    public UpdateFlightRequestValidator()
    {
        RuleFor(x => x.FlightNumber)
            .MaximumLength(10).WithMessage("Flight number cannot exceed 10 characters.")
            .When(x => x.FlightNumber is not null);

        RuleFor(x => x.Source)
            .MaximumLength(100)
            .When(x => x.Source is not null);

        RuleFor(x => x.Destination)
            .MaximumLength(100)
            .When(x => x.Destination is not null);

        When(x => x.DepartureTime.HasValue && x.ArrivalTime.HasValue, () =>
        {
            RuleFor(x => x.ArrivalTime)
                .GreaterThan(x => x.DepartureTime)
                .WithMessage("Arrival time must be after departure time.");
        });

        RuleFor(x => x.TotalSeats)
            .GreaterThan(0).WithMessage("Total seats must be greater than zero.")
            .LessThanOrEqualTo(500).WithMessage("Total seats cannot exceed 500.")
            .When(x => x.TotalSeats.HasValue);

        RuleFor(x => x.EconomyPrice)
            .GreaterThan(0).WithMessage("Economy price must be greater than zero.")
            .When(x => x.EconomyPrice.HasValue);

        RuleFor(x => x.BusinessPrice)
            .GreaterThan(0).WithMessage("Business price must be greater than zero.")
            .When(x => x.BusinessPrice.HasValue);

        RuleFor(x => x.Stops)
            .InclusiveBetween(0, 2).WithMessage("Stops must be 0, 1, or 2.")
            .When(x => x.Stops.HasValue);

        RuleFor(x => x.LayoverDurationMinutes)
            .GreaterThan(0).WithMessage("Layover duration must be greater than zero.")
            .When(x => x.LayoverDurationMinutes.HasValue);
    }
}
