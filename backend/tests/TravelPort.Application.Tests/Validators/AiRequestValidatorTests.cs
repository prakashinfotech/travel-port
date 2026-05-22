using TravelPort.Application.DTOs.Ai;
using TravelPort.Application.Validators.Ai;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class AiChatRequestValidatorTests
{
    private readonly AiChatRequestValidator _validator = new();

    private static AiMessage UserMsg(string content = "Hello") =>
        new() { Role = "user", Content = content };

    private static AiMessage AssistantMsg(string content = "Hi there!") =>
        new() { Role = "assistant", Content = content };

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Fact]
    public void Validator_AcceptsSingleUserMessage()
    {
        var req = new AiChatRequest { Messages = [UserMsg()] };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsMultiTurnConversation()
    {
        var req = new AiChatRequest
        {
            Messages = [UserMsg("Hello"), AssistantMsg("Hi!"), UserMsg("Help me book a flight")]
        };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsAssistantRole()
    {
        var req = new AiChatRequest { Messages = [AssistantMsg()] };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsContentAtMaxLength()
    {
        var req = new AiChatRequest { Messages = [new() { Role = "user", Content = new string('A', 4000) }] };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests — messages list ────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyMessagesList()
    {
        var req = new AiChatRequest { Messages = [] };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AiChatRequest.Messages));
    }

    // ── Negative tests — individual message role ───────────────────────────────

    [Theory]
    [InlineData("system")]
    [InlineData("admin")]
    [InlineData("")]
    public void Validator_RejectsInvalidMessageRole(string role)
    {
        var req = new AiChatRequest { Messages = [new() { Role = role, Content = "Test" }] };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
    }

    // ── Negative tests — individual message content ────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyMessageContent()
    {
        var req = new AiChatRequest { Messages = [new() { Role = "user", Content = "" }] };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validator_RejectsContentExceedingMaxLength()
    {
        var req = new AiChatRequest { Messages = [new() { Role = "user", Content = new string('X', 4001) }] };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
    }
}

public class NlSearchRequestValidatorTests
{
    private readonly NlSearchRequestValidator _validator = new();

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("Flights from Mumbai to Delhi")]
    [InlineData("Hotels in Goa for 2 adults")]
    [InlineData("Cheapest bus from Pune to Mumbai tomorrow")]
    public void Validator_AcceptsValidQuery(string query)
    {
        var req = new NlSearchRequest { Query = query };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsQueryAtMaxLength()
    {
        var req = new NlSearchRequest { Query = new string('A', 500) };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests ────────────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyQuery()
    {
        var req = new NlSearchRequest { Query = "" };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(NlSearchRequest.Query));
    }

    [Fact]
    public void Validator_RejectsWhiteSpaceQuery()
    {
        var req = new NlSearchRequest { Query = "   " };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(NlSearchRequest.Query));
    }

    [Fact]
    public void Validator_RejectsQueryExceedingMaxLength()
    {
        var req = new NlSearchRequest { Query = new string('X', 501) };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(NlSearchRequest.Query));
    }
}

public class TripPlanRequestValidatorTests
{
    private readonly TripPlanRequestValidator _validator = new();

    // ── Positive tests ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("3 days in Goa with beach and nightlife")]
    [InlineData("Honeymoon trip to Kerala for 7 days")]
    [InlineData("Budget backpacking — Rajasthan in 10 days")]
    public void Validator_AcceptsValidBrief(string brief)
    {
        var req = new TripPlanRequest { Brief = brief };
        Assert.True(_validator.Validate(req).IsValid);
    }

    [Fact]
    public void Validator_AcceptsBriefAtMaxLength()
    {
        var req = new TripPlanRequest { Brief = new string('A', 1000) };
        Assert.True(_validator.Validate(req).IsValid);
    }

    // ── Negative tests ────────────────────────────────────────────────────────

    [Fact]
    public void Validator_RejectsEmptyBrief()
    {
        var req = new TripPlanRequest { Brief = "" };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TripPlanRequest.Brief));
    }

    [Fact]
    public void Validator_RejectsWhiteSpaceBrief()
    {
        var req = new TripPlanRequest { Brief = "   " };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TripPlanRequest.Brief));
    }

    [Fact]
    public void Validator_RejectsBriefExceedingMaxLength()
    {
        var req = new TripPlanRequest { Brief = new string('X', 1001) };
        var result = _validator.Validate(req);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(TripPlanRequest.Brief));
    }
}
