"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  loginUser,
  registerUser,
  forgotPassword,
  resendCredentials,
  resetPassword,
  changePassword,
  logoutUser,
  deleteAccount,
  restoreAccount,
} from "@/services/auth.service"
import { getApiErrorMessage } from "@/lib/api/axios"
import { buildStoredAuthSession, clearAuthSession, saveAuthSession } from "@/lib/auth-session"
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
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

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: (data, variables) => {
      // Clear any existing cache data before logging in to prevent stale data
      queryClient.clear()
      saveAuthSession(buildStoredAuthSession(data, variables.email))
      toast.success(data.message ?? "Login successful")
      router.push("/dashboard")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useRegister() {
  const router = useRouter()

  return useMutation<RegisterResponse, Error, RegisterPayload>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data.message ?? "Account created successfully")
      router.push("/sign-in")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordPayload>({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      toast.success(data.message ?? "If an account exists, a reset link has been sent.")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useResendCredentials() {
  return useMutation<ResendCredentialsResponse, Error, ResendCredentialsPayload>({
    mutationFn: resendCredentials,
    onSuccess: (data) => {
      toast.success(data.message ?? "Credentials resent successfully")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useResetPassword() {
  const router = useRouter()

  return useMutation<ResetPasswordResponse, Error, ResetPasswordPayload>({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data.message ?? "Password reset successful")
      router.push("/sign-in")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordPayload>({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(data.message ?? "Password updated successfully")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<LogoutResponse, Error, LogoutPayload | undefined>({
    mutationFn: logoutUser,
    onSuccess: (data) => {
      toast.success(data.message ?? "Logged out successfully")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
    onSettled: () => {
      clearAuthSession()
      // Reset theme preference on logout to prevent dark mode persistence on the landing page.
      if (typeof window !== "undefined") {
        localStorage.removeItem("nextjs-ui-theme")
        window.location.href = "/"
      }
      queryClient.clear()
    },
  })
}

export function useDeleteAccount() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<DeleteAccountResponse, Error, DeleteAccountPayload>({
    mutationFn: deleteAccount,
    onSuccess: (data) => {
      clearAuthSession()
      queryClient.clear()
      toast.success(data.message ?? "Account deleted successfully")
      router.replace("/")
      router.refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useRestoreAccount() {
  const router = useRouter()

  return useMutation<any, Error, { email: string }>({
    mutationFn: restoreAccount,
    onSuccess: (data) => {
      toast.success(data.message ?? "Account restored successfully. Please sign in.")
      router.push("/sign-in")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
