import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  ApiResponse,
  HotelDto,
  HotelSearchRequest,
  BookHotelRequest,
  BookingCreatedResponse,
  HotelReviewDto,
  CreateHotelReviewRequest,
} from '@/types'

export const hotelService = {
  search: (params: HotelSearchRequest) =>
    api.get<ApiResponse<HotelDto[]>>(endpoints.hotels.search, { params }).then(r => r.data),

  getById: (id: string, checkIn?: string, checkOut?: string) =>
    api.get<ApiResponse<HotelDto>>(endpoints.hotels.byId(id), {
      params: checkIn && checkOut ? { checkIn, checkOut } : undefined,
    }).then(r => r.data),

  createReview: (hotelId: string, body: CreateHotelReviewRequest) =>
    api.post<ApiResponse<HotelReviewDto>>(endpoints.hotels.reviews(hotelId), body).then(r => r.data),

  book: (body: BookHotelRequest) =>
    api.post<ApiResponse<BookingCreatedResponse>>(endpoints.hotels.book, body).then(r => r.data),
}
