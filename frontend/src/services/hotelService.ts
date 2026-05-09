import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, HotelDto, HotelSearchRequest, BookHotelRequest, BookingCreatedResponse } from '@/types'

export const hotelService = {
  search: (params: HotelSearchRequest) =>
    api.get<ApiResponse<HotelDto[]>>(endpoints.hotels.search, { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<HotelDto>>(endpoints.hotels.byId(id)).then(r => r.data),

  book: (body: BookHotelRequest) =>
    api.post<ApiResponse<BookingCreatedResponse>>(endpoints.hotels.book, body).then(r => r.data),
}
