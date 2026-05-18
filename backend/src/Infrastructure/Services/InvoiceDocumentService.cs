using System.Globalization;
using PdfSharpCore.Drawing;
using PdfSharpCore.Drawing.Layout;
using PdfSharpCore.Pdf;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Infrastructure.Services;

public class InvoiceDocumentService : IInvoiceDocumentService
{
    private static readonly XColor BrandOrange = XColor.FromArgb(255, 107, 43);
    private static readonly XColor DarkNavy = XColor.FromArgb(28, 43, 74);
    private static readonly XColor LightGrey = XColor.FromArgb(247, 247, 247);
    private static readonly XColor TableBlue = XColor.FromArgb(235, 245, 251);
    private static readonly XColor BorderGrey = XColor.FromArgb(220, 220, 220);
    private static readonly XColor TextDark = XColor.FromArgb(26, 26, 26);
    private static readonly XColor TextMuted = XColor.FromArgb(119, 119, 119);
    private static readonly XColor RedCharge = XColor.FromArgb(192, 57, 43);
    private static readonly XColor White = XColor.FromArgb(255, 255, 255);

    private const double PageWidth = 595;
    private const double PageHeight = 842;
    private const double MarginX = 20;
    private const double ContentWidth = PageWidth - (MarginX * 2);

    private static readonly XFont TitleFont = Font(20, true);
    private static readonly XFont SmallTitleFont = Font(16, true);
    private static readonly XFont HeaderValueFont = Font(14, true);
    private static readonly XFont LargeValueFont = Font(20, true);
    private static readonly XFont SectionTitleFont = Font(9, true);
    private static readonly XFont BodyFont = Font(9, false);
    private static readonly XFont BodyBoldFont = Font(9, true);
    private static readonly XFont SmallFont = Font(8, false);
    private static readonly XFont SmallBoldFont = Font(8, true);
    private static readonly XFont TinyFont = Font(7, false);
    private static readonly XFont TinyBoldFont = Font(7, true);

    public byte[] GenerateBookingTicketPdf(BookingDto booking)
    {
        var document = CreateDocument();
        var page = document.AddPage();
        page.Width = PageWidth;
        page.Height = PageHeight;

        var gfx = XGraphics.FromPdfPage(page);
        var ci = CultureInfo.InvariantCulture;

        var pnr = DerivePnr(booking.BookingReference);
        var eTicket = DeriveETicket(booking.BookingReference);
        var origin = booking.Origin ?? "---";
        var destination = booking.Destination ?? "---";
        var originCity = booking.OriginCity ?? origin;
        var destinationCity = booking.DestinationCity ?? destination;
        var route = $"{origin}-{destination}";
        var baseFare = Math.Round(booking.TotalAmount * 0.61m, 0, MidpointRounding.AwayFromZero);
        var taxes = Math.Max(0, booking.TotalAmount - baseFare);

        var y = 0d;
        DrawTopHeader(gfx, ref y, "TravelPort", "Your trusted travel partner");
        DrawReferenceBar(gfx, ref y, booking.BookingReference, "ISSUED ON", booking.BookingDate.ToString("dd MMM yyyy, HH:mm", ci));
        y += 16;

        DrawFlightSummaryHeader(gfx, ref y, booking.DepartureTime?.ToString("ddd, dd MMM yyyy", ci) ?? "-", $"{originCity} - {destinationCity}", FormatDuration(booking.DurationMinutes));
        DrawFlightRouteCard(gfx, ref y, booking, origin, destination, originCity, destinationCity);
        y += 10;

        DrawSectionTable(
            gfx,
            ref y,
            "PASSENGER DETAILS",
            [145, 95, 140, 155],
            ["PASSENGER NAME", "PNR", "E-TICKET NO.", "SEAT"],
            [[booking.UserName ?? "Traveller", pnr, eTicket, "Web Check-in"]]
        );
        y += 10;

        DrawSectionTable(
            gfx,
            ref y,
            "BAGGAGE INFORMATION",
            [110, 170, 110, 165],
            ["TYPE", "SECTOR", "CABIN", "CHECK-IN"],
            [["Adult", route, "7 Kg", "15 Kg"]]
        );
        y += 10;

        DrawChargeSection(gfx, ref y);
        y += 10;

        DrawSummarySection(
            gfx,
            ref y,
            "FARE SUMMARY",
            [
                ("Base Fare", FormatCurrency(baseFare)),
                ("Taxes & Fees", FormatCurrency(taxes)),
                ("TOTAL AMOUNT PAID", FormatCurrency(booking.FinalAmount))
            ],
            booking.DiscountAmount > 0
                ? ("Coupon Discount" + (string.IsNullOrWhiteSpace(booking.CouponCode) ? string.Empty : $" ({booking.CouponCode})"), $"-{FormatCurrency(booking.DiscountAmount)}")
                : null
        );
        y += 10;

        DrawSupportFooter(
            gfx,
            ref y,
            [
                "This is an e-ticket. No physical ticket required.",
                "Present this document at the check-in counter.",
                "Valid for the mentioned flight only."
            ]
        );

        return Save(document);
    }

