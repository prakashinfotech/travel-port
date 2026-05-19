using TravelPort.Application.Common.Constants;
using TravelPort.Application.Common.Exceptions;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Admin;
using TravelPort.Application.DTOs.Bookings;
using TravelPort.Application.DTOs.HotelManager;
using TravelPort.Application.DTOs.Operator;
using TravelPort.Application.Services.Interfaces;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;

namespace TravelPort.Application.Services;

public class AdminService : IAdminService
{
    private readonly IUserRepository _users;
    private readonly IBookingRepository _bookings;
    private readonly ICouponRepository _coupons;
    private readonly IFlightRepository _flights;
    private readonly IHotelRepository _hotels;
    private readonly IRepository<HotelReview> _reviews;
    private readonly IFlightCompanyRepository _flightCompanies;
    private readonly IBusCompanyRepository _busCompanies;
    private readonly ICabCompanyRepository _cabCompanies;
    private readonly IEmailService _email;
    private readonly ICacheService _cache;
    private readonly IUnitOfWork _uow;

    public AdminService(
        IUserRepository users,
        IBookingRepository bookings,
        ICouponRepository coupons,
        IFlightRepository flights,
        IHotelRepository hotels,
        IRepository<HotelReview> reviews,
        IFlightCompanyRepository flightCompanies,
        IBusCompanyRepository busCompanies,
        ICabCompanyRepository cabCompanies,
        IEmailService email,
        ICacheService cache,
        IUnitOfWork uow)
    {
        _users          = users;
        _bookings       = bookings;
        _coupons        = coupons;
        _flights        = flights;
        _hotels         = hotels;
        _reviews        = reviews;
        _flightCompanies = flightCompanies;
        _busCompanies   = busCompanies;
        _cabCompanies   = cabCompanies;
        _email          = email;
        _cache          = cache;
        _uow            = uow;
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var allUsers    = await _users.GetAllAsync(ct);
        var allBookings = await _bookings.GetAllAsync(ct);

        var customerCount  = allUsers.Count(u => u.Role == UserRole.User);
        var totalRevenue   = allBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount);
        var active         = allBookings.Count(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending);
        var cancelled      = allBookings.Count(b => b.Status == BookingStatus.Cancelled);
        var flightBookings = allBookings.Count(b => b.BookingType == BookingType.Flight);
        var hotelBookings  = allBookings.Count(b => b.BookingType == BookingType.Hotel);
        var paidBookings   = allBookings.Where(b => b.Status != BookingStatus.Cancelled).ToList();
        var avgValue       = paidBookings.Count > 0 ? paidBookings.Average(b => b.FinalAmount) : 0m;

