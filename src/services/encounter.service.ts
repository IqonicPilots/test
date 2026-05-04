import { api } from '@/lib/api/axios'
import type { 
  Encounter, 
  EncounterReportPayload, 
  EncounterListResponse 
} from '@/types/encounter.types'

export type { 
  Encounter, 
  EncounterReportPayload, 
  EncounterListResponse 
} from '@/types/encounter.types'

export const encounterService = {
  getAllEncounters: async (
    page = 1, 
    perPage = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    status?: string,
    startDate?: string,
    endDate?: string,
    patientId?: string,
    doctorId?: string,
    clinicId?: string
  ): Promise<EncounterListResponse> => {
    const params: any = { page, perPage, sortBy, sortOrder }
    if (status && status !== 'All') {
      params.status = status
    }
    if (startDate) {
      params.startDate = startDate
    }
    if (endDate) {
      params.endDate = endDate
    }
    if (patientId) {
      params.patientId = patientId
    }
    if (doctorId) {
      params.doctorId = doctorId
    }
    if (clinicId) {
      params.clinicId = clinicId
    }
    const response = await api.get<EncounterListResponse>('/encounters', { params })
    return response.data
  },

  getEncounterReports: async (patientId: string): Promise<any[]> => {
    const response = await api.get(`/encounters/reports/${patientId}`)
    return response.data.data
  },

  addEncounterReport: async (patientId: string, data: EncounterReportPayload): Promise<any> => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("date", data.date)
    
    if (data.file && (data.file as any).name && (data.file as any).size && (data.file as any).type) {
      formData.append("file", data.file as unknown as File)
    } else if (typeof data.file === "string") {
      formData.append("fileUrl", data.file)
    }
    
    const response = await api.post(`/encounters/reports/${patientId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getEncounterById: async (id: string): Promise<Encounter> => {
    const response = await api.get<{ data: Encounter }>(`/encounters/${id}`)
    return response.data.data
  },

  getEncounterByAppointment: async (appointmentId: string): Promise<Encounter | null> => {
    try {
      const response = await api.get<{ data: Encounter }>(`/encounters/by-appointment/${appointmentId}`)
      return response.data.data
    } catch {
      return null
    }
  },

  createEncounter: async (data: {
    appointment?: string
    clinic: string
    doctor: string
    patient: string
    encounterDate?: string
  }): Promise<Encounter> => {
    const response = await api.post<{ data: Encounter }>('/encounters', data)
    return response.data.data
  },

  updateEncounter: async (
    id: string,
    data: { templateId?: string; [key: string]: unknown }
  ): Promise<Encounter> => {
    const response = await api.put<{ data: Encounter }>(`/encounters/${id}`, data)
    return response.data.data
  },

  addEncounterNote: async (encounterId: string, note: string): Promise<unknown> => {
    const response = await api.post(`/encounters/${encounterId}/notes`, { note })
    return response.data.data
  },

  updateEncounterNote: async (encounterId: string, noteId: string, note: string): Promise<unknown> => {
    const response = await api.put(`/encounters/${encounterId}/notes/${noteId}`, { note })
    return response.data.data
  },

  addEncounterPrescription: async (
    encounterId: string,
    data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
  ): Promise<unknown> => {
    const response = await api.post(`/encounters/${encounterId}/prescriptions`, data)
    return response.data.data
  },

  updateEncounterPrescription: async (
    encounterId: string,
    prescriptionId: string,
    data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
  ): Promise<unknown> => {
    const response = await api.put(
      `/encounters/${encounterId}/prescriptions/${prescriptionId}`,
      data
    )
    return response.data.data
  },

  addEncounterProblem: async (
    encounterId: string,
    dataId: string
  ): Promise<Encounter> => {
    const response = await api.post<{ data: Encounter }>(
      `/encounters/${encounterId}/problems`,
      { dataId }
    )
    return response.data.data
  },

  addEncounterObservation: async (
    encounterId: string,
    dataId: string
  ): Promise<Encounter> => {
    const response = await api.post<{ data: Encounter }>(
      `/encounters/${encounterId}/observations`,
      { dataId }
    )
    return response.data.data
  },

  deleteEncounter: async (id: string): Promise<void> => {
    await api.delete(`/encounters/${id}`)
  },

  deleteEncounterNote: async (encounterId: string, noteId: string): Promise<unknown> => {
    const response = await api.delete(`/encounters/${encounterId}/notes/${noteId}`)
    return response.data.data
  },

  deleteEncounterProblem: async (encounterId: string, dataId: string): Promise<Encounter> => {
    const response = await api.delete(`/encounters/${encounterId}/problems/${dataId}`)
    return response.data.data
  },

  deleteEncounterObservation: async (encounterId: string, dataId: string): Promise<Encounter> => {
    const response = await api.delete(`/encounters/${encounterId}/observations/${dataId}`)
    return response.data.data
  },

  deleteEncounterPrescription: async (encounterId: string, prescriptionId: string): Promise<unknown> => {
    const response = await api.delete(`/encounters/${encounterId}/prescriptions/${prescriptionId}`)
    return response.data.data
  },

  updateEncounterReport: async (patientId: string, reportId: string, data: any): Promise<any> => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("date", data.date)
    
    if (data.file && (data.file as any).name && (data.file as any).size && (data.file as any).type) {
      formData.append("file", data.file as unknown as File)
    } else if (typeof data.file === "string") {
      formData.append("fileUrl", data.file)
    }
    
    const response = await api.put(`/encounters/reports/${patientId}/${reportId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deleteEncounterReport: async (encounterId: string, reportId: string): Promise<void> => {
    await api.delete(`/encounters/reports/${encounterId}/${reportId}`)
  },

  emailEncounterReport: async (encounterId: string): Promise<void> => {
    await api.post(`/encounters/reports/${encounterId}/send-email`)
  },
  
  getEncounterableAppointments: async (params?: { clinicId?: string, doctorId?: string, patientId?: string }): Promise<any[]> => {
    const response = await api.get('/encounters/encounterable-appointments', { params })
    return response.data.data
  },
}
