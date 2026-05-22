using FluentValidation;
using TravelPort.Application.DTOs.Payments;

namespace TravelPort.Application.Validators.Payments;

public class InitiatePaymentRequestValidator : AbstractValidator<InitiatePaymentRequest>
{
    public InitiatePaymentRequestValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty()
            .WithMessage("BookingId is required.");
    }
}

public class VerifyPaymentRequestValidator : AbstractValidator<VerifyPaymentRequest>
{
    public VerifyPaymentRequestValidator()
    {
        RuleFor(x => x.BookingId)
            .NotEmpty()
            .WithMessage("BookingId is required.");

        RuleFor(x => x.RazorpayOrderId)
            .NotEmpty()
            .WithMessage("Razorpay order ID is required.");

        RuleFor(x => x.RazorpayPaymentId)
            .NotEmpty()
            .WithMessage("Razorpay payment ID is required.");

        RuleFor(x => x.RazorpaySignature)
            .NotEmpty()
            .WithMessage("Razorpay signature is required.");
    }
}
