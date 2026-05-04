"use client"

import { useQuery } from "@tanstack/react-query"

import { dashboardApi } from "@/services/dashboard.service"
import type { DashboardChartStatsResponse, DashboardStatsResponse } from "@/types/dashboard.types"

export function useDashboardStats(enabled = true) {
  return useQuery<DashboardStatsResponse>({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useDashboardChartStats(months = 3, enabled = true) {
  return useQuery<DashboardChartStatsResponse>({
    queryKey: ["dashboard", "chart-stats", { months }],
    queryFn: () => dashboardApi.getChartStats(months),
    enabled,
    staleTime: 60 * 1000,
  })
}