    public byte[] GenerateHotelInvoicePdf(BookingDto booking)
    {
        var document = CreateDocument();
        var page = document.AddPage();
        page.Width = PageWidth;
        page.Height = PageHeight;

        var gfx = XGraphics.FromPdfPage(page);
        var ci = CultureInfo.InvariantCulture;

        var hotelName = booking.HotelName ?? "Hotel";
        var checkIn = DateTime.TryParse(booking.CheckIn, out var cin) ? cin : (DateTime?)null;
        var checkOut = DateTime.TryParse(booking.CheckOut, out var cout) ? cout : (DateTime?)null;
        var nights = booking.NightsCount ?? 1;
        var guests = booking.Passengers ?? 1;
        var taxes = Math.Round(booking.TotalAmount * 0.12m, 0, MidpointRounding.AwayFromZero);

        var y = 0d;
        DrawTopHeader(gfx, ref y, "TravelPort", "Hotel booking confirmation");
        DrawReferenceBar(gfx, ref y, booking.BookingReference, "BOOKED ON", booking.BookingDate.ToString("dd MMM yyyy, HH:mm", ci));
        y += 16;

        DrawPropertyCard(gfx, ref y, hotelName, booking.HotelAddress, booking.HotelCity, booking.HotelStars);
        y += 10;

        DrawStayCard(gfx, ref y, checkIn?.ToString("ddd, dd MMM yyyy", ci) ?? booking.CheckIn ?? "-", checkOut?.ToString("ddd, dd MMM yyyy", ci) ?? booking.CheckOut ?? "-", nights, guests, booking.RoomType ?? "Standard Room");
        y += 10;

        DrawSectionTable(
            gfx,
            ref y,
            "GUEST DETAILS",
            [160, 235, 160],
            ["GUEST NAME", "EMAIL", "PHONE"],
            [[booking.UserName ?? "Guest", booking.UserEmail ?? "-", booking.UserPhone ?? "-"]]
        );
        y += 10;

        DrawSummarySection(
            gfx,
            ref y,
            "PRICE SUMMARY",
            [
                ($"Room Rate x {nights} night{(nights == 1 ? string.Empty : "s")}", FormatCurrency(booking.TotalAmount)),
                ("Taxes & Fees (12% GST)", FormatCurrency(taxes)),
                ("TOTAL AMOUNT PAID", FormatCurrency(booking.FinalAmount))
            ],
            booking.DiscountAmount > 0
                ? ("Coupon Discount" + (string.IsNullOrWhiteSpace(booking.CouponCode) ? string.Empty : $" ({booking.CouponCode})"), $"-{FormatCurrency(booking.DiscountAmount)}")
                : null
        );
        y += 10;

        DrawPolicySection(gfx, ref y);
        y += 10;

        DrawSupportFooter(
            gfx,
            ref y,
            [
                "Present this document at hotel check-in.",
                "Valid for the mentioned dates only.",
                "No physical voucher required."
            ]
        );

        return Save(document);
    }

