import { api } from "@/lib/api/axios"
import type { Service, ServiceListResponse } from "@/types/service.types"

export type { Service, ServiceFormData, ServiceListResponse } from "@/types/service.types"

export const serviceApi = {
  getAllServices: async (page = 1, limit = 10, params?: Record<string, any>): Promise<ServiceListResponse> => {
    const response = await api.get<ServiceListResponse>("/services", {
      params: { 
        page,
        limit,
        ...params
      },
    })
    return response.data
  },

  getServiceById: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`)
    return response.data.data
  },

  createService: async (formData: FormData): Promise<void> => {
    await api.post("/services", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  updateService: async (id: string, formData: FormData): Promise<void> => {
    await api.put(`/services/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`)
  },
}
