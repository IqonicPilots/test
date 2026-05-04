"use client"

import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useMemo } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { encounterService } from "@/services/encounter.service"
import type { Encounter, EncounterListResponse, EncounterReportPayload } from "@/types/encounter.types"

export function useEncounter(encounterId: string | null) {
  return useQuery<Encounter>({
    queryKey: ["encounter", encounterId],
    queryFn: () => encounterService.getEncounterById(encounterId!),
    enabled: !!encounterId,
  })
}

export function useEncounterByAppointment(appointmentId: string | undefined, enabled = true) {
  return useQuery<Encounter | null>({
    queryKey: ["encounter", "by-appointment", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null
      return encounterService.getEncounterByAppointment(appointmentId)
    },
    enabled: !!appointmentId && enabled,
    retry: (failureCount, error) => {
      // 404 means there is no encounter yet for this appointment.
      // Avoid retry noise for this expected state.
      if (isAxiosError(error) && error.response?.status === 404) {
        return false
      }
      return failureCount < 2
    },
  })
}

export type UseEncountersParams = {
  page?: number
  perPage?: number
  status?: string
  startDate?: string
  endDate?: string
  patientId?: string
  doctorId?: string
  clinicId?: string
}

export function useEncounters(params: UseEncountersParams = {}) {
  const { page = 1, perPage = 10, status, startDate, endDate, patientId, doctorId, clinicId } = params
  const queryKey = useMemo(() => ["encounters", { page, perPage, status, startDate, endDate, patientId, doctorId, clinicId }], [page, perPage, status, startDate, endDate, patientId, doctorId, clinicId])

  return useQuery<EncounterListResponse, Error>({
    queryKey,
    queryFn: async () => {
      const response = await encounterService.getAllEncounters(page, perPage, "createdAt", "desc", status, startDate, endDate, patientId, doctorId, clinicId)
      return response
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useInfiniteEncounters(params: UseEncountersParams = {}) {
  const { perPage = 10, status, startDate, endDate, patientId, doctorId, clinicId } = params
  const queryKey = useMemo(() => ["infinite-encounters", { perPage, status, startDate, endDate, patientId, doctorId, clinicId }], [perPage, status, startDate, endDate, patientId, doctorId, clinicId])

  return useInfiniteQuery<EncounterListResponse, Error>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      return encounterService.getAllEncounters(
        pageParam as number,
        perPage,
        "createdAt",
        "desc",
        status,
        startDate,
        endDate,
        patientId,
        doctorId,
        clinicId
      )
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
  })
}

export function useEncounterReports(patientId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["encounter-reports", patientId],
    queryFn: () => encounterService.getEncounterReports(patientId!),
    enabled: !!patientId && enabled,
  })
}

export function useAddEncounterReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: EncounterReportPayload }) =>
      encounterService.addEncounterReport(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      queryClient.invalidateQueries({ queryKey: ["encounter-reports"] })
      // toast.success("Encounter report added successfully")
    },
    onError: (error) => {
      toast.error(`Failed to add encounter report: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useCreateEncounter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      appointment?: string
      clinic: string
      doctor: string
      patient: string
      encounterDate?: string
    }) => encounterService.createEncounter(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      await queryClient.refetchQueries({ queryKey: ["encounters"], type: "all" })
      queryClient.invalidateQueries({ queryKey: ["encounterable-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
    },
    onError: (error) => {
      toast.error(`Failed to create encounter: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateEncounter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { templateId?: string; [key: string]: unknown }
    }) => encounterService.updateEncounter(id, data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      await queryClient.refetchQueries({ queryKey: ["encounters"], type: "all" })
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.id] })
      queryClient.resetQueries({ queryKey: ["appointments"] })
      queryClient.resetQueries({ queryKey: ["infinite-appointments"] })
    },
    onError: (error) => {
      toast.error(`Failed to update encounter: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useAddEncounterNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      note,
    }: {
      encounterId: string
      note: string
    }) => encounterService.addEncounterNote(encounterId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Note added successfully")
    },
    onError: (error) => {
      toast.error(`Failed to add note: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateEncounterNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      noteId,
      note,
    }: {
      encounterId: string
      noteId: string
      note: string
    }) => encounterService.updateEncounterNote(encounterId, noteId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Note updated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to update note: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounterNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ encounterId, noteId }: { encounterId: string; noteId: string }) =>
      encounterService.deleteEncounterNote(encounterId, noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Note deleted successfully")
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounterProblem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ encounterId, dataId }: { encounterId: string; dataId: string }) =>
      encounterService.deleteEncounterProblem(encounterId, dataId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Problem removed successfully")
    },
    onError: (error) => {
      toast.error(`Failed to remove problem: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounterObservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ encounterId, dataId }: { encounterId: string; dataId: string }) =>
      encounterService.deleteEncounterObservation(encounterId, dataId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Observation removed successfully")
    },
    onError: (error) => {
      toast.error(`Failed to remove observation: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useAddEncounterPrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      data,
    }: {
      encounterId: string
      data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
    }) => encounterService.addEncounterPrescription(encounterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Prescription added successfully")
    },
    onError: (error) => {
      toast.error(`Failed to add prescription: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateEncounterPrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      prescriptionId,
      data,
    }: {
      encounterId: string
      prescriptionId: string
      data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
    }) => encounterService.updateEncounterPrescription(encounterId, prescriptionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Prescription updated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to update prescription: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounterPrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ encounterId, prescriptionId }: { encounterId: string; prescriptionId: string }) =>
      encounterService.deleteEncounterPrescription(encounterId, prescriptionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Prescription removed successfully")
    },
    onError: (error) => {
      toast.error(`Failed to remove prescription: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useAddEncounterProblem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      dataId,
    }: {
      encounterId: string
      dataId: string
    }) => encounterService.addEncounterProblem(encounterId, dataId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Problem added successfully")
    },
    onError: (error) => {
      toast.error(`Failed to add problem: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useAddEncounterObservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      encounterId,
      dataId,
    }: {
      encounterId: string
      dataId: string
    }) => encounterService.addEncounterObservation(encounterId, dataId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      toast.success("Observation added successfully")
    },
    onError: (error) => {
      toast.error(`Failed to add observation: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => encounterService.deleteEncounter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      queryClient.invalidateQueries({ queryKey: ["encounterable-appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
      toast.success("Encounter deleted successfully")
    },
    onError: (error) => {
      toast.error(`Failed to delete encounter: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateEncounterReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ patientId, reportId, data }: { patientId: string; reportId: string; data: any }) =>
      encounterService.updateEncounterReport(patientId, reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounter-reports"] })
      toast.success("Report updated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteEncounterReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ encounterId, reportId }: { encounterId: string; reportId: string }) =>
      encounterService.deleteEncounterReport(encounterId, reportId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["encounter", variables.encounterId] })
      queryClient.invalidateQueries({ queryKey: ["encounters"] })
      queryClient.invalidateQueries({ queryKey: ["encounter-reports"] })
      toast.success("Report deleted successfully")
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useEmailEncounterReport() {
  return useMutation({
    mutationFn: (encounterId: string) => encounterService.emailEncounterReport(encounterId),
    onSuccess: () => {
      toast.success("Report sent via email successfully")
    },
    onError: (error) => {
      toast.error(`Failed to send report via email: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useEncounterableAppointments(params: { clinicId?: string, doctorId?: string, patientId?: string } = {}) {
  const queryKey = useMemo(() => ["encounterable-appointments", params], [params])

  return useQuery({
    queryKey,
    queryFn: () => encounterService.getEncounterableAppointments(params),
  })
}
