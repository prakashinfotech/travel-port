namespace TravelPort.Infrastructure.ExternalProviders.Amadeus;

public class AmadeusSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://test.api.amadeus.com"; // swap to https://api.amadeus.com for production
    public bool Enabled { get; set; } = false;
}
