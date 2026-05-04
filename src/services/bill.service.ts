import { api } from "@/lib/api/axios"
import type { Bill, BillPayload, BillListResponse } from "@/types/bill.types"

export type { Bill, BillPayload, BillListResponse } from "@/types/bill.types"

export const billApi = {
  getAllBills: async (
    page = 1,
    perPage = 10,
    filters?: {
      search?: string
      encounterId?: string
      patientId?: string
      doctorId?: string
      clinicId?: string
      /** `paid` | `unpaid` — matches API `status` query (same filter as summary stats) */
      status?: string
      receptionist?: string
      clinicAdmin?: string
    }
  ): Promise<BillListResponse> => {
    const response = await api.get<BillListResponse>("/bills", {
      params: {
        page,
        perPage,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(filters?.search && { search: filters.search }),
        ...(filters?.encounterId && { encounterId: filters.encounterId }),
        ...(filters?.patientId && { patientId: filters.patientId }),
        ...(filters?.doctorId && { doctorId: filters.doctorId }),
        ...(filters?.clinicId && { clinicId: filters.clinicId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.receptionist && { receptionist: filters.receptionist }),
        ...(filters?.clinicAdmin && { clinicAdmin: filters.clinicAdmin }),
      },
    })
    return response.data
  },

  createBill: async (data: BillPayload): Promise<Bill> => {
    const response = await api.post<{ data: Bill }>("/bills", data)
    return response.data.data
  },

  getBillById: async (id: string): Promise<Bill> => {
    const response = await api.get<{ data: Bill }>(`/bills/${id}`)
    return response.data.data
  },

  getBillByBillId: async (billId: string): Promise<Bill> => {
    const response = await api.get<{ data: Bill }>(`/bills/details/${billId}`)
    return response.data.data
  },

  updateBill: async (id: string, data: Partial<BillPayload>): Promise<Bill> => {
    const response = await api.put<{ data: Bill }>(`/bills/${id}`, data)
    return response.data.data
  },
  
  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`)
  },
}
