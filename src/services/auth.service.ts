import { api } from "@/lib/api/axios"
import type {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResendCredentialsPayload,
  ResendCredentialsResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  LogoutPayload,
  LogoutResponse,
  DeleteAccountPayload,
  DeleteAccountResponse,
} from "@/types/auth.types"

export type {
  RegisterRole,
  AuthUser,
  AuthTokens,
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResendCredentialsPayload,
  ResendCredentialsResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  LogoutPayload,
  LogoutResponse,
  DeleteAccountPayload,
  DeleteAccountResponse,
} from "@/types/auth.types"

export async function registerUser(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>("/auth/register", payload)
  return data
}

export async function loginUser(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>("/auth/login", payload)
  return data
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", payload)
  return data
}

export async function resendCredentials(payload: ResendCredentialsPayload) {
  const { data } = await api.post<ResendCredentialsResponse>(`/auth/resend-credentials/${payload.userId}`)
  return data
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password", payload)
  return data
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.post<ChangePasswordResponse>("/auth/change-password", payload)
  return data
}

export async function logoutUser(payload?: LogoutPayload) {
  const { data } = await api.post<LogoutResponse>("/auth/logout", payload)
  return data
}

export async function deleteAccount(payload: DeleteAccountPayload) {
  const { data } = await api.delete<DeleteAccountResponse>("/auth/delete-account", {
    data: payload,
  })
  return data
}

export async function restoreAccount(payload: { email: string }) {
  const { data } = await api.post("/auth/restore", payload)
  return data
}
