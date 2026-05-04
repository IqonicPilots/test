export interface EncounterTemplateProblem {
  _id: string
  label: string
  value: string
}

export interface EncounterTemplateObservation {
  _id: string
  label: string
  value: string
}

export interface EncounterTemplateNote {
  _id?: string
  note: string
}

export interface EncounterTemplatePrescription {
  _id?: string
  name: string | null
  dosage?: string
  frequency: string
  duration: string
  instruction: string
}

export interface EncounterTemplate {
  _id: string
  name: string
  problems?: EncounterTemplateProblem[]
  observations?: EncounterTemplateObservation[]
  doctor?: string
  isActive?: boolean
  notes?: EncounterTemplateNote[]
  prescriptions?: EncounterTemplatePrescription[]
  createdAt?: string
  updatedAt?: string
  __v?: number
}

export interface EncounterTemplateListResponse {
  statusCode: number
  data: EncounterTemplate[]
  message: string
  success: boolean
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export interface CreateEncounterTemplatePayload {
  name: string
  doctor?: string
}

export interface UpdateEncounterTemplatePayload {
  name?: string
  isActive?: boolean
  problems?: string[]
  observations?: string[]
  notes?: { note: string }[]
  prescriptions?: {
    name: string
    dosage?: string
    frequency: string
    duration: string
    instruction: string
  }[]
}