    public byte[] GenerateTransportTicketPdf(BookingDto booking)
    {
        var document = CreateDocument();
        var page = document.AddPage();
        page.Width = PageWidth;
        page.Height = PageHeight;

        var gfx = XGraphics.FromPdfPage(page);
        var ci = CultureInfo.InvariantCulture;

        var transportType = booking.Type; // "Bus" | "Train" | "Cab"
        var operator_     = booking.TransportOperator ?? "—";
        var vehicleType   = booking.TransportVehicleType ?? "—";
        var origin        = booking.Origin ?? "—";
        var destination   = booking.Destination ?? "—";
        var dep           = booking.DepartureTime?.ToString("dd MMM yyyy, hh:mm tt", ci) ?? "—";
        var arr           = booking.ArrivalTime?.ToString("dd MMM yyyy, hh:mm tt", ci) ?? "—";
        var dur           = FormatDuration(booking.DurationMinutes);
        var passengers    = booking.Passengers ?? 1;

        var y = 0d;
        DrawTopHeader(gfx, ref y, "TravelPort", $"{transportType} Booking Confirmation");
        DrawReferenceBar(gfx, ref y, booking.BookingReference, "BOOKED ON", booking.BookingDate.ToString("dd MMM yyyy, HH:mm", ci));
        y += 16;

        DrawSectionTable(
            gfx, ref y, "JOURNEY DETAILS",
            [160, 395],
            ["FIELD", "DETAILS"],
            [
                ["From", origin],
                ["To", destination],
                ["Departure", dep],
                ["Arrival / Est. Drop-off", arr],
                ["Duration", dur],
                ["Operator / Service", operator_],
                ["Vehicle / Class", vehicleType],
                ["Passengers", passengers.ToString()],
            ]
        );
        y += 10;

        DrawSectionTable(
            gfx, ref y, "PASSENGER DETAILS",
            [200, 195, 160],
            ["NAME", "EMAIL", "PHONE"],
            [[booking.UserName ?? "Passenger", booking.UserEmail ?? "—", booking.UserPhone ?? "—"]]
        );
        y += 10;

        var baseFare = Math.Round(booking.TotalAmount * 0.9m, 0, MidpointRounding.AwayFromZero);
        var taxes    = booking.TotalAmount - baseFare;
        DrawSummarySection(
            gfx, ref y, "FARE SUMMARY",
            [
                ("Base Fare", FormatCurrency(baseFare)),
                ("Taxes & Charges", FormatCurrency(taxes)),
                ("TOTAL AMOUNT PAID", FormatCurrency(booking.FinalAmount))
            ],
            booking.DiscountAmount > 0
                ? ("Coupon Discount" + (string.IsNullOrWhiteSpace(booking.CouponCode) ? string.Empty : $" ({booking.CouponCode})"), $"-{FormatCurrency(booking.DiscountAmount)}")
                : null
        );
        y += 10;

        DrawSupportFooter(
            gfx, ref y,
            [
                "This is an e-ticket. No physical ticket required.",
                "Present this document at boarding if required.",
                "Valid for the mentioned journey only."
            ]
        );

        return Save(document);
    }

    private static PdfDocument CreateDocument()
    {
        return new PdfDocument();
    }

    private static byte[] Save(PdfDocument document)
    {
        using var stream = new MemoryStream();
        document.Save(stream, false);
        return stream.ToArray();
    }

    private static XFont Font(double size, bool bold)
    {
        return new XFont("Arial", size, bold ? XFontStyle.Bold : XFontStyle.Regular);
    }

