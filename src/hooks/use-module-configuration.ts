"use client"

import { useMemo } from "react"

import { useSystemConfig } from "@/hooks/api/use-system-config"

export type ModuleConfiguration = {
  receptionist: boolean
  billing: boolean
  problem: boolean
  observations: boolean
  note: boolean
  prescription: boolean
}

/** Module flags from system config (`/settings/system-config`). When a flag is false, related UI should be hidden. */
export function useModuleConfiguration(): ModuleConfiguration {
  const { data } = useSystemConfig()
  return useMemo(() => {
    const c = data?.configuration_settings
    return {
      receptionist: c?.receptionist !== false,
      billing: c?.billing !== false,
      problem: c?.problem !== false,
      observations: c?.observations !== false,
      note: c?.note !== false,
      prescription: c?.prescription !== false,
    }
  }, [data?.configuration_settings])
}
