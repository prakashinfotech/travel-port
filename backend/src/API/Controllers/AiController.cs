using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Ai;

namespace TravelPort.API.Controllers;

[Route("api/v1/ai")]
public class AiController : BaseApiController
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AiController> _logger;

    private const string GeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    private const string GeminiModel   = "gemini-1.5-flash-8b";

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

    private string ApiKey => _config["Gemini:ApiKey"] ?? "";
    private string Model  => _config["Gemini:Model"]  ?? GeminiModel;

    private string StreamUrl  => $"{GeminiBaseUrl}/{Model}:streamGenerateContent?key={ApiKey}&alt=sse";
    private string GenerateUrl => $"{GeminiBaseUrl}/{Model}:generateContent?key={ApiKey}";

    private static object BuildContents(string systemPrompt, IEnumerable<object> messages) => new
    {
        system_instruction = new { parts = new[] { new { text = systemPrompt } } },
        contents = messages
    };

    private static string ExtractGeminiText(JsonDocument doc)
    {
        return doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "";
    }

    // ── Chat (SSE streaming) ─────────────────────────────────────────────────
    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task Chat([FromBody] AiChatRequest request, CancellationToken ct)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        if (string.IsNullOrEmpty(ApiKey))
        {
            await Response.WriteAsync("data: \"I'm not configured yet. Please add a Gemini API key to enable the AI assistant.\"\n\n", ct);
            await Response.WriteAsync("data: [DONE]\n\n", ct);
            return;
        }

        // Convert messages: Anthropic uses "assistant", Gemini uses "model"
        var contents = request.Messages.Select(m => new
        {
            role    = m.Role == "assistant" ? "model" : "user",
            parts   = new[] { new { text = m.Content } }
        });

        var body = JsonSerializer.Serialize(BuildContents(SystemPrompt, contents));

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, StreamUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Gemini API error {Status}: {Error}", response.StatusCode, err);
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
                var json = line[6..].Trim();
                if (json is "[DONE]" or "") continue;

                try
                {
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString() ?? "";

                    if (!string.IsNullOrEmpty(text))
                    {
                        var encoded = JsonSerializer.Serialize(text);
                        await Response.WriteAsync($"data: {encoded}\n\n", ct);
                        await Response.Body.FlushAsync(ct);
                    }
                }
                catch (JsonException) { }
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming from Gemini API");
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
        if (string.IsNullOrEmpty(ApiKey))
            return BadRequest(new { error = "AI not configured." });

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

        var body = JsonSerializer.Serialize(BuildContents(systemPrompt, new[]
        {
            new { role = "user", parts = new[] { new { text = context } } }
        }));

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GenerateUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini recommendations error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGeminiText(doc).Trim();

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
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        if (string.IsNullOrEmpty(ApiKey))
        {
            await Response.WriteAsync("data: \"AI trip planner is not configured. Please add a Gemini API key.\"\n\n", ct);
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

        var body = JsonSerializer.Serialize(BuildContents(tripSystemPrompt, new[]
        {
            new { role = "user", parts = new[] { new { text = request.Brief } } }
        }));

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, StreamUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini trip plan error {Status}", response.StatusCode);
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
                var json = line[6..].Trim();
                if (json is "[DONE]" or "") continue;

                try
                {
                    using var doc = JsonDocument.Parse(json);
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text")
                        .GetString() ?? "";

                    if (!string.IsNullOrEmpty(text))
                    {
                        var encoded = JsonSerializer.Serialize(text);
                        await Response.WriteAsync($"data: {encoded}\n\n", ct);
                        await Response.Body.FlushAsync(ct);
                    }
                }
                catch (JsonException) { }
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming trip plan from Gemini");
            await Response.WriteAsync("data: \"An error occurred. Please try again.\"\n\n", ct);
        }

        await Response.WriteAsync("data: [DONE]\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }

    // ── Price Trend Insight ───────────────────────────────────────────────────
    [HttpGet("price-insight")]
    [AllowAnonymous]
    [ResponseCache(Duration = 1800)]
    public async Task<ActionResult> PriceInsight(
        [FromQuery] string origin, [FromQuery] string destination, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(ApiKey) || string.IsNullOrEmpty(origin) || string.IsNullOrEmpty(destination))
            return Ok(new { insight = (string?)null });

        var systemPrompt =
            "You are a flight price trend analyst for Indian domestic routes. " +
            "Return ONLY a single JSON object with one field: insight (a string). " +
            "The insight must be exactly one sentence (max 15 words) about price trends on this route. " +
            "Use realistic patterns — e.g. prices drop mid-week, or are highest on Friday evenings. " +
            "Do NOT include specific prices or dates. Example: {\"insight\": \"Prices are lowest Tuesday–Wednesday on this route.\"}";

        var userMessage = $"Provide a price trend insight for the {origin} to {destination} domestic flight route in India.";

        var body = JsonSerializer.Serialize(BuildContents(systemPrompt, new[]
        {
            new { role = "user", parts = new[] { new { text = userMessage } } }
        }));

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GenerateUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            if (!response.IsSuccessStatusCode) return Ok(new { insight = (string?)null });

            var rawJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGeminiText(doc).Trim();

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
        if (string.IsNullOrEmpty(ApiKey))
            return BadRequest(new { error = "AI not configured." });

        var today = DateTime.UtcNow.AddHours(5).AddMinutes(30);
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

        var body = JsonSerializer.Serialize(BuildContents(systemPrompt, new[]
        {
            new { role = "user", parts = new[] { new { text = request.Query } } }
        }));

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GenerateUrl)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini NL search error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGeminiText(doc).Trim();

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
