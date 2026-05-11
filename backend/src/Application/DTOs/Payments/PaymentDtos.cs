namespace TravelPort.Application.DTOs.Payments;

public record CreateOrderRequest(
    Guid BookingId,
    decimal Amount,
    string Currency = "INR"
);

public record CreateOrderResponse(
    string OrderId,
    decimal Amount,
    string Currency,
    string KeyId
);

public record VerifyPaymentRequest(
    Guid BookingId,
    string RazorpayOrderId,
    string RazorpayPaymentId,
    string RazorpaySignature
);

public record PaymentStatusResponse(
    string PaymentId,
    string Status,
    decimal Amount,
    string Method
);

public record InitiatePaymentRequest(
    Guid BookingId
);
