using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Infrastructure.Services;

public class InvoiceDocumentService : IInvoiceDocumentService
{
    private const string BrandOrange  = "#FF6B2B";
    private const string DarkNavy     = "#1C2B4A";
    private const string LightGrey    = "#F7F7F7";
    private const string TableBlue    = "#EBF5FB";
    private const string BorderGrey   = "#DCDCDC";
    private const string TextDark     = "#1A1A1A";
    private const string TextMuted    = "#777777";
    private const string RedCharge    = "#C0392B";

    public byte[] GenerateBookingTicketPdf(BookingDto booking)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var pnr      = DerivePnr(booking.BookingReference);
        var eTicket  = DeriveETicket(booking.BookingReference);
        var origin   = booking.Origin      ?? "---";
        var dest     = booking.Destination ?? "---";
        var route    = $"{origin}-{dest}";

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(0);
                page.DefaultTextStyle(t => t.FontFamily(Fonts.Arial).FontSize(9).FontColor(TextDark));

                page.Content().Column(col =>
                {
                    // ── HEADER ──────────────────────────────────────────────
                    col.Item().Background(BrandOrange).Padding(16).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("TravelPort").FontColor("#FFFFFF").FontSize(22).Bold();
                            c.Item().Text("Your trusted travel partner").FontColor("#FFD0B0").FontSize(8);
                        });

