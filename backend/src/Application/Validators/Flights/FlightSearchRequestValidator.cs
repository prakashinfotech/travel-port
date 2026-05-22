using FluentValidation;
using TravelPort.Application.DTOs.Flights;

namespace TravelPort.Application.Validators.Flights;

public class FlightSearchRequestValidator : AbstractValidator<FlightSearchRequest>
{
    private static readonly string[] ValidSortBy = ["price", "duration", "departure", "arrival"];
    private static readonly string[] ValidCabins  = ["Economy", "Business"];

    public FlightSearchRequestValidator()
    {
        RuleFor(x => x.Origin)
            .NotEmpty()
            .WithMessage("Origin is required.")
            .MaximumLength(100);

        RuleFor(x => x.Destination)
            .NotEmpty()
            .WithMessage("Destination is required.")
            .MaximumLength(100);

        RuleFor(x => x.DepartureDate)
            .NotEmpty()
            .WithMessage("Departure date is required.");

        RuleFor(x => x.Passengers)
            .InclusiveBetween(1, 9)
            .WithMessage("Passengers must be between 1 and 9.");

        RuleFor(x => x.CabinClass)
            .Must(c => ValidCabins.Contains(c))
            .WithMessage("CabinClass must be Economy or Business.")
            .When(x => !string.IsNullOrWhiteSpace(x.CabinClass));

        RuleFor(x => x.SortBy)
            .Must(s => ValidSortBy.Contains(s))
            .WithMessage("SortBy must be one of: price, duration, departure, arrival.")
            .When(x => !string.IsNullOrWhiteSpace(x.SortBy));

        RuleFor(x => x.MaxPrice)
            .GreaterThan(0)
            .WithMessage("MaxPrice must be greater than zero.")
            .When(x => x.MaxPrice.HasValue);

        RuleFor(x => x.MaxStops)
            .InclusiveBetween(0, 2)
            .WithMessage("MaxStops must be 0, 1, or 2.")
            .When(x => x.MaxStops.HasValue);

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100)
            .WithMessage("PageSize must be between 1 and 100.");
    }
}
