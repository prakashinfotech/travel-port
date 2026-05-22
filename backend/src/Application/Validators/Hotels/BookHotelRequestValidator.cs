using FluentValidation;
using TravelPort.Application.DTOs.Hotels;

namespace TravelPort.Application.Validators.Hotels;

public class BookHotelRequestValidator : AbstractValidator<BookHotelRequest>
{
    public BookHotelRequestValidator()
    {
        RuleFor(x => x.HotelId)
            .NotEmpty()
            .WithMessage("HotelId is required.");

        RuleFor(x => x.RoomId)
            .NotEmpty()
            .WithMessage("RoomId is required.");

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

        RuleFor(x => x.GuestEmail)
            .EmailAddress()
            .WithMessage("Guest email must be a valid email address.")
            .When(x => !string.IsNullOrWhiteSpace(x.GuestEmail));

        RuleFor(x => x.GuestPhone)
            .Matches(@"^\d{10}$")
            .WithMessage("Guest phone must be a 10-digit number.")
            .When(x => !string.IsNullOrWhiteSpace(x.GuestPhone));

        RuleFor(x => x.MealPlanAmountPerNight)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Meal plan amount cannot be negative.");
    }
}
