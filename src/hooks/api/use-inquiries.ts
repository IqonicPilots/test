"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { inquiryApi } from "@/services/inquiry.service"
import { getApiErrorMessage } from "@/lib/api/axios"
import type { AdminInquiriesResponse, InquiryRecordType } from "@/types/inquiry.types"

export const adminInquiriesQueryKey = ["admin-inquiries"] as const

type UseInquiriesParams = {
  page?: number
  perPage?: number
  search?: string
  type?: "inquiry" | "newsletter"
}

export function useInquiries(params: UseInquiriesParams = {}) {
  const { page = 1, perPage = 10, search, type } = params

  const queryKey = useMemo(
    () => [...adminInquiriesQueryKey, { page, perPage, search, type }],
    [page, perPage, search, type]
  )

  return useQuery<AdminInquiriesResponse>({
    queryKey,
    queryFn: () => inquiryApi.getAdminInquiries(page, perPage, { search, type }),
    placeholderData: (previousData) => previousData,
  })
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: InquiryRecordType }) =>
      inquiryApi.deleteInquiry(id, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminInquiriesQueryKey })
      toast.success(
        variables.type === "newsletter"
          ? "Newsletter subscriber deleted successfully."
          : "Inquiry deleted successfully."
      )
    },
    onError: (error) => {
      toast.error(`Failed to delete record: ${getApiErrorMessage(error)}`)
    },
  })
}
