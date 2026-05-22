using FluentValidation;
using TravelPort.Application.DTOs.Admin;

namespace TravelPort.Application.Validators.Admin;

public class CreateCouponRequestValidator : AbstractValidator<CreateCouponRequest>
{
    private static readonly string[] ValidTypes = ["percentage", "flat"];

    public CreateCouponRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("Coupon code is required.")
            .MaximumLength(50)
            .WithMessage("Coupon code cannot exceed 50 characters.")
            .Matches(@"^[A-Z0-9_\-]+$")
            .WithMessage("Coupon code may only contain uppercase letters, digits, hyphens, and underscores.");

        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Coupon type is required.")
            .Must(t => ValidTypes.Contains(t?.ToLowerInvariant()))
            .WithMessage("Type must be 'percentage' or 'flat'.");

        RuleFor(x => x.Value)
            .GreaterThan(0)
            .WithMessage("Coupon value must be greater than zero.");

        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100)
            .WithMessage("Percentage discount cannot exceed 100%.")
            .When(x => x.Type?.ToLowerInvariant() == "percentage");

        RuleFor(x => x.MinAmount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Minimum amount cannot be negative.");

        RuleFor(x => x.MaxDiscount)
            .GreaterThan(0)
            .WithMessage("Maximum discount must be greater than zero.")
            .When(x => x.MaxDiscount.HasValue);

        RuleFor(x => x.UsageLimit)
            .GreaterThan(0)
            .WithMessage("Usage limit must be greater than zero.")
            .When(x => x.UsageLimit.HasValue);
    }
}

public class UpdateCouponRequestValidator : AbstractValidator<UpdateCouponRequest>
{
    private static readonly string[] ValidTypes = ["percentage", "flat"];

    public UpdateCouponRequestValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty()
            .WithMessage("Coupon type is required.")
            .Must(t => ValidTypes.Contains(t?.ToLowerInvariant()))
            .WithMessage("Type must be 'percentage' or 'flat'.");

        RuleFor(x => x.Value)
            .GreaterThan(0)
            .WithMessage("Coupon value must be greater than zero.");

        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100)
            .WithMessage("Percentage discount cannot exceed 100%.")
            .When(x => x.Type?.ToLowerInvariant() == "percentage");

        RuleFor(x => x.MinAmount)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Minimum amount cannot be negative.");

        RuleFor(x => x.MaxDiscount)
            .GreaterThan(0)
            .WithMessage("Maximum discount must be greater than zero.")
            .When(x => x.MaxDiscount.HasValue);

        RuleFor(x => x.UsageLimit)
            .GreaterThan(0)
            .WithMessage("Usage limit must be greater than zero.")
            .When(x => x.UsageLimit.HasValue);
    }
}
