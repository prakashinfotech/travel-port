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

    private const string GroqBaseUrl = "https://api.groq.com/openai/v1";
    private const string DefaultModel = "llama-3.3-70b-versatile";

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

    private string ApiKey => _config["Groq:ApiKey"] ?? "";
    private string Model  => _config["Groq:Model"]  ?? DefaultModel;

    private string ChatUrl => $"{GroqBaseUrl}/chat/completions";

    private HttpRequestMessage BuildRequest(object body, bool stream = false)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, ChatUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ApiKey);
        if (stream)
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));
        return req;
    }

    private static object BuildMessages(string systemPrompt, IEnumerable<object> userMessages, string model, bool stream = false)
    {
        var messages = new List<object> { new { role = "system", content = systemPrompt } };
        messages.AddRange(userMessages);
        return stream
            ? new { model, messages, stream = true }
            : (object)new { model, messages };
    }

    private static string? ExtractGroqText(JsonDocument doc)
    {
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }

    private static string? ExtractGroqChunk(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var delta = doc.RootElement.GetProperty("choices")[0].GetProperty("delta");
            if (delta.TryGetProperty("content", out var content))
                return content.GetString();
        }
        catch (JsonException) { }
        return null;
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
            await Response.WriteAsync("data: \"I'm not configured yet. Please add a Groq API key to enable the AI assistant.\"\n\n", ct);
            await Response.WriteAsync("data: [DONE]\n\n", ct);
            return;
        }

        var userMessages = request.Messages.Select(m => (object)new { role = m.Role, content = m.Content });
        var body = BuildMessages(SystemPrompt, userMessages, Model, stream: true);

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = BuildRequest(body, stream: true);

        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Groq API error {Status}: {Error}", response.StatusCode, err);
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

                var text = ExtractGroqChunk(json);
                if (string.IsNullOrEmpty(text)) continue;

                var encoded = JsonSerializer.Serialize(text);
                await Response.WriteAsync($"data: {encoded}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming from Groq API");
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

        var body = BuildMessages(systemPrompt, new[] { new { role = "user", content = context } }, Model);

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = BuildRequest(body);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq recommendations error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGroqText(doc)?.Trim() ?? "";

            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement.Clone());
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
            await Response.WriteAsync("data: \"AI trip planner is not configured. Please add a Groq API key.\"\n\n", ct);
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

        var body = BuildMessages(tripSystemPrompt, new[] { new { role = "user", content = request.Brief } }, Model, stream: true);

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = BuildRequest(body, stream: true);

        await Response.Body.FlushAsync(ct);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest, HttpCompletionOption.ResponseHeadersRead, ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq trip plan error {Status}", response.StatusCode);
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

                var text = ExtractGroqChunk(json);
                if (string.IsNullOrEmpty(text)) continue;

                var encoded = JsonSerializer.Serialize(text);
                await Response.WriteAsync($"data: {encoded}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error streaming trip plan from Groq");
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

        var body = BuildMessages(systemPrompt, new[] { new { role = "user", content = userMessage } }, Model);

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = BuildRequest(body);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            if (!response.IsSuccessStatusCode) return Ok(new { insight = (string?)null });

            var rawJson = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGroqText(doc)?.Trim() ?? "";

            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement.Clone());
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

        var body = BuildMessages(systemPrompt, new[] { new { role = "user", content = request.Query } }, Model);

        using var httpClient = _httpClientFactory.CreateClient();
        using var httpRequest = BuildRequest(body);

        try
        {
            using var response = await httpClient.SendAsync(httpRequest, ct);
            var rawJson = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq NL search error {Status}: {Body}", response.StatusCode, rawJson);
                return StatusCode(502, new { error = "AI service unavailable." });
            }

            using var doc = JsonDocument.Parse(rawJson);
            var text = ExtractGroqText(doc)?.Trim() ?? "";

            if (text.StartsWith("```"))
            {
                var start = text.IndexOf('\n') + 1;
                var end   = text.LastIndexOf("```");
                if (end > start) text = text[start..end].Trim();
            }

            using var resultDoc = JsonDocument.Parse(text);
            return Ok(resultDoc.RootElement.Clone());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "NL search failed");
            return StatusCode(500, new { error = "Failed to parse query." });
        }
    }
}
