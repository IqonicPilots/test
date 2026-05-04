export interface Pagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T[]
  pagination: Pagination
  stats?: {
    total: number
    active?: number
    inactive?: number
    percentageType?: number
    fixedType?: number
    paid?: number
    unpaid?: number
    pending?: number
    /** Sum of `totalAmount` for all rows matching the current list filters (not only the current page). */
    totalAmountSum?: number
    [key: string]: any
  }
}
