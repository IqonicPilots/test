import { api } from '@/lib/api/axios'
import type { 
  Appointment, 
  AppointmentPayload, 
  SlotAvailability, 
  DayAvailability,
  AppointmentListResponse,
  PaypalOrderResponse,
  StripeCheckoutResponse,
  RazorpayOrderResponse,
  PaymentVerificationResult
} from '@/types/appointment.types'

export type { 
  Appointment, 
  AppointmentPayload, 
  SlotAvailability, 
  DayAvailability,
  AppointmentListResponse,
  PaypalOrderResponse,
  StripeCheckoutResponse,
  RazorpayOrderResponse,
  PaymentVerificationResult
} from '@/types/appointment.types'

export const appointmentService = {
  getAllAppointments: async (
    page = 1,
    perPage = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filters?: {
      patientId?: string
      clinicId?: string
      doctorId?: string
      serviceId?: string
      status?: string
      search?: string
      receptionist?: string
      clinicAdmin?: string
      timeframe?: string
      upcoming?: string
    }
  ): Promise<AppointmentListResponse> => {
    const response = await api.get<AppointmentListResponse>('/appointments', {
      params: { page, perPage, sortBy, sortOrder, ...filters }
    })
    return response.data
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}`)
    return response.data.data
  },

  createAppointment: async (data: AppointmentPayload): Promise<Appointment> => {
    const response = await api.post('/appointments', data)
    return response.data.data
  },

  updateAppointment: async (id: string, data: Partial<AppointmentPayload>): Promise<Appointment> => {
    const response = await api.put(`/appointments/${id}`, data)
    return response.data.data
  },

  createPaypalOrder: async (appointmentId: string): Promise<PaypalOrderResponse> => {
    const response = await api.post(`/appointments/${appointmentId}/paypal/create-order`)
    return response.data.data
  },

  capturePaypalPayment: async (appointmentId: string, orderId: string, payerId?: string): Promise<Appointment> => {
    const response = await api.post(`/appointments/${appointmentId}/paypal/capture`, {
      orderId,
      payerId,
    })
    return response.data.data
  },

  createPaypalOrderForCheckout: async (payload: { amount: number; currency?: string; clientRef: string }): Promise<PaypalOrderResponse> => {
    const response = await api.post(`/appointments/payment/paypal/create-order`, payload)
    return response.data.data
  },

  capturePaypalForCheckout: async (payload: { orderId: string; payerId?: string }): Promise<PaymentVerificationResult> => {
    const response = await api.post(`/appointments/payment/paypal/capture`, payload)
    return response.data.data
  },

  markAppointmentPaymentFailed: async (
    appointmentId: string,
    payload: { orderId?: string; sessionId?: string; error?: string }
  ): Promise<Appointment> => {
    const response = await api.post(`/appointments/${appointmentId}/payment/fail`, payload)
    return response.data.data
  },

  createStripeCheckoutSession: async (appointmentId: string): Promise<StripeCheckoutResponse> => {
    const response = await api.post(`/appointments/${appointmentId}/stripe/create-checkout-session`)
    return response.data.data
  },

  verifyStripePayment: async (appointmentId: string, sessionId: string): Promise<Appointment> => {
    const response = await api.post(`/appointments/${appointmentId}/stripe/verify-session`, {
      sessionId,
    })
    return response.data.data
  },

  createStripeCheckoutForCheckout: async (payload: { amount: number; currency?: string; clientRef: string }): Promise<StripeCheckoutResponse> => {
    const response = await api.post(`/appointments/payment/stripe/create-checkout-session`, payload)
    return response.data.data
  },

  verifyStripeForCheckout: async (payload: { sessionId: string }): Promise<PaymentVerificationResult> => {
    const response = await api.post(`/appointments/payment/stripe/verify-session`, payload)
    return response.data.data
  },

  createRazorpayOrder: async (appointmentId: string): Promise<RazorpayOrderResponse> => {
    const response = await api.post(`/appointments/${appointmentId}/razorpay/create-order`)
    return response.data.data
  },

  verifyRazorpayPayment: async (
    appointmentId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ): Promise<Appointment> => {
    const response = await api.post(`/appointments/${appointmentId}/razorpay/verify-payment`, payload)
    return response.data.data
  },

  createRazorpayOrderForCheckout: async (payload: { amount: number; currency?: string }): Promise<RazorpayOrderResponse> => {
    const response = await api.post(`/appointments/payment/razorpay/create-order`, payload)
    return response.data.data
  },

  verifyRazorpayForCheckout: async (
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ): Promise<PaymentVerificationResult> => {
    const response = await api.post(`/appointments/payment/razorpay/verify-payment`, payload)
    return response.data.data
  },

  deleteAppointment: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`)
  },

  getBookSlots: async (params: { clinicId: string; doctorId: string; date: string; serviceId: string[] }): Promise<SlotAvailability[]> => {
    const query = new URLSearchParams()
    query.append('clinicId', params.clinicId)
    query.append('doctorId', params.doctorId)
    query.append('date', params.date)
    params.serviceId.forEach(id => query.append('serviceId', id))
    
    const response = await api.get(`/doctor-sessions/appointment-book-slot?${query.toString()}`)
    return response.data.data
  },

  getMonthAvailability: async (params: { clinicId: string; doctorId: string; month: number; year: number; serviceId: string }): Promise<DayAvailability[]> => {
    const query = new URLSearchParams()
    query.append('clinicId', params.clinicId)
    query.append('doctorId', params.doctorId)
    query.append('month', params.month.toString())
    query.append('year', params.year.toString())
    query.append('serviceId', params.serviceId)
    
    const response = await api.get(`/doctor-sessions/month-availability?${query.toString()}`)
    return response.data.data
  },

  regenerateTelemedLink: async (id: string): Promise<Appointment> => {
    const response = await api.get(`/appointments/${id}/regenerate-video-conference`)
    return response.data.data
  }
}
