import { api } from "@/lib/api/axios"

export type Permission = {
  key: string
  label: string
  status: "active" | "inactive"
  enabled: boolean
}

export type PermissionModule = {
  key: string
  label: string
  permissions: Permission[]
}

export type RolePermissions = {
  key: string
  name: string
  modules: PermissionModule[]
}

export type PermissionModuleData = {
  roles: RolePermissions[]
}

type SettingsResponse<T> = {
  statusCode: number
  data: T
  message?: string
  success?: boolean
}

export const advancedSettingsApi = {
  getSettings: async (): Promise<PermissionModuleData> => {
    const response = await api.get<SettingsResponse<any>>("/settings/permission_module")
    // The response structure from backend matches current implementation
    return response.data?.data ?? { roles: [] }
  },

  saveSettings: async (data: PermissionModuleData): Promise<any> => {
    const payload = {
      name: "permission_module",
      data,
    }
    const response = await api.post<SettingsResponse<any>>("/settings", payload)
    return response.data?.data
  },
}
