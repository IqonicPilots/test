export interface NotificationPagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface Notification {
  _id: string
  recipient: string
  title: string
  content: string
  type: "Appointment" | "Encounter" | "Message" | "Others"
  isRead: boolean
  data?: any
  createdAt: string
}

export interface NotificationListResponse {
  success: boolean
  data: Notification[]
  message: string
  pagination: NotificationPagination
  unreadCount?: number
  totalUnreads?: number
  stats?: {
    unreadCount: number
    totalUnreads: number
  }
}
