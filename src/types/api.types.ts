export type ApiMetaResponse<TData = null> = {
  statusCode?: number
  success?: boolean
  message?: string
  data?: TData
}

export type ApiResponse<T> = {
  statusCode?: number
  success?: boolean
  message?: string
  data: T
}
