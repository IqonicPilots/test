import type { PaginatedResponse } from "./pagination.types"

export interface Service {
  _id: string
  name: string
  charges: number | string
  duration: number | string
  category: string | { _id: string; label: string }
  clinic: string | { _id: string; name: string; email?: string; cliniclogo?: string; mobile?: string; countryCode?: string; address?: { street?: string; city?: string; state?: string; country?: string; postalCode?: string } }
  doctor?: string | { _id: string; firstName: string; lastName: string; name?: string; email?: string; mobile?: string; countryCode?: string; meta?: { profilePicture?: string; avatar?: string } }
  serviceImage?: string
  isActive: boolean
  telemed_service: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ServiceFormData {
  name: string
  charges: string
  duration: string
  category: string
  clinic: string[]
  doctor?: string[]
  serviceImage?: File
  isActive: string
}

export type ServiceListResponse = PaginatedResponse<Service>