    private static void DrawTopHeader(XGraphics gfx, ref double y, string title, string subtitle)
    {
        DrawFilled(gfx, 0, y, PageWidth, 58, BrandOrange);
        DrawText(gfx, title, TitleFont, White, new XRect(MarginX, y + 12, 220, 24), XStringFormats.TopLeft);
        DrawText(gfx, subtitle, SmallFont, XColor.FromArgb(255, 208, 176), new XRect(MarginX, y + 36, 220, 12), XStringFormats.TopLeft);
        DrawFilled(gfx, PageWidth - 110, y + 14, 74, 24, White);
        DrawText(gfx, "CONFIRMED", SmallBoldFont, BrandOrange, new XRect(PageWidth - 110, y + 14, 74, 24), XStringFormats.Center);
        y += 58;
    }

    private static void DrawReferenceBar(XGraphics gfx, ref double y, string bookingReference, string rightLabel, string rightValue)
    {
        DrawFilled(gfx, 0, y, PageWidth, 40, DarkNavy);
        DrawText(gfx, "BOOKING REFERENCE", TinyBoldFont, XColor.FromArgb(143, 168, 200), new XRect(MarginX, y + 8, 180, 10), XStringFormats.TopLeft);
        DrawText(gfx, bookingReference, HeaderValueFont, White, new XRect(MarginX, y + 18, 180, 16), XStringFormats.TopLeft);
        DrawText(gfx, rightLabel, TinyBoldFont, XColor.FromArgb(143, 168, 200), new XRect(PageWidth - 240, y + 8, 220, 10), XStringFormats.TopRight);
        DrawText(gfx, rightValue, BodyFont, White, new XRect(PageWidth - 240, y + 18, 220, 14), XStringFormats.TopRight);
        y += 40;
    }

    private static void DrawFlightSummaryHeader(XGraphics gfx, ref double y, string date, string route, string duration)
    {
        DrawBox(gfx, MarginX, y, ContentWidth, 36, LightGrey);
        DrawText(gfx, "FLIGHT DETAILS", TinyBoldFont, TextMuted, new XRect(MarginX + 8, y + 6, 120, 10), XStringFormats.TopLeft);
        DrawText(gfx, date, BodyBoldFont, TextDark, new XRect(MarginX + 8, y + 17, 160, 12), XStringFormats.TopLeft);
        DrawText(gfx, route, BodyBoldFont, TextDark, new XRect(MarginX + 170, y + 11, 220, 12), XStringFormats.TopCenter);
        DrawText(gfx, "DURATION", TinyBoldFont, TextMuted, new XRect(MarginX + ContentWidth - 90, y + 6, 82, 10), XStringFormats.TopRight);
        DrawText(gfx, duration, BodyBoldFont, TextDark, new XRect(MarginX + ContentWidth - 90, y + 17, 82, 12), XStringFormats.TopRight);
        y += 36;
    }

