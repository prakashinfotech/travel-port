import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { AnnouncementDto, CreateAnnouncementRequest, UpdateAnnouncementRequest, ApiResponse } from '@/types'

const e = endpoints.announcements

export const announcementService = {
  getActive: () =>
    api.get<ApiResponse<AnnouncementDto[]>>(e.active).then(r => r.data.data),

  getAll: () =>
    api.get<ApiResponse<AnnouncementDto[]>>(e.all).then(r => r.data.data),

  create: (req: CreateAnnouncementRequest) =>
    api.post<ApiResponse<AnnouncementDto>>(e.all, req).then(r => r.data.data),

  update: (id: string, req: UpdateAnnouncementRequest) =>
    api.put<ApiResponse<AnnouncementDto>>(e.item(id), req).then(r => r.data.data),

  delete: (id: string) =>
    api.delete(e.item(id)),
}
