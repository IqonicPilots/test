export type RegisterRole = "doctor" | "receptionist" | "patient"

export type UserRole = "admin" | "clinic_admin" | "doctor" | "receptionist" | "patient"

export type AuthUser = {
  id?: string
  email?: string
  role?: UserRole
  firstName?: string
  lastName?: string
  name?: string
  profilePicture?: string
  avatar?: string
  meta?: {
    profilePicture?: string
    avatar?: string
  }
}

export type AuthTokens = {
  accessToken?: string
  refreshToken?: string
}

export type RegisterPayload = {
  email: string
  password: string
  role: RegisterRole
  firstName: string
  lastName: string
  countryCode: string
  mobile: string
  clinics?: string[]
  specialties?: string[]
  description?: string
  gender?: string
  dob?: string
  bloodGroup?: string
  address?: string
}

export type RegisterResponse = {
  message?: string
  user?: AuthUser
  data?: {
    user?: AuthUser
    accessToken?: string
    refreshToken?: string
  }
  accessToken?: string
  refreshToken?: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  message?: string
  user?: AuthUser
  data?: {
    user?: AuthUser
    accessToken?: string
    refreshToken?: string
  }
  accessToken?: string
  refreshToken?: string
  token?: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}

export type ResendCredentialsPayload = {
  userId: string
}

export type ResendCredentialsResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}

export type ResetPasswordPayload = {
  token: string
  newPassword: string
}

export type ResetPasswordResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export type ChangePasswordResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}

export type LogoutResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}

export type LogoutPayload = {
  refreshToken?: string
}

export type DeleteAccountPayload = {
  confirmation: "DELETE"
}

export type DeleteAccountResponse = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: null
}
