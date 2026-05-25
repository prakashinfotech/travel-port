# Skill: AI Feature Development

**Category:** AI Integration
**Stack:** Gemini API (gemini-1.5-flash-latest) · .NET 8 HttpClient proxy · React 18 SSE streaming

---

## Purpose

Guides adding new Gemini-powered features to TravelPort, following the established backend-proxy pattern.

---

## Architecture Pattern

All AI calls go through the backend proxy (`AiController.cs`) — the API key never touches the browser.

```
Frontend (fetch/SSE)
    ↓ POST /api/v1/ai/<endpoint>
AiController.cs (HttpClient)
    ↓ POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Gemini API (gemini-1.5-flash-latest)
```

---

## Configuration

API key goes in `appsettings.Development.json` only (gitignored):
```json
"Gemini": {
  "ApiKey": "YOUR_GEMINI_KEY",
  "Model": "gemini-1.5-flash-latest"
}
```

All endpoints read `_config["Gemini:ApiKey"]` and return a graceful fallback when it's empty.

---

## Existing Endpoints

| Route | Type | Frontend Component |
|-------|------|--------------------|
| `POST /ai/chat` | SSE streaming | `AiChatWidget.tsx` |
| `POST /ai/nl-search` | JSON | `NaturalLanguageSearch.tsx` |
| `POST /ai/recommendations` | JSON | `AiRecommendations.tsx` |
| `POST /ai/trip-plan` | SSE streaming | `AiPlannerPage.tsx` |
| `GET /ai/price-insight` | JSON (cached 30 min) | `PriceTrendInsight.tsx` |

---

## Adding a New AI Endpoint

### Backend (AiController.cs)

```csharp
[HttpPost("my-feature")]
[AllowAnonymous]
public async Task<ActionResult> MyFeature([FromBody] MyRequest request, CancellationToken ct)
{
    if (string.IsNullOrEmpty(ApiKey)) return BadRequest(new { error = "AI not configured." });

    var body = JsonSerializer.Serialize(BuildContents("Your system prompt here.", new[]
    {
        new { role = "user", parts = new[] { new { text = request.Input } } }
    }));

    using var httpClient = _httpClientFactory.CreateClient();
    using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GenerateUrl)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json")
    };

    using var response = await httpClient.SendAsync(httpRequest, ct);
    var rawJson = await response.Content.ReadAsStringAsync(ct);
    using var doc = JsonDocument.Parse(rawJson);
    var text = ExtractGeminiText(doc).Trim();
    return Ok(new { result = text });
}
```

### Frontend (streaming)

```typescript
const res = await fetch(`${BASE_URL}/api/v1/ai/my-endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: 'user input' }),
})
const reader = res.body!.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  for (const line of buffer.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const payload = line.slice(6)
    if (payload === '[DONE]') return
    const chunk: string = JSON.parse(payload)
    setOutput(prev => prev + chunk)
  }
  buffer = ''
}
```

---

## SSE Event Format

Backend emits: `data: "JSON-encoded text chunk"\n\n` and terminates with `data: [DONE]\n\n`.

Frontend decodes: `const chunk: string = JSON.parse(payload)` — this preserves newlines and special chars.

---

## Graceful Degradation Pattern

Every endpoint checks the API key first:
- **Streaming endpoints**: emit an error message as an SSE event, then `[DONE]`
- **JSON endpoints**: return `BadRequest` or `Ok` with `null` fields
- **Frontend**: hide the component or show a fallback when response indicates no AI

---

## File Locations

| File | Purpose |
|------|---------|
| `backend/src/API/Controllers/AiController.cs` | All 5 AI endpoint actions + DTOs |
| `backend/src/API/appsettings.json` | Gemini config block (empty key, model set) |
| `frontend/src/components/ai/AiChatWidget.tsx` | Floating chat bubble |
| `frontend/src/components/ai/NaturalLanguageSearch.tsx` | NL search bar |
| `frontend/src/components/ai/AiRecommendations.tsx` | Destination recommendations |
| `frontend/src/components/ai/PriceTrendInsight.tsx` | Price trend tip |
| `frontend/src/pages/AiPlannerPage.tsx` | Trip planner page |
| `frontend/src/api/endpoints.ts` | `ai.*` endpoint constants |
