import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  AdminDashboardDto, AdminUserDto, AdminAnalyticsDto,
  CouponDto, CreateCouponRequest, UpdateCouponRequest,
  BookingDto, ApiResponse,
  AdminHotelListDto, RegisterHotelRequest,
  FlightOperatorListDto, BusOperatorListDto, CabOperatorListDto,
  RegisterFlightOperatorRequest, RegisterBusOperatorRequest, RegisterCabOperatorRequest,
} from '@/types'

const e = endpoints.admin

export const adminService = {
  getDashboard: () =>
    api.get<ApiResponse<AdminDashboardDto>>(e.dashboard).then(r => r.data.data),

  getAnalytics: () =>
    api.get<ApiResponse<AdminAnalyticsDto>>(e.analytics).then(r => r.data.data),

  getUsers: (page = 1, pageSize = 20, search?: string) =>
    api.get<ApiResponse<AdminUserDto[]>>(e.users, {
      params: { page, pageSize, search },
    }).then(r => r.data),

  toggleBlock: (id: string) =>
    api.post<ApiResponse<AdminUserDto>>(e.blockUser(id)).then(r => r.data.data),

  getBookings: (page = 1, pageSize = 20, status?: string, type?: string) =>
    api.get<ApiResponse<BookingDto[]>>(e.bookings, {
      params: { page, pageSize, status: status || undefined, type: type || undefined },
    }).then(r => r.data),

  getCoupons: () =>
    api.get<ApiResponse<CouponDto[]>>(e.coupons).then(r => r.data.data),

  createCoupon: (req: CreateCouponRequest) =>
    api.post<ApiResponse<CouponDto>>(e.coupons, req).then(r => r.data.data),

  updateCoupon: (id: string, req: UpdateCouponRequest) =>
    api.put<ApiResponse<CouponDto>>(e.coupon(id), req).then(r => r.data.data),

  deleteCoupon: (id: string) =>
    api.delete<ApiResponse<object>>(e.coupon(id)).then(r => r.data),

  getHotels: () =>
    api.get<ApiResponse<AdminHotelListDto[]>>(e.hotels).then(r => r.data.data),

  registerHotel: (req: RegisterHotelRequest) =>
    api.post<ApiResponse<AdminHotelListDto>>(e.hotels, req).then(r => r.data.data),

  toggleHotelActive: (id: string) =>
    api.post<ApiResponse<AdminHotelListDto>>(e.toggleHotel(id)).then(r => r.data.data),

  deleteHotelReview: (id: string) =>
    api.delete<ApiResponse<object>>(e.deleteHotelReview(id)).then(r => r.data),

  // Operator management
  getFlightOperators: () =>
    api.get<ApiResponse<FlightOperatorListDto[]>>(e.flightOperators).then(r => r.data.data),

  registerFlightOperator: (req: RegisterFlightOperatorRequest) =>
    api.post<ApiResponse<FlightOperatorListDto>>(e.flightOperators, req).then(r => r.data.data),

  toggleFlightOperator: (id: string) =>
    api.post<ApiResponse<FlightOperatorListDto>>(e.toggleFlightOperator(id)).then(r => r.data.data),

  getBusOperators: () =>
    api.get<ApiResponse<BusOperatorListDto[]>>(e.busOperators).then(r => r.data.data),

  registerBusOperator: (req: RegisterBusOperatorRequest) =>
    api.post<ApiResponse<BusOperatorListDto>>(e.busOperators, req).then(r => r.data.data),

  toggleBusOperator: (id: string) =>
    api.post<ApiResponse<BusOperatorListDto>>(e.toggleBusOperator(id)).then(r => r.data.data),

  getCabOperators: () =>
    api.get<ApiResponse<CabOperatorListDto[]>>(e.cabOperators).then(r => r.data.data),

  registerCabOperator: (req: RegisterCabOperatorRequest) =>
    api.post<ApiResponse<CabOperatorListDto>>(e.cabOperators, req).then(r => r.data.data),

  toggleCabOperator: (id: string) =>
    api.post<ApiResponse<CabOperatorListDto>>(e.toggleCabOperator(id)).then(r => r.data.data),
}
