import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type {
  AdminDashboardDto, AdminUserDto, AdminAnalyticsDto,
  CouponDto, CreateCouponRequest, UpdateCouponRequest,
  BookingDto, ApiResponse,
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
}
