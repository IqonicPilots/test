"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfToday, addDays, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { getStoredAuthSession } from '@/lib/auth-session'
import { BookingAuthContent } from './booking-auth-content'
import { Calendar } from '@/components/ui/calendar'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Check, ChevronRight, ChevronLeft, Loader2, Calendar as CalendarIcon, Clock, CreditCard, Stethoscope, Building2, LayoutDashboard, RefreshCcw, Search, Video, X, CalendarPlus, ShieldCheck, Lock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInfiniteClinics } from '@/hooks/api/use-clinics'
import { useInfiniteDoctors } from '@/hooks/api/use-doctors'
import { useInfiniteServices } from '@/hooks/api/use-services'
import { useProfile } from '@/hooks/api/use-profile'
import { useAppointmentBookSlots } from '@/hooks/api/use-doctor-sessions'
import { usePaymentSettings, usePublicPaymentSettings } from '@/hooks/api/use-payment-settings'
import { appointmentService } from '@/services/appointment.service'
import { taxApi } from '@/services/tax.service'
import type { TaxCalculationResponse } from '@/types/tax.types'
import type { Clinic } from '@/types/clinic.types'
import type { Doctor } from '@/types/doctor.types'
import Link from 'next/link'

type Step = 'clinic' | 'doctor' | 'service' | 'auth' | 'datetime' | 'payment'

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return resolve(true)
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function BookingFlow() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState<Step>('clinic')
  const [history, setHistory] = useState<Step[]>([])
  const [isBackNavigation, setIsBackNavigation] = useState(false)
  const [suppressAutoSkipStep, setSuppressAutoSkipStep] = useState<Step | null>(null)

  // Selection State
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('pay_later')
  const [bookingDescription, setBookingDescription] = useState('')
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResponse | null>(null)
  const [isCalculatingTax, setIsCalculatingTax] = useState(false)

  // Dialog States
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [clinicSearch, setClinicSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')

  const steps: { id: Step; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'clinic', label: 'Clinic', description: 'Please select a clinic to proceed', icon: <Building2 className="h-4 w-4" /> },
    { id: 'doctor', label: 'Doctor', description: 'Pick a specific Doctor for your service', icon: <Stethoscope className="h-4 w-4" /> },
    { id: 'service', label: 'Service', description: 'Please select a service from options', icon: <RefreshCcw className="h-4 w-4" /> },
    { id: 'auth', label: 'Account', description: 'Sign in to confirm booking', icon: <User className="h-4 w-4" /> },
    { id: 'datetime', label: 'Date & Time', description: 'Select date to see a timeline of slots', icon: <CalendarIcon className="h-4 w-4" /> },
    { id: 'payment', label: 'Payment', description: 'Confirm and book your appointment', icon: <CreditCard className="h-4 w-4" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  // Data Fetching (Paginated)
  const session = getStoredAuthSession()
  const isPatient = !session || session.user.role === 'patient'
  const { data: profile } = useProfile({ enabled: !!session?.accessToken })

  const {
    data: clinicsInfiniteData,
    isLoading: isClinicsLoading,
    fetchNextPage: fetchNextClinics,
    hasNextPage: hasNextClinics,
    isFetchingNextPage: isFetchingMoreClinics
  } = useInfiniteClinics(20, { isActive: true, search: clinicSearch })

  const {
    data: doctorsInfiniteData,
    isLoading: isDoctorsLoading,
    fetchNextPage: fetchNextDoctors,
    hasNextPage: hasNextDoctors,
    isFetchingNextPage: isFetchingMoreDoctors
  } = useInfiniteDoctors(20, { clinicId: selectedClinic || undefined, status: 'active', search: doctorSearch }, !!selectedClinic)

  const {
    data: servicesInfiniteData,
    isLoading: isServicesLoading,
    fetchNextPage: fetchNextServices,
    hasNextPage: hasNextServices,
    isFetchingNextPage: isFetchingMoreServices
  } = useInfiniteServices(20, {
    clinicId: selectedClinic || undefined,
    doctorId: selectedDoctor || undefined,
    status: 'active',
    search: serviceSearch
  }, !!(selectedClinic && selectedDoctor))

  const { data: slotsData, isLoading: isSlotsLoading } = useAppointmentBookSlots({
    clinicId: selectedClinic || undefined,
    doctorId: selectedDoctor || undefined,
    date: format(selectedDate, 'yyyy-MM-dd'),
    serviceId: selectedService || undefined,
    enabled: !!(selectedClinic && selectedDoctor && selectedService)
  })
  const { data: paymentSettings } = usePublicPaymentSettings()
  const settings = paymentSettings || {}

  const clinics = useMemo(() => clinicsInfiniteData?.pages.flatMap(p => p.data) || [], [clinicsInfiniteData])
  const doctors = useMemo(() => doctorsInfiniteData?.pages.flatMap(p => p.data) || [], [doctorsInfiniteData])
  const services = useMemo(() => servicesInfiniteData?.pages.flatMap(p => p.data) || [], [servicesInfiniteData])
  const baseAmount = Number(services.find(s => s._id === selectedService)?.charges || 0)
  const taxAmount = taxCalculation?.totalTaxAmount || 0
  const totalAmount = taxCalculation?.grandTotal || baseAmount
  const primaryTaxName = taxCalculation?.taxes?.[0]?.taxName || 'Tax'
  const taxDisplayRows = taxCalculation?.taxes?.length
    ? taxCalculation.taxes
      .map((tax) => ({
        id: String(tax.taxId),
        name: tax.taxName || primaryTaxName,
        amount: Number(tax.totalAmount || 0),
      }))
      .filter((tax) => tax.amount > 0)
    : taxAmount > 0
      ? [{ id: 'tax-total', name: primaryTaxName, amount: taxAmount }]
      : []
  const slots = slotsData?.availableSlots || []

  useEffect(() => {
    const calculateTax = async () => {
      if (!selectedService || !selectedClinic || !selectedDoctor) {
        setTaxCalculation(null)
        return
      }

      setIsCalculatingTax(true)
      try {
        const result = await taxApi.calculateTax({
          serviceItems: [{ serviceId: selectedService, quantity: 1 }],
          clinicId: selectedClinic,
          doctorId: selectedDoctor,
        })
        setTaxCalculation(result)
      } catch (error) {
        console.error('Tax calculation failed:', error)
        setTaxCalculation(null)
      } finally {
        setIsCalculatingTax(false)
      }
    }

    calculateTax()
  }, [selectedService, selectedClinic, selectedDoctor])

  // Step Transitions
  const goToNextStep = (next: Step) => {
    setHistory(prev => [...prev, currentStep])
    setCurrentStep(next)
  }

  const goBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setIsBackNavigation(true)
    if (prev === 'clinic' || prev === 'doctor' || prev === 'service') {
      setSuppressAutoSkipStep(prev)
    }
    setHistory(prev => prev.slice(0, -1))
    setCurrentStep(prev)
  }

  useEffect(() => {
    if (!isBackNavigation) return
    setIsBackNavigation(false)
  }, [currentStep, isBackNavigation])

  // Effect: Auto-skip steps
  useEffect(() => {
    if (isBackNavigation) return
    if (suppressAutoSkipStep === 'clinic') return
    if (currentStep === 'clinic' && !isClinicsLoading && clinics.length === 1) {
      setSelectedClinic(clinics[0]._id)
      goToNextStep('doctor')
    }
  }, [currentStep, clinics, isClinicsLoading, isBackNavigation, suppressAutoSkipStep])

  useEffect(() => {
    if (isBackNavigation) return
    if (suppressAutoSkipStep === 'doctor') return
    if (currentStep === 'doctor' && !isDoctorsLoading && doctors.length === 1) {
      setSelectedDoctor(doctors[0]._id)
      goToNextStep('service')
    }
  }, [currentStep, doctors, isDoctorsLoading, isBackNavigation, suppressAutoSkipStep])

  useEffect(() => {
    if (isBackNavigation) return
    if (suppressAutoSkipStep === 'service') return
    if (
      currentStep === 'service' &&
      !isServicesLoading &&
      !selectedService &&
      services.length === 1
    ) {
      const autoServiceId = services[0]._id
      setSelectedService(autoServiceId)
      handleServiceNext(autoServiceId)
    }
  }, [currentStep, services, isServicesLoading, selectedService, profile, isBackNavigation, suppressAutoSkipStep])

  // Auth Handling
  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    setCurrentStep('datetime')
  }

  const handleBook_Appointment = () => handleBookAppointment()

  const handleServiceNext = (serviceId?: string) => {
    const effectiveServiceId = serviceId || selectedService
    if (effectiveServiceId) {
      if (!profile) {
        goToNextStep('auth')
      } else {
        goToNextStep('datetime')
      }
    }
  }

  const handleReset = () => {
    setSelectedClinic(null)
    setSelectedDoctor(null)
    setSelectedService(null)
    setSelectedSlot(null)
    setSelectedDate(startOfToday())
    setBookingDescription('')
    setTaxCalculation(null)
    setSuppressAutoSkipStep(null)
    setIsBooked(false)
    setHistory([])
    setIsSuccessDialogOpen(false)
    setIsErrorDialogOpen(false)
    setCurrentStep('clinic')
  }

  // Booking Real Logic
  const handleBookAppointment = async () => {
    if (!selectedClinic || !selectedDoctor || !selectedService || !selectedSlot) return

    setIsBooking(true)
    try {
      const amount = totalAmount

      const clientRef = `appointment_${Date.now()}` // Temporary reference to link payment

      if (selectedPaymentMode === 'stripe' || selectedPaymentMode === 'paypal') {
        let checkoutUrl: string | null | undefined = null

        if (selectedPaymentMode === 'stripe') {
          const result = await appointmentService.createStripeCheckoutForCheckout({ amount, clientRef })
          checkoutUrl = result?.checkoutUrl
        } else {
          const result = await appointmentService.createPaypalOrderForCheckout({ amount, clientRef })
          checkoutUrl = result?.approveUrl
        }

        if (checkoutUrl) {
          const width = 600
          const height = 800
          const left = window.screenX + (window.outerWidth - width) / 2
          const top = window.screenY + (window.outerHeight - height) / 2

          const popup = window.open(
            checkoutUrl,
            `${selectedPaymentMode}_payment`,
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
          )

          if (!popup) {
            setErrorMessage('Popup blocked. Please allow popups for this site.')
            setIsErrorDialogOpen(true)
            setIsBooking(false)
            return
          }

          const handleMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            if (event.data?.type === `${selectedPaymentMode}-payment-result`) {
              window.removeEventListener('message', handleMessage)

              if (event.data.status === 'success') {
                const payload = {
                  clinicId: selectedClinic,
                  doctorId: selectedDoctor,
                  patientId: profile?._id,
                  serviceId: selectedService,
                  appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
                  slot: selectedSlot,
                  status: 'booked',
                  paymentMode: selectedPaymentMode,
                  paymentStatus: 'paid',
                  paymentDetails: {
                    transactionId: event.data.transactionId || event.data.sessionId || event.data.orderId,
                    orderId: event.data.orderId,
                    payerEmail: event.data.payerEmail,
                  },
                  appointmentCharge: amount,
                  taxAmount: taxAmount,
                  description: bookingDescription || undefined,
                }
                await appointmentService.createAppointment(payload as any)
                setIsBooked(true)
                setIsSuccessDialogOpen(true)
              } else {
                setErrorMessage(event.data.error || 'Payment failed')
                setIsErrorDialogOpen(true)
              }
              setIsBooking(false)
            }
          }
          window.addEventListener('message', handleMessage)
          return
        }
      }

      if (selectedPaymentMode === 'razorpay') {
        const res = await loadRazorpay()
        if (!res) {
          throw new Error('Razorpay SDK failed to load. Please check your connection.')
        }

        const result = await appointmentService.createRazorpayOrderForCheckout({
          amount,
        })

        if (result?.orderId) {
          const options = {
            key: result.keyId,
            amount: result.amount,
            currency: result.currency,
            name: "Kivicare Clinic",
            description: `Appointment with Dr. ${doctors.find(d => d._id === selectedDoctor)?.firstName}`,
            order_id: result.orderId,
            handler: async (response: any) => {
              // On success, create the appointment
              const payload = {
                clinicId: selectedClinic,
                doctorId: selectedDoctor,
                patientId: profile?._id,
                serviceId: selectedService,
                appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
                slot: selectedSlot,
                status: 'booked',
                paymentMode: 'razorpay',
                paymentStatus: 'paid',
                paymentDetails: {
                  transactionId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                },
                appointmentCharge: amount,
                taxAmount: taxAmount,
                description: bookingDescription || undefined,
              }
              await appointmentService.createAppointment(payload as any)
              setIsBooked(true)
              setIsSuccessDialogOpen(true)
            },
            prefill: {
              name: `${profile?.firstName} ${profile?.lastName}`,
              email: profile?.email,
              contact: profile?.mobile,
            },
            theme: { color: "#FF7C7C" }
          }
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
          setIsBooking(false)
          return
        }
      }

      // Default / Pay Later Flow
      const payload = {
        clinicId: selectedClinic,
        doctorId: selectedDoctor,
        patientId: profile?._id,
        serviceId: selectedService,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        slot: selectedSlot,
        status: 'booked',
        paymentMode: selectedPaymentMode,
        paymentStatus: 'pending',
        appointmentCharge: amount,
        taxAmount: taxAmount,
        description: bookingDescription || undefined,
      }

      await appointmentService.createAppointment(payload as any)
      setIsBooked(true)
      setIsSuccessDialogOpen(true)
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Failed to book appointment. Please try again.')
      setIsErrorDialogOpen(true)
    } finally {
      setIsBooking(false)
    }
  }

  // Helper: Format Time
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 || 12
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  // Helper: Format Address
  const formatAddress = (address: any) => {
    if (!address) return 'No address provided'
    const parts = [address.street, address.city, address.state, address.country].filter(Boolean)
    return parts.join(', ')
  }

  // Render Step Contents
  const renderStep = () => {
    switch (currentStep) {
      case 'clinic':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 lg:p-6 lg:pb-6 bg-background">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-foreground leading-tight shrink-0">Select a Clinic</h2>
                <div className="relative w-36 sm:w-72 group shrink">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                  <Input
                    placeholder="Search clinics..."
                    className="pl-11 h-11 bg-muted/50 border-none shadow-inner focus:shadow-none focus:bg-background focus:ring-2 focus:ring-secondary/20 rounded-xl text-[13px] transition-all placeholder:text-muted-foreground/60"
                    onChange={(e) => setClinicSearch(e.target.value)}
                    value={clinicSearch}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 px-6 md:px-8 pt-0 pb-10 bg-accent/15 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 pt-4">
                  {isClinicsLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-xl border" />
                    ))
                  ) : (
                    <>
                      {clinics.map(clinic => (
                        <div
                          key={clinic._id}
                          className={cn(
                            "cursor-pointer p-4 flex flex-col items-center text-center transition-all duration-200 border rounded-2xl relative bg-white min-h-[220px]",
                            selectedClinic === clinic._id
                              ? "border-secondary ring-1 ring-secondary/5 shadow-md"
                              : "border-muted/60 hover:border-secondary/30 hover:shadow-sm"
                          )}
                          onClick={() => {
                            setSuppressAutoSkipStep(null)
                            setSelectedClinic(clinic._id)
                            goToNextStep('doctor')
                          }}
                        >
                          <Avatar className="h-16 w-16 border-2 border-accent/10 shadow-md mb-4 mt-2">
                            <AvatarImage src={clinic.cliniclogo} />
                            <AvatarFallback className="bg-secondary/10 text-secondary text-base font-bold">
                              {clinic.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <h3 className="text-[16px] font-bold text-foreground mb-1 leading-tight">
                            {clinic.name}
                          </h3>

                          {clinic.address && (
                            <div className="flex flex-col gap-1 mb-2 flex-1 justify-center">
                              <span className="text-[12px] text-muted-foreground font-medium leading-tight line-clamp-2">
                                {clinic.address.street}, {clinic.address.city}, {clinic.address.country}
                              </span>
                            </div>
                          )}

                          <div className="mt-auto w-full pt-3 border-t border-muted/20 flex flex-col items-center justify-center">
                            <span className="text-[11px] font-bold text-muted-foreground opacity-60">Email :</span>
                            <span className="text-[11px] text-foreground font-bold break-all leading-normal mt-0.5 px-2">
                              {clinic.email}
                            </span>
                          </div>
                        </div>
                      ))}
                      {isFetchingMoreClinics && (
                        <div className="col-span-full py-4 flex justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      case 'doctor':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 lg:p-6 lg:pb-6 bg-background">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-foreground leading-tight shrink-0">Choose Your Doctor</h2>
                <div className="relative w-36 sm:w-72 group shrink">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                  <Input
                    placeholder="Search doctors..."
                    className="pl-11 h-11 bg-muted/50 border-none shadow-inner focus:shadow-none focus:bg-background focus:ring-2 focus:ring-secondary/20 rounded-xl text-[13px] transition-all placeholder:text-muted-foreground/60"
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    value={doctorSearch}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 md:p-6 pt-0 pb-0 bg-accent/15 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 pt-4">
                  {isDoctorsLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-xl border" />
                    ))
                  ) : (
                    <>
                      {doctors.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                          <Stethoscope className="h-10 w-10 text-muted-foreground mb-4 stroke-[1.5]" />
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">No doctors available</p>
                        </div>
                      ) : (
                        doctors.map(doctor => (
                          <div
                            key={doctor._id}
                            className={cn(
                              "cursor-pointer p-4 flex flex-col items-center text-center transition-all duration-200 border rounded-2xl relative bg-white min-h-[200px]",
                              selectedDoctor === doctor._id
                                ? "border-secondary ring-1 ring-secondary/5 shadow-md"
                                : "border-muted/60 hover:border-secondary/30 hover:shadow-sm"
                            )}
                            onClick={() => {
                              setSuppressAutoSkipStep(null)
                              setSelectedDoctor(doctor._id)
                              goToNextStep('service')
                            }}
                          >
                            {/* Video Icon placeholder */}
                            {(doctor.meta as any)?.isZoomEnabled !== false && (
                              <div className="absolute top-3 left-3 bg-[#80a13b] text-white p-1 rounded-md shadow-sm">
                                <Video className="h-3 w-3" />
                              </div>
                            )}

                            <Avatar className="h-16 w-16 border-2 border-accent/10 shadow-md mb-3">
                              <AvatarImage src={doctor.meta?.profilePicture || doctor.meta?.avatar} />
                              <AvatarFallback className="bg-secondary/10 text-secondary text-base font-bold">
                                {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>

                            <h3 className="text-[16px] font-bold text-foreground mb-0.5 leading-tight">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.05em] mb-4 max-w-[160px] line-clamp-2">
                              {doctor.meta?.specialties?.map(s => typeof s === 'object' ? (s.label || s.value) : s).join(', ') || 'Healthcare Professional'}
                            </p>

                            <div className="relative w-full flex items-center justify-center mt-auto pb-1">
                              <div className="absolute left-0 right-0 h-[1px] bg-muted/30" />
                              <div className="relative bg-[#00a6a2] text-white px-3 py-1 rounded-full text-[12px] font-bold shadow-sm whitespace-nowrap">
                                Exp : {doctor.meta?.experience || 0}yr
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isFetchingMoreDoctors && (
                        <div className="col-span-full py-4 flex justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
            <div className="mt-auto pt-3 pb-3 px-4 md:px-8 border-t flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
              <Button
                variant="outline"
                className="h-11 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer rounded-xl"
                onClick={goBack}
              >
                BACK
              </Button>
            </div>
          </div>
        )
      case 'service':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 lg:p-6 lg:pb-6 bg-background">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-foreground leading-tight shrink-0">Select a Service</h2>
                <div className="relative w-36 sm:w-72 group shrink">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                  <Input
                    placeholder="Search services..."
                    className="pl-11 h-11 bg-muted/50 border-none shadow-inner focus:shadow-none focus:bg-background focus:ring-2 focus:ring-secondary/20 rounded-xl text-[13px] transition-all placeholder:text-muted-foreground/60"
                    onChange={(e) => setServiceSearch(e.target.value)}
                    value={serviceSearch}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 md:p-6 pt-0 pb-0 bg-accent/15 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 pt-4">
                  {isServicesLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-xl border" />
                    ))
                  ) : (
                    <>
                      {services.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                          <LayoutDashboard className="h-10 w-10 text-muted-foreground mb-4 stroke-[1.5]" />
                          <p className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground px-4">No services available for the selected doctor</p>
                        </div>
                      ) : (
                        services.map(service => (
                          <div
                            key={service._id}
                            className={cn(
                              "cursor-pointer p-4 flex flex-col items-center text-center transition-all duration-200 border rounded-2xl relative bg-white min-h-[200px]",
                              selectedService === service._id
                                ? "border-secondary ring-1 ring-secondary/5 shadow-md"
                                : "border-muted/60 bg-white hover:border-secondary/30 hover:shadow-sm"
                            )}
                            onClick={() => {
                              setSuppressAutoSkipStep(null)
                              setSelectedService(service._id)
                              handleServiceNext(service._id)
                            }}
                          >
                            <Avatar className="h-16 w-16 border-2 border-accent/10 shadow-md mb-4 mt-2">
                              <AvatarImage src={service.serviceImage} />
                              <AvatarFallback className="bg-secondary/10 text-secondary text-base font-bold">
                                {service.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <h3 className="text-[13px] font-bold text-foreground mb-1 leading-tight">
                              {service.name}
                            </h3>

                            <div className="mt-auto w-full pt-3 border-t border-muted/20 flex items-center justify-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[12px] text-secondary font-black">${service.charges}</span>
                                <span className="text-[12px] text-muted-foreground font-bold">•</span>
                                <span className="text-[12px] text-muted-foreground font-bold">{service.duration} MINS</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {isFetchingMoreServices && (
                        <div className="col-span-full py-4 flex justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
            <div className="mt-auto pt-3 pb-3 px-4 md:px-8 border-t flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
              <Button
                variant="outline"
                className="h-11 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer rounded-xl"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                BACK
              </Button>
            </div>
          </div>
        )
      case 'auth':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 md:p-6 pb-5 bg-background">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Account Access</h2>
              </div>
            </div>

            {!isPatient ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-accent/15">
                <div className="max-w-sm w-full text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto border border-secondary/20 shadow-lg">
                    <ShieldCheck className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">Booking Restricted</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      With this account type, you are not able to book an appointment. Scheduling is reserved for patient accounts.
                    </p>
                  </div>
                  <Button
                    className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg shadow-secondary/20 font-bold uppercase tracking-widest transition-all"
                    asChild
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <BookingAuthContent onSuccess={handleAuthSuccess} />
            )}

            <div className="mt-auto pt-3 pb-3 px-4 md:px-8 border-t flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
              <Button
                variant="outline"
                className="h-11 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer rounded-xl"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                BACK
              </Button>
            </div>
          </div>
        )
      case 'datetime':
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 md:p-6 pb-5 bg-background">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Select Date & Time</h2>
              </div>
            </div>

            <div className="flex-1 p-4 md:p-6 pt-0 pb-0 bg-accent/15 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 py-3">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6 min-h-full">
                  {/* Left Column: Calendar */}
                  <div className="min-w-0 lg:col-span-7">
                    <div className="bg-white p-5 shadow-sm border border-muted/20 h-full flex flex-col items-center justify-center">
                      <div className="mb-6 text-center">
                        <span className="text-[10px] font-black tracking-[0.2em] text-secondary uppercase">Step 04</span>
                        <h3 className="text-lg font-bold text-foreground">Pick a Date</h3>
                      </div>
                      <div className="w-full flex items-center justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date)
                              setSelectedSlot(null)
                            }
                          }}
                          className="rounded-md border-none scale-105"
                          disabled={(date) => date < startOfToday()}
                          fixedWeeks
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Slots */}
                  <div className="min-w-0 lg:col-span-5 flex flex-col h-full min-h-[380px] bg-white p-5 shadow-sm border border-muted/20">
                    <div className="mb-4 flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">Available Slots</h3>
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            {format(selectedDate, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 py-1">
                      {isSlotsLoading ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                          {Array(12).fill(0).map((_, i) => (
                            <div key={i} className="h-9 bg-muted/40 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : !slotsData?.availableSlots?.length ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                          <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                          <p className="text-sm font-bold text-foreground">No Availability</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                          {slotsData.availableSlots.map(slot => (
                            <button
                              key={slot}
                              className={cn(
                                "h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-200 border",
                                selectedSlot === slot
                                  ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/20 scale-105"
                                  : "bg-white text-foreground border-muted/60 hover:border-secondary/40 hover:shadow-sm"
                              )}
                              onClick={() => {
                                setSelectedSlot(slot)
                                goToNextStep('payment')
                              }}
                            >
                              {formatTime(slot)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-3 pb-3 px-4 md:px-8 border-t flex justify-end gap-3 bg-background/50 backdrop-blur-sm">
              <Button
                variant="outline"
                className="h-11 px-8 text-xs font-bold uppercase tracking-widest cursor-pointer rounded-xl"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                BACK
              </Button>
            </div>
          </div>
        )
      case 'payment':
        const selectedDoc = doctors.find(d => d._id === selectedDoctor)
        const selectedSer = services.find(s => s._id === selectedService)

        return (
          <div className="flex h-auto min-h-0 flex-col md:h-full">
            <div className="bg-background px-4 pb-4 pt-5 md:p-6 md:pb-6">
              <h2 className="text-xl font-bold flex items-center text-foreground">
                <CreditCard className="mr-2 h-5 w-5 text-secondary" />
                {isBooked ? 'Booking Confirmed!' : 'Review & Pay'}
              </h2>
            </div>

            <div className="flex flex-1 min-h-0 flex-col bg-accent/15 px-4 pb-0 pt-0 md:p-8 md:pb-0 md:pt-0">
              <div className="custom-scrollbar flex-1 min-h-0 overflow-visible py-4 pr-0 md:overflow-y-auto md:py-2 md:pr-2">
                <div className="space-y-8 lg:space-y-4 max-w-2xl mx-auto pb-6">
                  {isBooked ? (
                    <div className="text-center py-10 space-y-6">
                      <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
                        <Check className="h-10 w-10" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
                        <p className="text-muted-foreground mt-2">Your appointment has been successfully scheduled.</p>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border shadow-sm text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <Check className="h-24 w-24 text-secondary rotate-12" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-6 block border-b pb-2">Appointment Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4 relative z-10">
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Clinic</p>
                                <p className="text-sm font-bold text-foreground">{selectedClinicObj?.name}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <Stethoscope className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Doctor</p>
                                <p className="text-sm font-bold text-foreground">Dr. {selectedDoc?.firstName} {selectedDoc?.lastName}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <CalendarIcon className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Schedule</p>
                                <p className="text-sm font-bold text-foreground">
                                  {format(selectedDate, 'MMM d, yyyy')}<br />
                                  <span className="text-secondary">{formatTime(selectedSlot || '')}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <RefreshCcw className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Service</p>
                                <p className="text-sm font-bold text-foreground">{selectedSer?.name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <CreditCard className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Payment Method</p>
                                <p className="text-sm font-bold text-foreground capitalize">
                                  {selectedPaymentMode?.replace('_', ' ') || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Payment Status</p>
                                <div className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                  selectedPaymentMode === 'pay_later' ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                                )}>
                                  {selectedPaymentMode === 'pay_later' ? 'UNPAID / AT CLINIC' : 'PAID SUCCESS'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
                        <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/10">
                          <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-secondary">Booking Note</h3>
                        </div>
                        <CardContent className="p-4">
                          <textarea
                            value={bookingDescription}
                            onChange={(e) => setBookingDescription(e.target.value)}
                            placeholder="Add note for doctor (optional)"
                            rows={3}
                            className="w-full resize-none rounded-xl border border-muted bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-secondary/20"
                          />
                        </CardContent>
                      </Card>

                      {/* Booking Summary - Top (Classic Design) */}
                      <Card className="bg-white border-none shadow-sm rounded-[2rem] overflow-hidden">
                        <div className="bg-secondary/5 px-6 py-3 border-b border-secondary/10">
                          <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-secondary">Appointment Summary</h3>
                        </div>
                        <CardContent className="p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="space-y-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Professional</span>
                                <span className="font-bold text-[13px]">Dr. {selectedDoc?.firstName} {selectedDoc?.lastName}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medical Service</span>
                                <span className="font-bold text-[13px]">{selectedSer?.name}</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Schedule</span>
                                <span className="font-bold text-[13px] text-secondary">
                                  {format(selectedDate, 'EEE, MMM d, yyyy')} • {selectedSlot ? formatTime(selectedSlot) : 'N/A'}
                                </span>
                              </div>
                              <div className="rounded-xl border border-secondary/10 bg-secondary/[0.03] p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Due</span>
                                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Breakdown</span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>${baseAmount.toFixed(2)}</span>
                                  </div>
                                  {isCalculatingTax ? (
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                      <span>{primaryTaxName}</span>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    </div>
                                  ) : taxDisplayRows.length ? (
                                    taxDisplayRows.map((tax) => (
                                      <div key={tax.id} className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                        <span>{tax.name}</span>
                                        <span>${tax.amount.toFixed(2)}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                      <span>Tax</span>
                                      <span>$0.00</span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-2.5 border-t border-dashed border-secondary/20 pt-2.5 flex items-center justify-between">
                                  <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Total</span>
                                  <span className="text-lg font-black text-foreground">${totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Methods - Classic Design */}
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-foreground">Choose Payment</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-xl mx-auto pb-4">
                          {settings.pay_later?.isActive && (
                            <Card
                              className={cn(
                                "group cursor-pointer border-2 transition-all duration-300 rounded-[1.5rem] h-28 flex flex-col items-center justify-center",
                                selectedPaymentMode === 'pay_later' ? "border-secondary bg-secondary/5 shadow-md" : "border-muted/20 bg-white hover:border-secondary/20"
                              )}
                              onClick={() => setSelectedPaymentMode('pay_later')}
                            >
                              <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all mb-1 text-secondary")}>
                                <Clock className="h-6 w-6" />
                              </div>
                              <div className="text-center px-1">
                                <h3 className={cn("font-bold text-[10px] uppercase tracking-wider text-muted-foreground")}>Pay Later</h3>
                              </div>
                            </Card>
                          )}

                          {settings.stripe?.isActive && (
                            <Card
                              className={cn(
                                "cursor-pointer border-2 gap-2 transition-all duration-300 rounded-[1.5rem] h-28 flex flex-col items-center justify-center",
                                selectedPaymentMode === 'stripe' ? "border-secondary bg-secondary/5 shadow-md" : "border-muted/20 bg-white hover:border-secondary/20"
                              )}
                              onClick={() => setSelectedPaymentMode('stripe')}
                            >
                              <div className="h-10 flex items-center justify-center mb-1 px-4">
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                                  alt="Stripe"
                                  className="h-6 w-auto"
                                />
                              </div>
                              <div className="text-center px-1">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Stripe</h3>
                              </div>
                            </Card>
                          )}

                          {settings.paypal?.isActive && (
                            <Card
                              className={cn(
                                "cursor-pointer border-2 gap-2 transition-all duration-300 rounded-[1.5rem] h-28 flex flex-col items-center justify-center",
                                selectedPaymentMode === 'paypal' ? "border-secondary bg-secondary/5 shadow-md" : "border-muted/20 bg-white hover:border-secondary/20"
                              )}
                              onClick={() => setSelectedPaymentMode('paypal')}
                            >
                              <div className="h-10 flex items-center justify-center mb-1 px-4">
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                                  alt="PayPal"
                                  className="h-6 w-auto"
                                />
                              </div>
                              <div className="text-center px-1">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">PayPal</h3>
                              </div>
                            </Card>
                          )}

                          {settings.razorpay?.isActive && (
                            <Card
                              className={cn(
                                "cursor-pointer border-2 gap-2 transition-all duration-300 rounded-[1.5rem] h-28 flex flex-col items-center justify-center",
                                selectedPaymentMode === 'razorpay' ? "border-secondary bg-secondary/5 shadow-md" : "border-muted/20 bg-white hover:border-secondary/20"
                              )}
                              onClick={() => setSelectedPaymentMode('razorpay')}
                            >
                              <div className="h-10 flex items-center justify-center mb-1 px-4">
                                <img
                                  src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                                  alt="Razorpay"
                                  className="h-8 w-auto"
                                />
                              </div>
                              <div className="text-center px-1">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Razorpay</h3>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-auto border-t bg-background px-4 pb-4 pt-3 md:px-10 md:pt-4 md:pb-4">
              {isBooked ? (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4 md:w-auto">
                  <Button
                    variant="outline"
                    className="h-11 w-full px-6 text-xs font-bold border-secondary text-secondary hover:bg-secondary hover:text-white transition-all shadow-sm rounded-xl uppercase tracking-widest cursor-pointer sm:h-12 sm:w-auto sm:px-10"
                    onClick={handleReset}
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Book Another
                  </Button>
                  <Button
                    asChild
                    className="h-11 w-full px-6 text-xs font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg shadow-secondary/20 transition-all uppercase tracking-widest cursor-pointer sm:h-12 sm:w-auto sm:px-12"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="h-10 w-full px-6 text-xs font-bold uppercase tracking-widest cursor-pointer rounded-xl sm:h-11 sm:w-auto sm:px-8"
                    onClick={goBack}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    BACK
                  </Button>
                  <Button
                    className="h-10 w-full px-6 text-xs font-bold bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg shadow-secondary/20 transition-all uppercase tracking-widest sm:h-11 sm:w-auto sm:px-12"
                    onClick={handleBookAppointment}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> BOOKING...
                      </>
                    ) : (
                      <>CONFIRM & BOOK</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  const selectedClinicObj = clinics.find(c => c._id === selectedClinic)
  const selectedDoctorObj = doctors.find(d => d._id === selectedDoctor)
  const selectedServiceObj = services.find(s => s._id === selectedService)

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl shadow-2xl border border-muted/50 bg-background">
      {/* Restricted Role Overlay (Global) */}
      {!isPatient && currentStep !== 'auth' && (
        <div className="absolute inset-0 z-[100] backdrop-blur-md bg-background/40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center mb-6 border-2 border-secondary/20 shadow-xl">
            <Lock className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Patient Only Access</h2>
          <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">
            The standard appointment booking wizard is exclusively for patient accounts.<br />
            Please use <Link href="/dashboard" className="text-secondary font-bold">dashboard</Link> to manage your appointments.
          </p>
          <Button
            className="mt-8 px-10 h-12 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-lg shadow-secondary/20 font-bold uppercase tracking-widest"
            asChild
          >
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Link>
          </Button>
        </div>
      )}

      <div className={cn(
        "flex flex-col lg:flex-row items-stretch h-auto lg:h-[750px] transition-all duration-500",
        !isPatient && currentStep !== 'auth' && "blur-[8px] opacity-40 grayscale-[0.5] pointer-events-none"
      )}>
        {/* Left Sidebar: Theme-safe Stepper */}
        <div className="w-full lg:w-[320px] border-r border-primary/15 bg-primary/[0.08] p-4 lg:p-8 flex flex-row lg:flex-col text-foreground">
          <div className="flex lg:flex-col lg:items-start items-center justify-between lg:justify-start w-full lg:space-y-8 lg:py-4 lg:px-6">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex
              const isActive = idx === currentStepIndex

              return (
                <div key={step.id} className="flex lg:gap-5 group relative">
                  <div className="flex flex-row lg:flex-col items-center">
                    <div
                      className={cn(
                        "h-8 w-8 lg:h-6 lg:w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10",
                        isCompleted ? "bg-primary border-primary text-primary-foreground" :
                          isActive ? "bg-primary border-primary text-primary-foreground" :
                            "bg-transparent border-border text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> :
                        isActive ? <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" /> :
                          <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={cn(
                        "hidden lg:block w-[2px] h-12 my-1 transition-all duration-500 rounded-full",
                        isCompleted ? "bg-primary/60" : "bg-border"
                      )} />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col justify-start -mt-0.5">
                    <span className={cn(
                      "text-lg font-bold transition-colors leading-tight",
                      isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    <span className={cn(
                      "text-xs mt-1 transition-colors leading-normal max-w-[180px]",
                      isActive || isCompleted ? "text-muted-foreground" : "text-muted-foreground/70"
                    )}>
                      {step.description}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-background min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Persistent Selection Summary - Styled as Minimal Bar */}
      <div className="bg-muted/20 border-t px-4 lg:px-8 py-3 flex flex-col md:flex-row items-start md:items-center gap-2 lg:gap-10">
        <span className="text-[9px] lg:text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">Your Selections:</span>
        <div className="flex gap-4 lg:gap-8 overflow-x-auto no-scrollbar w-full">
          {selectedClinicObj && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[11px] font-bold text-foreground truncate max-w-[150px]">{selectedClinicObj.name}</span>
            </div>
          )}
          {selectedDoctorObj && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[11px] font-bold text-foreground">Dr. {selectedDoctorObj.firstName}</span>
            </div>
          )}
          {selectedServiceObj && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[11px] font-bold text-foreground">{selectedServiceObj.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs handled via steps or persistent overlays */}

      <BookingResultDialog
        type="success"
        open={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onDashboard={() => {
          setIsSuccessDialogOpen(false)
          router.push('/dashboard')
        }}
        onRepeat={handleReset}
      />

      <BookingResultDialog
        type="error"
        open={isErrorDialogOpen}
        onOpenChange={setIsErrorDialogOpen}
        message={errorMessage}
        onDashboard={() => router.push('/dashboard')}
        onRepeat={() => {
          setIsErrorDialogOpen(false)
          setCurrentStep('datetime')
          setSelectedSlot(null)
        }}
      />
    </div>
  )
}

function BookingResultDialog({
  type,
  open,
  onOpenChange,
  message,
  onDashboard,
  onRepeat
}: {
  type: 'success' | 'error',
  open: boolean,
  onOpenChange: (o: boolean) => void,
  message?: string,
  onDashboard: () => void,
  onRepeat: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border shadow-2xl rounded-[2rem] max-w-md w-full p-8 text-center relative"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted/50 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>

            <div className={cn(
              "h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center",
              type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {type === 'success' ? <Check className="h-10 w-10" /> : <BookingXIcon className="h-10 w-10" />}
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {type === 'success' ? 'Appointment Booked!' : 'Booking Failed'}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              {type === 'success'
                ? 'Your appointment has been successfully scheduled. You can view all details and manage your booking in your personal dashboard.'
                : message || 'Something went wrong while processing your booking. Please check your payment status or try again.'}
            </p>

            <div className="flex flex-row gap-3">
              <Button
                variant="outline"
                onClick={onRepeat}
                className="flex-1 h-12 text-[11px] font-bold cursor-pointer rounded-xl border-muted/30 bg-primary hover:bg-primary/70 uppercase tracking-wider text-white shadow-md shadow-primary/5"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Book Another
              </Button>
              <Button
                asChild
                className="flex-1 h-12 text-[11px] font-bold cursor-pointer rounded-xl bg-secondary hover:bg-secondary/70 shadow-lg shadow-secondary/20 uppercase tracking-wider text-white"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function BookingXIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}