                        row.ConstantItem(120).AlignMiddle().AlignRight().Column(c =>
                        {
                            c.Item().Border(2).BorderColor("#FFFFFF").Padding(6).AlignCenter()
                                .Text("✓  CONFIRMED").FontColor("#FFFFFF").FontSize(11).Bold();
                        });
                    });

                    // ── BOOKING REFERENCE BAR ───────────────────────────────
                    col.Item().Background(DarkNavy).PaddingHorizontal(20).PaddingVertical(10).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("BOOKING REFERENCE").FontColor("#8FA8C8").FontSize(7).Bold();
                            c.Item().Text(booking.BookingReference).FontColor("#FFFFFF").FontSize(14).Bold();
                        });
                        row.ConstantItem(180).AlignRight().Column(c =>
                        {
                            c.Item().AlignRight().Text("ISSUED ON").FontColor("#8FA8C8").FontSize(7).Bold();
                            c.Item().AlignRight()
                                .Text(booking.BookingDate.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture))
                                .FontColor("#FFFFFF").FontSize(9);
                        });
                    });

                    // ── BODY ────────────────────────────────────────────────
                    col.Item().PaddingHorizontal(20).PaddingTop(16).PaddingBottom(20).Column(body =>
                    {
                        // Flight section label
                        body.Item().Background(LightGrey).Border(1).BorderColor(BorderGrey)
                            .PaddingHorizontal(12).PaddingVertical(8).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("FLIGHT DETAILS").FontSize(7).FontColor(TextMuted).Bold();
                                c.Item().Text(booking.DepartureTime?.ToString("ddd, dd MMM yyyy", CultureInfo.InvariantCulture) ?? "-")
                                    .FontSize(11).Bold();
                            });
                            row.RelativeItem().AlignCenter().Column(c =>
                            {
                                c.Item().AlignCenter()
                                    .Text($"{booking.OriginCity ?? origin}  →  {booking.DestinationCity ?? dest}")
                                    .FontSize(11).Bold();
                            });
                            row.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().AlignRight().Text("DURATION").FontSize(7).FontColor(TextMuted).Bold();
                                c.Item().AlignRight().Text(FormatDuration(booking.DurationMinutes)).FontSize(11).Bold();
                            });
                        });

                        // Flight card
                        body.Item().Border(1).BorderColor(BorderGrey).Column(fc =>
                        {
                            // Airline row
                            fc.Item().BorderBottom(1).BorderColor(BorderGrey)
                                .PaddingHorizontal(12).PaddingVertical(8).Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text(booking.Airline ?? "TravelPort Airways").FontSize(11).Bold();
                                    c.Item().Text($"Flight {booking.FlightNumber ?? "-"}  ·  Economy  ·  Non-stop")
                                        .FontSize(8).FontColor(TextMuted);
                                });
                                row.ConstantItem(90).AlignMiddle().Column(c =>
                                {
                                    c.Item().Background("#FFF3E0").Padding(5).AlignCenter()
                                        .Text("NON-STOP").FontSize(8).Bold().FontColor(BrandOrange);
                                });
                            });

                            // IATA codes + times
                            fc.Item().PaddingHorizontal(12).PaddingVertical(16).Row(row =>
                            {
                                row.RelativeItem().Column(c =>
                                {
                                    c.Item().Text(booking.DepartureTime?.ToString("HH:mm") ?? "--:--")
                                        .FontSize(24).Bold();
                                    c.Item().Text(origin).FontSize(20).Bold().FontColor(BrandOrange);
                                    c.Item().Text(booking.OriginCity ?? "-").FontSize(8).FontColor(TextMuted);
                                    c.Item().PaddingTop(2).Text("Terminal 2").FontSize(8).FontColor(TextMuted);
                                });

                                row.ConstantItem(90).AlignCenter().Column(c =>
                                {
                                    c.Item().AlignCenter().PaddingTop(10).Text("— — — →")
                                        .FontSize(11).FontColor(TextMuted);
                                    c.Item().AlignCenter().PaddingTop(4)
                                        .Text(FormatDuration(booking.DurationMinutes))
                                        .FontSize(8).FontColor(TextMuted);
                                });

                                row.RelativeItem().AlignRight().Column(c =>
                                {
                                    c.Item().AlignRight().Text(booking.ArrivalTime?.ToString("HH:mm") ?? "--:--")
                                        .FontSize(24).Bold();
                                    c.Item().AlignRight().Text(dest).FontSize(20).Bold().FontColor(BrandOrange);
                                    c.Item().AlignRight().Text(booking.DestinationCity ?? "-").FontSize(8).FontColor(TextMuted);
                                    c.Item().AlignRight().PaddingTop(2).Text("Terminal 1").FontSize(8).FontColor(TextMuted);
                                });
                            });
                        });

                        body.Item().Height(14);

                        // ── PASSENGER TABLE ──────────────────────────────────
                        body.Item().Column(pt =>
                        {
                            pt.Item().Background(DarkNavy).PaddingHorizontal(12).PaddingVertical(7)
                                .Text("PASSENGER DETAILS").FontColor("#FFFFFF").FontSize(9).Bold();

                            pt.Item().Border(1).BorderColor(BorderGrey).Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(3);
                                    c.RelativeColumn(2);
                                    c.RelativeColumn(3);
                                    c.RelativeColumn(2);
                                });

                                table.Header(h =>
                                {
                                    h.Cell().Background(TableBlue).Padding(6)
                                        .Text("PASSENGER NAME").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6)
                                        .Text("PNR").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6)
                                        .Text("E-TICKET NO.").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6)
                                        .Text("SEAT").FontSize(8).Bold().FontColor(DarkNavy);
                                });

                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7)
                                    .Text(booking.UserName ?? "Traveller").FontSize(9).Bold();
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7)
                                    .Text(pnr).FontSize(9);
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7)
                                    .Text(eTicket).FontSize(9);
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7)
                                    .Text("Web Check-in").FontSize(9).FontColor(TextMuted);
                            });
                        });

                        body.Item().Height(14);

                        // ── BAGGAGE TABLE ────────────────────────────────────
                        body.Item().Column(bt =>
                        {
                            bt.Item().Background(DarkNavy).PaddingHorizontal(12).PaddingVertical(7)
                                .Text("BAGGAGE INFORMATION").FontColor("#FFFFFF").FontSize(9).Bold();

                            bt.Item().Border(1).BorderColor(BorderGrey).Table(table =>
                            {
                                table.ColumnsDefinition(c =>
                                {
                                    c.RelativeColumn(2);
                                    c.RelativeColumn(3);
                                    c.RelativeColumn(2);
                                    c.RelativeColumn(2);
                                });

                                table.Header(h =>
                                {
                                    h.Cell().Background(TableBlue).Padding(6).Text("TYPE").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6).Text("SECTOR").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6).Text("CABIN").FontSize(8).Bold().FontColor(DarkNavy);
                                    h.Cell().Background(TableBlue).Padding(6).Text("CHECK-IN").FontSize(8).Bold().FontColor(DarkNavy);
                                });

                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7).Text("Adult").FontSize(9);
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7).Text(route).FontSize(9);
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7).Text("7 Kg").FontSize(9);
                                table.Cell().BorderTop(1).BorderColor(BorderGrey).Padding(7).Text("15 Kg").FontSize(9);
                            });
                        });

                        body.Item().Height(14);

                        // ── CANCELLATION & DATE CHANGE ───────────────────────
                        body.Item().Column(cc =>
                        {
                            cc.Item().Background(DarkNavy).PaddingHorizontal(12).PaddingVertical(7)
                                .Text("CANCELLATION & DATE CHANGE CHARGES").FontColor("#FFFFFF").FontSize(9).Bold();

                            cc.Item().Border(1).BorderColor(BorderGrey).Row(trow =>
                            {
                                // Cancellation
                                trow.RelativeItem().Column(left =>
                                {
                                    left.Item().Background(TableBlue).PaddingHorizontal(8).PaddingVertical(5)
                                        .Text("Cancellation Charges (Per Pax)").FontSize(8).Bold().FontColor(DarkNavy);
                                    ChargesRow(left, "0 – 1 Days before departure", "Airline Fee + ₹300", false);
                                    ChargesRow(left, "1 – 3 Days before departure", "Airline Fee + ₹250", true);
                                    ChargesRow(left, "More than 3 Days",            "Airline Fee + ₹200", false);
                                });

                                trow.ConstantItem(1).Background(BorderGrey);

                                // Date change
                                trow.RelativeItem().Column(right =>
                                {
                                    right.Item().Background(TableBlue).PaddingHorizontal(8).PaddingVertical(5)
                                        .Text("Date Change Charges (Per Pax)").FontSize(8).Bold().FontColor(DarkNavy);
                                    ChargesRow(right, "0 – 1 Days before departure", "Airline Fee + ₹250", false);
                                    ChargesRow(right, "1 – 3 Days before departure", "Airline Fee + ₹200", true);
                                    ChargesRow(right, "More than 3 Days",            "Airline Fee + ₹150", false);
                                });
                            });
                        });

                        body.Item().Height(14);

                        // ── FARE SUMMARY ─────────────────────────────────────
                        body.Item().Column(fs =>
                        {
                            fs.Item().Background(DarkNavy).PaddingHorizontal(12).PaddingVertical(7)
                                .Text("FARE SUMMARY").FontColor("#FFFFFF").FontSize(9).Bold();

                            fs.Item().Border(1).BorderColor(BorderGrey).Column(fc =>
                            {
                                FareRow(fc, "Base Fare",    $"₹{booking.TotalAmount:0}", false);
                                if (booking.DiscountAmount > 0)
                                    FareRow(fc, $"Coupon Discount ({booking.CouponCode})", $"-₹{booking.DiscountAmount:0}", false);
                                FareRow(fc, "Taxes & Fees", "Included",                   false);
                                FareRow(fc, "TOTAL AMOUNT PAID", $"₹{booking.FinalAmount:0}", true);
                            });
                        });

                        body.Item().Height(14);

                        // ── CUSTOMER SUPPORT ─────────────────────────────────
                        body.Item().Background(LightGrey).Border(1).BorderColor(BorderGrey)
                            .PaddingHorizontal(14).PaddingVertical(12).Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("24×7 Customer Support").FontSize(10).Bold().FontColor(DarkNavy);
                                c.Item().PaddingTop(4).Text("Email: support@travelport.com").FontSize(8).FontColor(TextMuted);
                                c.Item().Text("Phone: 1800-123-4567  (Toll Free)").FontSize(8).FontColor(TextMuted);
                            });
                            row.ConstantItem(200).AlignRight().Column(c =>
                            {
                                c.Item().AlignRight().Text("This is an e-ticket. No physical ticket required.").FontSize(7).FontColor(TextMuted);
                                c.Item().AlignRight().PaddingTop(2).Text("Present this document at the check-in counter.").FontSize(7).FontColor(TextMuted);
                                c.Item().AlignRight().PaddingTop(2).Text("Valid for the mentioned flight only.").FontSize(7).FontColor(TextMuted);
                            });
                        });

                        // Footer
                        body.Item().PaddingTop(10).AlignCenter()
                            .Text("TravelPort — Book smart, travel happy")
                            .FontSize(8).FontColor(TextMuted).Italic();
                    });
                });
            });
        }).GeneratePdf();
    }

    private static void ChargesRow(ColumnDescriptor col, string period, string amount, bool shaded)
    {
        col.Item().Background(shaded ? "#FAFAFA" : "#FFFFFF")
            .PaddingHorizontal(8).PaddingVertical(5).Row(row =>
        {
            row.RelativeItem().Text(period).FontSize(8).FontColor(TextDark);
            row.ConstantItem(130).AlignRight().Text(amount).FontSize(8).FontColor(RedCharge);
        });
    }

    private static void FareRow(ColumnDescriptor col, string label, string value, bool isTotal)
    {
        var bg = isTotal ? TableBlue : "#FFFFFF";
        col.Item().Background(bg)
            .BorderTop(isTotal ? 2 : 1).BorderColor(isTotal ? DarkNavy : BorderGrey)
            .PaddingHorizontal(12).PaddingVertical(6).Row(row =>
        {
            if (isTotal)
            {
                row.RelativeItem().Text(label).FontSize(10).Bold().FontColor(DarkNavy);
                row.ConstantItem(110).AlignRight().Text(value).FontSize(10).Bold().FontColor(DarkNavy);
            }
            else
            {
                row.RelativeItem().Text(label).FontSize(9).FontColor(TextDark);
                row.ConstantItem(110).AlignRight().Text(value).FontSize(9).FontColor(TextDark);
            }
        });
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
