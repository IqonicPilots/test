import { api } from "@/lib/api/axios"
import type {
  UserProfile,
  UserProfileApiResponse,
  UserListApiResponse,
  Receptionist,
  Patient,
  UserRole,
} from "@/types/user.types"

export type {
  UserRole,
  ProfileAddress,
  ProfileSpecialty,
  ProfileClinic,
  UserProfileMeta,
  UserProfile,
  UserProfileApiResponse,
  UserListApiResponse,
  Receptionist,
  Patient,
} from "@/types/user.types"

export async function getProfile() {
  const response = await api.get<UserProfileApiResponse>("/users/profile")
  return response.data.data
}

export async function updateProfile(formData: FormData) {
  const response = await api.put<UserProfileApiResponse>("/users/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data
}

export async function getReceptionists(
  page = 1,
  limit = 10,
  filters?: {
    clinicId?: string
    status?: "active" | "inactive"
    search?: string
  }
) {
  const response = await api.get<UserListApiResponse<Receptionist>>("/users", {
    params: {
      role: "receptionist",
      page,
      limit,
      clinicId: filters?.clinicId || undefined,
      status: filters?.status || undefined,
      search: filters?.search?.trim() || undefined,
    },
  })

  return response.data
}

export async function createReceptionist(formData: FormData) {
  const response = await api.post<UserProfileApiResponse>("/users", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data as Receptionist
}

export async function updateReceptionist(id: string, formData: FormData) {
  const response = await api.put<UserProfileApiResponse>(`/users/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data as Receptionist
}

export async function getPatients(page = 1, limit = 10, search?: string, status?: "active" | "inactive", startDate?: string, endDate?: string) {
  const response = await api.get<UserListApiResponse<Patient>>("/users", {
    params: {
      role: "patient",
      page,
      limit,
      search: search?.trim() || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
  })

  return response.data
}

export type GetUsersParams = {
  page?: number
  limit?: number
  role?: UserRole | "all"
  status?: "active" | "inactive" | "all"
  clinicId?: string
  search?: string
}

export async function getUsers(params: GetUsersParams = {}) {
  const {
    page = 1,
    limit = 10,
    role,
    status,
    clinicId,
    search,
  } = params

  const response = await api.get<UserListApiResponse<UserProfile>>("/users", {
    params: {
      page,
      limit,
      role: role && role !== "all" ? role : undefined,
      status: status && status !== "all" ? status : undefined,
      clinicId: clinicId || undefined,
      search: search?.trim() || undefined,
    },
  })

  return response.data
}

export async function createPatient(formData: FormData) {
  const response = await api.post<UserProfileApiResponse>("/users", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data as Patient
}

export async function updatePatient(id: string, formData: FormData) {
  const response = await api.put<UserProfileApiResponse>(`/users/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data as Patient
}

export async function getUserById(id: string) {
  const response = await api.get<UserProfileApiResponse>(`/users/${id}`)
  return response.data.data
}

export async function deleteUser(id: string) {
  const response = await api.delete(`/users/${id}`)
  return response.data
}
