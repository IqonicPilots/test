import { api } from "@/lib/api/axios"
import type { DashboardChartStatsResponse, DashboardStatsResponse } from "@/types/dashboard.types"

export const dashboardApi = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await api.get("/dashboard/stats")
    return response.data.data
  },

  getChartStats: async (months = 3): Promise<DashboardChartStatsResponse> => {
    const response = await api.get("/dashboard/chart-stats", {
      params: { chart: "sales_performance", months },
    })
    return response.data.data
  },
}

