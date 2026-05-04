"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { encounterTemplateService } from "@/services/encounter-template.service"
import type {
  EncounterTemplateListResponse,
  CreateEncounterTemplatePayload,
  UpdateEncounterTemplatePayload,
} from "@/types/encounter-template.types"

export const encounterTemplatesQueryKey = ["encounter-templates"] as const

export function useEncounterTemplate(id: string | null) {
  return useQuery({
    queryKey: ["encounter-template", id],
    queryFn: () => encounterTemplateService.getById(id!),
    enabled: !!id,
  })
}

export function useEncounterTemplates(page = 1, perPage = 10) {
  return useQuery<EncounterTemplateListResponse>({
    queryKey: [...encounterTemplatesQueryKey, { page, perPage }],
    queryFn: () => encounterTemplateService.getAll(page, perPage),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateEncounterTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateEncounterTemplatePayload) =>
      encounterTemplateService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encounterTemplatesQueryKey })
      toast.success("Encounter template created successfully.")
    },
    onError: (error) => {
      toast.error(
        `Failed to create encounter template: ${getApiErrorMessage(error)}`
      )
    },
  })
}

export function useUpdateEncounterTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateEncounterTemplatePayload
    }) => encounterTemplateService.update(id, payload),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: encounterTemplatesQueryKey })
      queryClient.invalidateQueries({
        queryKey: ["encounter-template", variables.id],
      })
      await queryClient.refetchQueries({
        queryKey: encounterTemplatesQueryKey,
        type: "all",
      })
      await queryClient.refetchQueries({
        queryKey: ["encounter-template", variables.id],
        type: "all",
      })
      const p = variables.payload
      const keys = Object.keys(p)
      if (keys.length === 1 && keys[0] === "isActive") {
        toast.success(
          p.isActive ? "Template activated." : "Template deactivated."
        )
      } else {
        toast.success("Encounter template updated successfully.")
      }
    },
    onError: (error) => {
      toast.error(
        `Failed to update encounter template: ${getApiErrorMessage(error)}`
      )
    },
  })
}

export function useDeleteEncounterTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => encounterTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: encounterTemplatesQueryKey })
      toast.success("Encounter template deleted successfully.")
    },
    onError: (error) => {
      toast.error(
        `Failed to delete encounter template: ${getApiErrorMessage(error)}`
      )
    },
  })
}
