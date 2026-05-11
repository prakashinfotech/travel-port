using Microsoft.AspNetCore.Mvc;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.Common.Models;
using TravelPort.Domain.Enums;

namespace TravelPort.API.Controllers;

[Route("api/v1/coupons")]
public class CouponsController : BaseApiController
{
    private readonly ICouponRepository _coupons;

    public CouponsController(ICouponRepository coupons) => _coupons = coupons;

    [HttpGet("validate")]
    public async Task<ActionResult<ApiResponse<CouponValidateResponse>>> Validate(
        [FromQuery] string code, [FromQuery] decimal amount, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            return Ok(ApiResponse<CouponValidateResponse>.Fail("Coupon code is required."));

        var coupon = await _coupons.GetByCodeAsync(code.Trim().ToUpper(), ct);

        if (coupon == null || !coupon.IsActive)
            return Ok(ApiResponse<CouponValidateResponse>.Fail("Invalid or expired coupon code."));

        if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt < DateTime.UtcNow)
            return Ok(ApiResponse<CouponValidateResponse>.Fail("This coupon has expired."));

        if (amount < coupon.MinAmount)
            return Ok(ApiResponse<CouponValidateResponse>.Fail($"Minimum booking amount of {coupon.MinAmount:C0} required for this coupon."));

        decimal discount = coupon.Type == CouponType.Fixed
            ? coupon.Value
            : amount * coupon.Value / 100m;

        if (coupon.MaxDiscount.HasValue)
            discount = Math.Min(discount, coupon.MaxDiscount.Value);

        discount = Math.Min(discount, amount);
        discount = Math.Round(discount, 2);

        return Ok(ApiResponse<CouponValidateResponse>.Ok(new CouponValidateResponse(
            discount,
            $"Coupon applied! You save ₹{discount:0} on this booking."
        )));
    }
}

public record CouponValidateResponse(decimal DiscountAmount, string Message);
