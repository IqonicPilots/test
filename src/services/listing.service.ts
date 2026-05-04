import { api } from "@/lib/api/axios"
import type { StaticData, ListingFormData, UpdateListingFormData } from "@/types/listing.types"

export type { StaticData, ListingFormData, UpdateListingFormData } from "@/types/listing.types"

export const listingApi = {
  getAllListingData: async (type?: string, isActive?: boolean): Promise<StaticData[]> => {
    const params = new URLSearchParams()
    if (type) params.append("type", type)
    if (isActive !== undefined) params.append("isActive", isActive.toString())

    const response = await api.get(`/listing-data?${params.toString()}`)
    return response.data.data
  },

  getListingDataById: async (id: string): Promise<StaticData> => {
    const response = await api.get(`/listing-data/${id}`)
    return response.data.data
  },

  createListingData: async (data: ListingFormData): Promise<StaticData> => {
    const response = await api.post("/listing-data", data)
    return response.data.data
  },

  updateListingData: async (id: string, data: UpdateListingFormData): Promise<StaticData> => {
    const response = await api.put(`/listing-data/${id}`, data)
    return response.data.data
  },

  deleteListingData: async (id: string): Promise<void> => {
    await api.delete(`/listing-data/${id}`)
  },
}
