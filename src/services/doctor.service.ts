import { api } from "@/lib/api/axios"
import type {
  Doctor,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  UpdateDoctorFormPayload,
  DoctorListResponse,
} from "@/types/doctor.types"

export type {
  DoctorSpecialtyRef,
  DoctorClinicRef,
  DoctorMeta,
  Doctor,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  UpdateDoctorFormPayload,
  DoctorListResponse,
} from "@/types/doctor.types"

function appendIfPresent(formData: FormData, key: string, value: string | number | boolean | undefined) {
  if (value === undefined || value === null || value === "") {
    return
  }

  formData.append(key, String(value))
}

function appendUpload(formData: FormData, key: string, file?: File | string | null) {
  if (file instanceof File) {
    formData.append(key, file)
  } else if (file === "" || file === null) {
    formData.append(key, "")
  }
}

function appendNestedAddress(
  formData: FormData,
  address?: string,
  city?: string,
  state?: string,
  country?: string,
  postalCode?: string
) {
  appendIfPresent(formData, "address[street]", address?.trim())
  appendIfPresent(formData, "address[city]", city?.trim())
  appendIfPresent(formData, "address[state]", state?.trim())
  appendIfPresent(formData, "address[country]", country?.trim())
  appendIfPresent(formData, "address[postalCode]", postalCode?.trim())
}

export function buildDoctorFormData(payload: CreateDoctorPayload) {
  const formData = new FormData()

  formData.append("email", payload.email.trim().toLowerCase())
  formData.append("role", "doctor")
  formData.append("firstName", payload.firstName.trim())
  formData.append("lastName", payload.lastName.trim())
  formData.append("mobile", payload.mobile.trim())
  formData.append("countryCode", payload.countryCode.trim())
  formData.append("gender", payload.gender)
  formData.append("dob", payload.dob)
  formData.append("isActive", String(payload.isActive))
  payload.clinics.forEach((clinicId, index) => {
    formData.append(`clinics[${index}]`, clinicId)
  })
  payload.specialties.forEach((specialtyId, index) => {
    formData.append(`specialties[${index}]`, specialtyId)
  })

  appendIfPresent(formData, "experience", payload.experience)
  appendIfPresent(formData, "description", payload.description)
  appendIfPresent(formData, "address", payload.address?.trim())
  appendIfPresent(formData, "city", payload.city?.trim())
  appendIfPresent(formData, "state", payload.state?.trim())
  appendIfPresent(formData, "country", payload.country?.trim())
  appendIfPresent(formData, "postalCode", payload.postalCode?.trim())

  appendUpload(formData, "profilePicture", payload.profilePicture)
  appendUpload(formData, "signatureImage", payload.signatureImage)

  return formData
}

export function buildDoctorUpdateFormData(payload: UpdateDoctorFormPayload) {
  const formData = new FormData()

  formData.append("email", payload.email.trim().toLowerCase())
  formData.append("firstName", payload.firstName.trim())
  formData.append("lastName", payload.lastName.trim())
  formData.append("mobile", payload.mobile.trim())
  formData.append("countryCode", payload.countryCode.trim())
  formData.append("gender", payload.gender)
  formData.append("dob", payload.dob)
  formData.append("isActive", String(payload.isActive))
  payload.clinics.forEach((clinicId, index) => {
    formData.append(`clinics[${index}]`, clinicId)
  })
  payload.specialties.forEach((specialtyId, index) => {
    formData.append(`specialties[${index}]`, specialtyId)
  })

  appendIfPresent(formData, "experience", payload.experience)
  appendIfPresent(formData, "description", payload.description)
  appendNestedAddress(
    formData,
    payload.address,
    payload.city,
    payload.state,
    payload.country,
    payload.postalCode
  )

  appendUpload(formData, "profilePicture", payload.profilePicture)
  appendUpload(formData, "signatureImage", payload.signatureImage)

  return formData
}

export const doctorApi = {
  async getAllDoctors(
    page = 1,
    limit = 10,
    filters?: {
      clinicId?: string
      specialtyId?: string
      status?: "active" | "inactive"
      search?: string
      sort?: string
    }
  ): Promise<DoctorListResponse> {
    const response = await api.get<DoctorListResponse>("/users", {
      params: {
        role: "doctor",
        page,
        limit,
        clinicId: filters?.clinicId || undefined,
        specialtyId: filters?.specialtyId || undefined,
        status: filters?.status || undefined,
        search: filters?.search?.trim() || undefined,
        sort: filters?.sort || undefined,
      },
    })

    return response.data
  },

  async createDoctor(formData: FormData): Promise<Doctor> {
    const response = await api.post("/users", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data.data
  },

  async updateDoctor(id: string, data: UpdateDoctorPayload): Promise<Doctor> {
    const response = await api.put(`/users/${id}`, data)
    return response.data.data
  },

  async updateDoctorWithFormData(id: string, formData: FormData): Promise<Doctor> {
    const response = await api.put(`/users/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data.data
  },

  async deleteDoctor(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async getDoctorsByClinic(clinicId: string, page = 1, limit = 10): Promise<DoctorListResponse> {
    const response = await api.get<DoctorListResponse>("/users", {
      params: { role: "doctor", clinicId, page, limit, status: "active" },
    })

    return response.data
  },

  async getDoctorById(id: string): Promise<Doctor> {
    const response = await api.get(`/users/${id}`)
    return response.data.data
  },
}
