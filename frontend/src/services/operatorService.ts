import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  ApiResponse,
  FlightOperatorDashboardDto,
  BusOperatorDashboardDto,
  CabOperatorDashboardDto,
  OperatorFlightDto,
  OperatorBusDto,
  OperatorBookingDto,
  CreateFlightRequest,
  UpdateFlightRequest,
  CreateBusRequest,
  UpdateBusRequest,
  SeatLayoutDto,
  SeatLayoutConfigRequest,
  BulkSeatBookingRequest,
  FlightDateRouteDto,
  BusDateRouteDto,
  BusSeatLayoutDto,
  BusSeatLayoutConfigRequest,
  BusBulkSeatBookingRequest,
} from '@/types'

// ── Flight Operator ───────────────────────────────────────────────────────────

export const flightOperatorService = {
  getDashboard: async (): Promise<FlightOperatorDashboardDto> => {
    const { data } = await api.get<ApiResponse<FlightOperatorDashboardDto>>(endpoints.flightOperator.dashboard)
    return data.data
  },
  getFlights: async (): Promise<OperatorFlightDto[]> => {
    const { data } = await api.get<ApiResponse<OperatorFlightDto[]>>(endpoints.flightOperator.flights)
    return data.data ?? []
  },
  addFlight: async (req: CreateFlightRequest): Promise<OperatorFlightDto> => {
    const { data } = await api.post<ApiResponse<OperatorFlightDto>>(endpoints.flightOperator.flights, req)
    return data.data
  },
  updateFlight: async (id: string, req: UpdateFlightRequest): Promise<OperatorFlightDto> => {
    const { data } = await api.put<ApiResponse<OperatorFlightDto>>(endpoints.flightOperator.flight(id), req)
    return data.data
  },
  deleteFlight: async (id: string): Promise<void> => {
    await api.delete(endpoints.flightOperator.flight(id))
  },
  getBookings: async (): Promise<OperatorBookingDto[]> => {
    const { data } = await api.get<ApiResponse<OperatorBookingDto[]>>(endpoints.flightOperator.bookings)
    return data.data ?? []
  },

  // Seat layout
  getFlightsByDate: async (date: string): Promise<FlightDateRouteDto[]> => {
    const { data } = await api.get<ApiResponse<FlightDateRouteDto[]>>(endpoints.flightOperator.flightsByDate, {
      params: { date },
    })
    return data.data ?? []
  },
  getSeatLayout: async (flightId: string): Promise<SeatLayoutDto> => {
    const { data } = await api.get<ApiResponse<SeatLayoutDto>>(endpoints.flightOperator.seatLayout(flightId))
    return data.data
  },
  updateSeatLayout: async (flightId: string, req: SeatLayoutConfigRequest): Promise<OperatorFlightDto> => {
    const { data } = await api.put<ApiResponse<OperatorFlightDto>>(endpoints.flightOperator.seatLayout(flightId), req)
    return data.data
  },
  bulkBookSeats: async (flightId: string, req: BulkSeatBookingRequest): Promise<OperatorBookingDto> => {
    const { data } = await api.post<ApiResponse<OperatorBookingDto>>(endpoints.flightOperator.bulkBook(flightId), req)
    return data.data
  },
  cancelBooking: async (bookingId: string): Promise<void> => {
    await api.delete(endpoints.flightOperator.cancelBooking(bookingId))
  },
}

// ── Bus Operator ──────────────────────────────────────────────────────────────

export const busOperatorService = {
  getDashboard: async (): Promise<BusOperatorDashboardDto> => {
    const { data } = await api.get<ApiResponse<BusOperatorDashboardDto>>(endpoints.busOperator.dashboard)
    return data.data
  },
  getBuses: async (): Promise<OperatorBusDto[]> => {
    const { data } = await api.get<ApiResponse<OperatorBusDto[]>>(endpoints.busOperator.buses)
    return data.data ?? []
  },
  addBus: async (req: CreateBusRequest): Promise<OperatorBusDto> => {
    const { data } = await api.post<ApiResponse<OperatorBusDto>>(endpoints.busOperator.buses, req)
    return data.data
  },
  updateBus: async (id: string, req: UpdateBusRequest): Promise<OperatorBusDto> => {
    const { data } = await api.put<ApiResponse<OperatorBusDto>>(endpoints.busOperator.bus(id), req)
    return data.data
  },
  deleteBus: async (id: string): Promise<void> => {
    await api.delete(endpoints.busOperator.bus(id))
  },
  getBookings: async (): Promise<OperatorBookingDto[]> => {
    const { data } = await api.get<ApiResponse<OperatorBookingDto[]>>(endpoints.busOperator.bookings)
    return data.data ?? []
  },

  // Seat layout
  getBusesByDate: async (date: string): Promise<BusDateRouteDto[]> => {
    const { data } = await api.get<ApiResponse<BusDateRouteDto[]>>(endpoints.busOperator.busesByDate, {
      params: { date },
    })
    return data.data ?? []
  },
  getSeatLayout: async (busId: string): Promise<BusSeatLayoutDto> => {
    const { data } = await api.get<ApiResponse<BusSeatLayoutDto>>(endpoints.busOperator.seatLayout(busId))
    return data.data
  },
  updateSeatLayout: async (busId: string, req: BusSeatLayoutConfigRequest): Promise<OperatorBusDto> => {
    const { data } = await api.put<ApiResponse<OperatorBusDto>>(endpoints.busOperator.seatLayout(busId), req)
    return data.data
  },
  bulkBookSeats: async (busId: string, req: BusBulkSeatBookingRequest): Promise<OperatorBookingDto> => {
    const { data } = await api.post<ApiResponse<OperatorBookingDto>>(endpoints.busOperator.bulkBook(busId), req)
    return data.data
  },
  cancelBooking: async (bookingId: string): Promise<void> => {
    await api.delete(endpoints.busOperator.cancelBooking(bookingId))
  },
}

// ── Cab Operator ──────────────────────────────────────────────────────────────

export const cabOperatorService = {
  getDashboard: async (): Promise<CabOperatorDashboardDto> => {
    const { data } = await api.get<ApiResponse<CabOperatorDashboardDto>>(endpoints.cabOperator.dashboard)
    return data.data
  },
  getBookings: async (): Promise<OperatorBookingDto[]> => {
    const { data } = await api.get<ApiResponse<OperatorBookingDto[]>>(endpoints.cabOperator.bookings)
    return data.data ?? []
  },
}
