using FluentValidation;
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

    [Fact]
    public void RegisterValidator_AcceptsValidRequest()
    {
        var request = new RegisterRequest(
            "Test User",
            "test.user@example.com",
            "9876543210",
            "Valid@123");

        var result = _registerValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void RegisterValidator_RejectsInvalidPhoneAndWeakPassword()
    {
        var request = new RegisterRequest(
            "Test User",
            "test.user@example.com",
            "12345",
            "password");

        var result = _registerValidator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(RegisterRequest.Phone));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void LoginValidator_RequiresEmailAndPassword()
    {
        var request = new LoginRequest(string.Empty, string.Empty);

        var result = _loginValidator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(LoginRequest.Email));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(LoginRequest.Password));
    }

    [Fact]
    public void ForgotPasswordValidator_RejectsInvalidEmail()
    {
        var request = new ForgotPasswordRequest("not-an-email");

        var result = _forgotPasswordValidator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(ForgotPasswordRequest.Email));
    }

    [Fact]
    public void ResetPasswordValidator_RequiresTokenAndStrongPassword()
    {
        var request = new ResetPasswordRequest(string.Empty, "weak");

        var result = _resetPasswordValidator.Validate(request);

        Assert.Contains(result.Errors, error => error.PropertyName == nameof(ResetPasswordRequest.Token));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(ResetPasswordRequest.NewPassword));
    }
}
