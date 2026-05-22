namespace TravelPort.Application.DTOs.Ai;

public sealed class AiChatRequest
{
    public List<AiMessage> Messages { get; set; } = [];
}

public sealed class AiMessage
{
    public string Role    { get; set; } = "user";
    public string Content { get; set; } = "";
}

public sealed class NlSearchRequest
{
    public string Query { get; set; } = "";
}

public sealed class RecommendationsRequest
{
    public List<string>? BookingHistory { get; set; }
}

public sealed class TripPlanRequest
{
    public string Brief { get; set; } = "";
}
