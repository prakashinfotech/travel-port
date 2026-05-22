import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  HotelManagerDashboardDto,
  HotelManagerBookingDto,
  HotelBookingDetailDto,
  HotelInvoiceDto,
  RoomAvailabilityDto,
  CheckInRequest,
  AddHotelChargeRequest,
  CheckOutRequest,
  HotelProfileDto,
  HotelRoomManagerDto,
  CreateRoomRequest,
  UpdateRoomRequest,
  UpdateHotelDetailsRequest,
  ApiResponse,
  PaginationMeta,
} from '@/types'

export const hotelManagerService = {
  getDashboard: async (): Promise<HotelManagerDashboardDto> => {
    const res = await api.get<ApiResponse<HotelManagerDashboardDto>>(endpoints.hotelManager.dashboard)
    return res.data.data
  },

  getBookings: async (
    page = 1,
    pageSize = 20,
    status?: string,
    query?: string,
  ): Promise<{ items: HotelManagerBookingDto[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<HotelManagerBookingDto[]>>(endpoints.hotelManager.bookings, {
      params: { page, pageSize, status, query },
    })
    return { items: res.data.data, meta: res.data.meta! }
  },

  getBookingDetail: async (bookingId: string): Promise<HotelBookingDetailDto> => {
    const res = await api.get<ApiResponse<HotelBookingDetailDto>>(endpoints.hotelManager.booking(bookingId))
    return res.data.data
  },

  checkIn: async (bookingId: string, req: CheckInRequest): Promise<HotelBookingDetailDto> => {
    const res = await api.post<ApiResponse<HotelBookingDetailDto>>(endpoints.hotelManager.checkIn(bookingId), req)
    return res.data.data
  },

  addCharge: async (bookingId: string, req: AddHotelChargeRequest): Promise<HotelBookingDetailDto> => {
    const res = await api.post<ApiResponse<HotelBookingDetailDto>>(endpoints.hotelManager.charges(bookingId), req)
    return res.data.data
  },

  removeCharge: async (bookingId: string, chargeId: string): Promise<void> => {
    await api.delete(endpoints.hotelManager.charge(bookingId, chargeId))
  },

  getInvoice: async (bookingId: string): Promise<HotelInvoiceDto> => {
    const res = await api.get<ApiResponse<HotelInvoiceDto>>(endpoints.hotelManager.invoice(bookingId))
    return res.data.data
  },

  checkOut: async (bookingId: string, req: CheckOutRequest): Promise<HotelInvoiceDto> => {
    const res = await api.post<ApiResponse<HotelInvoiceDto>>(endpoints.hotelManager.checkout(bookingId), req)
    return res.data.data
  },

  getAvailability: async (checkIn: string, checkOut: string): Promise<RoomAvailabilityDto[]> => {
    const res = await api.get<ApiResponse<RoomAvailabilityDto[]>>(endpoints.hotelManager.availability, {
      params: { checkIn, checkOut },
    })
    return res.data.data
  },

  getProfile: async (): Promise<HotelProfileDto> => {
    const res = await api.get<ApiResponse<HotelProfileDto>>(endpoints.hotelManager.profile)
    return res.data.data
  },

  updateProfile: async (req: UpdateHotelDetailsRequest): Promise<HotelProfileDto> => {
    const res = await api.put<ApiResponse<HotelProfileDto>>(endpoints.hotelManager.profile, req)
    return res.data.data
  },

  addRoom: async (req: CreateRoomRequest): Promise<HotelRoomManagerDto> => {
    const res = await api.post<ApiResponse<HotelRoomManagerDto>>(endpoints.hotelManager.rooms, req)
    return res.data.data
  },

  updateRoom: async (roomId: string, req: UpdateRoomRequest): Promise<HotelRoomManagerDto> => {
    const res = await api.put<ApiResponse<HotelRoomManagerDto>>(endpoints.hotelManager.room(roomId), req)
    return res.data.data
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    await api.delete(endpoints.hotelManager.room(roomId))
  },

  getRooms: async (): Promise<HotelRoomManagerDto[]> => {
    const res = await api.get<ApiResponse<HotelRoomManagerDto[]>>(endpoints.hotelManager.rooms)
    return res.data.data
  },
}
