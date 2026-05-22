using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;

namespace TravelPort.API.Controllers;

[Route("api/v1/ai")]
public class AiController : BaseApiController
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AiController> _logger;

    private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
    private const string AnthropicVersion = "2023-06-01";

    private const string SystemPrompt = """
        You are TravelPort AI, a smart travel assistant built into the TravelPort booking platform — India's leading travel portal.

        You help users:
        - Search and compare flights, hotels, buses, trains, and cabs across Indian cities
        - Understand pricing, schedules, and availability
        - Navigate the booking process and manage existing bookings
        - Find and apply discount coupons (SAVE100, FIRST10, SUMMER20, HOTEL500, FLAT15, FLYSAVER, FLYOFF200, FLYDEAL15, HOTELOFF15, STAYMORE, HOTELDEAL)
        - Get travel tips for Indian destinations

        Key facts about TravelPort:
        - Flights: 900+ routes with 7 airlines (IndiGo, SpiceJet, Air India, Vistara, Akasa Air, Air India Express, Go First)
        - Hotels: 60+ properties across Mumbai, Delhi, Goa, Bangalore, Jaipur, Hyderabad, Chennai, Kolkata, Ahmedabad, Pune, Kochi, Lucknow
        - Wallet system: top-up and pay for bookings; 90% refund on cancellation

        App navigation:
        - /flights → search flights | /hotels → search hotels | /buses → search buses
        - /trains → search trains | /cabs → search cabs
        - /bookings → your bookings | /profile → profile & wallet | /ai-planner → AI trip planner

        Keep responses friendly, concise (2-3 sentences), and actionable. Never make up flight numbers, prices, or availability — instead guide the user to search.
        """;

    public AiController(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<AiController> logger)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // ── Chat (SSE streaming) ─────────────────────────────────────────────────
    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task Chat([FromBody] AiChatRequest request, CancellationToken ct)
    {
        var apiKey = _config["Claude:ApiKey"] ?? "";
        var model = _config["Claude:Model"] ?? "claude-haiku-4-5-20251001";

        if (string.IsNullOrEmpty(apiKey))
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            await Response.WriteAsync("data: \"I'm not configured yet. Please add a Claude API key to enable the AI assistant.\"\n\n", ct);
            await Response.WriteAsync("data: [DONE]\n\n", ct);
            return;
        }

        var messages = request.Messages
            .Select(m => new { role = m.Role, content = m.Content })
            .ToArray();

        var body = JsonSerializer.Serialize(new
        {
            model,
            max_tokens = 1024,
            stream = true,
            system = SystemPrompt,
            messages
        });

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Claude API error {Status}: {Error}", response.StatusCode, err);
                await Response.WriteAsync("data: \"Sorry, I couldn't connect to the AI service right now. Please try again later.\"\n\n", ct);
                await Response.WriteAsync("data: [DONE]\n\n", ct);
                return;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !ct.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(ct);
                if (line == null) break;

                if (!line.StartsWith("data: ")) continue;
                var json = line[6..];
                if (json == "[DONE]") break;

                try
                {
                    using var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("type", out var typeEl) &&
                        typeEl.GetString() == "content_block_delta" &&
                        root.TryGetProperty("delta", out var delta) &&
                        delta.TryGetProperty("type", out var deltaType) &&
                        deltaType.GetString() == "text_delta" &&
                        delta.TryGetProperty("text", out var textEl))
                    {
                        var text = textEl.GetString() ?? "";
                        if (!string.IsNullOrEmpty(text))
                        {
                            var encoded = JsonSerializer.Serialize(text);
                            await Response.WriteAsync($"data: {encoded}\n\n", ct);
                            await Response.Body.FlushAsync(ct);
                        }
                    }
                }
                catch (JsonException)
                {
                    // Skip malformed lines
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected — normal
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming from Claude API");
            await Response.WriteAsync("data: \"An error occurred. Please try again.\"\n\n", ct);
        }

        await Response.WriteAsync("data: [DONE]\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }

    // ── Smart Destination Recommendations ────────────────────────────────────
    [HttpPost("recommendations")]
    [AllowAnonymous]
    public async Task<ActionResult> Recommendations([FromBody] RecommendationsRequest request, CancellationToken ct)
    {
        var apiKey = _config["Claude:ApiKey"] ?? "";
        var model  = _config["Claude:Model"] ?? "claude-haiku-4-5-20251001";

        if (string.IsNullOrEmpty(apiKey))
        {
            return BadRequest(new { error = "AI not configured." });
        }

        var context = request.BookingHistory?.Count > 0
            ? $"The user has previously visited: {string.Join(", ", request.BookingHistory)}."
            : "The user is a new visitor with no booking history.";

        var systemPrompt =
            "You are a travel recommendations engine for TravelPort, India's travel portal. " +
            "Return ONLY valid JSON — no markdown, no explanation.\n\n" +
            "Return an array of exactly 4 destination recommendations:\n" +
            "[\n" +
            "  {\n" +
            "    \"city\": \"city name\",\n" +
            "    \"tagline\": \"one short phrase (3-5 words)\",\n" +
            "    \"reason\": \"one sentence why this fits the user\",\n" +
            "    \"bestFor\": \"e.g. Beaches, Culture, Food, Adventure\",\n" +
            "    \"flightCode\": \"IATA code (BOM/DEL/BLR/MAA/CCU/HYD/PNQ/GOI/JAI/COK/AMD/LKO)\"\n" +
            "  }\n" +
            "]\n\n" +
            "Pick diverse destinations from: Goa, Mumbai, Delhi, Bangalore, Jaipur, Hyderabad, Chennai, Kolkata, Kochi, Lucknow, Pune, Ahmedabad. " +
            "If the user has booking history, avoid repeating those cities and suggest complementary destinations.";

        var body = JsonSerializer.Serialize(new
        {
            model,
            max_tokens = 1024,
            stream = false,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = context } }
        });

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Claude recommendations error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString() ?? "[]";

            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Recommendations failed");
            return StatusCode(500, new { error = "Failed to generate recommendations." });
        }
    }

    // ── AI Trip Planner ───────────────────────────────────────────────────────
    [HttpPost("trip-plan")]
    [AllowAnonymous]
    public async Task TripPlan([FromBody] TripPlanRequest request, CancellationToken ct)
    {
        var apiKey = _config["Claude:ApiKey"] ?? "";
        var model  = _config["Claude:Model"] ?? "claude-haiku-4-5-20251001";

        if (string.IsNullOrEmpty(apiKey))
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            await Response.WriteAsync("data: \"AI trip planner is not configured. Please add a Claude API key.\"\n\n", ct);
            await Response.WriteAsync("data: [DONE]\n\n", ct);
            return;
        }

        var today = DateTime.UtcNow.AddHours(5).AddMinutes(30);
        var tripSystemPrompt =
            $"Today's date is {today:yyyy-MM-dd}. You are an expert Indian travel planner.\n\n" +
            "Create a detailed day-by-day trip itinerary. Structure your response in this EXACT markdown format:\n\n" +
            "## Trip Overview\n" +
            "[2-3 sentence overview]\n\n" +
            "## Day 1: [Theme]\n" +
            "- **Morning**: [activity]\n" +
            "- **Afternoon**: [activity]\n" +
            "- **Evening**: [activity]\n" +
            "[continue for each day]\n\n" +
            "## Booking Suggestions\n" +
            "- **Flight**: [route details] → [BOOK_FLIGHT:origin=BOM&destination=DEL&date=2026-06-01]\n" +
            "- **Hotel**: [hotel suggestion in destination city] → [BOOK_HOTEL:city=Delhi&checkIn=2026-06-01&checkOut=2026-06-05]\n\n" +
            "## Travel Tips\n" +
            "[3-4 practical tips]\n\n" +
            "For BOOK_FLIGHT and BOOK_HOTEL markers, use realistic dates based on the trip brief. " +
            "Use IATA codes: Mumbai=BOM, Delhi=DEL, Bangalore=BLR, Chennai=MAA, Kolkata=CCU, Hyderabad=HYD, Pune=PNQ, Goa=GOI, Jaipur=JAI, Kochi=COK. " +
            "Keep each day section focused and actionable.";

        var body = JsonSerializer.Serialize(new
        {
            model,
            max_tokens = 2048,
            stream = true,
            system = tripSystemPrompt,
            messages = new[] { new { role = "user", content = request.Brief } }
        });

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";
        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Claude trip plan error {Status}", response.StatusCode);
                await Response.WriteAsync("data: \"Sorry, could not generate the trip plan. Please try again.\"\n\n", ct);
                await Response.WriteAsync("data: [DONE]\n\n", ct);
                return;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !ct.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(ct);
                if (line == null) break;
                if (!line.StartsWith("data: ")) continue;
                var json = line[6..];
                if (json == "[DONE]") break;

                try
                {
                    using var doc = JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("type", out var typeEl) &&
                        typeEl.GetString() == "content_block_delta" &&
                        root.TryGetProperty("delta", out var delta) &&
                        delta.TryGetProperty("type", out var deltaType) &&
                        deltaType.GetString() == "text_delta" &&
                        delta.TryGetProperty("text", out var textEl))
                    {
                        var text = textEl.GetString() ?? "";
                        if (!string.IsNullOrEmpty(text))
                        {
                            var encoded = JsonSerializer.Serialize(text);
                            await Response.WriteAsync($"data: {encoded}\n\n", ct);
                            await Response.Body.FlushAsync(ct);
                        }
                    }
                }
                catch (JsonException) { }
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming trip plan");
            await Response.WriteAsync("data: \"An error occurred. Please try again.\"\n\n", ct);
        }

        await Response.WriteAsync("data: [DONE]\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }

    // ── Price Trend Insight ───────────────────────────────────────────────────
    [HttpGet("price-insight")]
    [AllowAnonymous]
    [ResponseCache(Duration = 1800)] // Cache 30 min per route pair
    public async Task<ActionResult> PriceInsight(
        [FromQuery] string origin, [FromQuery] string destination, CancellationToken ct)
    {
        var apiKey = _config["Claude:ApiKey"] ?? "";
        var model  = _config["Claude:Model"] ?? "claude-haiku-4-5-20251001";

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(origin) || string.IsNullOrEmpty(destination))
        {
            return Ok(new { insight = (string?)null });
        }

        var systemPrompt =
            "You are a flight price trend analyst for Indian domestic routes. " +
            "Return ONLY a single JSON object with one field: insight (a string). " +
            "The insight must be exactly one sentence (max 15 words) about price trends on this route. " +
            "Use realistic patterns — e.g. prices drop mid-week, or are highest on Friday evenings. " +
            "Do NOT include specific prices or dates. Example: {\"insight\": \"Prices are lowest Tuesday–Wednesday on this route.\"}";

        var userMessage = $"Provide a price trend insight for the {origin} to {destination} domestic flight route in India.";

        var body = JsonSerializer.Serialize(new
        {
            model,
            max_tokens = 100,
            stream = false,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userMessage } }
        });

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode) return Ok(new { insight = (string?)null });

            using var doc = JsonDocument.Parse(rawJson);
            var text = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Price insight failed");
            return Ok(new { insight = (string?)null });
        }
    }

    // ── Natural Language Search ───────────────────────────────────────────────
    [HttpPost("nl-search")]
    [AllowAnonymous]
    public async Task<ActionResult> NlSearch([FromBody] NlSearchRequest request, CancellationToken ct)
    {
        var apiKey = _config["Claude:ApiKey"] ?? "";
        var model  = _config["Claude:Model"] ?? "claude-haiku-4-5-20251001";

        if (string.IsNullOrEmpty(apiKey))
        {
            return BadRequest(new { error = "AI not configured." });
        }

        var today = DateTime.UtcNow.AddHours(5).AddMinutes(30); // IST
        var systemPrompt =
            $"Today's date is {today:yyyy-MM-dd} ({today:dddd}).\n" +
            "Parse the travel search query below and return ONLY valid JSON — no markdown, no explanation.\n\n" +
            "Format:\n" +
            "{\n" +
            "  \"type\": \"flight|hotel|bus|train|cab\",\n" +
            "  \"origin\": \"IATA code for flights (BOM/DEL/BLR/MAA/CCU/HYD/PNQ/GOI/JAI/COK/AMD/LKO/ATQ/IXC), city name for others\",\n" +
            "  \"originCity\": \"human-readable city name\",\n" +
            "  \"destination\": \"same format as origin\",\n" +
            "  \"destinationCity\": \"human-readable city name\",\n" +
            "  \"date\": \"YYYY-MM-DD or null\",\n" +
            "  \"returnDate\": \"YYYY-MM-DD or null\",\n" +
            "  \"passengers\": \"integer or null\",\n" +
            "  \"hotelCity\": \"city name or null\",\n" +
            "  \"checkIn\": \"YYYY-MM-DD or null\",\n" +
            "  \"checkOut\": \"YYYY-MM-DD or null\",\n" +
            "  \"guests\": \"integer or null\"\n" +
            "}\n\n" +
            "IATA map: Mumbai=BOM, Delhi=DEL, Bangalore=BLR, Chennai=MAA, Kolkata=CCU, Hyderabad=HYD, Pune=PNQ, Goa=GOI, Jaipur=JAI, Kochi=COK, Ahmedabad=AMD, Lucknow=LKO, Amritsar=ATQ, Chandigarh=IXC.\n" +
            "If query type is unclear, default to \"flight\". If a city is ambiguous, pick the most common match.";

        var body = JsonSerializer.Serialize(new
        {
            model,
            max_tokens = 512,
            stream = false,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = request.Query } }
        });

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Add("x-api-key", apiKey);
        httpRequest.Headers.Add("anthropic-version", AnthropicVersion);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Claude NL search error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            // Strip markdown code fences if Claude wrapped in ```json ... ```
            text = text.Trim();
            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NL search failed");
            return StatusCode(500, new { error = "Failed to parse query." });
        }
    }
}

public sealed class AiChatRequest
{
    public List<AiMessage> Messages { get; set; } = [];
}

public sealed class AiMessage
{
    public string Role { get; set; } = "user";
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
