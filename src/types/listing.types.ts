export interface StaticData {
  _id: string
  type: string
  label: string
  value: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ListingFormData {
  label: string
  type: string
  isActive?: boolean
}

export interface UpdateListingFormData {
  label?: string
  type?: string
  isActive?: boolean
}
