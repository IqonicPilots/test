export interface Appointment {
  _id: string
  schedule: {
    startDate: string
    startTime: string
  }
  status: {
    id: string
    label: string
  }
  clinic: {
    _id: string
    name: string
    cliniclogo?: string
    email?: string
    mobile?: string
    phoneNumber?: string
    countryCode?: string
    address?: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  } | string | null
  clinicId?: string
  doctor: {
    _id: string
    firstName: string
    lastName: string
    fullName: string
    id: string
    profilePicture?: string
    avatar?: string
    mobile?: string
    phoneNumber?: string
    countryCode?: string
    signature?: string
    signatureImage?: string
    meta?: {
      signature?: string
      signatureImage?: string
    }
    UserMeta?: {
      signature?: string
      signatureImage?: string
    }
    userMeta?: {
      signature?: string
      signatureImage?: string
    }
  } | string | null
  doctorId?: string
  patient: {
    _id: string
    email: string
    firstName: string
    lastName: string
    fullName: string
    id: string
    profilePicture?: string
    avatar?: string
    mobile?: string
    phoneNumber?: string
    countryCode?: string
  } | string | null
  patientId?: string
  service: {
    _id: string
    name: string
    charges: number
    duration: number
  } | string | null
  serviceId?: string
  appointmentCharge?: number
  paymentStatus?: "pending" | "paid" | "failed"
  paymentDetails?: {
    transactionId?: string
    orderId?: string
    payerId?: string
    payerEmail?: string
    amount?: number
    currency?: string
    status?: string
    error?: string
  }
  paymentMode: string
  description?: string
  telemedicine?: {
    type?: string
    zoom?: {
      meetingId: string
      uuid: string
      startUrl: string
      joinUrl: string
      password?: string
    }
    googleMeet?: {
      url: string
    }
  }
  reminders?: {
    emailSent: boolean
    smsSent: boolean
    whatsappSent: boolean
  }
  updatedAt: string
  createdAt: string
  encounter_status?: "NOT_CREATED" | "CREATED"
}

export interface AppointmentPayload {
  clinicId: string
  doctorId: string
  patientId: string
  serviceId: string
  appointmentDate: string
  slot: string
  status: string | { id: string; label: string }
  appointmentCharge?: number
  paymentStatus?: "pending" | "paid" | "failed"
  paymentDetails?: {
    transactionId?: string
    orderId?: string
    payerId?: string
    payerEmail?: string
    amount?: number
    currency?: string
    status?: string
    error?: string
  }
  paymentMode?: string
  description?: string
}

export interface PaypalOrderResponse {
  orderId: string
  approveUrl?: string
}

export interface StripeCheckoutResponse {
  sessionId: string
  checkoutUrl?: string | null
}

export interface RazorpayOrderResponse {
  orderId: string
  keyId: string
  amount: number
  currency: string
  name?: string
  description?: string
}

export interface PaymentVerificationResult {
  orderId?: string
  sessionId?: string
  transactionId?: string
  payerId?: string
  payerEmail?: string
  amount?: number
  currency?: string
  status?: string
}

export interface SlotAvailability {
  time: string
  available: boolean
}

export interface DayAvailability {
  date: string
  availableSlots: number
}
export interface AppointmentListResponse {
  statusCode: number
  success: boolean
  message: string
  data: Appointment[]
  pagination: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
  stats?: {
    total: number
    booked: number
    checkIn: number
    checkout: number
    cancelled: number
    pending: number
  }
}
