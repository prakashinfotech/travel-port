using FluentValidation;
using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Application.Validators.Hotels;

public class CreateHotelReviewRequestValidator : AbstractValidator<CreateHotelReviewRequest>
{
    public CreateHotelReviewRequestValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .WithMessage("Rating must be between 1 and 5.");

        RuleFor(x => x.Comment)
            .NotEmpty()
            .MaximumLength(1000)
            .WithMessage("Comment is required and must be 1000 characters or fewer.");
    }
}
