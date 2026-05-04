"use client"

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { getUsers, type GetUsersParams } from "@/services/user.service"
import type { UserListApiResponse, UserProfile } from "@/types/user.types"

export const usersQueryKey = ["users"] as const

export function useUsers(params: GetUsersParams = {}) {
  const {
    page = 1,
    limit = 10,
    role = "all",
    status = "all",
    clinicId = "",
    search = "",
  } = params

  const queryKey = useMemo(() => [...usersQueryKey, { page, limit, role, status, clinicId, search }], [page, limit, role, status, clinicId, search])

  return useQuery<UserListApiResponse<UserProfile>>({
    queryKey,
    queryFn: () => getUsers({ page, limit, role, status, clinicId, search }),
    placeholderData: (previousData) => previousData,
  })
}

