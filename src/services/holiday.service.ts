import { api } from "@/lib/api/axios"

export type HolidayMode = "single" | "multiple" | "range"

export interface Holiday {
  _id: string
  category: "clinic" | "doctor"
  target: { _id: string; name?: string; firstName?: string; lastName?: string }
  targetModel: "Clinic" | "User"
  mode: HolidayMode
  holiday_dates: string[]
  description?: string
  apply_specific_time?: boolean
  specific_time?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface HolidayListResponse {
  data: Holiday[]
  pagination?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export interface GetHolidaysParams {
  page?: number
  perPage?: number
  category?: string
  targetId?: string
  includeInactive?: boolean
  search?: string
  dateFrom?: string
  dateTo?: string
}

export async function getHolidays(params?: GetHolidaysParams) {
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 10
  const response = await api.get<HolidayListResponse>("/holidays", {
    params: {
      page,
      perPage,
      limit: perPage,
      category: params?.category,
      targetId: params?.targetId,
      includeInactive: params?.includeInactive ? "true" : undefined,
      search: params?.search?.trim() || undefined,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
    },
  })
  return response.data
}

export async function getHolidayById(id: string) {
  const response = await api.get<{ data: Holiday }>(`/holidays/${id}`)
  return response.data.data
}

export async function createHoliday(data: {
  category: "clinic" | "doctor"
  target: string
  mode: HolidayMode
  holiday_dates: string[]
  description?: string
  apply_specific_time?: boolean
  specific_time?: string[]
}) {
  const response = await api.post<{ data: Holiday }>("/holidays", data)
  return response.data.data
}

export type UpdateHolidayPayload = Partial<Omit<Holiday, "target">> & {
  target?: string
}

export async function updateHoliday(id: string, data: UpdateHolidayPayload) {
  const response = await api.put<{ data: Holiday }>(`/holidays/${id}`, data)
  return response.data.data
}

export async function deleteHoliday(id: string) {
  await api.delete(`/holidays/${id}`)
}
