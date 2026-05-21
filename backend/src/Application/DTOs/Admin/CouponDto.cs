namespace TravelPort.Application.DTOs.Admin;

public record CouponDto(
    Guid Id,
    string Code,
    string Type,
    decimal Value,
    decimal MinAmount,
    decimal? MaxDiscount,
    int? UsageLimit,
    int UsedCount,
    DateTime? ExpiresAt,
    bool IsActive,
    bool IsFeatured,
    DateTime CreatedAt
);

public record CouponAnalyticsDto(
    Guid Id,
    string Code,
    int TotalUses,
    decimal TotalDiscount,
    decimal TotalRevenue
);

public record CreateCouponRequest(
    string Code,
    string Type,
    decimal Value,
    decimal MinAmount,
    decimal? MaxDiscount,
    int? UsageLimit,
    DateTime? ExpiresAt
);

public record UpdateCouponRequest(
    string Type,
    decimal Value,
    decimal MinAmount,
    decimal? MaxDiscount,
    int? UsageLimit,
    DateTime? ExpiresAt,
    bool IsActive,
    bool IsFeatured = false
);