    private static void DrawFlightRouteCard(XGraphics gfx, ref double y, BookingDto booking, string origin, string destination, string originCity, string destinationCity)
    {
        DrawBox(gfx, MarginX, y, ContentWidth, 110, White);

        DrawLine(gfx, BorderGrey, 1, MarginX, y + 30, MarginX + ContentWidth, y + 30);
        DrawText(gfx, booking.Airline ?? "TravelPort Airways", BodyBoldFont, TextDark, new XRect(MarginX + 8, y + 8, 200, 12), XStringFormats.TopLeft);
        DrawText(gfx, $"Flight {booking.FlightNumber ?? "-"} | Economy | Non-stop", SmallFont, TextMuted, new XRect(MarginX + 8, y + 18, 220, 10), XStringFormats.TopLeft);

        DrawFilled(gfx, MarginX + ContentWidth - 82, y + 8, 74, 18, XColor.FromArgb(255, 243, 224));
        DrawText(gfx, "NON-STOP", TinyBoldFont, BrandOrange, new XRect(MarginX + ContentWidth - 82, y + 8, 74, 18), XStringFormats.Center);

        var blockY = y + 44;
        DrawText(gfx, booking.DepartureTime?.ToString("HH:mm") ?? "--:--", LargeValueFont, TextDark, new XRect(MarginX + 10, blockY, 100, 24), XStringFormats.TopLeft);
        DrawText(gfx, origin, HeaderValueFont, BrandOrange, new XRect(MarginX + 10, blockY + 30, 80, 16), XStringFormats.TopLeft);
        DrawText(gfx, originCity, SmallFont, TextMuted, new XRect(MarginX + 10, blockY + 46, 90, 10), XStringFormats.TopLeft);
        DrawText(gfx, "Terminal 2", TinyFont, TextMuted, new XRect(MarginX + 10, blockY + 58, 90, 10), XStringFormats.TopLeft);

        var centerX = MarginX + (ContentWidth / 2);
        DrawLine(gfx, TextMuted, 1, centerX - 40, blockY + 15, centerX + 40, blockY + 15);
        DrawText(gfx, FormatDuration(booking.DurationMinutes), SmallFont, TextMuted, new XRect(centerX - 40, blockY + 22, 80, 12), XStringFormats.TopCenter);

        DrawText(gfx, booking.ArrivalTime?.ToString("HH:mm") ?? "--:--", LargeValueFont, TextDark, new XRect(MarginX + ContentWidth - 110, blockY, 100, 24), XStringFormats.TopRight);
        DrawText(gfx, destination, HeaderValueFont, BrandOrange, new XRect(MarginX + ContentWidth - 110, blockY + 30, 100, 16), XStringFormats.TopRight);
        DrawText(gfx, destinationCity, SmallFont, TextMuted, new XRect(MarginX + ContentWidth - 110, blockY + 46, 100, 10), XStringFormats.TopRight);
        DrawText(gfx, "Terminal 1", TinyFont, TextMuted, new XRect(MarginX + ContentWidth - 110, blockY + 58, 100, 10), XStringFormats.TopRight);

        y += 110;
    }

    private static void DrawSectionTable(XGraphics gfx, ref double y, string title, double[] widths, string[] headers, string[][] rows)
    {
        DrawFilled(gfx, MarginX, y, ContentWidth, 20, DarkNavy);
        DrawText(gfx, title, SectionTitleFont, White, new XRect(MarginX + 10, y + 5, 200, 10), XStringFormats.TopLeft);
        y += 20;

        var totalWidth = widths.Sum();
        DrawBox(gfx, MarginX, y, totalWidth, 20, TableBlue);

        var x = MarginX;
        for (var i = 0; i < headers.Length; i++)
        {
            DrawText(gfx, headers[i], TinyBoldFont, DarkNavy, new XRect(x + 5, y + 6, widths[i] - 10, 10), XStringFormats.TopLeft);
            x += widths[i];
        }

        y += 20;

        foreach (var row in rows)
        {
            DrawBox(gfx, MarginX, y, totalWidth, 24, White);
            x = MarginX;
            for (var i = 0; i < row.Length; i++)
            {
                DrawText(gfx, row[i], i == 0 ? BodyBoldFont : BodyFont, i == row.Length - 1 ? TextMuted : TextDark, new XRect(x + 5, y + 7, widths[i] - 10, 12), XStringFormats.TopLeft);
                x += widths[i];
            }

            y += 24;
        }
    }

