export interface BillItem {
  serviceId?: string
  name: string
  qty: number
  price: number
  total: number
}

export interface BillTax {
  taxId?: string
  name: string
  taxType: "percentage" | "fixed"
  taxValue: number
  taxAmount: number
}

export interface BillPayload {
  encounter: string
  clinic: string
  patient: string
  doctor?: string
  title?: string
  items: BillItem[]
  taxes?: BillTax[]
  discount?: number
  serviceTotal: number
  taxTotal: number
  totalAmount: number
  actualAmount: number
  paymentStatus: "paid" | "unpaid"
}

export interface BillClinic {
  _id: string
  name: string
  email?: string
  cliniclogo?: string
  logo?: string
}

export interface BillPatient {
  _id: string
  email?: string
  firstName: string
  lastName: string
  mobile?: string
  fullName: string
  id?: string
  profilePicture?: string
}

export interface BillDoctor {
  _id: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  mobile?: string
  countryCode?: string
  id?: string
  profilePicture?: string
  signature?: string
  signatureImage?: string
  meta?: {
    signature?: string
  }
}

export interface Bill {
  _id: string
  billId: string
  encounter: string | Record<string, unknown>
  clinic: string | BillClinic | null
  patient: string | BillPatient | null
  doctor?: string | BillDoctor | null
  appointment?: string | any | null
  title?: string
  items: BillItem[]
  taxes?: BillTax[]
  discount?: number
  discount_value?: number
  discount_amount?: number
  serviceTotal: number
  taxTotal: number
  totalAmount: number
  actualAmount: number
  paymentStatus: "paid" | "unpaid"
  createdAt?: string
  updatedAt?: string
}

export interface BillListResponse {
  statusCode?: number
  data: Bill[]
  message?: string
  success?: boolean
  pagination?: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
  stats?: {
    total: number
    paid: number
    unpaid?: number
    /** @deprecated use `unpaid` */
    pending?: number
    totalAmountSum?: number
  }
}
