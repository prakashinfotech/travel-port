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

    // ── Users ────────────────────────────────────────────────────────────────

    private static async Task SeedUsersAsync(TravelPortDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        var admin = new User
        {
            Id = Guid.NewGuid(), Name = "Admin User", Email = "admin@travelport.com",
            Phone = "9000000001", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", 12),
            Role = UserRole.Admin, IsVerified = true, IsActive = true
        };
        admin.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = admin.Id, Balance = 0 };

        var john = new User
        {
            Id = Guid.NewGuid(), Name = "John Doe", Email = "john@example.com",
            Phone = "9876543210", PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User, IsVerified = true, IsActive = true
        };
        john.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = john.Id, Balance = 5000 };
        john.SavedTravellers.Add(new SavedTraveller
        {
            Id = Guid.NewGuid(), UserId = john.Id, Name = "Jane Doe",
            Email = "jane@example.com", Phone = "9876543211"
        });

        var priya = new User
        {
            Id = Guid.NewGuid(), Name = "Priya Sharma", Email = "priya@example.com",
            Phone = "9123456789", PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User, IsVerified = true, IsActive = true
        };
        priya.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = priya.Id, Balance = 2500 };

        var rahul = new User
        {
            Id = Guid.NewGuid(), Name = "Rahul Verma", Email = "rahul@example.com",
            Phone = "9988776655", PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123", 12),
            Role = UserRole.User, IsVerified = true, IsActive = true
        };
        rahul.Wallet = new Wallet { Id = Guid.NewGuid(), UserId = rahul.Id, Balance = 1000 };

        context.Users.AddRange(admin, john, priya, rahul);
    }

    // ── Flights ──────────────────────────────────────────────────────────────

    private static async Task SeedFlightsAsync(TravelPortDbContext context)
    {
        // Return early if flights already exist — preserves flight IDs so user bookings stay valid.
        // Dates may drift stale over time but that is acceptable for a demo environment.
        if (await context.Flights.AnyAsync()) return;

        context.Flights.AddRange(BuildFlights());
    }

    // Route config: (origin, dest, durationMin, economyBase, businessBase?)
    private static readonly (string Src, string Dst, int Dur, decimal Eco, decimal? Biz)[] Routes =
    [
        ("BOM", "DEL", 130, 4200m,  12000m),
        ("DEL", "BOM", 130, 4200m,  12000m),
        ("BOM", "BLR", 105, 3100m,  null),
        ("BLR", "BOM", 105, 3100m,  null),
        ("BOM", "HYD", 100, 2800m,  8000m),
        ("HYD", "BOM", 100, 2800m,  8000m),
        ("BOM", "GOI",  70, 1800m,  null),
        ("GOI", "BOM",  70, 1800m,  null),
        ("BOM", "COK", 130, 3500m,  null),
        ("COK", "BOM", 130, 3500m,  null),
        ("BOM", "CCU", 155, 5200m,  14000m),
        ("CCU", "BOM", 155, 5200m,  14000m),
        ("BOM", "MAA", 120, 3800m,  10000m),
        ("MAA", "BOM", 120, 3800m,  10000m),
        ("BOM", "AMD",  75, 2200m,  6000m),
        ("AMD", "BOM",  75, 2200m,  6000m),
        ("DEL", "BLR", 165, 5000m,  14000m),
        ("BLR", "DEL", 165, 5000m,  14000m),
        ("DEL", "HYD", 155, 4500m,  13000m),
        ("HYD", "DEL", 155, 4500m,  13000m),
        ("DEL", "CCU", 145, 4800m,  13000m),
        ("CCU", "DEL", 145, 4800m,  13000m),
        ("DEL", "MAA", 175, 5500m,  15000m),
        ("MAA", "DEL", 175, 5500m,  15000m),
        ("DEL", "AMD", 130, 3200m,  8000m),
        ("AMD", "DEL", 130, 3200m,  8000m),
        ("DEL", "GOI", 145, 5100m,  14000m),
        ("GOI", "DEL", 145, 5100m,  14000m),
        ("DEL", "LKO",  65, 2100m,  null),
        ("LKO", "DEL",  65, 2100m,  null),
        ("BLR", "MAA",  70, 1600m,  null),
        ("MAA", "BLR",  70, 1600m,  null),
        ("BLR", "HYD",  80, 2000m,  null),
        ("HYD", "BLR",  80, 2000m,  null),
        ("BLR", "COK",  80, 1900m,  null),
        ("COK", "BLR",  80, 1900m,  null),
        ("HYD", "MAA",  85, 2200m,  null),
        ("MAA", "HYD",  85, 2200m,  null),
        ("CCU", "BLR", 180, 5500m,  null),
        ("BLR", "CCU", 180, 5500m,  null),
        ("AMD", "HYD", 140, 3800m,  null),
        ("HYD", "AMD", 140, 3800m,  null),
    ];

    // Airlines per route tier
    private static readonly (string Airline, string Code, int FlightBase, decimal PriceMult)[] Airlines =
    [
        ("IndiGo",            "6E",  100, 1.00m),
        ("SpiceJet",          "SG",  200, 0.92m),
        ("Air India",         "AI",  300, 1.25m),
        ("Vistara",           "UK",  400, 1.45m),
        ("Akasa Air",         "QP",  500, 0.88m),
        ("Air India Express", "IX",  600, 0.95m),
        ("Go First",          "G8",  700, 0.85m),
    ];

    // Departure hour slots per airline "personality"
    private static readonly int[][] DepHours =
    [
        [5, 6, 7, 9, 12, 15, 17, 20],    // IndiGo — high frequency
        [6, 8, 14, 18],                   // SpiceJet
        [7, 10, 13, 16, 19],              // Air India
        [8, 11, 14, 17],                  // Vistara
        [6, 9, 14, 20],                   // Akasa Air
        [7, 13, 19],                      // Air India Express
        [8, 15],                          // Go First
    ];

    // ── Demand multiplier: day-of-week + peak periods (May–June 2026) ───────────
    private static decimal GetDemandMultiplier(DateTime date)
    {
        // Day-of-week base
        decimal mult = date.DayOfWeek switch
        {
            DayOfWeek.Saturday => 1.55m,   // peak leisure — beach/hills rush
            DayOfWeek.Friday   => 1.40m,   // getaway start
            DayOfWeek.Sunday   => 1.28m,   // return journeys
            DayOfWeek.Thursday => 1.15m,   // corporate + early travellers
            DayOfWeek.Monday   => 1.08m,   // post-weekend stragglers
            _                  => 1.00m,   // mid-week budget window
        };

        // Indian school summer vacation surge (May 15 – Jun 15): families travel
        if ((date.Month == 5 && date.Day >= 15) || (date.Month == 6 && date.Day <= 15))
            mult *= 1.25m;

        // Buddha Purnima long weekend (May 11–13): holiday cluster
        if (date.Month == 5 && date.Day is >= 11 and <= 13)
            mult *= 1.18m;

        // Eid al-Adha cluster (~Jun 6–9): biggest travel surge of the window
        if (date.Month == 6 && date.Day is >= 5 and <= 9)
            mult *= 1.38m;

        // End-of-June rush (Jun 27–30): return before July school re-openings
        if (date.Month == 6 && date.Day >= 27)
            mult *= 1.15m;

        return Math.Min(mult, 2.5m); // hard cap — no extreme outliers
    }

    private static List<Flight> BuildFlights()
    {
        var today = DateTime.UtcNow.Date;
        // Full May–June 2026; only future dates included (safe to reseed any day in May/June)
        var dates = Enumerable.Range(0, 61)
            .Select(i => new DateTime(2026, 5, 1).AddDays(i))
            .Where(d => d >= today && d <= new DateTime(2026, 6, 30))
            .ToArray();

        var flights = new List<Flight>();
        var counters = new Dictionary<string, int>();

        foreach (var (src, dst, baseDur, ecoBase, bizBase) in Routes)
        {
            var airlineIndices = baseDur >= 150
                ? new[] { 0, 2, 3 }
                : baseDur >= 100
                    ? new[] { 0, 1, 2, 4 }
                    : new[] { 0, 1, 4, 5, 6 };

            foreach (var ai in airlineIndices)
            {
                var (airline, code, flightBase, priceMult) = Airlines[ai];
                var hours  = DepHours[ai];

                foreach (var date in dates)
                {
                    var demand = GetDemandMultiplier(date);

                    // Peak days: airlines add capacity → harder to skip
                    var skipBits = demand >= 1.5m ? 15 : demand >= 1.25m ? 7 : 3;
                    var skip = (HashCode.Combine(src, dst, airline, date.DayOfYear) & skipBits) == 0;
                    if (skip && hours.Length > 2) continue;

                    // High-demand days: major airlines add a second departure
                    int departures = demand >= 1.35m && hours.Length >= 4 && ai <= 2 ? 2 : 1;

                    for (int slot = 0; slot < departures; slot++)
                    {
                        var key = $"{code}_{src}_{dst}";
                        if (!counters.TryGetValue(key, out var n)) n = flightBase;
                        counters[key] = n + 2;

                        var hourIdx = (date.DayOfYear + flightBase + slot * 5) % hours.Length;
                        var depHour = hours[hourIdx];
                        var depMin  = ((date.DayOfYear + flightBase + slot) % 4) * 15;
                        var dur     = baseDur + (((date.DayOfYear * 7) % 20) - 10);
                        var dep     = date.AddHours(depHour).AddMinutes(depMin);
                        var arr     = dep.AddMinutes(dur);

                        // Price: base × airline multiplier × demand multiplier ± small day variation
                        var dayVariation = (date.Day % 5) * 80m;
                        var eco = Math.Round(ecoBase * priceMult * demand + dayVariation, 0);
                        var biz = bizBase.HasValue ? (decimal?)Math.Round(bizBase.Value * priceMult * demand, 0) : null;

                        // Seats: fewer on peak days (high demand = faster sell-out)
                        var total = airline == "IndiGo" ? 180 : airline == "Air India" ? 200 : 170;
                        var hash  = HashCode.Combine(src, dst, airline, date.DayOfYear, slot);
                        var avail = demand >= 1.4m
                            ? 15 + (Math.Abs(hash) % 45)   // 15–60 on peak (selling fast)
                            : 55 + (Math.Abs(hash) % 80);  // 55–135 on off-peak (plenty of seats)

                        flights.Add(new Flight
                        {
                            Id             = Guid.NewGuid(),
                            Airline        = airline,
                            FlightNumber   = $"{code}-{n}",
                            Source         = src,
                            Destination    = dst,
                            DepartureTime  = dep,
                            ArrivalTime    = arr,
                            Duration       = dur,
                            TotalSeats     = total,
                            AvailableSeats = Math.Min(avail, total),
                            EconomyPrice   = eco,
                            BusinessPrice  = biz,
                            Stops          = 0,
                            IsActive       = true
                        });
                    }
                }
            }
        }

        return flights;
    }

    // ── Hotels ───────────────────────────────────────────────────────────────

    private static async Task SeedHotelsAsync(TravelPortDbContext context)
    {
        if (await context.Hotels.CountAsync() >= 60) return;

        context.Hotels.AddRange(
            // ── MUMBAI ───────────────────────────────────────────────────────
            MakeHotel("Taj Mahal Palace", "Mumbai",
                "Apollo Bunder, Colaba, Mumbai - 400001", 5.0m, 4.8m, 3240,
                "Iconic luxury hotel overlooking the Gateway of India. A UNESCO World Heritage landmark.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Concierge\",\"Room Service\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                18.9220m, 72.8332m,
                ("Deluxe Room", 12000m, 2, 20), ("Premier Room", 18000m, 2, 15), ("Luxury Suite", 35000m, 4, 8)),

            MakeHotel("The Leela Mumbai", "Mumbai",
                "Sahar, Andheri East, Mumbai - 400059", 5.0m, 4.5m, 1820,
                "Contemporary luxury hotel near the international airport with stunning city views.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Airport Shuttle\"]",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
                19.0968m, 72.8729m,
                ("Deluxe Room", 7500m, 2, 30), ("Club Room", 10000m, 2, 15), ("Suite", 22000m, 4, 10)),

            MakeHotel("Trident Nariman Point", "Mumbai",
                "Nariman Point, Mumbai - 400021", 5.0m, 4.6m, 2100,
                "Luxury hotel on Marine Drive with panoramic views of the Arabian Sea.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Sea View\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                18.9254m, 72.8228m,
                ("Sea View Room", 9500m, 2, 25), ("Premium Suite", 28000m, 4, 10)),

            MakeHotel("Hotel Midland", "Mumbai",
                "Colaba, Mumbai - 400005", 3.0m, 3.8m, 542,
                "Comfortable budget hotel in the heart of Colaba, close to all major attractions.",
                "[\"WiFi\",\"Restaurant\",\"Room Service\",\"Laundry\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                18.9218m, 72.8321m,
                ("Standard Room", 2500m, 2, 25), ("Deluxe Room", 3500m, 2, 15)),

            MakeHotel("Ibis Mumbai Vikhroli", "Mumbai",
                "Vikhroli East, Mumbai - 400083", 3.0m, 4.0m, 890,
                "Smart hotel with modern amenities near the Eastern Express Highway.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                19.1066m, 72.9205m,
                ("Smart Room", 3200m, 2, 40), ("Smart Studio", 4500m, 2, 20)),

            // ── DELHI ────────────────────────────────────────────────────────
            MakeHotel("The Oberoi New Delhi", "Delhi",
                "Dr. Zakir Hussain Marg, New Delhi - 110003", 5.0m, 4.9m, 4560,
                "Legendary luxury hotel offering breathtaking views of the golf course and Humayun's Tomb.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                28.5921m, 77.2344m,
                ("Premier Room", 14000m, 2, 25), ("Luxury Suite", 45000m, 4, 8), ("Oberoi Suite", 75000m, 4, 3)),

            MakeHotel("ITC Maurya", "Delhi",
                "Sardar Patel Marg, Diplomatic Enclave, New Delhi - 110021", 5.0m, 4.7m, 2890,
                "Award-winning luxury hotel blending Indian heritage with contemporary comforts.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                28.5976m, 77.1741m,
                ("Executive Room", 11000m, 2, 30), ("Luxury Suite", 38000m, 4, 12)),

            MakeHotel("The Imperial New Delhi", "Delhi",
                "Janpath, New Delhi - 110001", 5.0m, 4.8m, 3100,
                "Colonial-era grand hotel on Janpath, minutes from Connaught Place and Rajpath.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Heritage Gallery\"]",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                28.6219m, 77.2197m,
                ("Heritage Room", 12000m, 2, 20), ("Imperial Suite", 42000m, 4, 8)),

            MakeHotel("Park Inn by Radisson Delhi", "Delhi",
                "Sector 29, Gurugram, Haryana - 122022", 3.0m, 3.7m, 380,
                "Modern business hotel with excellent connectivity to Delhi NCR and airport.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                28.4595m, 77.0266m,
                ("Standard Room", 3000m, 2, 40), ("Superior Room", 4500m, 2, 20)),

            MakeHotel("Lemon Tree Hotel Aerocity", "Delhi",
                "Aerocity, New Delhi - 110037", 4.0m, 4.2m, 1200,
                "Well-appointed hotel in the aerocity zone, 5 minutes from IGI Airport.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Airport Shuttle\"]",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                28.5562m, 77.0909m,
                ("Comfortable Room", 5500m, 2, 50), ("Refreshing Suite", 9500m, 4, 15)),

            // ── GOA ──────────────────────────────────────────────────────────
            MakeHotel("Taj Exotica Resort & Spa", "Goa",
                "Calwaddo, Benaulim, South Goa - 403716", 5.0m, 4.8m, 2100,
                "Sprawling luxury resort amid coconut groves with direct beach access on Benaulim Beach.",
                "[\"WiFi\",\"Beachfront\",\"Multiple Pools\",\"Spa\",\"5 Restaurants\",\"Gym\",\"Watersports\"]",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                15.2588m, 73.9311m,
                ("Luxury Room", 16000m, 2, 20), ("Beach Suite", 35000m, 2, 10), ("Pool Villa", 55000m, 4, 8)),

            MakeHotel("Alila Diwa Goa", "Goa",
                "Adao Waddo, Majorda, South Goa - 403713", 4.0m, 4.6m, 980,
                "Contemporary resort surrounded by paddy fields, minutes from Majorda Beach.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Cycling\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                15.3022m, 73.9185m,
                ("Deluxe Room", 8500m, 2, 25), ("Pool Suite", 25000m, 4, 8)),

            MakeHotel("Sea Pearl Beach Resort", "Goa",
                "Calangute Beach Road, North Goa - 403516", 3.0m, 4.0m, 650,
                "Cheerful resort steps away from the famous Calangute Beach, perfect for families.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Beach Access\",\"Water Sports\"]",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                15.5478m, 73.7571m,
                ("Standard Room", 3500m, 2, 30), ("Sea View Room", 5000m, 2, 15)),

            MakeHotel("The Zuri White Sands Goa", "Goa",
                "Varca Beach, South Goa - 403721", 5.0m, 4.7m, 1650,
                "Award-winning resort with the longest private stretch of white sand beach in South Goa.",
                "[\"WiFi\",\"Beachfront\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Watersports\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                15.2111m, 73.9397m,
                ("Superior Room", 9500m, 2, 30), ("Suite", 22000m, 4, 10)),

            // ── BANGALORE ────────────────────────────────────────────────────
            MakeHotel("ITC Windsor", "Bangalore",
                "Golf Course Road, Sankey Road, Bengaluru - 560052", 5.0m, 4.5m, 1560,
                "Heritage luxury hotel inspired by English manor houses, offering timeless elegance.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                13.0065m, 77.5769m,
                ("Executive Room", 8500m, 2, 30), ("Windsor Suite", 28000m, 4, 8)),

            MakeHotel("The Lalit Ashok Bangalore", "Bangalore",
                "Kumara Krupa High Grounds, Bengaluru - 560001", 4.0m, 4.3m, 1230,
                "Contemporary luxury hotel near Cubbon Park, offering easy access to Bengaluru's tech hub.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                12.9928m, 77.5850m,
                ("Superior Room", 6500m, 2, 35), ("Deluxe Room", 9500m, 2, 20)),

            MakeHotel("Lemon Tree Premier Ulsoor", "Bangalore",
                "Ulsoor Road, Bengaluru - 560042", 4.0m, 4.1m, 870,
                "Smart city-center hotel near MG Road with contemporary rooms and rooftop pool.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Bar\"]",
                "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
                12.9741m, 77.6134m,
                ("Refreshing Room", 5500m, 2, 40), ("Premier Suite", 14000m, 4, 10)),

            MakeHotel("Treebo Trend Bangalore", "Bangalore",
                "Koramangala, Bengaluru - 560034", 3.0m, 3.9m, 420,
                "Budget-friendly hotel in the IT corridor with clean rooms and reliable WiFi.",
                "[\"WiFi\",\"Restaurant\",\"Parking\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                12.9352m, 77.6243m,
                ("Standard Room", 2200m, 2, 30), ("Deluxe Room", 3000m, 2, 15)),

            // ── JAIPUR ───────────────────────────────────────────────────────
            MakeHotel("Rambagh Palace", "Jaipur",
                "Bhawani Singh Road, Jaipur - 302005", 5.0m, 4.9m, 3120,
                "Former residence of the Maharaja of Jaipur — a magnificent palace hotel.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Polo\",\"Tennis\",\"Heritage Walks\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                26.8947m, 75.8203m,
                ("Heritage Room", 18000m, 2, 15), ("Grand Suite", 45000m, 4, 8), ("Palace Suite", 65000m, 4, 5)),

            MakeHotel("Fairmont Jaipur", "Jaipur",
                "Riico Institutional Area, Kukas, Jaipur - 303101", 5.0m, 4.7m, 1890,
                "Majestic resort-style hotel with panoramic views of the Aravalli Hills.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Tennis\",\"Cycling\"]",
                "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800",
                26.9997m, 75.7865m,
                ("Deluxe Room", 12000m, 2, 30), ("Fairmont Suite", 40000m, 4, 10)),

            MakeHotel("Hotel Pearl Palace", "Jaipur",
                "Hari Kishan Somani Marg, Hathroi, Jaipur - 302001", 3.0m, 4.4m, 1800,
                "Award-winning boutique heritage hotel, beloved by budget travellers for its rooftop restaurant.",
                "[\"WiFi\",\"Restaurant\",\"Rooftop\",\"Heritage Decor\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                26.9279m, 75.8166m,
                ("Heritage Room", 2800m, 2, 20), ("Deluxe Room", 3800m, 2, 10)),

            // ── HYDERABAD ────────────────────────────────────────────────────
            MakeHotel("Taj Falaknuma Palace", "Hyderabad",
                "Engine Bowli, Falaknuma, Hyderabad - 500053", 5.0m, 4.9m, 2780,
                "Former palace of the Nizam of Hyderabad. India's most exclusive palace hotel.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Heritage Walks\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                17.3327m, 78.4673m,
                ("Palace Room", 22000m, 2, 12), ("Palace Suite", 50000m, 4, 6), ("Royal Suite", 80000m, 4, 4)),

            MakeHotel("Park Hyatt Hyderabad", "Hyderabad",
                "Road No. 2, Banjara Hills, Hyderabad - 500034", 5.0m, 4.7m, 2100,
                "Contemporary luxury hotel in the upscale Banjara Hills with world-class dining.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
                17.4218m, 78.4473m,
                ("Park Room", 12000m, 2, 30), ("Hyatt Suite", 35000m, 4, 10)),

            MakeHotel("Novotel Hyderabad Airport", "Hyderabad",
                "Shamshabad, Hyderabad - 501218", 4.0m, 4.2m, 960,
                "Premium airport hotel with complimentary shuttle and round-the-clock dining.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Airport Shuttle\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                17.2313m, 78.4298m,
                ("Superior Room", 6500m, 2, 50), ("Deluxe Suite", 14000m, 4, 15)),

            // ── CHENNAI ──────────────────────────────────────────────────────
            MakeHotel("ITC Grand Chola", "Chennai",
                "Mount Road, Guindy, Chennai - 600032", 5.0m, 4.8m, 2400,
                "India's largest luxury hotel — a tribute to the magnificence of the Chola dynasty.",
                "[\"WiFi\",\"Multiple Pools\",\"Spa\",\"5 Restaurants\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                13.0082m, 80.2208m,
                ("Executive Room", 12000m, 2, 40), ("Club Room", 16000m, 2, 20), ("Luxury Suite", 45000m, 4, 8)),

            MakeHotel("Taj Coromandel", "Chennai",
                "Nungambakkam High Road, Chennai - 600034", 5.0m, 4.7m, 1980,
                "Timeless luxury in the heart of Chennai's commercial and cultural district.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                13.0604m, 80.2463m,
                ("Deluxe Room", 10000m, 2, 30), ("Premier Suite", 32000m, 4, 10)),

            MakeHotel("The Raintree Hotel", "Chennai",
                "St Mary's Road, Alwarpet, Chennai - 600018", 4.0m, 4.3m, 870,
                "Boutique eco-friendly hotel with lush gardens and a refreshing outdoor pool.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Eco-Friendly\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                13.0338m, 80.2526m,
                ("Garden Room", 5500m, 2, 25), ("Pool Suite", 14000m, 4, 8)),

            MakeHotel("FabHotel Prime Chennai", "Chennai",
                "Anna Salai, Chennai - 600002", 2.0m, 3.8m, 560,
                "Clean and affordable hotel with quick access to Chennai Central Railway Station.",
                "[\"WiFi\",\"Room Service\",\"Laundry\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                13.0759m, 80.2721m,
                ("Standard Room", 1800m, 2, 30), ("Deluxe Room", 2500m, 2, 15)),

            // ── KOLKATA ──────────────────────────────────────────────────────
            MakeHotel("The Oberoi Grand Kolkata", "Kolkata",
                "Jawaharlal Nehru Road, Kolkata - 700013", 5.0m, 4.8m, 2300,
                "Kolkata's grande dame — a Victorian-era masterpiece with legendary service.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Heritage\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                22.5550m, 88.3497m,
                ("Luxury Room", 11000m, 2, 25), ("Heritage Suite", 35000m, 4, 8)),

            MakeHotel("ITC Royal Bengal", "Kolkata",
                "JBS Haldane Avenue, Kolkata - 700105", 5.0m, 4.7m, 1760,
                "Modern luxury skyscraper hotel with panoramic views of the Kolkata skyline.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                22.5290m, 88.3644m,
                ("Executive Room", 9500m, 2, 35), ("Royal Suite", 30000m, 4, 10)),

            MakeHotel("Taj Bengal", "Kolkata",
                "34B, Belvedere Road, Alipore, Kolkata - 700027", 5.0m, 4.6m, 1940,
                "Luxury hotel in the leafy Alipore neighbourhood with outstanding Bengali cuisine.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                22.5275m, 88.3350m,
                ("Deluxe Room", 8500m, 2, 30), ("Bengal Suite", 26000m, 4, 10)),

            MakeHotel("Hotel Lindsay", "Kolkata",
                "Lindsay Street, Kolkata - 700087", 3.0m, 3.6m, 410,
                "Budget heritage hotel near New Market and Park Street in the heart of Kolkata.",
                "[\"WiFi\",\"Restaurant\",\"Room Service\"]",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                22.5571m, 88.3545m,
                ("Standard Room", 2000m, 2, 30), ("Deluxe Room", 2800m, 2, 15)),

            // ── AHMEDABAD ────────────────────────────────────────────────────
            MakeHotel("Hyatt Regency Ahmedabad", "Ahmedabad",
                "SG Highway, Ahmedabad - 380054", 5.0m, 4.6m, 1340,
                "Premium hotel on the SG Highway corridor, the business hub of Ahmedabad.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                23.0424m, 72.5068m,
                ("King Room", 8000m, 2, 30), ("Suite", 22000m, 4, 10)),

            MakeHotel("Novotel Ahmedabad", "Ahmedabad",
                "Judges Bungalow Road, Bodakdev, Ahmedabad - 380054", 4.0m, 4.3m, 980,
                "Contemporary hotel in Bodakdev with a relaxing pool and all-day dining.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                23.0478m, 72.5100m,
                ("Superior Room", 5500m, 2, 40), ("Junior Suite", 12000m, 4, 12)),

            MakeHotel("Hotel Regenta Inn", "Ahmedabad",
                "Navrangpura, Ahmedabad - 380009", 3.0m, 3.9m, 580,
                "Comfortable mid-range hotel near Gujarat University and Navrangpura business district.",
                "[\"WiFi\",\"Restaurant\",\"Parking\",\"Room Service\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                23.0373m, 72.5602m,
                ("Standard Room", 2800m, 2, 30), ("Executive Room", 4200m, 2, 15)),

            // ── PUNE ─────────────────────────────────────────────────────────
            MakeHotel("JW Marriott Pune", "Pune",
                "Senapati Bapat Road, Pune - 411016", 5.0m, 4.7m, 1980,
                "Landmark luxury hotel at the heart of Pune's business and leisure district.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                18.5315m, 73.8446m,
                ("Deluxe Room", 10000m, 2, 30), ("Junior Suite", 22000m, 4, 15), ("Grand Suite", 40000m, 4, 5)),

            MakeHotel("The Westin Pune Koregaon Park", "Pune",
                "Koregaon Park, Pune - 411001", 5.0m, 4.6m, 1650,
                "Urban resort in the vibrant Koregaon Park neighbourhood with a lush garden oasis.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Tennis\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                18.5367m, 73.8950m,
                ("Heavenly Room", 9000m, 2, 35), ("Executive Suite", 24000m, 4, 10)),

            MakeHotel("Hotel Shalimar", "Pune",
                "Connaught Road, Camp, Pune - 411001", 3.0m, 3.7m, 440,
                "Well-established hotel in the Camp area with easy access to Pune railway station.",
                "[\"WiFi\",\"Restaurant\",\"Room Service\",\"Parking\"]",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
                18.5196m, 73.8744m,
                ("Standard Room", 2200m, 2, 25), ("Deluxe Room", 3200m, 2, 12)),

            // ── KOCHI ────────────────────────────────────────────────────────
            MakeHotel("Casino Hotel Kochi", "Kochi",
                "Wellington Island, Kochi - 682003", 5.0m, 4.6m, 1420,
                "Waterfront luxury hotel on Wellington Island with stunning backwater views.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Waterfront\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                9.9654m, 76.2620m,
                ("Lake View Room", 9000m, 2, 25), ("Suite", 22000m, 4, 8)),

            MakeHotel("Le Meridien Kochi", "Kochi",
                "Maradu, Kochi - 682304", 5.0m, 4.5m, 1100,
                "Contemporary luxury hotel on the banks of the backwaters with Infinity pool.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                9.9436m, 76.3069m,
                ("Deluxe Room", 7500m, 2, 35), ("Luxury Suite", 20000m, 4, 10)),

            MakeHotel("GoStops Kochi", "Kochi",
                "Fort Kochi, Kochi - 682001", 2.0m, 4.1m, 680,
                "Backpacker-friendly hostel in charming Fort Kochi, steps from the Chinese fishing nets.",
                "[\"WiFi\",\"Rooftop\",\"Cafe\",\"Lockers\",\"Tours\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                9.9638m, 76.2437m,
                ("Dormitory Bed", 700m, 1, 40), ("Private Room", 2500m, 2, 15)),

            // ── LUCKNOW ──────────────────────────────────────────────────────
            MakeHotel("Taj Mahal Lucknow", "Lucknow",
                "Vipin Khand, Gomti Nagar, Lucknow - 226010", 5.0m, 4.6m, 1200,
                "Luxury hotel in Gomti Nagar, the upscale commercial heart of Lucknow.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                26.8672m, 80.9939m,
                ("Deluxe Room", 8000m, 2, 30), ("Taj Suite", 25000m, 4, 10)),

            MakeHotel("Piccadily Hotel Lucknow", "Lucknow",
                "Vidhan Sabha Marg, Lucknow - 226001", 4.0m, 4.2m, 760,
                "Well-known Lucknow hotel near Hazratganj market, famous for authentic Awadhi cuisine.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                26.8467m, 80.9462m,
                ("Superior Room", 4500m, 2, 35), ("Junior Suite", 9500m, 4, 10)),

            // ── MUMBAI (additional) ──────────────────────────────────────────
            MakeHotel("The St. Regis Mumbai", "Mumbai",
                "Lower Parel, Mumbai - 400013", 5.0m, 4.7m, 2650,
                "Mumbai's tallest luxury hotel, offering panoramic views from 30+ floors above Lower Parel.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                18.9966m, 72.8249m,
                ("Superior Room", 13000m, 2, 25), ("Grand Deluxe Room", 19000m, 2, 15), ("St. Regis Suite", 40000m, 4, 8)),

            MakeHotel("Sofitel Mumbai BKC", "Mumbai",
                "Bandra Kurla Complex, Mumbai - 400051", 5.0m, 4.6m, 1900,
                "French elegance meets Mumbai's business heart — luxury redefined in BKC.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                19.0668m, 72.8695m,
                ("Luxury Room", 11000m, 2, 30), ("Suite", 28000m, 4, 10)),

            MakeHotel("Juhu Beach Resort", "Mumbai",
                "Juhu Tara Road, Juhu, Mumbai - 400049", 3.0m, 3.9m, 720,
                "Beachside resort steps from Juhu Beach — casual comfort with sea breeze.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Parking\",\"Beach Access\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                19.0875m, 72.8258m,
                ("Sea View Room", 4500m, 2, 20), ("Beach Suite", 8000m, 3, 10)),

            MakeHotel("Hotel Kohinoor Continental", "Mumbai",
                "Andheri East, Mumbai - 400069", 4.0m, 4.1m, 1050,
                "Business-friendly hotel near domestic airport with modern amenities and conference facilities.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Airport Shuttle\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                19.1120m, 72.8570m,
                ("Deluxe Room", 6000m, 2, 40), ("Business Suite", 12000m, 4, 12)),

            MakeHotel("Backpacker Panda Mumbai", "Mumbai",
                "Fort, Mumbai - 400001", 2.0m, 4.2m, 880,
                "Social hostel in the heritage Fort district — perfectly placed for budget explorers.",
                "[\"WiFi\",\"Cafe\",\"Lockers\",\"Rooftop\",\"Tours\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                18.9322m, 72.8353m,
                ("Dormitory Bed", 800m, 1, 50), ("Private Double", 2800m, 2, 12)),

            // ── DELHI (additional) ───────────────────────────────────────────
            MakeHotel("The Leela Palace New Delhi", "Delhi",
                "Diplomatic Enclave, New Delhi - 110023", 5.0m, 4.9m, 3800,
                "Ultra-luxury palace hotel in Chanakyapuri — India's most awarded luxury property.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Butler Service\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
                28.5965m, 77.1875m,
                ("Deluxe Room", 20000m, 2, 20), ("Royal Club Room", 28000m, 2, 15), ("Royal Suite", 85000m, 4, 4)),

            MakeHotel("Hyatt Regency Delhi", "Delhi",
                "Bhikaiji Cama Place, New Delhi - 110066", 5.0m, 4.6m, 2200,
                "Contemporary luxury in the heart of South Delhi with world-class dining and events.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                28.5693m, 77.1895m,
                ("King Room", 12000m, 2, 35), ("Regency Suite", 32000m, 4, 10)),

            MakeHotel("Radisson Blu Marina Delhi", "Delhi",
                "Connaught Place, New Delhi - 110001", 4.0m, 4.4m, 1560,
                "Upscale hotel at the iconic Connaught Place circle, ideal for business and leisure.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                28.6325m, 77.2197m,
                ("Superior Room", 8000m, 2, 40), ("Junior Suite", 18000m, 4, 12)),

            MakeHotel("OYO Flagship New Delhi Station", "Delhi",
                "Paharganj, New Delhi - 110055", 2.0m, 3.7m, 620,
                "Budget hotel steps from New Delhi Railway Station — clean, affordable, well-connected.",
                "[\"WiFi\",\"Room Service\",\"24-Hour Front Desk\"]",
                "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
                28.6435m, 77.2189m,
                ("Standard Room", 1500m, 2, 40), ("Deluxe Room", 2200m, 2, 20)),

            MakeHotel("The Hans Hotel New Delhi", "Delhi",
                "Barakhamba Road, Connaught Place, New Delhi - 110001", 4.0m, 4.0m, 870,
                "Classic hotel with a prime CP address — reliable mid-range choice for business travellers.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                28.6295m, 77.2277m,
                ("Standard Room", 5500m, 2, 35), ("Executive Room", 8000m, 2, 15)),

            // ── GOA (additional) ─────────────────────────────────────────────
            MakeHotel("Grand Hyatt Goa", "Goa",
                "Bambolim Beach Resort, Goa - 403206", 5.0m, 4.8m, 2400,
                "Award-winning resort on Bambolim Bay with 5 pools, 9 dining outlets and a private beach.",
                "[\"WiFi\",\"Beachfront\",\"Multiple Pools\",\"Spa\",\"5 Restaurants\",\"Gym\",\"Watersports\",\"Tennis\"]",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                15.4634m, 73.8261m,
                ("Grand Room", 14000m, 2, 30), ("Grand Suite", 42000m, 4, 8)),

            MakeHotel("W Goa", "Goa",
                "Vagator Beach, North Goa - 403509", 5.0m, 4.7m, 1950,
                "W's eclectic beach resort — bold design, infinity pool and Goa's best sunset views.",
                "[\"WiFi\",\"Beachfront\",\"Pool\",\"Spa\",\"Restaurant\",\"Bar\",\"Gym\",\"DJ Events\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                15.5987m, 73.7451m,
                ("Wonderful Room", 18000m, 2, 20), ("Mega Suite", 55000m, 4, 6)),

            MakeHotel("Goa Marriott Resort & Spa", "Goa",
                "Miramar Beach, Panaji, Goa - 403001", 5.0m, 4.6m, 1780,
                "Beachfront resort on Miramar Beach, minutes from Panaji city with a spectacular infinity pool.",
                "[\"WiFi\",\"Beachfront\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800",
                15.4671m, 73.8009m,
                ("Deluxe Room", 12000m, 2, 25), ("Junior Suite", 30000m, 4, 8)),

            MakeHotel("Kenilworth Beach Resort Goa", "Goa",
                "Utorda-Majorda Beach, South Goa - 403713", 4.0m, 4.4m, 1100,
                "Secluded south Goa hideaway on the quieter Utorda Beach — ideal for families.",
                "[\"WiFi\",\"Beachfront\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Kids Club\"]",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                15.3175m, 73.9221m,
                ("Garden View Room", 7500m, 2, 20), ("Pool Facing Suite", 18000m, 4, 8)),

            MakeHotel("The Beach House Goa", "Goa",
                "Baga Beach Road, North Goa - 403516", 3.0m, 4.1m, 760,
                "Charming boutique property a 2-minute walk from Baga Beach — vibrant location, great value.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Beach Access\",\"Cafe\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                15.5546m, 73.7529m,
                ("Standard Room", 3000m, 2, 20), ("Beach Room", 5500m, 2, 10)),

            // ── BANGALORE (additional) ───────────────────────────────────────
            MakeHotel("The Oberoi Bengaluru", "Bangalore",
                "MG Road, Bengaluru - 560001", 5.0m, 4.9m, 2800,
                "Landmark luxury hotel on MG Road, offering impeccable Oberoi service and stunning city views.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Concierge\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                12.9762m, 77.5939m,
                ("Premier Room", 16000m, 2, 20), ("Luxury Suite", 50000m, 4, 6)),

            MakeHotel("JW Marriott Bangalore", "Bangalore",
                "Vittal Mallya Road, Bengaluru - 560001", 5.0m, 4.7m, 2100,
                "Sophisticated luxury in the heart of the city — close to UB City and Cubbon Park.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                12.9709m, 77.5962m,
                ("Deluxe Room", 13000m, 2, 30), ("Executive Suite", 35000m, 4, 10)),

            MakeHotel("Vivanta Bengaluru MG Road", "Bangalore",
                "MG Road, Bengaluru - 560001", 4.0m, 4.5m, 1600,
                "Contemporary Taj-owned property in the busiest part of Bangalore — perfect location.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Bar\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                12.9766m, 77.6072m,
                ("Superior Room", 9000m, 2, 30), ("Club Room", 14000m, 2, 12)),

            MakeHotel("Sheraton Grand Bangalore", "Bangalore",
                "Brigade Gateway, Bengaluru - 560055", 5.0m, 4.6m, 1750,
                "Elegant hotel in the thriving Brigade Gateway district near World Trade Center.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                13.0113m, 77.5548m,
                ("Grand Room", 11000m, 2, 35), ("Sheraton Suite", 28000m, 4, 10)),

            MakeHotel("Zostel Bangalore", "Bangalore",
                "Indiranagar, Bengaluru - 560038", 2.0m, 4.3m, 920,
                "Popular backpacker hostel in trendy Indiranagar — great social vibe and pub-street access.",
                "[\"WiFi\",\"Cafe\",\"Rooftop\",\"Lockers\",\"Tours\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                12.9716m, 77.6411m,
                ("Dormitory Bed", 700m, 1, 40), ("Private Room", 2500m, 2, 12)),

            // ── JAIPUR (additional) ──────────────────────────────────────────
            MakeHotel("Taj Hotel Convention Centre Jaipur", "Jaipur",
                "Ambawata, Queens Road, Jaipur - 302021", 5.0m, 4.7m, 1650,
                "Modern luxury hotel adjacent to the Jaipur Convention Centre, perfect for large events.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\",\"Tennis\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                26.9277m, 75.8069m,
                ("Superior Room", 10000m, 2, 30), ("Luxury Suite", 32000m, 4, 8)),

            MakeHotel("Narain Niwas Palace Hotel", "Jaipur",
                "Kanota Bagh, Narain Singh Road, Jaipur - 302004", 4.0m, 4.5m, 1420,
                "Regal heritage hotel built in 1881, surrounded by lush gardens — colonial charm preserved.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Heritage Decor\",\"Cycling\",\"Croquet\"]",
                "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800",
                26.9226m, 75.8246m,
                ("Heritage Room", 7000m, 2, 20), ("Palace Suite", 18000m, 4, 6)),

            MakeHotel("Four Points by Sheraton Jaipur", "Jaipur",
                "Tonk Road, Jaipur - 302018", 4.0m, 4.2m, 980,
                "Reliable upscale business hotel on Tonk Road with rooftop pool and contemporary rooms.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                26.8806m, 75.8087m,
                ("Standard Room", 5000m, 2, 40), ("Deluxe Room", 8000m, 2, 15)),

            MakeHotel("Hotel Samode Haveli", "Jaipur",
                "Gangapole, Jaipur - 302002", 4.0m, 4.6m, 1860,
                "Restored 19th-century mansion inside Jaipur's old city walls — authentic Rajput experience.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Heritage Walks\",\"Rooftop\",\"Spa\"]",
                "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
                26.9268m, 75.8238m,
                ("Heritage Suite", 12000m, 2, 12), ("Royal Suite", 25000m, 4, 5)),

            MakeHotel("Hotel Pink City Jaipur", "Jaipur",
                "MI Road, Jaipur - 302001", 3.0m, 3.8m, 540,
                "Budget-friendly hotel in the heart of the Pink City near Ajmeri Gate and bazaars.",
                "[\"WiFi\",\"Restaurant\",\"Room Service\",\"Parking\"]",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                26.9199m, 75.8161m,
                ("Standard Room", 2200m, 2, 25), ("Deluxe Room", 3200m, 2, 12)),

            MakeHotel("Dera Mandawa Jaipur", "Jaipur",
                "Link Road, Shastri Nagar, Jaipur - 302016", 3.0m, 4.3m, 1100,
                "Award-winning heritage guesthouse with hand-painted frescoes and traditional Rajasthani hospitality.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Heritage Decor\",\"Rooftop\",\"Cultural Shows\"]",
                "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
                26.9315m, 75.8143m,
                ("Heritage Room", 3500m, 2, 20), ("Haveli Suite", 7500m, 4, 8)),

            // ── HYDERABAD (additional) ───────────────────────────────────────
            MakeHotel("ITC Kohenur Hyderabad", "Hyderabad",
                "HITEC City, Hyderabad - 500081", 5.0m, 4.8m, 2200,
                "Iconic glass-and-steel luxury tower in HITEC City, inspired by the Kohinoor diamond.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Multiple Restaurants\",\"Gym\",\"Business Center\",\"Bar\"]",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                17.4487m, 78.3775m,
                ("Luxury Room", 16000m, 2, 25), ("Kohenur Suite", 48000m, 4, 6)),

            MakeHotel("The Westin Hyderabad Mindspace", "Hyderabad",
                "Mindspace IT Park, Madhapur, Hyderabad - 500081", 5.0m, 4.6m, 1900,
                "Modern luxury in Hyderabad's IT district — premium amenities for corporate travellers.",
                "[\"WiFi\",\"Pool\",\"Spa\",\"Restaurant\",\"Gym\",\"Business Center\",\"Parking\"]",
                "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
                17.4428m, 78.3831m,
                ("Heavenly Room", 12000m, 2, 35), ("Executive Suite", 30000m, 4, 10)),

            MakeHotel("Lemon Tree Premier HITEC City", "Hyderabad",
                "HITEC City, Hyderabad - 500081", 4.0m, 4.2m, 1100,
                "Smart upscale hotel in the tech district — cheerful interiors and great value dining.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
                17.4512m, 78.3824m,
                ("Refreshing Room", 6500m, 2, 50), ("Premier Suite", 16000m, 4, 10)),

            MakeHotel("Golkonda Hotel Hyderabad", "Hyderabad",
                "Masab Tank, Hyderabad - 500028", 4.0m, 4.1m, 860,
                "Established city hotel with spacious rooms, centrally located near Hussain Sagar lake.",
                "[\"WiFi\",\"Pool\",\"Restaurant\",\"Gym\",\"Parking\",\"Banquet\"]",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
                17.4060m, 78.4603m,
                ("Standard Room", 4500m, 2, 40), ("Executive Room", 7000m, 2, 15)),

            MakeHotel("ibis Hyderabad HITEC City", "Hyderabad",
                "Madhapur, Hyderabad - 500081", 3.0m, 4.0m, 780,
                "Smart budget hotel with modern amenities in the heart of Hyderabad's tech corridor.",
                "[\"WiFi\",\"Restaurant\",\"Gym\",\"Business Center\"]",
                "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800",
                17.4447m, 78.3860m,
                ("Smart Room", 3500m, 2, 60), ("Smart Suite", 6500m, 3, 15))
        );
    }

    // Gallery image pools keyed by star tier — each pool has 12 distinct Unsplash hotel photos
    private static readonly string[][] _galleryPools =
    [
        // 3-star budget/midscale
        [
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800",
            "https://images.unsplash.com/photo-1560347876-aeef00ee58a1?w=800",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
        ],
        // 4-star business/superior
        [
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
            "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
            "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800",
        ],
        // 5-star luxury
        [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
            "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800",
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        ],
    ];

    private static string BuildGalleryJson(string imageUrl, decimal stars, string name)
    {
        var pool = stars >= 5 ? _galleryPools[2] : stars >= 4 ? _galleryPools[1] : _galleryPools[0];
        // deterministic pick based on name hash so each hotel gets a stable but varied set
        var hash = Math.Abs(name.GetHashCode());
        var picked = new List<string> { imageUrl };
        for (var i = 0; i < 4; i++)
        {
            var candidate = pool[(hash + i * 3) % pool.Length];
            if (!picked.Contains(candidate)) picked.Add(candidate);
        }
        return System.Text.Json.JsonSerializer.Serialize(picked);
    }

    private static Hotel MakeHotel(string name, string city, string address,
        decimal stars, decimal reviewScore, int reviewCount,
        string description, string amenities, string imageUrl,
        decimal lat, decimal lon,
        params (string type, decimal price, int maxGuests, int totalRooms)[] rooms)
    {
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(), Name = name, City = city, Address = address,
            StarRating = stars, ReviewScore = reviewScore, ReviewCount = reviewCount,
            Description = description, Amenities = amenities, ImageUrl = imageUrl,
            Images = BuildGalleryJson(imageUrl, stars, name),
            Latitude = lat, Longitude = lon, IsActive = true
        };

        foreach (var (type, price, maxGuests, totalRooms) in rooms)
        {
            hotel.Rooms.Add(new HotelRoom
            {
                Id = Guid.NewGuid(), HotelId = hotel.Id, RoomType = type,
                PricePerNight = price, MaxGuests = maxGuests, TotalRooms = totalRooms, IsActive = true
            });
        }

        return hotel;
    }

    // ── Coupons ──────────────────────────────────────────────────────────────

    private static async Task SeedCouponsAsync(TravelPortDbContext context)
    {
        var all = new[]
        {
            // Generic
            new Coupon { Id = Guid.NewGuid(), Code = "SAVE100",    Type = CouponType.Fixed,      Value = 100, MinAmount = 1000,  UsageLimit = 1000, ExpiresAt = DateTime.UtcNow.AddMonths(3),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "FIRST10",    Type = CouponType.Percentage,  Value = 10,  MinAmount = 500,   MaxDiscount = 500,  UsageLimit = 500,  ExpiresAt = DateTime.UtcNow.AddMonths(6),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "SUMMER20",   Type = CouponType.Percentage,  Value = 20,  MinAmount = 2000,  MaxDiscount = 1000, UsageLimit = 200,  ExpiresAt = DateTime.UtcNow.AddMonths(2),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "HOTEL500",   Type = CouponType.Fixed,       Value = 500, MinAmount = 3000,  UsageLimit = 300,   ExpiresAt = DateTime.UtcNow.AddMonths(4),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "FLAT15",     Type = CouponType.Percentage,  Value = 15,  MinAmount = 1500,  MaxDiscount = 750,  UsageLimit = 400,  ExpiresAt = DateTime.UtcNow.AddMonths(5),  IsActive = true },
            // Flight-specific
            new Coupon { Id = Guid.NewGuid(), Code = "FLYSAVER",   Type = CouponType.Percentage,  Value = 10,  MinAmount = 500,   MaxDiscount = 800,  UsageLimit = 1000, ExpiresAt = DateTime.UtcNow.AddMonths(6),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "FLYOFF200",  Type = CouponType.Fixed,       Value = 200, MinAmount = 2000,  UsageLimit = 500,   ExpiresAt = DateTime.UtcNow.AddMonths(4),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "FLYDEAL15",  Type = CouponType.Percentage,  Value = 15,  MinAmount = 3000,  MaxDiscount = 1500, UsageLimit = 300,  ExpiresAt = DateTime.UtcNow.AddMonths(3),  IsActive = true },
            // Hotel-specific
            new Coupon { Id = Guid.NewGuid(), Code = "HOTELOFF15", Type = CouponType.Percentage,  Value = 15,  MinAmount = 3000,  MaxDiscount = 1500, UsageLimit = 300,  ExpiresAt = DateTime.UtcNow.AddMonths(6),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "STAYMORE",   Type = CouponType.Fixed,       Value = 750, MinAmount = 5000,  UsageLimit = 200,   ExpiresAt = DateTime.UtcNow.AddMonths(4),  IsActive = true },
            new Coupon { Id = Guid.NewGuid(), Code = "HOTELDEAL",  Type = CouponType.Percentage,  Value = 12,  MinAmount = 2000,  MaxDiscount = 1000, UsageLimit = 500,  ExpiresAt = DateTime.UtcNow.AddMonths(5),  IsActive = true },
        };

        var existing = await context.Coupons.Select(c => c.Code).ToListAsync();
        var toAdd = all.Where(c => !existing.Contains(c.Code)).ToList();
        if (toAdd.Count > 0)
            context.Coupons.AddRange(toAdd);
    }

    // ── Bookings ─────────────────────────────────────────────────────────────

    private static async Task SeedBookingsAsync(TravelPortDbContext context)
    {
        var john           = await context.Users.FirstOrDefaultAsync(u => u.Email == "john@example.com");
        var flight         = await context.Flights.FirstOrDefaultAsync(f => f.Source == "BOM" && f.Destination == "DEL");
        var cancelledFlight= await context.Flights.FirstOrDefaultAsync(f => f.Source == "DEL" && f.Destination == "BOM");
        var hotel          = await context.Hotels.Include(h => h.Rooms).FirstOrDefaultAsync(h => h.City == "Goa");

        if (john == null || flight == null || cancelledFlight == null || hotel == null) return;
        var room = hotel.Rooms.FirstOrDefault();
        if (room == null) return;

        // Only seed sample bookings when John has none — preserves real bookings created during testing
        if (await context.Bookings.AnyAsync(b => b.UserId == john.Id)) return;

        context.Bookings.AddRange(
            new Booking
            {
                Id = Guid.NewGuid(), BookingRef = "TP-FL-2026001", UserId = john.Id,
                BookingType = BookingType.Flight, ReferenceId = flight.Id, Passengers = 2,
                TotalAmount = flight.EconomyPrice * 2, DiscountAmount = 0,
                FinalAmount = flight.EconomyPrice * 2, Status = BookingStatus.Confirmed
            },
            new Booking
            {
                Id = Guid.NewGuid(), BookingRef = "TP-HT-2026001", UserId = john.Id,
                BookingType = BookingType.Hotel, ReferenceId = hotel.Id,
                CheckIn = DateTime.UtcNow.Date.AddDays(7), CheckOut = DateTime.UtcNow.Date.AddDays(10),
                TotalAmount = room.PricePerNight * 3, DiscountAmount = 500,
                FinalAmount = room.PricePerNight * 3 - 500, CouponCode = "HOTEL500",
                Status = BookingStatus.Confirmed
            },
            new Booking
            {
                Id = Guid.NewGuid(), BookingRef = "TP-FL-2026002", UserId = john.Id,
                BookingType = BookingType.Flight, ReferenceId = cancelledFlight.Id, Passengers = 1,
                TotalAmount = cancelledFlight.EconomyPrice, DiscountAmount = 0,
                FinalAmount = cancelledFlight.EconomyPrice, Status = BookingStatus.Cancelled,
                CancelledAt = DateTime.UtcNow.AddDays(-3), RefundAmount = cancelledFlight.EconomyPrice * 0.9m
            }
        );
    }
}
