import type { Pagination } from "./pagination.types"

export type UserRole = "admin" | "clinic_admin" | "doctor" | "receptionist" | "patient"

export type ProfileAddress = {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export type ProfileSpecialty = {
  _id: string
  label?: string
  value?: string
}

export type ProfileClinic = {
  _id: string
  name?: string
  email?: string
}

export type UserProfileMeta = {
  profilePicture?: string
  avatar?: string
  gender?: "Male" | "Female" | "Other"
  bloodGroup?: string
  dob?: string
  experience?: number
  specialties?: Array<string | ProfileSpecialty>
  description?: string
  signature?: string
  address?: ProfileAddress
  clinics?: Array<string | ProfileClinic>
  addressLine1?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export type UserProfile = {
  _id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  mobile?: string
  countryCode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  meta?: UserProfileMeta | null
}

export type UserProfileApiResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data: UserProfile
}

export type UserListApiResponse<TUser> = {
  statusCode: number
  success: boolean
  message: string
  data: TUser[]
  pagination: Pagination
  stats?: {
    total: number
    active: number
    inactive: number
    newThisMonth: number
  }
}

export type Receptionist = UserProfile & {
  role: "receptionist"
}

export type Patient = UserProfile & {
  role: "patient"
}
