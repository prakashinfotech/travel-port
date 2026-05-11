using TravelPort.Application.DTOs.Bookings;

namespace TravelPort.Application.Common.Interfaces;

public interface IInvoiceDocumentService
{
    byte[] GenerateBookingTicketPdf(BookingDto booking);
}
