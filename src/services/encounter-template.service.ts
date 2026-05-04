import { api } from "@/lib/api/axios"
import type {
  EncounterTemplate,
  EncounterTemplateListResponse,
  CreateEncounterTemplatePayload,
  UpdateEncounterTemplatePayload,
} from "@/types/encounter-template.types"

export type {
  EncounterTemplate,
  EncounterTemplateListResponse,
  CreateEncounterTemplatePayload,
  UpdateEncounterTemplatePayload,
} from "@/types/encounter-template.types"

export const encounterTemplateService = {
  getAll: async (
    page = 1,
    perPage = 10
  ): Promise<EncounterTemplateListResponse> => {
    const response = await api.get<EncounterTemplateListResponse>(
      "/encounter-templates",
      { params: { page, perPage } }
    )
    return response.data
  },

  getById: async (id: string): Promise<EncounterTemplate> => {
    const response = await api.get<{ data: EncounterTemplate }>(
      `/encounter-templates/${id}`
    )
    return response.data.data
  },

  create: async (
    payload: CreateEncounterTemplatePayload
  ): Promise<{ data: EncounterTemplate }> => {
    const response = await api.post<{ data: EncounterTemplate }>(
      "/encounter-templates",
      payload
    )
    return response.data
  },

  update: async (
    id: string,
    payload: UpdateEncounterTemplatePayload
  ): Promise<{ data: EncounterTemplate }> => {
    const response = await api.put<{ data: EncounterTemplate }>(
      `/encounter-templates/${id}`,
      payload
    )
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/encounter-templates/${id}`)
  },
}
