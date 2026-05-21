import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  HotelManagerDashboardDto,
  HotelManagerBookingDto,
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
  ): Promise<{ items: HotelManagerBookingDto[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<HotelManagerBookingDto[]>>(endpoints.hotelManager.bookings, {
      params: { page, pageSize, status },
    })
    return { items: res.data.data, meta: res.data.meta! }
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
