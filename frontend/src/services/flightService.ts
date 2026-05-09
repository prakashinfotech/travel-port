import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, FlightDto, FlightSearchRequest, BookFlightRequest, BookingCreatedResponse } from '@/types'

export const flightService = {
  search: (params: FlightSearchRequest) =>
    api.get<ApiResponse<FlightDto[]>>(endpoints.flights.search, { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<FlightDto>>(endpoints.flights.byId(id)).then(r => r.data),

  book: (body: BookFlightRequest) =>
    api.post<ApiResponse<BookingCreatedResponse>>(endpoints.flights.book, body).then(r => r.data),
}