    private static void DrawChargeSection(XGraphics gfx, ref double y)
    {
        DrawFilled(gfx, MarginX, y, ContentWidth, 20, DarkNavy);
        DrawText(gfx, "CANCELLATION & DATE CHANGE CHARGES", SectionTitleFont, White, new XRect(MarginX + 10, y + 5, 280, 10), XStringFormats.TopLeft);
        y += 20;

        var boxWidth = (ContentWidth - 8) / 2;
        DrawChargeTable(gfx, MarginX, y, boxWidth, "Cancellation Charges (Per Pax)", [
            ("0-1 Days before dep.", "Airline Fee + INR 300"),
            ("1-3 Days before dep.", "Airline Fee + INR 250"),
            ("More than 3 Days", "Airline Fee + INR 200")
        ]);
        DrawChargeTable(gfx, MarginX + boxWidth + 8, y, boxWidth, "Date Change Charges (Per Pax)", [
            ("0-1 Days before dep.", "Airline Fee + INR 250"),
            ("1-3 Days before dep.", "Airline Fee + INR 200"),
            ("More than 3 Days", "Airline Fee + INR 150")
        ]);

        y += 84;
    }

    private static void DrawChargeTable(XGraphics gfx, double x, double y, double width, string header, (string Label, string Value)[] rows)
    {
        DrawBox(gfx, x, y, width, 20, TableBlue);
        DrawText(gfx, header, TinyBoldFont, DarkNavy, new XRect(x + 5, y + 6, width - 10, 10), XStringFormats.TopLeft);

        var rowY = y + 20;
        foreach (var row in rows)
        {
            DrawBox(gfx, x, rowY, width, 21, White);
            DrawText(gfx, row.Label, TinyFont, TextDark, new XRect(x + 5, rowY + 6, width * 0.52, 10), XStringFormats.TopLeft);
            DrawText(gfx, row.Value, TinyFont, RedCharge, new XRect(x + (width * 0.52), rowY + 6, width * 0.43, 10), XStringFormats.TopRight);
            rowY += 21;
        }
    }

    private static void DrawSummarySection(XGraphics gfx, ref double y, string title, List<(string Label, string Value)> rows, (string Label, string Value)? discount)
    {
        DrawFilled(gfx, MarginX, y, ContentWidth, 20, DarkNavy);
        DrawText(gfx, title, SectionTitleFont, White, new XRect(MarginX + 10, y + 5, 200, 10), XStringFormats.TopLeft);
        y += 20;

        var allRows = new List<(string Label, string Value)>();
        allRows.Add(rows[0]);
        if (discount.HasValue)
            allRows.Add(discount.Value);
        allRows.AddRange(rows.Skip(1));

        foreach (var row in allRows.Take(allRows.Count - 1))
        {
            DrawSummaryRow(gfx, MarginX, y, ContentWidth, row.Label, row.Value, false);
            y += 22;
        }

        var total = allRows[^1];
        DrawSummaryRow(gfx, MarginX, y, ContentWidth, total.Label, total.Value, true);
        y += 28;
    }

    private static void DrawSummaryRow(XGraphics gfx, double x, double y, double width, string label, string value, bool isTotal)
    {
        var bg = isTotal ? TableBlue : White;
        DrawFilled(gfx, x, y, width, isTotal ? 28 : 22, bg);
        DrawLine(gfx, isTotal ? DarkNavy : BorderGrey, isTotal ? 2 : 1, x, y, x + width, y);
        DrawText(gfx, label, isTotal ? BodyBoldFont : BodyFont, isTotal ? DarkNavy : TextDark, new XRect(x + 12, y + (isTotal ? 8 : 6), width - 164, 12), XStringFormats.TopLeft);
        DrawText(gfx, value, isTotal ? BodyBoldFont : BodyFont, isTotal ? DarkNavy : TextDark, new XRect(x + width - 152, y + (isTotal ? 8 : 6), 140, 12), XStringFormats.TopRight);
    }

