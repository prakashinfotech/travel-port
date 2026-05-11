namespace TravelPort.Infrastructure.ExternalProviders.Payment;

public class RazorpaySettings
{
    public string KeyId { get; set; } = string.Empty;
    public string KeySecret { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
}
