using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Models;
using TravelPort.Application.DTOs.Users;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Application.Common.Exceptions;

namespace TravelPort.API.Controllers;

[Authorize]
[Route("api/v1/users")]
public class UsersController : BaseApiController
{
    private readonly IUserService _users;
    private readonly IWalletService _wallet;

    public UsersController(IUserService users, IWalletService wallet)
    {
        _users = users;
        _wallet = wallet;
    }

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetProfile(CancellationToken ct)
    {
        var result = await _users.GetProfileAsync(CurrentUserId, ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(result));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile(
        [FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var result = await _users.UpdateProfileAsync(CurrentUserId, request, ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(result, "Profile updated."));
    }

    [HttpGet("wallet")]
    public async Task<ActionResult<ApiResponse<WalletDto>>> GetWallet(CancellationToken ct)
    {
        var result = await _users.GetWalletAsync(CurrentUserId, ct);
        return Ok(ApiResponse<WalletDto>.Ok(result));
    }

    [HttpGet("travellers")]
    public async Task<ActionResult<ApiResponse<List<SavedTravellerDto>>>> GetTravellers(CancellationToken ct)
    {
        var result = await _users.GetSavedTravellersAsync(CurrentUserId, ct);
        return Ok(ApiResponse<List<SavedTravellerDto>>.Ok(result));
    }

    [HttpPost("travellers")]
    public async Task<ActionResult<ApiResponse<SavedTravellerDto>>> AddTraveller(
        [FromBody] AddTravellerRequest request, CancellationToken ct)
    {
        var result = await _users.AddSavedTravellerAsync(CurrentUserId, request, ct);
        return StatusCode(201, ApiResponse<SavedTravellerDto>.Ok(result));
    }

    [HttpDelete("travellers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTraveller(Guid id, CancellationToken ct)
    {
        await _users.DeleteSavedTravellerAsync(CurrentUserId, id, ct);
        return Ok(ApiResponse<object>.Ok(null!, "Traveller removed."));
    }

    [HttpPost("wallet/topup")]
    public async Task<ActionResult<ApiResponse<WalletDto>>> TopUpWallet(
        [FromBody] WalletTopUpRequest request, CancellationToken ct)
    {
        var result = await _wallet.TopUpAsync(CurrentUserId, request, ct);
        return Ok(ApiResponse<WalletDto>.Ok(result, $"₹{request.Amount:N2} added to wallet."));
    }

    [HttpGet("wallet/transactions")]
    public async Task<ActionResult<ApiResponse<WalletTransactionsResponse>>> GetTransactions(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (items, total) = await _wallet.GetTransactionsAsync(CurrentUserId, page, pageSize, ct);
        return Ok(ApiResponse<WalletTransactionsResponse>.Ok(new WalletTransactionsResponse(items, total, page, pageSize)));
    }
}