    private static void DrawPropertyCard(XGraphics gfx, ref double y, string hotelName, string? address, string? city, decimal? stars)
    {
        DrawBox(gfx, MarginX, y, ContentWidth, 74, LightGrey);
        DrawText(gfx, "PROPERTY DETAILS", TinyBoldFont, TextMuted, new XRect(MarginX + 10, y + 8, 120, 10), XStringFormats.TopLeft);
        DrawText(gfx, hotelName, SmallTitleFont, DarkNavy, new XRect(MarginX + 10, y + 22, 260, 18), XStringFormats.TopLeft);
        if (stars.HasValue)
            DrawText(gfx, new string('*', (int)stars.Value), SmallBoldFont, BrandOrange, new XRect(MarginX + 10, y + 42, 80, 10), XStringFormats.TopLeft);
        DrawText(gfx, address ?? "-", SmallFont, TextMuted, new XRect(MarginX + 10, y + 54, 360, 10), XStringFormats.TopLeft);
        DrawText(gfx, city ?? "-", SmallFont, TextMuted, new XRect(MarginX + 380, y + 54, 160, 10), XStringFormats.TopRight);
        y += 74;
    }

    private static void DrawStayCard(XGraphics gfx, ref double y, string checkIn, string checkOut, int nights, int guests, string roomType)
    {
        DrawFilled(gfx, MarginX, y, ContentWidth, 20, DarkNavy);
        DrawText(gfx, "STAY DETAILS", SectionTitleFont, White, new XRect(MarginX + 10, y + 5, 200, 10), XStringFormats.TopLeft);
        y += 20;

        DrawBox(gfx, MarginX, y, ContentWidth, 68, White);
        DrawLine(gfx, BorderGrey, 1, MarginX + 190, y, MarginX + 190, y + 68);
        DrawLine(gfx, BorderGrey, 1, MarginX + 355, y, MarginX + 355, y + 68);

        DrawText(gfx, "CHECK-IN", TinyBoldFont, TextMuted, new XRect(MarginX + 12, y + 10, 80, 10), XStringFormats.TopLeft);
        DrawText(gfx, checkIn, BodyBoldFont, DarkNavy, new XRect(MarginX + 12, y + 26, 160, 12), XStringFormats.TopLeft);
        DrawText(gfx, "From 2:00 PM", SmallFont, TextMuted, new XRect(MarginX + 12, y + 42, 120, 10), XStringFormats.TopLeft);

        DrawText(gfx, $"{nights} Night{(nights == 1 ? string.Empty : "s")}", BodyBoldFont, BrandOrange, new XRect(MarginX + 190, y + 24, 165, 12), XStringFormats.TopCenter);
        DrawText(gfx, $"{guests} Guest{(guests == 1 ? string.Empty : "s")}", SmallFont, TextMuted, new XRect(MarginX + 190, y + 40, 165, 10), XStringFormats.TopCenter);

        DrawText(gfx, "CHECK-OUT", TinyBoldFont, TextMuted, new XRect(MarginX + 367, y + 10, 90, 10), XStringFormats.TopLeft);
        DrawText(gfx, checkOut, BodyBoldFont, DarkNavy, new XRect(MarginX + 367, y + 26, 160, 12), XStringFormats.TopLeft);
        DrawText(gfx, "Until 11:00 AM", SmallFont, TextMuted, new XRect(MarginX + 367, y + 42, 120, 10), XStringFormats.TopLeft);

        y += 68;

        DrawBox(gfx, MarginX, y, ContentWidth, 26, White);
        DrawText(gfx, "ROOM TYPE", TinyBoldFont, TextMuted, new XRect(MarginX + 12, y + 8, 90, 10), XStringFormats.TopLeft);
        DrawText(gfx, roomType, BodyBoldFont, TextDark, new XRect(MarginX + 90, y + 8, 180, 10), XStringFormats.TopLeft);
        DrawText(gfx, "GUESTS", TinyBoldFont, TextMuted, new XRect(MarginX + 360, y + 8, 70, 10), XStringFormats.TopLeft);
        DrawText(gfx, guests.ToString(), BodyBoldFont, TextDark, new XRect(MarginX + 430, y + 8, 100, 10), XStringFormats.TopLeft);

        y += 26;
    }

