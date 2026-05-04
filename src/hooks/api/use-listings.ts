"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { listingApi } from "@/services/listing.service"
import type { StaticData, ListingFormData, UpdateListingFormData } from "@/types/listing.types"

export const listingDataQueryKey = ["listing-data"] as const

export function useListingData(type?: string, isActive?: boolean) {
  const queryKey = useMemo(() => [...listingDataQueryKey, type ?? "all", isActive ?? "all"], [type, isActive])

  return useQuery<StaticData[]>({
    queryKey,
    queryFn: () => listingApi.getAllListingData(type, isActive),
    placeholderData: (previousData) => previousData,
  })
}

export function useAllListings() {
  const queryKey = useMemo(() => [...listingDataQueryKey, "all"], [])

  return useQuery<StaticData[]>({
    queryKey,
    queryFn: () => listingApi.getAllListingData(),
    placeholderData: (previousData) => previousData,
  })
}

export function useSpecialties() {
  const queryKey = useMemo(() => [...listingDataQueryKey, "specialties-fallback", true], [])

  return useQuery<StaticData[]>({
    queryKey,
    queryFn: async () => {
      const candidateTypes = ["specialties", "specialization", "specialty"]

      for (const type of candidateTypes) {
        const data = await listingApi.getAllListingData(type, true)
        if (data.length > 0) {
          return data
        }
      }

      return []
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation<StaticData, Error, ListingFormData>({
    mutationFn: (data) => listingApi.createListingData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingDataQueryKey })
    },
    onError: (error) => {
      toast.error(`Failed to create listing: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation<StaticData, Error, { id: string; data: UpdateListingFormData }>({
    mutationFn: ({ id, data }) => listingApi.updateListingData(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingDataQueryKey })
    },
    onError: (error) => {
      toast.error(`Failed to update listing: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => listingApi.deleteListingData(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingDataQueryKey })
      toast.success("Listing deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete listing: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useToggleListingStatus() {
  const queryClient = useQueryClient()

  return useMutation<StaticData, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => listingApi.updateListingData(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: listingDataQueryKey })
      toast.success(
        variables.isActive ? "Listing activated successfully." : "Listing deactivated successfully."
      )
    },
    onError: (error) => {
      toast.error(`Failed to update listing status: ${getApiErrorMessage(error)}`)
    },
  })
}
