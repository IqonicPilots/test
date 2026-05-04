import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taxApi } from '@/services/tax.service'
import type {
  TaxPayload,
  TaxListResponse,
  TaxCalculationPayload,
  TaxCalculationResponse,
} from '@/types/tax.types'
import type { GetAllTaxesFilters } from '@/services/tax.service'

import { getApiErrorMessage } from '@/lib/api/axios'
import { toast } from 'sonner'

export function useTaxes(page = 1, limit = 10, filters?: GetAllTaxesFilters) {
  return useQuery<TaxListResponse>({
    queryKey: ['taxes', { page, limit, ...filters }],
    queryFn: () => taxApi.getAllTaxes(page, limit, filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export function useTax(id: string) {
  return useQuery({
    queryKey: ['tax', id],
    queryFn: () => taxApi.getTaxById(id),
    enabled: !!id,
  })
}

export function useCreateTax() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TaxPayload) => taxApi.createTax(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      toast.success('Tax created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create tax: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateTax() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxPayload> }) =>
      taxApi.updateTax(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      queryClient.invalidateQueries({ queryKey: ['tax', id] })
      toast.success('Tax updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update tax: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteTax() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taxApi.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] })
      toast.success('Tax deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete tax: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useCalculateTax() {
  return useMutation<TaxCalculationResponse, unknown, TaxCalculationPayload>({
    mutationFn: (data: TaxCalculationPayload) => taxApi.calculateTax(data),
  })
}
