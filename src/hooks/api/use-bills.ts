"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { billApi } from "@/services/bill.service"
import type { BillListResponse, BillPayload } from "@/types/bill.types"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"

export function useBills(
  page = 1,
  perPage = 10,
  filters?: {
    search?: string
    encounterId?: string
    patientId?: string
    doctorId?: string
    clinicId?: string
    status?: string
    receptionist?: string
    clinicAdmin?: string
  }
) {
  const queryKey = useMemo(() => ["bills", { page, perPage, ...filters }], [page, perPage, filters])

  return useQuery<BillListResponse>({
    queryKey,
    queryFn: () => billApi.getAllBills(page, perPage, filters),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Fetches aggregate stats only (minimal page size). Use role scope only — do not pass table filters
 * (search, patient, status, user-selected clinic/doctor) so KPI cards stay fixed while the table filters.
 */
export function useBillSummaryStats(
  filters?: { doctorId?: string; clinicId?: string },
  options?: { enabled?: boolean }
) {
  const queryKey = useMemo(() => ["bills", "summary-stats", filters ?? {}], [filters])

  return useQuery<BillListResponse>({
    queryKey,
    queryFn: () => billApi.getAllBills(1, 1, filters),
    // Keep low stale time so KPIs refresh when bills are created/updated elsewhere (e.g. encounter flow)
    staleTime: 0,
    refetchOnMount: "always",
    enabled: options?.enabled ?? true,
  })
}

export function useBillsByEncounter(encounterId: string | undefined, enabled = true) {
  const queryKey = useMemo(() => ["bills", "by-encounter", encounterId], [encounterId])

  return useQuery<BillListResponse>({
    queryKey,
    queryFn: () => billApi.getAllBills(1, 10, { encounterId: encounterId! }),
    enabled: Boolean(encounterId && enabled),
    // Avoid stale "no bill" or outdated totals when opening the bill dialog right after a sync/save
    staleTime: 0,
    refetchOnMount: "always",
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BillPayload) => billApi.createBill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] })
      queryClient.invalidateQueries({ queryKey: ["bills", "by-encounter"] })
      queryClient.resetQueries({ queryKey: ["appointments"] })
      queryClient.resetQueries({ queryKey: ["infinite-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["encounter"] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Bill created successfully")
    },
    onError: (error) => {
      toast.error(`Failed to create bill: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillPayload> }) =>
      billApi.updateBill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] })
      queryClient.invalidateQueries({ queryKey: ["bills", "by-encounter"] })
      queryClient.resetQueries({ queryKey: ["appointments"] })
      queryClient.resetQueries({ queryKey: ["infinite-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["encounter"] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Bill updated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to update bill: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => billApi.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] })
      queryClient.invalidateQueries({ queryKey: ["bills", "by-encounter"] })
      queryClient.invalidateQueries({ queryKey: ["bills", "summary-stats"] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      queryClient.resetQueries({ queryKey: ["appointments"] })
      queryClient.resetQueries({ queryKey: ["infinite-appointments"] })
      toast.success("Bill deleted successfully. Encounter reactivated.")
    },
    onError: (error) => {
      toast.error(`Failed to delete bill: ${getApiErrorMessage(error)}`)
    },
  })
}
