namespace TravelPort.Application.DTOs.Admin;

public record AdminAnalyticsDto(
    List<MonthlyRevenueDto> MonthlyRevenue,
    List<BookingsByStatusDto> BookingsByStatus,
    List<BookingsByTypeDto> BookingsByType
);

public record MonthlyRevenueDto(string Month, decimal Revenue, int BookingCount);
public record BookingsByStatusDto(string Status, int Count);
public record BookingsByTypeDto(string Type, int Count, decimal Revenue);
