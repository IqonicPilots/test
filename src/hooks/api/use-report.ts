"use client";

import { useQuery } from "@tanstack/react-query";
import { reportApi, ReportFilters } from "@/services/report.service";

export const reportQueryKey = ["reports"] as const;

export function useReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: [...reportQueryKey, filters],
    queryFn: () => reportApi.getReport(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
