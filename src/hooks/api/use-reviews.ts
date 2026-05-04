import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage, api } from "@/lib/api/axios"
import type { ReviewFormValues } from "@/components/review-form-dialog"

export interface ReviewResponse {
  _id: string
  rating: number
  reviewText: string
  comment?: string // Backend field
  doctor: string
  patient: {
    _id: string
    firstName: string
    lastName: string
    profilePicture?: string
  }
  createdAt: string
  isActive: boolean
}

export interface ReviewListResponse {
  data: {
    reviews: ReviewResponse[]
    analytics: {
      averageRating: number
      ratingCounts: { [star: number]: number }
      totalReviews: number
    }
  }
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export function useDoctorReviews(doctorId?: string, params?: {
  page?: number
  perPage?: number
  rating?: string
  sortBy?: string
  sortOrder?: string
}) {
  return useQuery({
    queryKey: ["reviews", "doctor", doctorId, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', String(params.page))
      if (params?.perPage) searchParams.append('perPage', String(params.perPage))
      if (params?.rating && params.rating !== 'all') searchParams.append('rating', params.rating)
      if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

      const response = await api.get<ReviewListResponse>(`/reviews/doctor/${doctorId}?${searchParams.toString()}`)
      const { reviews = [], analytics } = response.data.data || {}

      return {
        reviews: (reviews || []).map(r => ({ ...r, reviewText: r.comment || r.reviewText || "" })) as ReviewResponse[],
        analytics,
        pagination: response.data.pagination
      }
    },
    enabled: Boolean(doctorId),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { doctor: string } & ReviewFormValues) => api.post("/reviews", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "doctor", variables.doctor] })
      toast.success("Review submitted successfully!")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useUpdateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (args: { id: string; doctor: string } & ReviewFormValues) => {
      const { id, doctor, ...data } = args
      return api.put(`/reviews/${id}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "doctor", variables.doctor] })
      toast.success("Review updated successfully!")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useLandingReviews(params?: {
  limit?: number
  filter?: 'auto' | 'highest'
}) {
  return useQuery({
    queryKey: ["reviews", "landing", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.append('perPage', String(params.limit))
      if (params?.filter) searchParams.append('filter', params.filter)

      const response = await api.get<any>(`/reviews?${searchParams.toString()}`)
      const { reviews = [], analytics } = response.data.data || {}

      return {
        reviews: (reviews || []).map((r: any) => ({
          ...r,
          reviewText: r.comment || r.reviewText || ""
        })) as ReviewResponse[],
        analytics
      }
    }
  })
}