        return new AdminDashboardDto(
            customerCount,
            allBookings.Count,
            totalRevenue,
            active,
            cancelled,
            flightBookings,
            hotelBookings,
            Math.Round(avgValue, 0)
        );
    }

    // ── Users ────────────────────────────────────────────────────────────────

    public async Task<(List<AdminUserDto> Items, int Total)> GetUsersAsync(
        int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var (users, total) = await _users.GetPagedAsync(page, pageSize, search, ct);
        var allBookings = await _bookings.GetAllAsync(ct);
        var bookingCounts = allBookings.GroupBy(b => b.UserId).ToDictionary(g => g.Key, g => g.Count());

        var dtos = users.Select(u => new AdminUserDto(
            u.Id, u.Name, u.Email, u.Phone,
            u.Role.ToString(), u.IsActive, u.IsVerified,
            u.Wallet?.Balance ?? 0m,
            bookingCounts.TryGetValue(u.Id, out var cnt) ? cnt : 0,
            u.CreatedAt
        )).ToList();

        return (dtos, total);
    }

    public async Task<AdminUserDto> ToggleUserBlockAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User", userId);

        user.IsActive = !user.IsActive;
        await _users.UpdateAsync(user, ct);
        await _uow.SaveChangesAsync(ct);

        var allBookings = await _bookings.GetAllAsync(ct);
        var bookingCount = allBookings.Count(b => b.UserId == userId);

        return new AdminUserDto(
            user.Id, user.Name, user.Email, user.Phone,
            user.Role.ToString(), user.IsActive, user.IsVerified,
            user.Wallet?.Balance ?? 0m, bookingCount, user.CreatedAt
        );
    }

    // ── Bookings ─────────────────────────────────────────────────────────────

    public async Task<(List<BookingDto> Items, int Total)> GetBookingsAsync(
        int page, int pageSize, string? status, string? type, CancellationToken ct = default)
    {
        var (bookings, total) = await _bookings.GetAllPagedAsync(page, pageSize, status, type, ct);

        var dtos = new List<BookingDto>();
        foreach (var b in bookings)
        {
            Flight? flight = b.BookingType == BookingType.Flight
                ? await _flights.GetByIdAsync(b.ReferenceId, ct) : null;
            Hotel? hotel = b.BookingType == BookingType.Hotel
                ? await _hotels.GetByIdAsync(b.ReferenceId, ct) : null;

            dtos.Add(new BookingDto(
                b.Id, b.BookingRef,
                b.BookingType.ToString(), b.Status,
                b.TotalAmount, b.FinalAmount, b.DiscountAmount,
                b.CreatedAt,
                b.BookingType == BookingType.Flight ? b.ReferenceId : null,
                b.BookingType == BookingType.Hotel  ? b.ReferenceId : null,
                b.Passengers,
                b.CheckIn?.ToString("yyyy-MM-dd"),
                b.CheckOut?.ToString("yyyy-MM-dd"),
                b.CouponCode,
                b.GuestName ?? b.User?.Name,
                b.GuestEmail ?? b.User?.Email,
                b.GuestPhone ?? b.User?.Phone,
                flight?.Airline, flight?.FlightNumber,
                flight?.Source, MapCity(flight?.Source),
                flight?.Destination, MapCity(flight?.Destination),
                flight?.DepartureTime, flight?.ArrivalTime, flight?.Duration,
                hotel?.Name, hotel?.Address, hotel?.City,
                hotel?.StarRating, null, null, null
            ));
        }
        return (dtos, total);
    }

    // ── Coupons ──────────────────────────────────────────────────────────────

    public async Task<List<CouponDto>> GetCouponsAsync(CancellationToken ct = default)
    {
        var coupons = await _coupons.GetAllCouponsAsync(ct);
        return coupons.Select(ToDto).ToList();
    }

    public async Task<CouponDto> CreateCouponAsync(CreateCouponRequest req, CancellationToken ct = default)
    {
        var code = req.Code.Trim().ToUpper();
        if (await _coupons.CodeExistsAsync(code, ct))
            throw new BusinessException($"Coupon code '{code}' already exists.");

        if (!Enum.TryParse<CouponType>(req.Type, true, out var couponType))
            throw new BusinessException("Invalid coupon type. Use 'Fixed' or 'Percentage'.");

        var coupon = new Coupon
        {
            Id          = Guid.NewGuid(),
            Code        = code,
            Type        = couponType,
            Value       = req.Value,
            MinAmount   = req.MinAmount,
            MaxDiscount = req.MaxDiscount,
            UsageLimit  = req.UsageLimit,
            ExpiresAt   = req.ExpiresAt,
            IsActive    = true,
            UsedCount   = 0
        };

        await _coupons.AddAsync(coupon, ct);
        await _uow.SaveChangesAsync(ct);
        return ToDto(coupon);
    }

    public async Task<CouponDto> UpdateCouponAsync(Guid id, UpdateCouponRequest req, CancellationToken ct = default)
    {
        var coupon = await _coupons.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Coupon", id);

        if (!Enum.TryParse<CouponType>(req.Type, true, out var couponType))
            throw new BusinessException("Invalid coupon type. Use 'Fixed' or 'Percentage'.");

        coupon.Type        = couponType;
        coupon.Value       = req.Value;
        coupon.MinAmount   = req.MinAmount;
        coupon.MaxDiscount = req.MaxDiscount;
        coupon.UsageLimit  = req.UsageLimit;
        coupon.ExpiresAt   = req.ExpiresAt;
        coupon.IsActive    = req.IsActive;

        await _coupons.UpdateAsync(coupon, ct);
        await _uow.SaveChangesAsync(ct);
        return ToDto(coupon);
    }

    public async Task DeleteCouponAsync(Guid id, CancellationToken ct = default)
    {
        var coupon = await _coupons.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Coupon", id);
        coupon.IsActive = false;
        await _coupons.UpdateAsync(coupon, ct);
        await _uow.SaveChangesAsync(ct);
    }

    // ── Analytics ────────────────────────────────────────────────────────────

    public async Task<AdminAnalyticsDto> GetAnalyticsAsync(CancellationToken ct = default)
    {
        var from     = DateTime.UtcNow.AddMonths(-6).Date;
        var bookings = await _bookings.GetAllForAnalyticsAsync(from, DateTime.UtcNow, ct);

        // Monthly revenue (last 6 months)
        var monthly = Enumerable.Range(0, 6)
            .Select(i => DateTime.UtcNow.AddMonths(-5 + i))
            .Select(m =>
            {
                var month = bookings.Where(b =>
                    b.CreatedAt.Year == m.Year &&
                    b.CreatedAt.Month == m.Month &&
                    b.Status != BookingStatus.Cancelled).ToList();
                return new MonthlyRevenueDto(
                    m.ToString("MMM yyyy"),
                    month.Sum(b => b.FinalAmount),
                    month.Count
                );
            }).ToList();

        // By status
        var byStatus = bookings
            .GroupBy(b => b.Status.ToString())
            .Select(g => new BookingsByStatusDto(g.Key, g.Count()))
            .ToList();

        // By type
        var byType = bookings
            .GroupBy(b => b.BookingType.ToString())
            .Select(g => new BookingsByTypeDto(
                g.Key, g.Count(),
                g.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.FinalAmount)
            )).ToList();

        return new AdminAnalyticsDto(monthly, byStatus, byType);
    }

    // ── Hotels ───────────────────────────────────────────────────────────────

    public async Task<List<AdminHotelListDto>> GetHotelsAsync(CancellationToken ct = default)
    {
        var hotels = await _hotels.GetAllWithManagerAsync(ct);
        var result = new List<AdminHotelListDto>();
        foreach (var h in hotels)
        {
            var manager = await _users.GetHotelManagerAsync(h.Id, ct);
            result.Add(ToAdminHotelDto(h, manager));
        }
        return result;
    }

    public async Task<AdminHotelListDto> RegisterHotelAsync(RegisterHotelRequest req, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(req.ManagerEmail.ToLowerInvariant(), ct))
            throw new BusinessException("A user with this email already exists.");

        var hotel = new Hotel
        {
            Id         = Guid.NewGuid(),
            Name       = req.HotelName,
            City       = req.City,
            Address    = req.Address,
            StarRating = req.StarRating,
            IsActive   = true
        };

        await _hotels.AddAsync(hotel, ct);

        var manager = new User
        {
            Id           = Guid.NewGuid(),
            Name         = req.ManagerName,
            Email        = req.ManagerEmail.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.ManagerPassword, SecurityConstants.BcryptWorkFactor),
            Role         = UserRole.Hotel,
            HotelId      = hotel.Id,
            IsActive     = true,
            IsVerified   = true
        };

        await _users.AddAsync(manager, ct);
        await _uow.SaveChangesAsync(ct);

        if (_email.IsConfigured)
        {
            await _email.SendHotelCredentialsEmailAsync(
                req.ManagerEmail, req.ManagerName,
                req.HotelName, req.ManagerEmail, req.ManagerPassword, ct);
        }

        return ToAdminHotelDto(hotel, manager);
    }

    public async Task<AdminHotelListDto> ToggleHotelActiveAsync(Guid hotelId, CancellationToken ct = default)
    {
        var hotel = await _hotels.GetByIdAsync(hotelId, ct)
            ?? throw new NotFoundException("Hotel", hotelId);

        hotel.IsActive = !hotel.IsActive;
        await _hotels.UpdateAsync(hotel, ct);
        await _uow.SaveChangesAsync(ct);

        var manager = await _users.GetHotelManagerAsync(hotelId, ct);
        return ToAdminHotelDto(hotel, manager);
    }

    public async Task DeleteHotelReviewAsync(Guid reviewId, CancellationToken ct = default)
    {
        var review = await _reviews.GetByIdAsync(reviewId, ct)
            ?? throw new NotFoundException("HotelReview", reviewId);

        var hotel = await _hotels.GetByIdAsync(review.HotelId, ct)
            ?? throw new NotFoundException("Hotel", review.HotelId);

        await _reviews.DeleteAsync(review, ct);

        var remainingReviews = await _reviews.FindAsync(r => r.HotelId == review.HotelId && r.Id != reviewId, ct);
        hotel.ReviewCount = remainingReviews.Count;
        hotel.ReviewScore = remainingReviews.Count == 0
            ? 0m
            : Math.Round(remainingReviews.Average(r => (decimal)r.Rating), 1);

        await _hotels.UpdateAsync(hotel, ct);
        await _uow.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"hotel:{review.HotelId}", ct);
    }

    // ── Flight Operators ─────────────────────────────────────────────────────

    public async Task<List<FlightOperatorListDto>> GetFlightOperatorsAsync(CancellationToken ct = default)
    {
        var companies = await _flightCompanies.GetAllActiveAsync(ct);
        var result    = new List<FlightOperatorListDto>();
        foreach (var c in companies)
        {
            var manager     = await _users.GetOperatorManagerAsync(c.Id, ct);
            var flightCount = (await _flights.GetByCompanyAsync(c.Id, ct)).Count;
            result.Add(ToFlightOperatorDto(c, manager, flightCount));
        }
        return result;
    }

    public async Task<FlightOperatorListDto> RegisterFlightOperatorAsync(RegisterFlightOperatorRequest req, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(req.ManagerEmail.ToLowerInvariant(), ct))
            throw new BusinessException("A user with this email already exists.");

        var company = new FlightCompany
        {
            Id                = Guid.NewGuid(),
            Name              = req.CompanyName,
            IataCode          = req.IataCode.ToUpper(),
            LogoUrl           = req.LogoUrl,
            HeadquartersCity  = req.HeadquartersCity,
            ContactEmail      = req.ManagerEmail,
            ContactPhone      = req.ContactPhone,
            IsActive          = true
        };
        await _flightCompanies.AddAsync(company, ct);

        var manager = new User
        {
            Id           = Guid.NewGuid(),
            Name         = req.ManagerName,
            Email        = req.ManagerEmail.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.ManagerPassword, SecurityConstants.BcryptWorkFactor),
            Role         = UserRole.FlightOperator,
            OperatorCompanyId = company.Id,
            IsActive     = true,
            IsVerified   = true
        };
        await _users.AddAsync(manager, ct);
        await _uow.SaveChangesAsync(ct);

        if (_email.IsConfigured)
            await _email.SendOperatorCredentialsEmailAsync(req.ManagerEmail, req.ManagerName, req.CompanyName, "Flight Operator", req.ManagerEmail, req.ManagerPassword, ct);

        return ToFlightOperatorDto(company, manager, 0);
    }

    public async Task<FlightOperatorListDto> ToggleFlightOperatorActiveAsync(Guid companyId, CancellationToken ct = default)
    {
        var company = await _flightCompanies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("FlightCompany", companyId);
        company.IsActive = !company.IsActive;
        await _flightCompanies.UpdateAsync(company, ct);
        await _uow.SaveChangesAsync(ct);
        var manager     = await _users.GetOperatorManagerAsync(companyId, ct);
        var flightCount = (await _flights.GetByCompanyAsync(companyId, ct)).Count;
        return ToFlightOperatorDto(company, manager, flightCount);
    }

    // ── Bus Operators ─────────────────────────────────────────────────────────

    public async Task<List<BusOperatorListDto>> GetBusOperatorsAsync(CancellationToken ct = default)
    {
        var companies = await _busCompanies.GetAllActiveAsync(ct);
        var result    = new List<BusOperatorListDto>();
        foreach (var c in companies)
        {
            var manager = await _users.GetOperatorManagerAsync(c.Id, ct);
            result.Add(ToBusOperatorDto(c, manager));
        }
        return result;
    }

    public async Task<BusOperatorListDto> RegisterBusOperatorAsync(RegisterBusOperatorRequest req, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(req.ManagerEmail.ToLowerInvariant(), ct))
            throw new BusinessException("A user with this email already exists.");

        var company = new BusCompany
        {
            Id               = Guid.NewGuid(),
            Name             = req.CompanyName,
            HeadquartersCity = req.HeadquartersCity,
            ContactEmail     = req.ManagerEmail,
            ContactPhone     = req.ContactPhone,
            BusTypes         = req.BusTypes,
            IsActive         = true
        };
        await _busCompanies.AddAsync(company, ct);

        var manager = new User
        {
            Id                = Guid.NewGuid(),
            Name              = req.ManagerName,
            Email             = req.ManagerEmail.ToLowerInvariant(),
            PasswordHash      = BCrypt.Net.BCrypt.HashPassword(req.ManagerPassword, SecurityConstants.BcryptWorkFactor),
            Role              = UserRole.BusOperator,
            OperatorCompanyId = company.Id,
            IsActive          = true,
            IsVerified        = true
        };
        await _users.AddAsync(manager, ct);
        await _uow.SaveChangesAsync(ct);

        if (_email.IsConfigured)
            await _email.SendOperatorCredentialsEmailAsync(req.ManagerEmail, req.ManagerName, req.CompanyName, "Bus Operator", req.ManagerEmail, req.ManagerPassword, ct);

        return ToBusOperatorDto(company, manager);
    }

    public async Task<BusOperatorListDto> ToggleBusOperatorActiveAsync(Guid companyId, CancellationToken ct = default)
    {
        var company = await _busCompanies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("BusCompany", companyId);
        company.IsActive = !company.IsActive;
        await _busCompanies.UpdateAsync(company, ct);
        await _uow.SaveChangesAsync(ct);
        var manager = await _users.GetOperatorManagerAsync(companyId, ct);
        return ToBusOperatorDto(company, manager);
    }

    // ── Cab Operators ─────────────────────────────────────────────────────────

    public async Task<List<CabOperatorListDto>> GetCabOperatorsAsync(CancellationToken ct = default)
    {
        var companies = await _cabCompanies.GetAllActiveAsync(ct);
        var result    = new List<CabOperatorListDto>();
        foreach (var c in companies)
        {
            var manager = await _users.GetOperatorManagerAsync(c.Id, ct);
            result.Add(ToCabOperatorDto(c, manager));
        }
        return result;
    }

    public async Task<CabOperatorListDto> RegisterCabOperatorAsync(RegisterCabOperatorRequest req, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(req.ManagerEmail.ToLowerInvariant(), ct))
            throw new BusinessException("A user with this email already exists.");

        var company = new CabCompany
        {
            Id                  = Guid.NewGuid(),
            Name                = req.CompanyName,
            City                = req.City,
            ContactEmail        = req.ManagerEmail,
            ContactPhone        = req.ContactPhone,
            CabTypes            = req.CabTypes,
            IsIndividualDriver  = req.IsIndividualDriver,
            DriverLicenseNumber = req.DriverLicenseNumber,
            IsActive            = true
        };
        await _cabCompanies.AddAsync(company, ct);

        var manager = new User
        {
            Id                = Guid.NewGuid(),
            Name              = req.ManagerName,
            Email             = req.ManagerEmail.ToLowerInvariant(),
            PasswordHash      = BCrypt.Net.BCrypt.HashPassword(req.ManagerPassword, SecurityConstants.BcryptWorkFactor),
            Role              = UserRole.CabOperator,
            OperatorCompanyId = company.Id,
            IsActive          = true,
            IsVerified        = true
        };
        await _users.AddAsync(manager, ct);
        await _uow.SaveChangesAsync(ct);

        if (_email.IsConfigured)
            await _email.SendOperatorCredentialsEmailAsync(req.ManagerEmail, req.ManagerName, req.CompanyName, "Cab Operator", req.ManagerEmail, req.ManagerPassword, ct);

        return ToCabOperatorDto(company, manager);
    }

    public async Task<CabOperatorListDto> ToggleCabOperatorActiveAsync(Guid companyId, CancellationToken ct = default)
    {
        var company = await _cabCompanies.GetByIdAsync(companyId, ct)
            ?? throw new NotFoundException("CabCompany", companyId);
        company.IsActive = !company.IsActive;
        await _cabCompanies.UpdateAsync(company, ct);
        await _uow.SaveChangesAsync(ct);
        var manager = await _users.GetOperatorManagerAsync(companyId, ct);
        return ToCabOperatorDto(company, manager);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static CouponDto ToDto(Coupon c) => new(
        c.Id, c.Code, c.Type.ToString(), c.Value,
        c.MinAmount, c.MaxDiscount, c.UsageLimit, c.UsedCount,
        c.ExpiresAt, c.IsActive, c.CreatedAt
    );

    private static AdminHotelListDto ToAdminHotelDto(Hotel h, User? manager) => new(
        h.Id, h.Name, h.City, h.Address, h.StarRating, h.ReviewScore, h.ReviewCount,
        h.IsActive, h.Rooms.Count, manager?.Email, h.CreatedAt
    );

    private static FlightOperatorListDto ToFlightOperatorDto(FlightCompany c, User? manager, int flightCount) => new(
        c.Id, c.Name, c.IataCode, c.LogoUrl, c.HeadquartersCity, c.ContactPhone,
        c.IsActive, flightCount, manager?.Email, c.CreatedAt
    );

    private static BusOperatorListDto ToBusOperatorDto(BusCompany c, User? manager) => new(
        c.Id, c.Name, c.HeadquartersCity, c.ContactPhone, c.BusTypes,
        c.IsActive, manager?.Email, c.CreatedAt
    );

    private static CabOperatorListDto ToCabOperatorDto(CabCompany c, User? manager) => new(
        c.Id, c.Name, c.City, c.ContactPhone, c.CabTypes, c.IsIndividualDriver,
        c.IsActive, manager?.Email, c.CreatedAt
    );

    private static string? MapCity(string? code) => code switch
    {
        "BOM" => "Mumbai",    "DEL" => "Delhi",     "BLR" => "Bengaluru",
        "MAA" => "Chennai",   "HYD" => "Hyderabad", "AMD" => "Ahmedabad",
        "GOI" => "Goa",       "CCU" => "Kolkata",   "JAI" => "Jaipur",
        "PNQ" => "Pune",      "COK" => "Kochi",     "LKO" => "Lucknow",
        _ => code
    };
}
