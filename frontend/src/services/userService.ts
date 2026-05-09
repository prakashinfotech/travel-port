import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, UserProfileDto, WalletDto, SavedTravellerDto } from '@/types'

export const userService = {
  getProfile: () =>
    api.get<ApiResponse<UserProfileDto>>(endpoints.users.profile).then(r => r.data),

  updateProfile: (body: { name: string; phone: string }) =>
    api.put<ApiResponse<UserProfileDto>>(endpoints.users.profile, body).then(r => r.data),

  getWallet: () =>
    api.get<ApiResponse<WalletDto>>(endpoints.users.wallet).then(r => r.data),

  getTravellers: () =>
    api.get<ApiResponse<SavedTravellerDto[]>>(endpoints.users.travellers).then(r => r.data),

  addTraveller: (body: { name: string; email: string; phone: string; passportNumber?: string }) =>
    api.post<ApiResponse<SavedTravellerDto>>(endpoints.users.travellers, body).then(r => r.data),

  deleteTraveller: (id: string) =>
    api.delete<ApiResponse<null>>(endpoints.users.traveller(id)).then(r => r.data),
}
