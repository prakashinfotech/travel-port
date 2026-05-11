namespace TravelPort.Infrastructure.ExternalProviders.Duffel;

public class DuffelSettings
{
    public string ApiToken { get; set; } = string.Empty;
    public string BaseUrl  { get; set; } = "https://api.duffel.com";
    public bool   Enabled  { get; set; } = false;
}