    private static void DrawPolicySection(XGraphics gfx, ref double y)
    {
        DrawFilled(gfx, MarginX, y, ContentWidth, 20, DarkNavy);
        DrawText(gfx, "HOTEL POLICIES", SectionTitleFont, White, new XRect(MarginX + 10, y + 5, 200, 10), XStringFormats.TopLeft);
        y += 20;

        var rows = new[]
        {
            ("Check-in Time", "From 2:00 PM"),
            ("Check-out Time", "Until 11:00 AM"),
            ("Cancellation", "Free cancellation up to 24 hours before check-in"),
            ("ID Proof", "Government-issued photo ID required at check-in"),
            ("Pet Policy", "Pets not allowed")
        };

        foreach (var row in rows)
        {
            DrawBox(gfx, MarginX, y, ContentWidth, 22, White);
            DrawText(gfx, row.Item1, SmallBoldFont, DarkNavy, new XRect(MarginX + 12, y + 6, 120, 10), XStringFormats.TopLeft);
            DrawText(gfx, row.Item2, SmallFont, TextDark, new XRect(MarginX + 132, y + 6, ContentWidth - 144, 10), XStringFormats.TopLeft);
            y += 22;
        }
    }

    private static void DrawSupportFooter(XGraphics gfx, ref double y, string[] notes)
    {
        DrawBox(gfx, MarginX, y, ContentWidth, 62, LightGrey);
        DrawText(gfx, "24x7 Customer Support", BodyBoldFont, DarkNavy, new XRect(MarginX + 10, y + 10, 180, 12), XStringFormats.TopLeft);
        DrawText(gfx, "Email: support@travelport.com", SmallFont, TextMuted, new XRect(MarginX + 10, y + 26, 200, 10), XStringFormats.TopLeft);
        DrawText(gfx, "Phone: 1800-123-4567  (Toll Free)", SmallFont, TextMuted, new XRect(MarginX + 10, y + 38, 220, 10), XStringFormats.TopLeft);

        var noteY = y + 12;
        foreach (var note in notes)
        {
            DrawText(gfx, note, TinyFont, TextMuted, new XRect(MarginX + 300, noteY, 235, 9), XStringFormats.TopRight);
            noteY += 10;
        }

        y += 62;
        DrawText(gfx, "TravelPort - Book smart, travel happy", SmallFont, TextMuted, new XRect(MarginX, y + 10, ContentWidth, 10), XStringFormats.TopCenter);
        y += 24;
    }

    private static void DrawFilled(XGraphics gfx, double x, double y, double width, double height, XColor color)
    {
        gfx.DrawRectangle(new XSolidBrush(color), x, y, width, height);
    }

    private static void DrawBox(XGraphics gfx, double x, double y, double width, double height, XColor fill)
    {
        gfx.DrawRectangle(new XSolidBrush(fill), x, y, width, height);
        gfx.DrawRectangle(new XPen(BorderGrey, 1), x, y, width, height);
    }

    private static void DrawLine(XGraphics gfx, XColor color, double width, double x1, double y1, double x2, double y2)
    {
        gfx.DrawLine(new XPen(color, width), x1, y1, x2, y2);
    }

    private static void DrawText(XGraphics gfx, string text, XFont font, XColor color, XRect rect, XStringFormat format)
    {
        gfx.DrawString(text, font, new XSolidBrush(color), rect, format);
    }

    private static string FormatCurrency(decimal amount)
    {
        return $"INR {amount:N0}";
    }

    private static string DerivePnr(string bookingRef)
    {
        var hash = (uint)bookingRef.GetHashCode();
        return (hash % 900000 + 100000).ToString();
    }

    private static string DeriveETicket(string bookingRef)
    {
        var hash = (ulong)(uint)bookingRef.GetHashCode();
        return $"098-{hash % 9000000000ul + 1000000000ul}";
    }

    private static string FormatDuration(int? minutes)
    {
        if (!minutes.HasValue) return "-";
        return $"{minutes.Value / 60}h {minutes.Value % 60}m";
    }
}
