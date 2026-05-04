import { api } from "@/lib/api/axios";

export interface ReportFilters {
  clinicId?: string;
  doctorId?: string;
  year?: number;
  month?: number;
}

export const reportApi = {
  getReport: async (filters: ReportFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.clinicId) params.append("clinicId", filters.clinicId);
    if (filters.doctorId) params.append("doctorId", filters.doctorId);
    if (filters.year) params.append("year", filters.year.toString());
    if (filters.month) params.append("month", filters.month.toString());

    const { data } = await api.get(`/report?${params.toString()}`);
    return data;
  },
};
