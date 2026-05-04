import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { notificationService } from "@/services/notification.service"
import type { NotificationListResponse } from "@/types/notification.types"

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: (page: number, perPage: number, filters: any) => [...notificationKeys.all, "list", { page, perPage, ...filters }] as const,
  infinite: (filters: any) => [...notificationKeys.all, "infinite", { ...filters }] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
}

export function useNotifications(page = 1, perPage = 10, filters: any = {}) {
  return useQuery<NotificationListResponse, Error>({
    queryKey: notificationKeys.lists(page, perPage, filters),
    queryFn: () => notificationService.getMyNotifications(page, perPage, filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  })
}

export function useInfiniteNotifications(perPage = 10, filters: any = {}) {
  return useInfiniteQuery<NotificationListResponse, Error>({
    queryKey: notificationKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => notificationService.getMyNotifications(pageParam as number, perPage, filters),
    getNextPageParam: (lastPage: NotificationListResponse) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
