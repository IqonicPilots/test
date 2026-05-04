export type InquiryRecordType = "inquiry" | "newsletter"

export interface InquiryRecord {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  clinicName: string | null
  message: string | null
  type: InquiryRecordType
  createdAt: string
}

export interface InquiryPagination {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface InquiryStats {
  total: number
  inquiry: number
  newsletter: number
  totalInquiries: number
  totalNewsletters: number
  inquiryGrowth: number
  newsletterGrowth: number
}

export interface AdminInquiriesResponse {
  statusCode: number
  data: InquiryRecord[]
  message: string
  success: boolean
  pagination: InquiryPagination
  stats?: InquiryStats
}
