import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, UserProfileDto, WalletDto, SavedTravellerDto, SavedCardDto, AddSavedCardRequest } from '@/types'

export const userService = {
  getProfile: () =>
    api.get<ApiResponse<UserProfileDto>>(endpoints.users.profile).then(r => r.data),

  updateProfile: (body: { name: string; phone: string }) =>
    api.put<ApiResponse<UserProfileDto>>(endpoints.users.profile, body).then(r => r.data),

  getWallet: () =>
    api.get<ApiResponse<WalletDto>>(endpoints.users.wallet).then(r => r.data),

  topUpWallet: (amount: number) =>
    api.post<ApiResponse<WalletDto>>(endpoints.users.walletTopup, { amount }).then(r => r.data),

  getTravellers: () =>
    api.get<ApiResponse<SavedTravellerDto[]>>(endpoints.users.travellers).then(r => r.data),

  addTraveller: (body: { name: string; email: string; phone: string; passportNumber?: string }) =>
    api.post<ApiResponse<SavedTravellerDto>>(endpoints.users.travellers, body).then(r => r.data),

  deleteTraveller: (id: string) =>
    api.delete<ApiResponse<null>>(endpoints.users.traveller(id)).then(r => r.data),

  // Saved Cards
  getSavedCards: () =>
    api.get<ApiResponse<SavedCardDto[]>>(endpoints.users.cards).then(r => r.data),

  addSavedCard: (body: AddSavedCardRequest) =>
    api.post<ApiResponse<SavedCardDto>>(endpoints.users.cards, body).then(r => r.data),

  deleteSavedCard: (id: string) =>
    api.delete<ApiResponse<null>>(endpoints.users.card(id)).then(r => r.data),

  setDefaultCard: (id: string) =>
    api.put<ApiResponse<SavedCardDto>>(endpoints.users.cardDefault(id), {}).then(r => r.data),
}
