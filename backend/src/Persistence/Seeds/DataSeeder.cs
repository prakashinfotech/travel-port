using Microsoft.EntityFrameworkCore;
using TravelPort.Domain.Entities;
using TravelPort.Domain.Enums;
using TravelPort.Persistence.Context;

namespace TravelPort.Persistence.Seeds;

public static class DataSeeder
{
    public static async Task SeedAsync(TravelPortDbContext context)
    {
        await SeedUsersAsync(context);
        await SeedFlightsAsync(context);
        await SeedHotelsAsync(context);
        await SeedCouponsAsync(context);
        await context.SaveChangesAsync();
        await SeedBookingsAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(TravelPortDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "Admin User",
            Email = "admin@travelport.com",
            Phone = "9000000001",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 12),
            Role = UserRole.Admin,
            IsVerified = true,
            IsActive = true
        };
        admin.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = admin.Id, Balance = 0 };

        var john = new User
        {
            Id = Guid.NewGuid(),
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "9876543210",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User,
            IsVerified = true,
            IsActive = true
        };
        john.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = john.Id, Balance = 5000 };
        john.SavedTravellers.Add(new SavedTraveller
        {
            Id = Guid.NewGuid(),
            UserId = john.Id,
            Name = "Jane Doe",
            Email = "jane@example.com",
            Phone = "9876543211"
        });

        var priya = new User
        {
            Id = Guid.NewGuid(),
            Name = "Priya Sharma",
            Email = "priya@example.com",
            Phone = "9123456789",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User,
            IsVerified = true,
            IsActive = true
        };
        priya.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = priya.Id, Balance = 2500 };

        var rahul = new User
        {
            Id = Guid.NewGuid(),
            Name = "Rahul Verma",
            Email = "rahul@example.com",
            Phone = "9988776655",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User,
            IsVerified = true,
            IsActive = true
        };
        rahul.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = rahul.Id, Balance = 1000 };

        context.Users.AddRange(admin, john, priya, rahul);
    }

    private static async Task SeedFlightsAsync(TravelPortDbContext context)
    {
        if (await context.Flights.AnyAsync()) return;

        var d1 = DateTime.UtcNow.Date.AddDays(7);
        var d2 = DateTime.UtcNow.Date.AddDays(8);
        var d3 = DateTime.UtcNow.Date.AddDays(10);
        var d4 = DateTime.UtcNow.Date.AddDays(14);
        var d5 = DateTime.UtcNow.Date.AddDays(15);
        var d6 = DateTime.UtcNow.Date.AddDays(20);

        context.Flights.AddRange(
            // BOM → DEL
            MakeFlight("IndiGo",    "6E-123",  "BOM", "DEL", d1.AddHours(6),  d1.AddHours(8).AddMinutes(15),   135, 180, 120, 4599m,  12000m),
            MakeFlight("Air India", "AI-202",  "BOM", "DEL", d1.AddHours(10), d1.AddHours(12).AddMinutes(20),  140, 200, 150, 5299m,  15000m),
            MakeFlight("IndiGo",    "6E-126",  "BOM", "DEL", d3.AddHours(7),  d3.AddHours(9).AddMinutes(20),   140, 180, 90,  4799m,  12500m),
            MakeFlight("SpiceJet",  "SG-201",  "BOM", "DEL", d4.AddHours(5),  d4.AddHours(7).AddMinutes(10),   130, 150, 100, 3999m,  null),
            MakeFlight("Vistara",   "UK-101",  "BOM", "DEL", d5.AddHours(8),  d5.AddHours(10).AddMinutes(25),  145, 160, 70,  6499m,  18000m),

            // DEL → BOM
            MakeFlight("SpiceJet",  "SG-202",  "DEL", "BOM", d1.AddHours(14), d1.AddHours(16).AddMinutes(15),  135, 150, 80,  3999m,  null),
            MakeFlight("Vistara",   "UK-901",  "DEL", "BOM", d2.AddHours(8),  d2.AddHours(10).AddMinutes(20),  140, 160, 120, 6299m,  18000m),
            MakeFlight("IndiGo",    "6E-301",  "DEL", "BOM", d4.AddHours(12), d4.AddHours(14).AddMinutes(15),  135, 180, 75,  4299m,  11000m),

            // BOM → BLR
            MakeFlight("IndiGo",    "6E-501",  "BOM", "BLR", d1.AddHours(9),  d1.AddHours(10).AddMinutes(45),  105, 180, 60,  3299m,  null),
            MakeFlight("Akasa Air", "QP-201",  "BOM", "BLR", d2.AddHours(7),  d2.AddHours(8).AddMinutes(55),   115, 170, 130, 2999m,  null),
            MakeFlight("Air India", "AI-501",  "BOM", "BLR", d5.AddHours(15), d5.AddHours(17),                 120, 200, 145, 4599m,  13000m),

            // BLR → DEL
            MakeFlight("Vistara",   "UK-801",  "BLR", "DEL", d1.AddHours(6),  d1.AddHours(8).AddMinutes(45),   165, 160, 90,  6799m,  19000m),
            MakeFlight("IndiGo",    "6E-701",  "BLR", "DEL", d3.AddHours(10), d3.AddHours(12).AddMinutes(55),  175, 180, 110, 4999m,  null),

            // DEL → GOI
            MakeFlight("IndiGo",    "6E-801",  "DEL", "GOI", d2.AddHours(6),  d2.AddHours(8).AddMinutes(30),   150, 180, 100, 5299m,  null),
            MakeFlight("Air India", "AI-601",  "DEL", "GOI", d5.AddHours(9),  d5.AddHours(11).AddMinutes(20),  140, 200, 120, 6499m,  16000m),

            // BOM → GOI
            MakeFlight("Akasa Air", "QP-301",  "BOM", "GOI", d1.AddHours(7),  d1.AddHours(8).AddMinutes(10),   70,  170, 140, 1999m,  null),
            MakeFlight("SpiceJet",  "SG-401",  "BOM", "GOI", d3.AddHours(11), d3.AddHours(12).AddMinutes(20),  80,  150, 85,  2299m,  null),

            // BOM → HYD
            MakeFlight("Air India", "AI-701",  "BOM", "HYD", d1.AddHours(8),  d1.AddHours(9).AddMinutes(45),   105, 200, 150, 3799m,  10000m),
            MakeFlight("IndiGo",    "6E-901",  "BOM", "HYD", d4.AddHours(16), d4.AddHours(17).AddMinutes(55),  115, 180, 95,  2999m,  null),

            // DEL → CCU
            MakeFlight("Air India", "AI-401",  "DEL", "CCU", d2.AddHours(7),  d2.AddHours(9).AddMinutes(25),   145, 200, 130, 4999m,  13500m),
            MakeFlight("IndiGo",    "6E-1001", "DEL", "CCU", d6.AddHours(9),  d6.AddHours(11).AddMinutes(30),  150, 180, 75,  3999m,  null),

            // HYD → DEL
            MakeFlight("SpiceJet",  "SG-601",  "HYD", "DEL", d2.AddHours(10), d2.AddHours(12).AddMinutes(45),  165, 150, 88,  4299m,  null),

            // BLR → MAA
            MakeFlight("IndiGo",    "6E-601",  "BLR", "MAA", d1.AddHours(11), d1.AddHours(12).AddMinutes(10),  70,  180, 120, 1599m,  null),
            MakeFlight("Air India", "AI-801",  "BLR", "MAA", d4.AddHours(7),  d4.AddHours(8).AddMinutes(15),   75,  200, 155, 2099m,  5000m)
        );
    }

    private static Flight MakeFlight(string airline, string flightNo, string source, string dest,
        DateTime dep, DateTime arr, int duration, int total, int available, decimal economy, decimal? business) => new()
    {
        Id = Guid.NewGuid(),
        Airline = airline,
        FlightNumber = flightNo,
        Source = source,
        Destination = dest,
        DepartureTime = dep,
        ArrivalTime = arr,
        Duration = duration,
        TotalSeats = total,
        AvailableSeats = available,
        EconomyPrice = economy,
        BusinessPrice = business,
        Stops = 0,
        IsActive = true
    };

    private static async Task SeedHotelsAsync(TravelPortDbContext context)
    {
        if (await context.Hotels.AnyAsync()) return;

        context.Hotels.AddRange(
            // ── MUMBAI ───────────────────────────────────────────────────────────
            MakeHotel("Taj Mahal Palace", "Mumbai",
                "Apollo Bunder, Colaba, Mumbai - 400001", 5.0m, 4.8m, 3240,
                "Iconic luxury hotel overlooking the Gateway of India. A UNESCO World Heritage landmark offering unparalleled luxury.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Concierge\",\"Room Service\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                18.9220m, 72.8332m,
                ("Deluxe Room", 12000m, 2, 20),
                ("Premier Room", 18000m, 2, 15),
                ("Luxury Suite", 35000m, 4, 8)),

            MakeHotel("The Leela Mumbai", "Mumbai",
                "Sahar, Andheri East, Mumbai - 400059", 4.0m, 4.5m, 1820,
                "Contemporary luxury hotel near the international airport with stunning city views.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Airport Shuttle\"]",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
                19.0968m, 72.8729m,
                ("Deluxe Room", 7500m, 2, 30),
                ("Club Room", 10000m, 2, 15),
                ("Suite", 22000m, 4, 10)),

            MakeHotel("Hotel Midland", "Mumbai",
                "Colaba, Mumbai - 400005", 3.0m, 3.8m, 542,
                "Comfortable budget hotel in the heart of Colaba, close to all major attractions.",
                "[\"WiFi\",\"Restaurant\",\"Room Service\",\"Laundry\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                18.9218m, 72.8321m,
                ("Standard Room", 2500m, 2, 25),
                ("Deluxe Room", 3500m, 2, 15)),

            // ── DELHI ────────────────────────────────────────────────────────────
            MakeHotel("The Oberoi New Delhi", "Delhi",
                "Dr. Zakir Hussain Marg, New Delhi - 110003", 5.0m, 4.9m, 4560,
                "Legendary luxury hotel offering breathtaking views of the golf course and Humayun's Tomb.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                28.5921m, 77.2344m,
                ("Premier Room", 14000m, 2, 25),
                ("Luxury Suite", 45000m, 4, 8),
                ("Oberoi Suite", 75000m, 4, 3)),

            MakeHotel("ITC Maurya", "Delhi",
                "Sardar Patel Marg, Diplomatic Enclave, New Delhi - 110021", 5.0m, 4.7m, 2890,
                "Award-winning luxury hotel blending Indian heritage with contemporary comforts.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                28.5976m, 77.1741m,
                ("Executive Room", 11000m, 2, 30),
                ("Luxury Suite", 38000m, 4, 12)),

            MakeHotel("Park Inn by Radisson", "Delhi",
                "Sector 29, Gurugram, Haryana - 122022", 3.0m, 3.7m, 380,
                "Modern business hotel with excellent connectivity to Delhi NCR and airport.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                28.4595m, 77.0266m,
                ("Standard Room", 3000m, 2, 40),
                ("Superior Room", 4500m, 2, 20)),

            // ── GOA ──────────────────────────────────────────────────────────────
            MakeHotel("Taj Exotica Resort & Spa", "Goa",
                "Calwaddo, Benaulim, South Goa - 403716", 5.0m, 4.8m, 2100,
                "Sprawling luxury resort amid coconut groves with direct beach access on Benaulim Beach.",
                "[\"WiFi\",\"Beachfront\",\"Multiple Pools\",\"Spa\",\"5 Restaurants\",\"Gym\",\"Watersports\"]",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                15.2588m, 73.9311m,
                ("Luxury Room", 16000m, 2, 20),
                ("Beach Suite", 35000m, 2, 10),
                ("Pool Villa", 55000m, 4, 8)),

            MakeHotel("Alila Diwa Goa", "Goa",
                "Adao Waddo, Majorda, South Goa - 403713", 4.0m, 4.6m, 980,
                "Contemporary resort surrounded by paddy fields, minutes from Majorda Beach.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Cycling\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                15.3022m, 73.9185m,
                ("Deluxe Room", 8500m, 2, 25),
                ("Pool Suite", 25000m, 4, 8)),

            MakeHotel("Sea Pearl Beach Resort", "Goa",
                "Calangute Beach Road, North Goa - 403516", 3.0m, 4.0m, 650,
                "Cheerful resort steps away from the famous Calangute Beach, perfect for families.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Beach Access\",\"Water Sports\"]",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                15.5478m, 73.7571m,
                ("Standard Room", 3500m, 2, 30),
                ("Sea View Room", 5000m, 2, 15)),

            // ── BANGALORE ────────────────────────────────────────────────────────
            MakeHotel("ITC Windsor", "Bangalore",
                "Golf Course Road, Sankey Road, Bengaluru - 560052", 4.0m, 4.5m, 1560,
                "Heritage luxury hotel inspired by English manor houses, offering timeless elegance in the city.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                13.0065m, 77.5769m,
                ("Executive Room", 8500m, 2, 30),
                ("Windsor Suite", 28000m, 4, 8)),

            MakeHotel("The Lalit Ashok Bangalore", "Bangalore",
                "Kumara Krupa High Grounds, Bengaluru - 560001", 4.0m, 4.3m, 1230,
                "Contemporary luxury hotel near Cubbon Park, offering easy access to Bengaluru's tech hub.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\"]",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                12.9928m, 77.5850m,
                ("Superior Room", 6500m, 2, 35),
                ("Deluxe Room", 9500m, 2, 20)),

            // ── JAIPUR ───────────────────────────────────────────────────────────
            MakeHotel("Rambagh Palace", "Jaipur",
                "Bhawani Singh Road, Jaipur - 302005", 5.0m, 4.9m, 3120,
                "Former residence of the Maharaja of Jaipur, now a magnificent palace hotel offering royal splendor.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Polo\",\"Tennis\",\"Heritage Walks\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                26.8947m, 75.8203m,
                ("Heritage Room", 18000m, 2, 15),
                ("Grand Suite", 45000m, 4, 8),
                ("Palace Suite", 65000m, 4, 5)),

            MakeHotel("Fairmont Jaipur", "Jaipur",
                "Riico Institutional Area, Kukas, Jaipur - 303101", 5.0m, 4.7m, 1890,
                "Majestic resort-style hotel offering panoramic views of the Aravalli Hills and desert landscape.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Tennis\",\"Cycling\"]",
                "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800",
                26.9997m, 75.7865m,
                ("Deluxe Room", 12000m, 2, 30),
                ("Fairmont Suite", 40000m, 4, 10)),

            // ── HYDERABAD ────────────────────────────────────────────────────────
            MakeHotel("Taj Falaknuma Palace", "Hyderabad",
                "Engine Bowli, Falaknuma, Hyderabad - 500053", 5.0m, 4.9m, 2780,
                "Former palace of the Nizam of Hyderabad, perched 2000 feet above the city. India's most exclusive palace hotel.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Heritage Walks\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                17.3327m, 78.4673m,
                ("Palace Room", 22000m, 2, 12),
                ("Palace Suite", 50000m, 4, 6),
                ("Royal Suite", 80000m, 4, 4)),

            MakeHotel("Park Hyatt Hyderabad", "Hyderabad",
                "Road No. 2, Banjara Hills, Hyderabad - 500034", 5.0m, 4.7m, 2100,
                "Contemporary luxury hotel in the upscale Banjara Hills neighborhood with world-class dining.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
                17.4218m, 78.4473m,
                ("Park Room", 12000m, 2, 30),
                ("Hyatt Suite", 35000m, 4, 10))
        );
    }

    private static Hotel MakeHotel(string name, string city, string address,
        decimal stars, decimal reviewScore, int reviewCount,
        string description, string amenities, string imageUrl,
        decimal lat, decimal lon,
        params (string type, decimal price, int maxGuests, int totalRooms)[] rooms)
    {
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = name,
            City = city,
            Address = address,
            StarRating = stars,
            ReviewScore = reviewScore,
            ReviewCount = reviewCount,
            Description = description,
            Amenities = amenities,
            ImageUrl = imageUrl,
            Latitude = lat,
            Longitude = lon,
            IsActive = true
        };

        foreach (var (type, price, maxGuests, totalRooms) in rooms)
        {
            hotel.Rooms.Add(new HotelRoom
            {
                Id = Guid.NewGuid(),
                HotelId = hotel.Id,
                RoomType = type,
                PricePerNight = price,
                MaxGuests = maxGuests,
                TotalRooms = totalRooms,
                IsActive = true
            });
        }

        return hotel;
    }

    private static async Task SeedCouponsAsync(TravelPortDbContext context)
    {
        if (await context.Coupons.AnyAsync()) return;

        context.Coupons.AddRange(
            new Coupon
            {
                Id = Guid.NewGuid(), Code = "SAVE100", Type = CouponType.Fixed, Value = 100,
                MinAmount = 1000, UsageLimit = 1000, ExpiresAt = DateTime.UtcNow.AddMonths(3), IsActive = true
            },
            new Coupon
            {
                Id = Guid.NewGuid(), Code = "FIRST10", Type = CouponType.Percentage, Value = 10,
                MinAmount = 500, MaxDiscount = 500, UsageLimit = 500, ExpiresAt = DateTime.UtcNow.AddMonths(6), IsActive = true
            },
            new Coupon
            {
                Id = Guid.NewGuid(), Code = "SUMMER20", Type = CouponType.Percentage, Value = 20,
                MinAmount = 2000, MaxDiscount = 1000, UsageLimit = 200, ExpiresAt = DateTime.UtcNow.AddMonths(2), IsActive = true
            },
            new Coupon
            {
                Id = Guid.NewGuid(), Code = "HOTEL500", Type = CouponType.Fixed, Value = 500,
                MinAmount = 3000, UsageLimit = 300, ExpiresAt = DateTime.UtcNow.AddMonths(4), IsActive = true
            },
            new Coupon
            {
                Id = Guid.NewGuid(), Code = "FLAT15", Type = CouponType.Percentage, Value = 15,
                MinAmount = 1500, MaxDiscount = 750, UsageLimit = 400, ExpiresAt = DateTime.UtcNow.AddMonths(5), IsActive = true
            }
        );
    }

    private static async Task SeedBookingsAsync(TravelPortDbContext context)
    {
        if (await context.Bookings.AnyAsync()) return;

        var john = await context.Users.FirstOrDefaultAsync(u => u.Email == "john@example.com");
        var flight = await context.Flights.FirstOrDefaultAsync(f => f.Source == "BOM" && f.Destination == "DEL");
        var cancelledFlight = await context.Flights.FirstOrDefaultAsync(f => f.Source == "DEL" && f.Destination == "BOM");
        var hotel = await context.Hotels.Include(h => h.Rooms).FirstOrDefaultAsync(h => h.City == "Goa");

        if (john == null || flight == null || cancelledFlight == null || hotel == null) return;
        var room = hotel.Rooms.FirstOrDefault();
        if (room == null) return;

        context.Bookings.AddRange(
            new Booking
            {
                Id = Guid.NewGuid(),
                BookingRef = "TP-FL-2026001",
                UserId = john.Id,
                BookingType = BookingType.Flight,
                ReferenceId = flight.Id,
                Passengers = 2,
                TotalAmount = flight.EconomyPrice * 2,
                DiscountAmount = 0,
                FinalAmount = flight.EconomyPrice * 2,
                Status = BookingStatus.Confirmed
            },
            new Booking
            {
                Id = Guid.NewGuid(),
                BookingRef = "TP-HT-2026001",
                UserId = john.Id,
                BookingType = BookingType.Hotel,
                ReferenceId = hotel.Id,
                CheckIn = DateTime.UtcNow.Date.AddDays(7),
                CheckOut = DateTime.UtcNow.Date.AddDays(10),
                TotalAmount = room.PricePerNight * 3,
                DiscountAmount = 500,
                FinalAmount = room.PricePerNight * 3 - 500,
                CouponCode = "HOTEL500",
                Status = BookingStatus.Confirmed
            },
            new Booking
            {
                Id = Guid.NewGuid(),
                BookingRef = "TP-FL-2026002",
                UserId = john.Id,
                BookingType = BookingType.Flight,
                ReferenceId = cancelledFlight.Id,
                Passengers = 1,
                TotalAmount = cancelledFlight.EconomyPrice,
                DiscountAmount = 0,
                FinalAmount = cancelledFlight.EconomyPrice,
                Status = BookingStatus.Cancelled,
                CancelledAt = DateTime.UtcNow.AddDays(-3),
                RefundAmount = cancelledFlight.EconomyPrice * 0.9m
            }
        );
    }
}
