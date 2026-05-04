import { api } from "@/lib/api/axios"
import type {
  Tax,
  TaxPayload,
  TaxListResponse,
  TaxCalculationPayload,
  TaxCalculationResponse,
} from "@/types/tax.types"

export type { Tax, TaxPayload, TaxListResponse } from "@/types/tax.types"

export type GetAllTaxesFilters = {
  clinicId?: string
  /** Single doctor id; sent as `doctorIds` to match the taxes API. */
  doctorId?: string
  /** Single service id; sent as `serviceIds` to match the taxes API. */
  serviceId?: string
}

export const taxApi = {
  getAllTaxes: async (page = 1, limit = 10, filters?: GetAllTaxesFilters): Promise<TaxListResponse> => {
    const { clinicId, doctorId, serviceId } = filters || {}
    const response = await api.get<TaxListResponse>("/taxes", {
      params: {
        sortBy: "createdAt",
        sortOrder: "desc",
        page,
        limit,
        clinicId,
        doctorIds: doctorId,
        serviceIds: serviceId,
      },
    })
    return response.data
  },

  getTaxById: async (id: string): Promise<Tax> => {
    const response = await api.get(`/taxes/${id}`)
    return response.data.data
  },

  createTax: async (data: TaxPayload): Promise<Tax> => {
    const response = await api.post('/taxes', data)
    return response.data.data
  },

  updateTax: async (id: string, data: Partial<TaxPayload>): Promise<Tax> => {
    const response = await api.put(`/taxes/${id}`, data)
    return response.data.data
  },

  deleteTax: async (id: string): Promise<void> => {
    await api.delete(`/taxes/${id}`)
  },

  calculateTax: async (data: TaxCalculationPayload): Promise<TaxCalculationResponse> => {
    const response = await api.post('/taxes/calculate-tax', data)
    return response.data.data
  },
}
