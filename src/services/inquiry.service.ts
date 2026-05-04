import { api } from "@/lib/api/axios"
import type { AdminInquiriesResponse, InquiryRecordType } from "@/types/inquiry.types"

export type InquiryPayload = {
  fullName: string
  email: string
  phone: string
  clinicName: string
  message: string
}

export type InquiryResponse = {
  _id: string
  fullName: string
  email: string
  phone: string
  clinicName: string
  message: string
  createdAt: string
  updatedAt: string
}

export type NewsletterPayload = {
  email: string
}

export type NewsletterResponse = {
  _id: string
  email: string
  createdAt: string
  updatedAt: string
}

export const inquiryApi = {
  createInquiry: async (payload: InquiryPayload): Promise<InquiryResponse> => {
    const response = await api.post("/inquiries", payload)
    return response.data?.data
  },

  createNewsletter: async (payload: NewsletterPayload): Promise<NewsletterResponse> => {
    const response = await api.post("/newsletter/subscribe", payload)
    return response.data?.data
  },

  getAdminInquiries: async (
    page = 1,
    perPage = 10,
    params?: { search?: string; type?: "inquiry" | "newsletter" }
  ): Promise<AdminInquiriesResponse> => {
    const response = await api.get<AdminInquiriesResponse>("/admin/inquiries", {
      params: {
        page,
        perPage,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.type ? { type: params.type } : {}),
      },
    })

    return response.data
  },

  deleteInquiry: async (id: string, type: InquiryRecordType): Promise<void> => {
    await api.delete(`/admin/inquiries/${id}`, {
      params: { type },
    })
  },
}
