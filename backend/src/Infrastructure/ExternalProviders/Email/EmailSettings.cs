namespace TravelPort.Infrastructure.ExternalProviders.Email;

public class EmailSettings
{
    public string FromEmail { get; set; } = "noreply@travelport.com";
    public string FromName { get; set; } = "TravelPort";
    public bool Enabled { get; set; } = false;
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
}
