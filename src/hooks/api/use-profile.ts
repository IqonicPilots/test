"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { getProfile, updateProfile, getUserById } from "@/services/user.service"
import type { UserProfile } from "@/types/user.types"

export const profileQueryKey = ["user-profile"] as const

export function useProfile(options?: { enabled?: boolean }) {
  return useQuery<UserProfile>({
    queryKey: profileQueryKey,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useUser(id?: string) {
  return useQuery<UserProfile>({
    queryKey: ["user", id],
    queryFn: () => getUserById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, FormData>({
    mutationFn: updateProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(profileQueryKey, profile)
      await queryClient.invalidateQueries({ queryKey: profileQueryKey })
      toast.success("Profile updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${getApiErrorMessage(error)}`)
    },
  })
}
