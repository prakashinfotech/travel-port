using FluentValidation;
using TravelPort.Application.DTOs.Transport;

namespace TravelPort.Application.Validators.Transport;

public class BusSearchRequestValidator : AbstractValidator<BusSearchRequest>
{
    public BusSearchRequestValidator()
    {
        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.")
            .MaximumLength(100);

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.")
            .MaximumLength(100);

        RuleFor(x => x.TravelDate)
            .NotEmpty()
            .WithMessage("Travel date is required.");

        RuleFor(x => x.Seats)
            .InclusiveBetween(1, 10)
            .WithMessage("Seats must be between 1 and 10.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}

public class CabSearchRequestValidator : AbstractValidator<CabSearchRequest>
{
    private static readonly string[] ValidTripTypes = ["OneWay", "Outstation", "Rental"];

    public CabSearchRequestValidator()
    {
        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.")
            .MaximumLength(200);

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.")
            .MaximumLength(200);

        RuleFor(x => x.PickupDateTime)
            .NotEmpty()
            .WithMessage("Pickup date/time is required.");

        RuleFor(x => x.TripType)
            .Must(t => ValidTripTypes.Contains(t))
            .WithMessage("TripType must be one of: OneWay, Outstation, Rental.")
            .When(x => !string.IsNullOrWhiteSpace(x.TripType));

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}

public class TrainSearchRequestValidator : AbstractValidator<TrainSearchRequest>
{
    public TrainSearchRequestValidator()
    {
        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.")
            .MaximumLength(100);

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.")
            .MaximumLength(100);

        RuleFor(x => x.TravelDate)
            .NotEmpty()
            .WithMessage("Travel date is required.");

        RuleFor(x => x.Class)
            .NotEmpty()
            .WithMessage("Class is required.")
            .MaximumLength(10);

        RuleFor(x => x.Passengers)
            .InclusiveBetween(1, 9)
            .WithMessage("Passengers must be between 1 and 9.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}

public class SeatLockRequestValidator : AbstractValidator<SeatLockRequest>
{
    public SeatLockRequestValidator()
    {
        RuleFor(x => x.SeatNumbers)
            .NotNull()
            .WithMessage("Seat numbers are required.")
            .Must(s => s.Length > 0)
            .WithMessage("At least one seat number must be provided.")
            .Must(s => s.Length <= 10)
            .WithMessage("Cannot lock more than 10 seats at once.");

        RuleForEach(x => x.SeatNumbers)
            .NotEmpty()
            .WithMessage("Seat number cannot be empty.");
    }
}
