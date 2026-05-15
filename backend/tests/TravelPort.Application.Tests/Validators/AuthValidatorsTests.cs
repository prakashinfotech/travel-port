using TravelPort.Application.DTOs.Auth;
using TravelPort.Application.Validators.Auth;
using Xunit;

namespace TravelPort.Application.Tests.Validators;

public class AuthValidatorsTests
{
    private readonly RegisterRequestValidator _registerValidator = new();
    private readonly LoginRequestValidator _loginValidator = new();
    private readonly ForgotPasswordRequestValidator _forgotPasswordValidator = new();
    private readonly ResetPasswordRequestValidator _resetPasswordValidator = new();

    // ── RegisterRequest — positive ────────────────────────────────────────────

    [Fact]
    public void RegisterValidator_AcceptsValidRequest()
    {
        var request = new RegisterRequest("Test User", "test.user@example.com", "9876543210", "Valid@123");
        Assert.True(_registerValidator.Validate(request).IsValid);
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("user+tag@domain.co.in")]
    [InlineData("name.surname@company.org")]
    public void RegisterValidator_AcceptsValidEmailFormats(string email)
    {
        var request = new RegisterRequest("Test User", email, "9876543210", "Valid@123");
        Assert.True(_registerValidator.Validate(request).IsValid);
    }

    [Theory]
    [InlineData("Valid@123")]
    [InlineData("Secure#Pass1")]
    [InlineData("Ab1!Ab1!Ab1!")]
    public void RegisterValidator_AcceptsStrongPasswords(string password)
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", password);
        Assert.True(_registerValidator.Validate(request).IsValid);
    }

    // ── RegisterRequest — negative ────────────────────────────────────────────

    [Fact]
    public void RegisterValidator_RejectsEmptyName()
    {
        var request = new RegisterRequest("", "test@example.com", "9876543210", "Valid@123");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Name));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("@nodomain.com")]
    [InlineData("missing@")]
    public void RegisterValidator_RejectsInvalidEmail(string email)
    {
        var request = new RegisterRequest("Test User", email, "9876543210", "Valid@123");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Email));
    }

    [Theory]
    [InlineData("12345")]         // too short
    [InlineData("123456789012")]  // too long (12 digits)
    [InlineData("abcdefghij")]    // non-numeric
    [InlineData("")]              // empty
    public void RegisterValidator_RejectsInvalidPhone(string phone)
    {
        var request = new RegisterRequest("Test User", "test@example.com", phone, "Valid@123");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Phone));
    }

    [Fact]
    public void RegisterValidator_RejectsPasswordWithNoUppercase()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", "valid@123");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void RegisterValidator_RejectsPasswordWithNoLowercase()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", "VALID@123");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void RegisterValidator_RejectsPasswordWithNoDigit()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", "Valid@abc");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void RegisterValidator_RejectsPasswordWithNoSpecialChar()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", "Valid1234");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void RegisterValidator_RejectsPasswordTooShort()
    {
        var request = new RegisterRequest("Test User", "test@example.com", "9876543210", "Ab1!");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void RegisterValidator_RejectsInvalidPhoneAndWeakPassword()
    {
        var request = new RegisterRequest("Test User", "test.user@example.com", "12345", "password");
        var result = _registerValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Phone));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    // ── LoginRequest — positive ───────────────────────────────────────────────

    [Fact]
    public void LoginValidator_AcceptsValidCredentials()
    {
        var request = new LoginRequest("user@example.com", "anypassword");
        Assert.True(_loginValidator.Validate(request).IsValid);
    }

    // ── LoginRequest — negative ───────────────────────────────────────────────

    [Fact]
    public void LoginValidator_RequiresEmailAndPassword()
    {
        var request = new LoginRequest(string.Empty, string.Empty);
        var result = _loginValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Email));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Password));
    }

    [Fact]
    public void LoginValidator_RejectsInvalidEmailFormat()
    {
        var request = new LoginRequest("not-an-email", "SomePassword");
        var result = _loginValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Email));
    }

    [Fact]
    public void LoginValidator_RejectsEmptyPassword()
    {
        var request = new LoginRequest("user@example.com", "");
        var result = _loginValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(LoginRequest.Password));
    }

    // ── ForgotPasswordRequest — positive ─────────────────────────────────────

    [Fact]
    public void ForgotPasswordValidator_AcceptsValidEmail()
    {
        var request = new ForgotPasswordRequest("user@example.com");
        Assert.True(_forgotPasswordValidator.Validate(request).IsValid);
    }

    // ── ForgotPasswordRequest — negative ─────────────────────────────────────

    [Fact]
    public void ForgotPasswordValidator_RejectsInvalidEmail()
    {
        var request = new ForgotPasswordRequest("not-an-email");
        var result = _forgotPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ForgotPasswordRequest.Email));
    }

    [Fact]
    public void ForgotPasswordValidator_RejectsEmptyEmail()
    {
        var request = new ForgotPasswordRequest("");
        var result = _forgotPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ForgotPasswordRequest.Email));
    }

    // ── ResetPasswordRequest — positive ──────────────────────────────────────

    [Fact]
    public void ResetPasswordValidator_AcceptsValidTokenAndStrongPassword()
    {
        var request = new ResetPasswordRequest("valid-reset-token", "NewPass@123");
        Assert.True(_resetPasswordValidator.Validate(request).IsValid);
    }

    // ── ResetPasswordRequest — negative ──────────────────────────────────────

    [Fact]
    public void ResetPasswordValidator_RequiresTokenAndStrongPassword()
    {
        var request = new ResetPasswordRequest(string.Empty, "weak");
        var result = _resetPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.Token));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.NewPassword));
    }

    [Fact]
    public void ResetPasswordValidator_RejectsEmptyToken()
    {
        var request = new ResetPasswordRequest("", "NewPass@123");
        var result = _resetPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.Token));
    }

    [Fact]
    public void ResetPasswordValidator_RejectsWeakNewPassword()
    {
        var request = new ResetPasswordRequest("valid-token", "weak");
        var result = _resetPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.NewPassword));
    }

    [Fact]
    public void ResetPasswordValidator_RejectsPasswordWithNoSpecialChar()
    {
        var request = new ResetPasswordRequest("valid-token", "NewPass123");
        var result = _resetPasswordValidator.Validate(request);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(ResetPasswordRequest.NewPassword));
    }
}
