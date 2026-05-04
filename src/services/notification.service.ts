import { api } from "@/lib/api/axios"
import type { NotificationListResponse, Notification } from "@/types/notification.types"

export interface GenericApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export const notificationService = {
  /**
   * Get current user's notifications
   */
  getMyNotifications: async (
    page = 1,
    perPage = 10,
    filters: { search?: string; type?: string; isRead?: boolean } = {}
  ): Promise<NotificationListResponse> => {
    const { data } = await api.get<NotificationListResponse>("/notifications", {
      params: {
        page,
        perPage,
        ...filters,
      },
    })
    return data
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<GenericApiResponse<Notification>> => {
    const { data } = await api.patch<GenericApiResponse<Notification>>(`/notifications/${id}/read`)
    return data
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<GenericApiResponse<null>> => {
    const { data } = await api.patch<GenericApiResponse<null>>("/notifications/mark-all-read")
    return data
  },
}
