using System.Globalization;
using System.Text;
using TravelPort.Application.Common.Interfaces;
using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Infrastructure.Services;

public class InvoiceDocumentService : IInvoiceDocumentService
{
    public byte[] GenerateBookingTicketPdf(BookingDto booking)
    {
        var contentBuilder = new StringBuilder();
        var lines = new[]
        {
            "TravelPort - Flight E-Ticket",
            $"Booking Reference: {booking.BookingReference}",
            $"Passenger(s): {booking.Passengers ?? 1}",
            $"Traveller: {booking.UserName ?? "Guest User"}",
            $"Email: {booking.UserEmail ?? "-"}",
            $"Phone: {booking.UserPhone ?? "-"}",
            $"Flight: {booking.Airline ?? "-"} {booking.FlightNumber ?? string.Empty}",
            $"Route: {booking.OriginCity ?? booking.Origin ?? "-"} ({booking.Origin ?? "-"}) -> {booking.DestinationCity ?? booking.Destination ?? "-"} ({booking.Destination ?? "-"})",
            $"Departure: {FormatDateTime(booking.DepartureTime)}",
            $"Arrival: {FormatDateTime(booking.ArrivalTime)}",
            $"Duration: {FormatDuration(booking.DurationMinutes)}",
            $"Status: {booking.Status}",
            $"Total Fare: INR {booking.FinalAmount:0}",
            $"Issued On: {booking.BookingDate:dd MMM yyyy hh:mm tt}",
            "Thank you for booking with TravelPort."
        };

        var y = 790;
        foreach (var line in lines)
        {
            contentBuilder.AppendLine($"BT /F1 12 Tf 50 {y} Td ({EscapePdfText(line)}) Tj ET");
            y -= 28;
        }

        var contentBytes = Encoding.ASCII.GetBytes(contentBuilder.ToString());
        return BuildPdf(contentBytes);
    }

    private static byte[] BuildPdf(byte[] contentStream)
    {
        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);

        var offsets = new List<long>();

        void WriteObject(int id, string body)
        {
            offsets.Add(stream.Position);
            writer.Write($"{id} 0 obj\n{body}\nendobj\n");
            writer.Flush();
        }

        writer.Write("%PDF-1.4\n");
        writer.Flush();

        WriteObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
        WriteObject(2, "<< /Type /Pages /Count 1 /Kids [3 0 R] >>");
        WriteObject(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
        WriteObject(4, $"<< /Length {contentStream.Length} >>\nstream\n{Encoding.ASCII.GetString(contentStream)}endstream");
        WriteObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        var xrefStart = stream.Position;
        writer.Write($"xref\n0 {offsets.Count + 1}\n");
        writer.Write("0000000000 65535 f \n");
        foreach (var offset in offsets)
            writer.Write($"{offset:D10} 00000 n \n");
        writer.Write($"trailer\n<< /Size {offsets.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefStart}\n%%EOF");
        writer.Flush();

        return stream.ToArray();
    }

    private static string EscapePdfText(string value) =>
        value.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

    private static string FormatDateTime(DateTime? value) =>
        value?.ToString("dd MMM yyyy hh:mm tt", CultureInfo.InvariantCulture) ?? "-";

    private static string FormatDuration(int? durationMinutes)
    {
        if (!durationMinutes.HasValue) return "-";
        var hours = durationMinutes.Value / 60;
        var minutes = durationMinutes.Value % 60;
        return $"{hours}h {minutes}m";
    }
}
