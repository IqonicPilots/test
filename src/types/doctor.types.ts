import type { PaginatedResponse } from "./pagination.types"

export interface DoctorSpecialtyRef {
  _id: string
  label?: string
  value?: string
}

export interface DoctorClinicRef {
  _id: string
  name?: string
}

export interface DoctorMeta {
  _id?: string
  address?:
    | {
        street?: string
        city?: string
        state?: string
        country?: string
        postalCode?: string
      }
    | string
  profilePicture?: string
  avatar?: string
  gender?: "Male" | "Female" | "Other"
  dob?: string
  experience?: number
  city?: string
  state?: string
  country?: string
  postalCode?: string
  specialties?: Array<string | DoctorSpecialtyRef>
  description?: string
  signature?: string
  clinics?: Array<string | DoctorClinicRef>
}

export interface Doctor {
  _id: string
  email: string
  role: "doctor"
  firstName: string
  lastName: string
  countryCode?: string
  mobile?: string
  isActive: boolean
  avgRating?: number | null
  createdAt: string
  updatedAt: string
  meta?: DoctorMeta
}

export interface CreateDoctorPayload {
  email: string
  role: "doctor"
  firstName: string
  lastName: string
  mobile: string
  countryCode: string
  gender: string
  dob: string
  experience?: string
  description?: string
  clinics: string[]
  specialties: string[]
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  isActive: boolean
  profilePicture?: File | string
  signatureImage?: File | string
}

export interface UpdateDoctorPayload {
  email?: string
  firstName?: string
  lastName?: string
  mobile?: string
  countryCode?: string
  gender?: string
  dob?: string
  experience?: string
  description?: string
  clinics?: string[]
  specialties?: string[]
  isActive?: boolean
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export interface UpdateDoctorFormPayload {
  email: string
  firstName: string
  lastName: string
  mobile: string
  countryCode: string
  gender: string
  dob: string
  experience?: string
  description?: string
  clinics: string[]
  specialties: string[]
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  isActive: boolean
  profilePicture?: File | string
  signatureImage?: File | string
}

export type DoctorListResponse = PaginatedResponse<Doctor>
