import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, BookingDto, CancelBookingResponse, PaginationMeta } from '@/types'

export const bookingService = {
  list: (page = 1, pageSize = 10) =>
    api.get<ApiResponse<BookingDto[]>>(endpoints.bookings.list, { params: { page, pageSize } }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<BookingDto>>(endpoints.bookings.byId(id)).then(r => r.data),

  downloadInvoice: (id: string) =>
    api.get(endpoints.bookings.invoice(id), { responseType: 'blob' }).then(r => r.data as Blob),

  cancel: (id: string) =>
    api.post<ApiResponse<CancelBookingResponse>>(endpoints.bookings.cancel(id)).then(r => r.data),
}

export type { PaginationMeta }
