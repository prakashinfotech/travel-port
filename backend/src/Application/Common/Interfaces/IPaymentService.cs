using TravelPort.Application.DTOs.Payments;

namespace TravelPort.Application.Common.Interfaces;

public interface IPaymentService
{
    bool IsConfigured { get; }
    Task<CreateOrderResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken ct = default);
    bool VerifySignature(string orderId, string paymentId, string signature);
    Task<PaymentStatusResponse> GetPaymentStatusAsync(string paymentId, CancellationToken ct = default);
}
