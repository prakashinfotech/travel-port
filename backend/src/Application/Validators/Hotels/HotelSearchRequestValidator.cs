using FluentValidation;
using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Application.Validators.Hotels;

public class HotelSearchRequestValidator : AbstractValidator<HotelSearchRequest>
{
    private static readonly string[] ValidSortBy = ["price", "rating", "name", "stars"];

    public HotelSearchRequestValidator()
    {
        RuleFor(x => x.City)
            .NotEmpty()
            .WithMessage("City is required.")
            .MaximumLength(100);

        RuleFor(x => x.CheckIn)
            .NotEmpty()
            .WithMessage("Check-in date is required.");

        RuleFor(x => x.CheckOut)
            .NotEmpty()
            .WithMessage("Check-out date is required.")
            .GreaterThan(x => x.CheckIn)
            .WithMessage("Check-out must be after check-in.");

        RuleFor(x => x.Guests)
            .InclusiveBetween(1, 20)
            .WithMessage("Guests must be between 1 and 20.");

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("MinPrice cannot be negative.")
            .When(x => x.MinPrice.HasValue);

        RuleFor(x => x.MaxPrice)
            .GreaterThan(0)
            .WithMessage("MaxPrice must be greater than zero.")
            .GreaterThanOrEqualTo(x => x.MinPrice ?? 0)
            .WithMessage("MaxPrice must be greater than or equal to MinPrice.")
            .When(x => x.MaxPrice.HasValue);

        RuleFor(x => x.StarRating)
            .InclusiveBetween(0, 5)
            .WithMessage("StarRating must be between 0 and 5.");

        RuleFor(x => x.SortBy)
            .Must(s => ValidSortBy.Contains(s))
            .WithMessage("SortBy must be one of: price, rating, name, stars.")
            .When(x => !string.IsNullOrWhiteSpace(x.SortBy));

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");
    }
}
