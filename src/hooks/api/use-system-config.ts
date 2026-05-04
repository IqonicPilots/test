"use client"

import { useQuery } from "@tanstack/react-query"

import { systemConfigApi } from "@/services/system-config.service"
import type { SystemConfig } from "@/types/system-config.types"

export function useSystemConfig(enabled = true) {
  return useQuery<SystemConfig>({
    queryKey: ["system-config"],
    queryFn: systemConfigApi.getSystemConfig,
    enabled,
    staleTime: 10 * 60 * 1000,
  })
}

