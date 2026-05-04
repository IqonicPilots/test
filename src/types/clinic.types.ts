import type { PaginatedResponse } from "./pagination.types"

export interface Clinic {
  _id: string
  name: string
  email: string
  mobile: string
  countryCode: string
  specialties: any[]
  clinicAdmin: {
    _id: string
    firstName: string
    lastName: string
    email: string
    mobile: string
    countryCode: string
    meta?: {
      avatar?: string
      profilePicture?: string
      clinics: string[]
      dob?: string
      gender?: string
      address?: {
        street?: string
        city?: string
        state?: string
        country?: string
        postalCode?: string
      }
    }
  }
  address: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  cliniclogo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ClinicFormData {
  name: string
  email: string
  mobile: string
  countryCode: string
  isActive: boolean
  clinicAdmin: {
    email: string
    firstName: string
    lastName: string
    mobile: string
    countryCode: string
    gender: string
    dob: string
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
    profilePicture?: File
  }
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  cliniclogo?: File
  clinic_specialties?: string[]
}

export type ClinicListResponse = PaginatedResponse<Clinic>
