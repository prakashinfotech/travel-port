using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TravelPort.Application.Common.Interfaces;

namespace TravelPort.Infrastructure.ExternalProviders.Email;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public bool IsConfigured =>
        _settings.Enabled &&
        !string.IsNullOrWhiteSpace(_settings.SmtpHost) &&
        !string.IsNullOrWhiteSpace(_settings.FromEmail);

    public SmtpEmailService(IOptions<EmailSettings> settings, ILogger<SmtpEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    // ── Shared layout helpers (email-client safe — no gradients, no flex, no rgba) ──

    private static string EmailHead() => """
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>TravelPort</title>
        </head>
        """;

    private static string TopBar(string bgColor, string heading, string subheading) => $"""
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:{bgColor}">
          <tr>
            <td style="padding:28px 32px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
                      TravelPort
                    </span><br>
                    <span style="font-size:12px;color:#bfdbfe">
                      India's Smart Travel Booking Portal
                    </span>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-top:20px;padding-top:20px;border-top:1px solid #3b82f6">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:#ffffff">{heading}</span><br>
                    <span style="font-size:14px;color:#dbeafe">{subheading}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        """;

    private static string RefBadge(string bookingRef) => $"""
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;margin:24px 0">
          <tr>
            <td style="padding:14px 20px">
              <span style="font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
                Booking Reference
              </span>
            </td>
            <td style="padding:14px 20px;text-align:right">
              <span style="font-size:18px;font-weight:800;color:#c2410c;letter-spacing:2px">
                {WebUtility.HtmlEncode(bookingRef)}
              </span>
            </td>
          </tr>
        </table>
        """;

    private static string SectionTitle(string title) => $"""
        <p style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;
                  letter-spacing:0.8px;margin:24px 0 10px 0">
          {title}
        </p>
        """;

    private static string InfoRow(string label, string value, bool shaded = false) => $"""
        <tr style="background-color:{(shaded ? "#f9fafb" : "#ffffff")}">
          <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:500;width:45%">
            {WebUtility.HtmlEncode(label)}
          </td>
          <td style="padding:10px 14px;font-size:13px;color:#111827;font-weight:600">
            {WebUtility.HtmlEncode(value)}
          </td>
        </tr>
        """;

    private static string PriceRow(string label, string value, bool shaded = false, bool highlight = false) => $"""
        <tr style="background-color:{(shaded ? "#f9fafb" : "#ffffff")}">
          <td style="padding:10px 14px;font-size:13px;
                     color:{(highlight ? "#111827" : "#6b7280")};
                     font-weight:{(highlight ? "700" : "500")}">
            {WebUtility.HtmlEncode(label)}
          </td>
          <td style="padding:10px 14px;font-size:13px;text-align:right;
                     color:{(highlight ? "#111827" : "#374151")};
                     font-weight:{(highlight ? "700" : "600")}">
            {WebUtility.HtmlEncode(value)}
          </td>
        </tr>
        """;

    private static string CtaButton(string href, string label, string bgColor = "#2563eb") => $"""
        <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto">
          <tr>
            <td style="background-color:{bgColor};border-radius:8px;padding:0">
              <a href="{WebUtility.HtmlEncode(href)}"
                 style="display:block;padding:14px 40px;font-size:15px;font-weight:700;
                        color:#ffffff;text-decoration:none;text-align:center;
                        font-family:Arial,sans-serif;border-radius:8px;
                        background-color:{bgColor}">
                {label}
              </a>
            </td>
          </tr>
        </table>
        """;

    private static string Footer() => """
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="margin-top:32px;border-top:1px solid #f3f4f6">
          <tr>
            <td style="padding-top:20px;text-align:center">
              <p style="font-size:13px;color:#6b7280;margin:0 0 8px 0">
                Need help? We're here 24/7
              </p>
              <p style="font-size:13px;color:#374151;margin:0 0 16px 0">
                <a href="mailto:support@travelport.com"
                   style="color:#2563eb;text-decoration:none">support@travelport.com</a>
                &nbsp;|&nbsp; 1800-123-4567
              </p>
              <p style="font-size:11px;color:#9ca3af;margin:0">
                &#169; 2026 TravelPort. This is an automated email &#8212; please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
        """;

    private static string Wrap(string inner) => $"""
        {EmailHead()}
        <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,'Segoe UI',sans-serif">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background-color:#f3f4f6">
          <tr>
            <td align="center" style="padding:24px 16px">
              <table width="600" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#ffffff;border-radius:12px;
                            border:1px solid #e5e7eb;max-width:600px;width:100%">
                <tr><td>{inner}</td></tr>
                <tr><td style="padding:0 32px 32px 32px">{Footer()}</td></tr>
              </table>
            </td>
          </tr>
        </table>
        </body></html>
        """;

    // ── Flight Booking Confirmation ──────────────────────────────────────────

    public async Task SendFlightBookingConfirmationAsync(
        string toEmail, string toName, string bookingRef,
        string airline, string flightNumber,
        string origin, string originCity,
        string destination, string destinationCity,
        string departureTime, string arrivalTime, string duration,
        string cabinClass, int passengers,
        decimal unitPrice, decimal subtotal, decimal discount, string? couponCode, decimal finalAmount,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped — flight confirmation {BookingRef}", bookingRef);
            return;
        }

        var discountRow = discount > 0
            ? PriceRow($"Coupon Discount ({couponCode})", $"- Rs.{discount:0}", shaded: true)
            : string.Empty;

        var routeCard = $"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#1e3a8a;border-radius:12px;margin:16px 0">
              <tr>
                <td style="padding:24px">
                  <p style="font-size:11px;font-weight:600;color:#93c5fd;
                            text-transform:uppercase;letter-spacing:1px;margin:0 0 16px 0">
                    {WebUtility.HtmlEncode(airline)} &middot; {WebUtility.HtmlEncode(flightNumber)} &middot; {WebUtility.HtmlEncode(cabinClass)}
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:38%;text-align:center">
                        <p style="font-size:30px;font-weight:800;color:#ffffff;
                                  letter-spacing:-1px;margin:0">
                          {WebUtility.HtmlEncode(origin)}
                        </p>
                        <p style="font-size:13px;color:#bfdbfe;margin:4px 0 0 0">
                          {WebUtility.HtmlEncode(originCity)}
                        </p>
                        <p style="font-size:14px;font-weight:700;color:#ffffff;margin:8px 0 0 0">
                          {WebUtility.HtmlEncode(departureTime)}
                        </p>
                      </td>
                      <td style="width:24%;text-align:center">
                        <p style="font-size:11px;color:#93c5fd;margin:0 0 6px 0">
                          {WebUtility.HtmlEncode(duration)}
                        </p>
                        <p style="font-size:18px;color:#60a5fa;margin:0">&#9992;</p>
                        <p style="font-size:10px;color:#93c5fd;margin:6px 0 0 0">NON STOP</p>
                      </td>
                      <td style="width:38%;text-align:center">
                        <p style="font-size:30px;font-weight:800;color:#ffffff;
                                  letter-spacing:-1px;margin:0">
                          {WebUtility.HtmlEncode(destination)}
                        </p>
                        <p style="font-size:13px;color:#bfdbfe;margin:4px 0 0 0">
                          {WebUtility.HtmlEncode(destinationCity)}
                        </p>
                        <p style="font-size:14px;font-weight:700;color:#ffffff;margin:8px 0 0 0">
                          {WebUtility.HtmlEncode(arrivalTime)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """;

        var fareTable = $"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;margin-top:8px">
              {PriceRow($"Base Fare (Rs.{unitPrice:0} x {passengers} passenger{(passengers > 1 ? "s" : "")})", $"Rs.{subtotal:0}")}
              {discountRow}
              <tr style="background-color:#f0fdf4">
                <td style="padding:12px 14px;font-size:14px;color:#166534;font-weight:800">
                  Total Amount Paid
                </td>
                <td style="padding:12px 14px;font-size:16px;color:#166534;font-weight:800;text-align:right">
                  Rs.{finalAmount:0}
                </td>
              </tr>
            </table>
            """;

        var body = $"""
            {TopBar("#1e3a8a", "Flight Booking Confirmed!", "Your seat is reserved. Have a great journey!")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 32px">
                  <p style="margin:0 0 4px 0;font-size:15px;color:#374151">
                    Hi <strong style="color:#111827">{WebUtility.HtmlEncode(toName)}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280">
                    Your flight booking is confirmed. Details are below.
                  </p>

                  {RefBadge(bookingRef)}
                  {routeCard}

                  {SectionTitle("Traveller Details")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="border:1px solid #e5e7eb;border-radius:8px">
                    {InfoRow("Passenger Name", toName)}
                    {InfoRow("PNR / Booking Reference", bookingRef, shaded: true)}
                    {InfoRow("Passengers", $"{passengers} Adult{(passengers > 1 ? "s" : "")}")}
                    {InfoRow("Cabin Class", cabinClass, shaded: true)}
                    {InfoRow("Booking Status", "Confirmed")}
                  </table>

                  {SectionTitle("Fare Summary")}
                  {fareTable}

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#eff6ff;border-radius:8px;margin-top:20px">
                    <tr>
                      <td style="padding:14px 18px;font-size:13px;color:#1e40af">
                        <strong>Download E-Ticket</strong> — Log in to TravelPort &rarr; My Bookings &rarr; Download Invoice
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(toEmail, toName,
            $"Flight Confirmed - {bookingRef} | {origin} to {destination}",
            Wrap(body), ct);
    }

    // ── Hotel Booking Confirmation ────────────────────────────────────────────

    public async Task SendHotelBookingConfirmationAsync(
        string toEmail, string toName, string bookingRef,
        string hotelName, string hotelAddress, string city, decimal starRating,
        string roomType, string checkIn, string checkOut, int nights, int guests,
        string? guestName, string? guestPhone,
        decimal pricePerNight, decimal roomTotal, decimal discount, string? couponCode, decimal finalAmount,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped — hotel confirmation {BookingRef}", bookingRef);
            return;
        }

        var stars = string.Concat(Enumerable.Repeat("&#9733;", (int)starRating));

        var discountRow = discount > 0
            ? PriceRow($"Coupon Discount ({couponCode})", $"- Rs.{discount:0}", shaded: true)
            : string.Empty;

        var gstAmount  = Math.Round(finalAmount * 0.12m, 0);
        var baseAmount = finalAmount - gstAmount;

        var hotelCard = $"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background-color:#ea580c;border-radius:12px;margin:16px 0">
              <tr>
                <td style="padding:22px 24px">
                  <p style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 6px 0">
                    {WebUtility.HtmlEncode(hotelName)}
                  </p>
                  <p style="margin:0 0 10px 0">
                    <span style="font-size:13px;color:#ffffff;font-weight:700">
                      {stars} {starRating:0.0}-Star Hotel
                    </span>
                  </p>
                  <p style="font-size:13px;color:#fed7aa;margin:0">
                    {WebUtility.HtmlEncode(hotelAddress)}, {WebUtility.HtmlEncode(city)}
                  </p>
                </td>
              </tr>
            </table>
            """;

        var stayCard = $"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;margin:8px 0 16px 0">
              <tr style="background-color:#fff7ed">
                <td style="padding:16px 14px;border-right:1px solid #e5e7eb;text-align:center;width:33%">
                  <p style="font-size:11px;color:#92400e;font-weight:700;
                            text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px 0">Check-In</p>
                  <p style="font-size:17px;font-weight:800;color:#c2410c;margin:0">
                    {WebUtility.HtmlEncode(checkIn)}
                  </p>
                  <p style="font-size:11px;color:#9ca3af;margin:2px 0 0 0">From 2:00 PM</p>
                </td>
                <td style="padding:16px 14px;border-right:1px solid #e5e7eb;text-align:center;width:34%">
                  <p style="font-size:22px;font-weight:800;color:#ea580c;margin:0">{nights}</p>
                  <p style="font-size:11px;color:#6b7280;font-weight:600;margin:0">
                    Night{(nights > 1 ? "s" : "")}
                  </p>
                </td>
                <td style="padding:16px 14px;text-align:center;width:33%">
                  <p style="font-size:11px;color:#92400e;font-weight:700;
                            text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px 0">Check-Out</p>
                  <p style="font-size:17px;font-weight:800;color:#c2410c;margin:0">
                    {WebUtility.HtmlEncode(checkOut)}
                  </p>
                  <p style="font-size:11px;color:#9ca3af;margin:2px 0 0 0">Until 11:00 AM</p>
                </td>
              </tr>
            </table>
            """;

        var guestNameDisplay = !string.IsNullOrWhiteSpace(guestName) ? guestName : toName;
        var guestRows = InfoRow("Guest Name", guestNameDisplay)
            + InfoRow("Room Type", roomType, shaded: true)
            + InfoRow("Guests", $"{guests} Guest{(guests > 1 ? "s" : "")}")
            + InfoRow("Contact Email", toEmail, shaded: true)
            + (!string.IsNullOrWhiteSpace(guestPhone) ? InfoRow("Contact Phone", guestPhone) : string.Empty);

        var fareTable = $"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;margin-top:8px">
              {PriceRow($"Room Rate (Rs.{pricePerNight:0}/night x {nights} night{(nights > 1 ? "s" : "")})", $"Rs.{roomTotal:0}")}
              {discountRow}
              {PriceRow("Base Amount (excl. GST)", $"Rs.{baseAmount:0}", shaded: true)}
              {PriceRow("GST (12%)", $"Rs.{gstAmount:0}")}
              <tr style="background-color:#f0fdf4">
                <td style="padding:12px 14px;font-size:14px;color:#166534;font-weight:800">
                  Total Amount Paid
                </td>
                <td style="padding:12px 14px;font-size:16px;color:#166534;font-weight:800;text-align:right">
                  Rs.{finalAmount:0}
                </td>
              </tr>
            </table>
            """;

        var body = $"""
            {TopBar("#c2410c", "Hotel Booking Confirmed!", "Your room is reserved. We hope you enjoy your stay!")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 32px">
                  <p style="margin:0 0 4px 0;font-size:15px;color:#374151">
                    Hi <strong style="color:#111827">{WebUtility.HtmlEncode(toName)}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280">
                    Your hotel booking is confirmed. Details are below.
                  </p>

                  {RefBadge(bookingRef)}
                  {hotelCard}
                  {stayCard}

                  {SectionTitle("Guest Details")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="border:1px solid #e5e7eb;border-radius:8px">
                    {guestRows}
                    {InfoRow("Booking Status", "Confirmed", shaded: true)}
                  </table>

                  {SectionTitle("Price Summary")}
                  {fareTable}

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#fff7ed;border-radius:8px;margin-top:20px">
                    <tr>
                      <td style="padding:14px 18px;font-size:13px;color:#c2410c">
                        <strong>Hotel Policies:</strong>
                        Free cancellation before check-in &middot;
                        Early check-in subject to availability &middot;
                        Valid government-issued ID required at check-in
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#eff6ff;border-radius:8px;margin-top:12px">
                    <tr>
                      <td style="padding:14px 18px;font-size:13px;color:#1e40af">
                        <strong>Download Hotel Invoice</strong> — Log in to TravelPort &rarr; My Bookings &rarr; Download Invoice
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(toEmail, toName,
            $"Hotel Confirmed - {bookingRef} | {hotelName}, {city}",
            Wrap(body), ct);
    }

    // ── Cancellation ─────────────────────────────────────────────────────────

    public async Task SendBookingCancellationAsync(string toEmail, string toName, string bookingRef,
        string bookingType, decimal refundAmount, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped — cancellation {BookingRef}", bookingRef);
            return;
        }

        var typeLabel  = bookingType == "Hotel" ? "Hotel" : "Flight";
        var refundHtml = refundAmount > 0
            ? $"""
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#f0fdf4;border:1px solid #bbf7d0;
                            border-radius:8px;margin-top:16px">
                <tr>
                  <td style="padding:16px 20px">
                    <p style="margin:0 0 4px 0;font-size:15px;color:#166534;font-weight:700">
                      Refund of Rs.{refundAmount:0} (90%) has been credited to your TravelPort Wallet.
                    </p>
                    <p style="margin:0;font-size:12px;color:#15803d">
                      Your wallet balance is updated immediately and can be used for your next booking.
                    </p>
                  </td>
                </tr>
              </table>
              """
            : string.Empty;

        var body = $"""
            {TopBar("#dc2626", $"{typeLabel} Booking Cancelled", "Your booking has been successfully cancelled.")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 32px">
                  <p style="margin:0 0 4px 0;font-size:15px;color:#374151">
                    Hi <strong style="color:#111827">{WebUtility.HtmlEncode(toName)}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280">
                    Your <strong>{WebUtility.HtmlEncode(typeLabel)}</strong> booking has been cancelled as requested.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px">
                    <tr style="background-color:#fef2f2">
                      <td style="padding:14px 18px;font-size:13px;color:#991b1b;font-weight:600;width:50%">
                        Booking Reference
                      </td>
                      <td style="padding:14px 18px;font-size:16px;font-weight:800;
                                 color:#dc2626;letter-spacing:1px;text-align:right">
                        {WebUtility.HtmlEncode(bookingRef)}
                      </td>
                    </tr>
                    <tr style="background-color:#fff5f5">
                      <td style="padding:14px 18px;font-size:13px;color:#991b1b;font-weight:600;
                                 border-top:1px solid #fecaca">
                        Status
                      </td>
                      <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#dc2626;
                                 text-align:right;border-top:1px solid #fecaca">
                        Cancelled
                      </td>
                    </tr>
                  </table>

                  {refundHtml}

                  <p style="font-size:13px;color:#6b7280;margin-top:20px;line-height:1.6">
                    If you did not request this cancellation or need further assistance,
                    please contact us immediately.
                  </p>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(toEmail, toName, $"Booking Cancelled - {bookingRef}", Wrap(body), ct);
    }

    // ── Password Reset ────────────────────────────────────────────────────────

    public async Task SendPasswordResetAsync(string toEmail, string toName, string resetLink, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped — reset link: {Link}", resetLink);
            return;
        }

        var body = $"""
            {TopBar("#1e3a8a", "Reset Your Password", "We received a request to reset your TravelPort password.")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 32px">
                  <p style="margin:0 0 4px 0;font-size:15px;color:#374151">
                    Hi <strong style="color:#111827">{WebUtility.HtmlEncode(toName)}</strong>,
                  </p>
                  <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6">
                    Click the button below to reset your password.
                    This link expires in <strong style="color:#111827">1 hour</strong>.
                  </p>

                  {CtaButton(resetLink, "Reset Password", "#2563eb")}

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#f9fafb;border-radius:8px;margin-top:4px">
                    <tr>
                      <td style="padding:12px 16px;font-size:12px;color:#6b7280">
                        Or copy and paste this link into your browser:<br>
                        <span style="color:#2563eb;word-break:break-all">
                          {WebUtility.HtmlEncode(resetLink)}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:13px;color:#9ca3af;margin-top:20px;line-height:1.6">
                    If you did not request a password reset, you can safely ignore this email.
                    Your account remains secure.
                  </p>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(toEmail, toName, "Reset Your TravelPort Password", Wrap(body), ct);
    }

    // ── Hotel Credentials ────────────────────────────────────────────────────

    public async Task SendHotelCredentialsEmailAsync(
        string toEmail, string toName,
        string hotelName, string loginEmail, string password,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email skipped — hotel credentials for {Email}", toEmail);
            return;
        }

        var body = $"""
            {TopBar("#0369a1", "Welcome to TravelPort Hotel Portal", $"Your hotel account for {WebUtility.HtmlEncode(hotelName)} is ready.")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 32px">
                  <p style="margin:0 0 4px 0;font-size:15px;color:#374151">
                    Hi <strong style="color:#111827">{WebUtility.HtmlEncode(toName)}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;line-height:1.6">
                    Your hotel manager account has been created on TravelPort.
                    Use the credentials below to log in and manage your property.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin:0 0 20px 0">
                    <tr>
                      <td style="padding:20px 24px">
                        <p style="font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;
                                  letter-spacing:0.8px;margin:0 0 16px 0">Your Login Credentials</p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0"
                               style="border:1px solid #e0f2fe;border-radius:6px;background-color:#ffffff">
                          {InfoRow("Hotel", hotelName)}
                          {InfoRow("Login Email", loginEmail, shaded: true)}
                          {InfoRow("Temporary Password", password)}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background-color:#fef9c3;border:1px solid #fde047;border-radius:8px;margin-bottom:20px">
                    <tr>
                      <td style="padding:14px 18px;font-size:13px;color:#713f12">
                        <strong>Security Notice:</strong> Please log in and change your password immediately.
                        Do not share your credentials with anyone.
                      </td>
                    </tr>
                  </table>

                  <p style="font-size:14px;color:#374151;line-height:1.6">
                    With your hotel portal you can:
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="margin-bottom:20px">
                    <tr><td style="padding:6px 0;font-size:13px;color:#374151">&#10003;&nbsp; View all guest bookings in real-time</td></tr>
                    <tr><td style="padding:6px 0;font-size:13px;color:#374151">&#10003;&nbsp; Add and manage rooms with pricing</td></tr>
                    <tr><td style="padding:6px 0;font-size:13px;color:#374151">&#10003;&nbsp; Upload room photos and hotel images</td></tr>
                    <tr><td style="padding:6px 0;font-size:13px;color:#374151">&#10003;&nbsp; Update hotel amenities and description</td></tr>
                    <tr><td style="padding:6px 0;font-size:13px;color:#374151">&#10003;&nbsp; Track revenue and occupancy statistics</td></tr>
                  </table>
                </td>
              </tr>
            </table>
            """;

        await SendAsync(toEmail, toName,
            $"Your TravelPort Hotel Portal Access — {hotelName}",
            Wrap(body), ct);
    }

    // ── SMTP sender ───────────────────────────────────────────────────────────

    private async Task SendAsync(string toEmail, string toName, string subject, string htmlContent, CancellationToken ct)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = subject,
            Body = htmlContent,
            IsBodyHtml = true
        };
        message.To.Add(new MailAddress(toEmail, toName));

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = string.IsNullOrWhiteSpace(_settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(_settings.Username, _settings.Password)
        };

        try
        {
            ct.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email sent to {ToEmail} — Subject: {Subject}", toEmail, subject);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP send failed — Host: {Host}:{Port}, StatusCode: {Code}",
                _settings.SmtpHost, _settings.SmtpPort, ex.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email send failed — To: {To}, Subject: {Subject}", toEmail, subject);
        }
    }
}
