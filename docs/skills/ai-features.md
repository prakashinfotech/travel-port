# Skill: AI Feature Development

**Current runtime stack:** Groq API, .NET 8 `HttpClient` backend proxy, and React SSE/JSON clients.

## Rules

- Browser code never receives provider credentials.
- Store `Groq:ApiKey` only in ignored local settings, user secrets, or deployment secrets.
- Read the model from `Groq:Model`; do not hardcode credentials or provider URLs in components.
- Return the existing graceful fallback when AI is disabled or unavailable.
- Validate input and retain rate limiting on public AI endpoints.
- For streaming endpoints, emit JSON-encoded `data:` chunks and finish with `data: [DONE]`.
- Do not log prompts containing sensitive user data or provider responses containing secrets.

## Configuration

```json
{
  "Groq": {
    "ApiKey": "",
    "Model": "llama-3.3-70b-versatile"
  }
}
```

The empty key is intentional. Optional AI features must degrade safely when it is absent.

## Verification

- Missing key returns the documented fallback without exposing internal errors.
- Valid requests work through the backend proxy.
- Streaming responses terminate correctly.
- Cancellation tokens abort provider calls.
- No key or authorization header appears in browser assets, logs, tests, or documentation.
