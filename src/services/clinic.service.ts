import { api } from "@/lib/api/axios"
import type { Clinic, ClinicListResponse } from "@/types/clinic.types"

export type { Clinic, ClinicFormData, ClinicListResponse } from "@/types/clinic.types"

export const clinicApi = {
  getAllClinics: async (page = 1, limit = 10, filters?: { search?: string; isActive?: boolean; sortBy?: string }): Promise<ClinicListResponse> => {
    const response = await api.get<ClinicListResponse>("/clinics", {
      params: { page, limit, ...filters }
    })
    return response.data
  },

  getClinicById: async (id: string): Promise<Clinic> => {
    const response = await api.get(`/clinics/${id}`)
    return response.data.data
  },

  createClinic: async (formData: FormData): Promise<void> => {
    await api.post("/clinics", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  updateClinic: async (id: string, formData: FormData): Promise<void> => {
    await api.put(`/clinics/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },

  deleteClinic: async (id: string): Promise<void> => {
    await api.delete(`/clinics/${id}`)
  },
}
