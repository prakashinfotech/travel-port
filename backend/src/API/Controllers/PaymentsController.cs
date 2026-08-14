using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Payments;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Enums;
using TravelPort.Persistence.Context;
using PaymentStatus  = TravelPort.Domain.Enums.PaymentStatus;
using PaymentMethod  = TravelPort.Domain.Enums.PaymentMethod;

namespace TravelPort.API.Controllers;

[Route("api/v1/payments")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _payment;
    private readonly IBookingService _bookingService;
    private readonly TravelPortDbContext _db;

    public PaymentsController(IPaymentService payment, IBookingService bookingService, TravelPortDbContext db)
    {
        _payment = payment;
        _bookingService = bookingService;
        _db = db;
    }

    /// <summary>Creates a Razorpay order for a confirmed booking.</summary>
    [Authorize]
    [HttpPost("initiate")]
    public async Task<ActionResult<ApiResponse<CreateOrderResponse>>> Initiate(
        [FromBody] InitiatePaymentRequest req, CancellationToken ct)
    {
        var booking = await _db.Bookings.FindAsync([req.BookingId], ct)
            ?? throw new KeyNotFoundException($"Booking {req.BookingId} not found");

        if (booking.UserId != CurrentUserId)
            return Forbid();

        if (!_payment.IsConfigured)
        {
            // Simulate order in dev when Razorpay not configured
            var mock = new CreateOrderResponse(
                $"order_mock_{Guid.NewGuid():N}",
                booking.FinalAmount,
                "INR",
                "mock_key_id"
            );
            return Ok(ApiResponse<CreateOrderResponse>.Ok(mock, "Mock order created (Razorpay not configured)"));
        }

        var order = await _payment.CreateOrderAsync(
            new CreateOrderRequest(booking.Id, booking.FinalAmount), ct);

        return Ok(ApiResponse<CreateOrderResponse>.Ok(order));
    }

    /// <summary>Verifies Razorpay payment signature and marks booking as paid.</summary>
    [Authorize]
    [HttpPost("verify")]
    public async Task<ActionResult<ApiResponse<object>>> Verify(
        [FromBody] VerifyPaymentRequest req, CancellationToken ct)
    {
        var booking = await _db.Bookings.FindAsync([req.BookingId], ct)
            ?? throw new KeyNotFoundException($"Booking {req.BookingId} not found");

        if (booking.UserId != CurrentUserId)
            return Forbid();

        // Verify HMAC signature from Razorpay
        bool valid = _payment.IsConfigured
            ? _payment.VerifySignature(req.RazorpayOrderId, req.RazorpayPaymentId, req.RazorpaySignature)
            : true; // allow in dev

        if (!valid)
            return BadRequest(ApiResponse<object>.Fail("Payment signature verification failed"));

        // Record payment
        var payment = new TravelPort.Domain.Entities.Payment
        {
            Id               = Guid.NewGuid(),
            BookingId        = booking.Id,
            Method           = PaymentMethod.Card,
            GatewayOrderId   = req.RazorpayOrderId,
            GatewayPaymentId = req.RazorpayPaymentId,
            Amount           = booking.FinalAmount,
            Status           = PaymentStatus.Success,
            PaidAt           = DateTime.UtcNow,
        };

        booking.Status = BookingStatus.Confirmed;
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);

        // Send confirmation email now that payment is complete
        await _bookingService.SendConfirmationEmailAsync(booking.Id, ct);

        return Ok(ApiResponse<object>.Ok(new { paymentId = payment.Id, bookingRef = booking.BookingRef },
            "Payment verified successfully"));
    }

    /// <summary>Returns payment status from Razorpay.</summary>
    [Authorize]
    [HttpGet("{paymentId}")]
    public async Task<ActionResult<ApiResponse<PaymentStatusResponse>>> Status(
        string paymentId, CancellationToken ct)
    {
        if (!_payment.IsConfigured)
            return Ok(ApiResponse<PaymentStatusResponse>.Ok(
                new PaymentStatusResponse(paymentId, "captured", 0, "card"), "Mock status"));

        var status = await _payment.GetPaymentStatusAsync(paymentId, ct);
        return Ok(ApiResponse<PaymentStatusResponse>.Ok(status));
    }
}
