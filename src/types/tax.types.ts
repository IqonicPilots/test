import type { PaginatedResponse } from "./pagination.types"

export interface Tax {
  _id: string
  taxName: string
  taxRate: number
  type: 'percentage' | 'fixed'
  clinicId?: string | {
    _id: string
    name: string
    email?: string
    cliniclogo?: string
  }
  doctorIds?: string[] | Array<{
    _id: string
    firstName: string
    lastName: string
    fullName?: string
    email?: string
    meta?: {
      profilePicture?: string
    }
  }>
  serviceIds?: string[] | Array<{
    _id: string
    name: string
    serviceImage?: string
    charges?: number
    duration?: number
  }>
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TaxPayload {
  taxName: string
  taxRate: number
  type: 'percentage' | 'fixed'
  clinicId?: string
  doctorIds?: string[]
  serviceIds?: string[]
  isActive: boolean
}

export type TaxListResponse = PaginatedResponse<Tax>

export interface TaxCalculationItemPayload {
  serviceId: string
  quantity: number
}

export interface TaxCalculationPayload {
  serviceItems: TaxCalculationItemPayload[]
  clinicId?: string
  doctorId?: string
}

export interface TaxCalculationTaxRow {
  taxId: string
  taxName: string
  taxRate: number
  taxType: 'percentage' | 'fixed'
  totalAmount: number
  services: Array<{
    serviceId: string
    taxAmount: number
  }>
}

export interface TaxCalculationResponse {
  totalBaseAmount: number
  totalTaxAmount: number
  grandTotal: number
  taxes: TaxCalculationTaxRow[]
  breakdown: Array<{
    serviceId: string
    serviceName: string
    quantity: number
    charges: number
    baseAmount: number
    taxAmount: number
  }>
}
