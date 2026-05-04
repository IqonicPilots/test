"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfToday, isSameDay } from 'date-fns'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronRight, ChevronLeft, Loader2,
  Calendar as CalendarIcon, Clock, Star,
  Stethoscope,
  Building2,
  MapPin,
  ShieldCheck,
  HelpCircle,
  CreditCard, Lock,
  Wallet,  Phone, Banknote, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStoredAuthSession } from '@/lib/auth-session'
import { BookingAuthContent } from './booking-auth-content'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useInfiniteClinics, useClinic } from '@/hooks/api/use-clinics'
import { useInfiniteDoctors, useDoctor } from '@/hooks/api/use-doctors'
import { useInfiniteServices } from '@/hooks/api/use-services'
import { useProfile } from '@/hooks/api/use-profile'
import { useAppointmentBookSlots } from '@/hooks/api/use-doctor-sessions'
import { usePublicPaymentSettings } from '@/hooks/api/use-payment-settings'
import { appointmentService } from '@/services/appointment.service'
import { taxApi } from '@/services/tax.service'
import type { TaxCalculationResponse } from '@/types/tax.types'
import type { Clinic } from '@/types/clinic.types'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Helper to load Razorpay
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return resolve(true)
    }
    if (typeof document === 'undefined') return resolve(false)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const formatTime = (time: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours || '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${minutes} ${ampm}`
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function BookingFlowDefault() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // Get IDs from URL params or sessionStorage
  const initialDoctorId = searchParams.get('doctorId') || (typeof window !== 'undefined' ? sessionStorage.getItem('bookingDoctorId') : null)
  const initialClinicId = searchParams.get('clinicId') || (typeof window !== 'undefined' ? sessionStorage.getItem('bookingClinicId') : null)

  // Step state (6 steps)
  const [currentStep, setCurrentStep] = useState(1)
  const [history, setHistory] = useState<number[]>([])
  const [isBackNavigation, setIsBackNavigation] = useState(false)
  const [suppressStep1AutoAdvance, setSuppressStep1AutoAdvance] = useState(false)

  // Selection State
  const [selectedClinic, setSelectedClinic] = useState<string | null>(initialClinicId)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(initialDoctorId)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('pay_later')
  const [bookingDescription, setBookingDescription] = useState('')

  // UI States
  const [isBooking, setIsBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Tax calculation state
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResponse | null>(null)
  const [isCalculatingTax, setIsCalculatingTax] = useState(false)

  // Data Fetching
  const session = getStoredAuthSession()
  const isPatient = !session || session.user.role === 'patient'
  const { data: profile } = useProfile({ enabled: !!session?.accessToken })

  // Fetch entities for context card
  const { data: contextDoctor, isLoading: isContextDoctorLoading } = useDoctor(initialDoctorId || "")
  const { data: contextClinic, isLoading: isContextClinicLoading } = useClinic(initialClinicId || "")

  // Fetch lists for selection
  const {
    data: clinicsInfiniteData,
  } = useInfiniteClinics(100, { isActive: true }, true) // Always fetch clinics for label lookup

  const {
    data: doctorsInfiniteData,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(100, { clinicId: selectedClinic || undefined, status: 'active' }, !!selectedClinic)

  const {
    data: servicesInfiniteData,
    isLoading: isServicesLoading,
  } = useInfiniteServices(100, {
    clinicId: selectedClinic || undefined,
    doctorId: selectedDoctor || undefined,
    status: 'active'
  }, !!(selectedClinic && selectedDoctor))

  const { data: slotsData, isLoading: isSlotsLoading } = useAppointmentBookSlots({
    clinicId: selectedClinic || undefined,
    doctorId: selectedDoctor || undefined,
    date: format(selectedDate, 'yyyy-MM-dd'),
    serviceId: selectedService || undefined,
    enabled: !!(selectedClinic && selectedDoctor && selectedService)
  })

  const profileInitials = `${profile?.firstName} ${profile?.lastName}`.split(" ").map((n) => n[0]).join("").slice(0, 2)

  const { data: paymentSettings } = usePublicPaymentSettings()
  const settings = paymentSettings || {}

  // Auto-select first enabled payment method when settings are loaded
  useEffect(() => {
    if (!paymentSettings) return

    const paymentMethods = ['pay_later', 'stripe', 'paypal', 'razorpay']
    const firstEnabled = paymentMethods.find(method => (paymentSettings as any)[method]?.isActive)

    if (firstEnabled) {
      setSelectedPaymentMode(firstEnabled)
    }
  }, [paymentSettings])

  // Calculate enabled payment methods
  const enabledPaymentMethods = useMemo(() => {
    const paymentMethods = [
      { id: 'pay_later', label: 'Pay Later at Clinic', icon: <Clock className="h-5 w-5" />, badge: <span className="bg-muted px-2.5 py-1 rounded text-[10px] font-black tracking-tighter text-muted-foreground opacity-50">PAY LATER</span> },
      { id: 'stripe', label: 'Credit / Debit Card', icon: <CreditCard className="h-5 w-5" />, badge: <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-5 opacity-80" alt="Stripe" /> },
      { id: 'paypal', label: 'PayPal', icon: <Wallet className="h-5 w-5" />, badge: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6 opacity-80" alt="PayPal" /> },
      { id: 'razorpay', label: 'Razorpay', icon: <Banknote className="h-5 w-5" />, badge: <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-5 opacity-80" alt="Razorpay" /> }
    ]
    return paymentMethods.filter(method => (settings as any)[method.id]?.isActive ?? false)
  }, [settings])

  // Memos
  const clinics = useMemo(() => clinicsInfiniteData?.pages.flatMap(p => p.data) || [], [clinicsInfiniteData])
  const doctors = useMemo(() => doctorsInfiniteData?.pages.flatMap(p => p.data) || [], [doctorsInfiniteData])
  const services = useMemo(() => servicesInfiniteData?.pages.flatMap(p => p.data) || [], [servicesInfiniteData])
  const slots = slotsData?.availableSlots || []

  const selectedClinicObj = useMemo(() => {
    const fromList = clinics.find(c => c._id === selectedClinic)
    if (fromList) return fromList
    if (contextClinic) return contextClinic
    // Check inside doctor clinics if they are objects
    if (contextDoctor?.meta?.clinics) {
      const found = contextDoctor.meta.clinics.find((c: any) => (typeof c === 'object' ? c._id === selectedClinic : c === selectedClinic))
      if (typeof found === 'object') return found as unknown as Clinic
    }
    return null
  }, [contextClinic, clinics, selectedClinic, contextDoctor])

  const selectedDoctorObj = useMemo(() => {
    const fromList = doctors.find(d => d._id === selectedDoctor)
    if (fromList) return fromList
    if (contextDoctor) return contextDoctor
    return null
  }, [contextDoctor, doctors, selectedDoctor])

  const selectedServiceObj = useMemo(() => services.find(s => s._id === selectedService), [services, selectedService])
  const primaryTaxName = taxCalculation?.taxes?.[0]?.taxName || 'Tax'
  const taxDisplayRows = taxCalculation?.taxes?.length
    ? taxCalculation.taxes
      .map((tax) => ({
        id: String(tax.taxId),
        name: tax.taxName || primaryTaxName,
        amount: Number(tax.totalAmount || 0),
      }))
      .filter((tax) => tax.amount > 0)
    : (taxCalculation?.totalTaxAmount || 0) > 0
      ? [{ id: 'tax-total', name: primaryTaxName, amount: Number(taxCalculation?.totalTaxAmount || 0) }]
      : []

  const clincMobile = `${selectedClinicObj?.countryCode}${selectedClinicObj?.mobile}`

  // Calculate tax when service, clinic, or doctor changes
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
  const goToNextStep = () => {
    setHistory(prev => [...prev, currentStep])
    setCurrentStep(prev => prev + 1)
  }

  const goBack = () => {
    if (history.length === 0) return

    // After successful auth, skip returning to auth step on back.
    if (profile && history[history.length - 1] === 4) {
      const fallbackStep = history[history.length - 2] ?? 3
      setIsBackNavigation(true)
      if (fallbackStep === 1) {
        setSuppressStep1AutoAdvance(true)
      }
      setHistory(h => h.slice(0, -2))
      setCurrentStep(fallbackStep)
      return
    }

    const prev = history[history.length - 1]
    setIsBackNavigation(true)
    if (prev === 1) {
      setSuppressStep1AutoAdvance(true)
    }
    setHistory(h => h.slice(0, -1))
    setCurrentStep(prev)
  }

  useEffect(() => {
    if (!isBackNavigation) return
    setIsBackNavigation(false)
  }, [currentStep, isBackNavigation])

  // Auto-select clinic when only one option is available at step 1.
  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep !== 1 || selectedClinic) return

    if (initialDoctorId) {
      const doctorClinicIds = (contextDoctor?.meta?.clinics || [])
        .map((clinic: any) => (typeof clinic === 'object' ? clinic?._id : clinic))
        .filter(Boolean)

      if (doctorClinicIds.length === 1) {
        setSelectedClinic(doctorClinicIds[0] as string)
      }
      return
    }

    if (!initialClinicId && clinics.length === 1) {
      setSelectedClinic(clinics[0]._id)
    }
  }, [currentStep, selectedClinic, initialDoctorId, initialClinicId, contextDoctor, clinics, isBackNavigation])

  // Auto-select doctor when only one option is available at step 1.
  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep !== 1 || selectedDoctor || isDoctorsLoading || !!initialDoctorId) return
    if (doctors.length === 1) {
      setSelectedDoctor(doctors[0]._id)
    }
  }, [currentStep, selectedDoctor, isDoctorsLoading, initialDoctorId, doctors, isBackNavigation])

  // Auto-advance to service step when clinic and doctor are already uniquely resolved.
  useEffect(() => {
    if (isBackNavigation) return
    if (suppressStep1AutoAdvance) return
    if (currentStep === 1 && selectedClinic && selectedDoctor) {
      goToNextStep()
    }
  }, [currentStep, selectedClinic, selectedDoctor, isBackNavigation, suppressStep1AutoAdvance])

  // Auto-select service when only one option is available at step 2.
  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep !== 2 || selectedService || isServicesLoading) return
    if (services.length === 1) {
      setSelectedService(services[0]._id)
      goToNextStep()
    }
  }, [currentStep, selectedService, isServicesLoading, services, isBackNavigation])

  const handleReset = () => {
    setSelectedClinic(initialClinicId)
    setSelectedDoctor(initialDoctorId)
    setSelectedService(null)
    setSelectedSlot(null)
    setSelectedDate(startOfToday())
    setBookingDescription('')
    setIsBooked(false)
    setHistory([])
    setCurrentStep(1)
  }

  // Handle Step 1 completion
  const handleStep1Next = () => {
    if (selectedClinic && selectedDoctor) {
      setSuppressStep1AutoAdvance(false)
      goToNextStep()
    }
  }

  // Handle Step 2 (Services)
  const handleStep2Next = () => {
    if (selectedService) {
      goToNextStep()
    }
  }

  // Handle Step 3 (Date & Time)
  const handleStep3Next = () => {
    if (selectedSlot) {
      if (!profile) {
        goToNextStep() // To auth step
      } else {
        // Skip auth step if already logged in and go directly to payment (step 5)
        setHistory(prev => [...prev, currentStep])
        setCurrentStep(5)
      }
    }
  }

  // Handle Auth success or confirming profile
  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    goToNextStep()
  }

  // Booking Logic
  const handleBookAppointment = async () => {
    if (!selectedClinic || !selectedDoctor || !selectedService || !selectedSlot) return
    setIsBooking(true)
    try {
      const baseAmount = Number(selectedServiceObj?.charges || 0)
      const taxAmount = taxCalculation?.totalTaxAmount || 0
      const amount = taxCalculation?.grandTotal || baseAmount
      const clientRef = `appointment_${Date.now()}`

      if (selectedPaymentMode === 'pay_later') {
        const payload = {
          clinicId: selectedClinic,
          doctorId: selectedDoctor,
          patientId: profile?._id,
          serviceId: selectedService,
          appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
          slot: selectedSlot,
          status: 'booked',
          paymentMode: 'pay_later',
          paymentStatus: 'pending',
          appointmentCharge: amount,
          taxAmount: taxAmount,
          description: bookingDescription || undefined,
        }
        await appointmentService.createAppointment(payload as any)
        setIsBooked(true)
        goToNextStep() // Go to confirmation
      } else if (selectedPaymentMode === 'razorpay') {
        const res = await loadRazorpay()
        if (!res) throw new Error('Razorpay SDK failed to load')
        const result = await appointmentService.createRazorpayOrderForCheckout({ amount })
        if (result?.orderId) {
          const options = {
            key: result.keyId,
            amount: result.amount,
            currency: result.currency,
            name: "Kivicare",
            description: `Appointment with Dr. ${selectedDoctorObj?.firstName}`,
            order_id: result.orderId,
            handler: async (response: any) => {
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
                paymentDetails: { transactionId: response.razorpay_payment_id, orderId: response.razorpay_order_id },
                appointmentCharge: amount,
                taxAmount: taxAmount,
                description: bookingDescription || undefined,
              }
              await appointmentService.createAppointment(payload as any)
              setIsBooked(true)
              goToNextStep()
            },
            prefill: { name: profile ? `${profile.firstName} ${profile.lastName}` : '', email: profile?.email, contact: profile?.mobile },
            theme: { color: "#3B82F6" }
          }
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        }
      } else {
        // Stripe/Paypal
        let checkoutUrl = ""
        if (selectedPaymentMode === 'stripe') {
          const result = await appointmentService.createStripeCheckoutForCheckout({ amount, clientRef })
          checkoutUrl = result?.checkoutUrl || ""
        } else {
          const result = await appointmentService.createPaypalOrderForCheckout({ amount, clientRef })
          checkoutUrl = result?.approveUrl || ""
        }
        if (checkoutUrl) {
          const popup = window.open(checkoutUrl, `${selectedPaymentMode}_payment`, 'width=600,height=800')
          const handleMsg = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            if (event.data?.type === `${selectedPaymentMode}-payment-result` && event.data.status === 'success') {
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
                paymentDetails: { transactionId: event.data.transactionId || event.data.sessionId },
                appointmentCharge: amount,
                taxAmount: taxAmount,
                description: bookingDescription || undefined,
              }
              await appointmentService.createAppointment(payload as any)
              setIsBooked(true)
              goToNextStep()
              window.removeEventListener('message', handleMsg)
            }
          }
          window.addEventListener('message', handleMsg)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking failed')
    } finally {
      setIsBooking(false)
    }
  }

  // Progress Bar Components
  const steps_labels = [
    { label: 'Specialty', shortLabel: 'Specialty' },
    { label: 'Services', shortLabel: 'Services' },
    { label: 'Date & Time', shortLabel: 'Date/Time' },
    { label: 'Basic Information', shortLabel: 'Basic Info' },
    { label: 'Payment', shortLabel: 'Payment' },
    { label: 'Confirmation', shortLabel: 'Confirm' }
  ]

  const ProgressBar = () => (
    <div className="mb-2 w-full py-3 md:mb-8 md:py-2">
      <div className="mx-auto flex w-full max-w-[700px] flex-wrap justify-center gap-y-3 px-2 sm:flex-nowrap sm:justify-between sm:gap-2 sm:px-4 md:px-0">
        {steps_labels.map((step, idx) => {
          const stepNum = idx + 1
          const isActive = currentStep === stepNum
          const isCompleted = currentStep > stepNum

          return (
            <div key={idx} className="flex w-1/3 flex-col items-center sm:w-auto sm:flex-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:text-sm",
                  isActive
                    ? "bg-primary text-white scale-110 shadow-lg"
                    : isCompleted
                    ? "bg-primary text-white"
                    : "bg-muted/30 text-muted-foreground border border-muted"
                )}
              >
                {stepNum}
              </div>

              <span
                className={cn("mt-1.5 text-center text-[10px] font-bold leading-tight sm:mt-2 sm:text-xs", isActive ? "text-primary" : "text-muted-foreground/60")}
              >
                <span className="sm:hidden">{step.shortLabel}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (!isPatient) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border text-center max-w-lg mx-4">
          <div className="h-24 w-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"><Lock className="h-10 w-10" /></div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Patient Only Access</h2>
          <p className="text-muted-foreground mb-10 text-lg">Booking is restricted to patient accounts. Please use your patient portal or return to your dashboard.</p>
          <Button asChild className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-bold uppercase tracking-widest"><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </div>
    )
  }

  // Entity Details Header (Doccure style)
  const EntityHeader = () => {
    const entity = initialDoctorId ? contextDoctor : contextClinic
    if (!entity && !isContextDoctorLoading && !isContextClinicLoading) return null

    const name = initialDoctorId ? `Dr. ${contextDoctor?.firstName} ${contextDoctor?.lastName}` : contextClinic?.name
    const image = initialDoctorId ? contextDoctor?.meta?.profilePicture : contextClinic?.cliniclogo
    const specialty = initialDoctorId
      ? (contextDoctor?.meta?.specialties?.map((s: any) => typeof s === 'object' ? s.label : s).join(', '))
      : (Array.isArray(contextClinic?.specialties) ? contextClinic.specialties.map((s: any) => typeof s === 'object' ? s.label : s).join(', ') : contextClinic?.specialties || 'General Clinic')
    const address = initialDoctorId
      ? (typeof contextDoctor?.meta?.address === 'object' ? `${contextDoctor.meta.address.street}, ${contextDoctor.meta.address.city}, ${contextDoctor.meta.address.state}` : contextDoctor?.meta?.address)
      : `${contextClinic?.address?.street}, ${contextClinic?.address?.city}`

    return (
      <div className="bg-white rounded-2xl border border-muted/30 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-white shadow-md overflow-hidden shrink-0 ring-1 ring-muted">
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/5 flex items-center justify-center text-primary">
                  {initialDoctorId ? <Stethoscope className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{name}</h1>
              <Badge className="bg-[#FF6A13] hover:bg-[#FF6A13] text-white border-none px-2 py-0.5 text-[10px] font-bold h-5 gap-1 self-center md:self-auto uppercase tracking-tighter">
                <Star className="h-2 w-2 fill-current" /> 5.0
              </Badge>
            </div>
            <p className="text-[#3B82F6] font-bold text-sm tracking-tight">{specialty || (initialDoctorId ? 'Medical Professional' : 'General Clinic')}</p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-muted-foreground text-xs font-medium pt-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <span className="truncate">{address || 'Contact for location details'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rendering Content based on Step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Specialty / Clinic Selection / Doctor Selection
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border border-muted/30 rounded-2xl p-6 md:p-8 bg-white">
              <div className="space-y-6">
                <div className="space-y-6">
                  {/* CASE 1: Doctor ID provided -> Select Clinic */}
                  {initialDoctorId && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-gray-800">Select Clinic</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {contextDoctor?.meta?.clinics?.map((c: any) => {
                          const cid = typeof c === 'object' ? c._id : c
                          const fullClinic = clinics.find(cl => cl._id === cid)
                          const cname = fullClinic?.name || (typeof c === 'object' ? c.name : 'Clinic')
                          const cImg = fullClinic?.cliniclogo || (typeof c === 'object' ? c.cliniclogo : undefined)
                          const rawSpec = fullClinic?.specialties || (typeof c === 'object' ? c.specialties : undefined)
                          const cSpec = Array.isArray(rawSpec) ? rawSpec.map((s: any) => typeof s === 'object' ? s.label : s).join(', ') : rawSpec
                          const isSelected = selectedClinic === cid
                          return (
                            <div
                              key={cid}
                              onClick={() => setSelectedClinic(cid)}
                              className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/10 shadow-sm" : "border-muted/40 hover:border-primary/20 bg-white"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={cImg} />
                                  <AvatarFallback className="bg-primary/10 text-primary">{cname.charAt(0)}{cname.charAt(1)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className={cn("font-bold text-[15px] leading-tight", isSelected ? "text-primary" : "text-gray-700")}>{cname}</span>
                                  <span className="text-[12px] font-bold text-muted-foreground/80 mt-1">{cSpec || 'General Clinic'}</span>
                                </div>
                              </div>
                              {isSelected && <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center p-0.5"><Check className="h-3 w-3 stroke-[3]" /></div>}
                            </div>
                          )
                        })}
                        {!contextDoctor?.meta?.clinics?.length && !isContextDoctorLoading && (
                          <p className="text-sm text-muted-foreground">No clinics associated with this doctor.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CASE 2: Clinic ID provided, No Doctor ID -> Select Doctor */}
                  {initialClinicId && !initialDoctorId && (
                    <div className="space-y-4">
                      <h3 className="text-base font-bold text-gray-800">Select Doctor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        {doctors.map(d => {
                          const isSelected = selectedDoctor === d._id
                          const dImg = d.meta?.profilePicture
                          const dSpec = d.meta?.specialties?.map((s: any) => typeof s === 'object' ? s.label : s).join(', ')
                          return (
                            <div
                              key={d._id}
                              onClick={() => setSelectedDoctor(d._id)}
                              className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/10 shadow-sm" : "border-muted/40 hover:border-primary/20 bg-white"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={dImg} />
                                  <AvatarFallback className="bg-primary/10 text-primary">{d.firstName.charAt(0)}{d.lastName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className={cn("font-bold text-[15px] leading-tight", isSelected ? "text-primary" : "text-gray-700")}>Dr. {d.firstName} {d.lastName}</span>
                                  <span className="text-[12px] font-bold text-muted-foreground/80 mt-1">{dSpec || 'General Practitioner'}</span>
                                </div>
                              </div>
                              {isSelected && <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center p-0.5"><Check className="h-3 w-3 stroke-[3]" /></div>}
                            </div>
                          )
                        })}
                        {doctors.length === 0 && !isDoctorsLoading && (
                          <p className="text-sm text-muted-foreground">No doctors found in this clinic.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CASE 3: No IDs -> Select Clinic THEN Doctor */}
                  {!initialDoctorId && !initialClinicId && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-800">Select Clinic</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                          {clinics.map(c => {
                            const cid = c._id
                            const isSelected = selectedClinic === cid
                            const cSpec = Array.isArray(c.specialties) ? c.specialties.map((s: any) => typeof s === 'object' ? s.label : s).join(', ') : c.specialties
                            return (
                              <div
                                key={cid}
                                onClick={() => {
                                  setSelectedClinic(cid)
                                  setSelectedDoctor(null)
                                  setSelectedService(null)
                                }}
                                className={cn(
                                  "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                  isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/10 shadow-sm" : "border-muted/40 hover:border-primary/20 bg-white"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={c.cliniclogo} />
                                    <AvatarFallback className="bg-primary/10 text-primary">{c.name.charAt(0)}{c.name.charAt(1)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className={cn("font-bold text-[15px] leading-tight", isSelected ? "text-primary" : "text-gray-700")}>{c.name}</span>
                                    <span className="text-[12px] font-bold text-muted-foreground/80 mt-1">{cSpec || 'General Clinic'}</span>
                                  </div>
                                </div>
                                {isSelected && <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center p-0.5"><Check className="h-3 w-3 stroke-[3]" /></div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {selectedClinic && (
                        <div className="space-y-4 pt-6 border-t border-dashed">
                          <h3 className="text-base font-bold text-gray-800">Select Doctor</h3>
                          {isDoctorsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[1, 2].map(i => <div key={i} className="h-20 bg-muted/10 animate-pulse rounded-xl" />)}
                            </div>
                          ) : doctors.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                              {doctors.map(d => {
                                const isSelected = selectedDoctor === d._id
                                const dImg = d.meta?.profilePicture
                                const dSpec = d.meta?.specialties?.map((s: any) => typeof s === 'object' ? s.label : s).join(', ')
                                return (
                                  <div
                                    key={d._id}
                                    onClick={() => setSelectedDoctor(d._id)}
                                    className={cn(
                                      "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                      isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/10 shadow-sm" : "border-muted/40 hover:border-primary/20 bg-white"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-12 w-12">
                                        <AvatarImage src={dImg} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{d.firstName.charAt(0)}{d.lastName.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span className={cn("font-bold text-[15px] leading-tight", isSelected ? "text-primary" : "text-gray-700")}>Dr. {d.firstName} {d.lastName}</span>
                                        <span className="text-[12px] font-bold text-muted-foreground/80 mt-1">{dSpec || 'General Practitioner'}</span>
                                      </div>
                                    </div>
                                    {isSelected && <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center p-0.5"><Check className="h-3 w-3 stroke-[3]" /></div>}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No doctors available for the selected clinic.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStep1Next}
                disabled={!selectedClinic || !selectedDoctor}
                className="h-12 px-8 rounded-full font-bold text-sm bg-primary hover:bg-primary/90 text-white gap-2 uppercase tracking-wide"
              >
                Select Service <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case 2: // Services
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border border-muted/30 rounded-2xl p-6 md:p-8 bg-white">
              <div className="space-y-6">
                <h3 className="text-base font-bold text-gray-800">Available Services</h3>
                {isServicesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />)}
                  </div>
                ) : services.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-muted/5">
                    <p className="text-muted-foreground text-sm font-medium">No services available for the selection.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {services.map(service => (

                      <div
                        key={service._id}
                        onClick={() => setSelectedService(service._id)}
                        className={cn(
                          "relative p-4 md:p-6 rounded-xl border-1 shadow-sm cursor-pointer group flex flex-row justify-center items-center justify-between",
                          selectedService === service._id ? "border-primary bg-primary/[0.02] shadow-sm" : "hover:border-primary/20"
                        )}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-800 text-[15px] leading-tight">{service.name}</h4>
                          <p className="text-sm font-bold text-muted-foreground/80">${service.charges} | {service.duration} minutes</p>
                        </div>
                        {selectedService === service._id &&
                          <div className="h-4 w-4 bg-primary text-white rounded-full flex items-center justify-center p-0.5 animate-in zoom-in duration-200">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={goBack} className="h-10 w-full rounded-full font-bold uppercase text-xs tracking-widest sm:h-12 sm:w-auto">
                <ChevronLeft className="h-4 w-4" />Back
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={!selectedService}
                className="h-10 w-full rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-wide text-white gap-2 hover:bg-primary/90 sm:h-12 sm:w-auto sm:px-8 sm:text-sm"
              >
                Select Date & Time <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case 3: // Date & Time
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 border border-muted/30 rounded-2xl p-6 md:p-8 bg-white">
              <div className="p-4 rounded-[1rem] border-1 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(date) => date < startOfToday()}
                  className="w-full"
                />
              </div>
              <div className="bg-white p-6 rounded-[1rem] border-1 shadow-sm min-h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-8 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm uppercase font-semibold">{format(selectedDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-semibold">{slots.length} Slots</Badge>
                </div>

                {isSlotsLoading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-muted/40 animate-pulse rounded-xl" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-10">
                    <Clock className="h-12 w-12 mb-4" />
                    <p className="uppercase tracking-widest text-xs">No slots available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {slots.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={cn(
                          "h-12 rounded-xl text-[11px] transition-all border-2 shadow-sm font-semibold",
                          selectedSlot === s ? "bg-primary border-primary text-white shadow-lg scale-105" : "bg-white border-muted/30 hover:border-primary/30"
                        )}
                      >
                        {formatTime(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={goBack} className="h-10 w-full rounded-full font-bold uppercase text-xs tracking-widest sm:h-12 sm:w-auto">
                <ChevronLeft className="h-4 w-4" />Back
              </Button>
              <Button
                onClick={handleStep3Next}
                disabled={!selectedSlot}
                className="h-10 w-full rounded-full bg-primary px-4 text-[11px] font-bold uppercase tracking-wide text-white gap-2 hover:bg-primary/90 sm:h-12 sm:w-auto sm:px-8 sm:text-sm"
              >
                {profile ? "Continue to Payment" : "Add Basic Information"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case 4: // Basic Info / Auth
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isPatient ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 shadow-xl space-y-6">
                <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-black">Account Restricted</h3>
                <p className="text-muted-foreground font-medium max-w-sm mx-auto">Scheduling is reserved for patient accounts. Please switch to a patient account to continue.</p>
                <Button className="rounded-full h-14 px-8 uppercase font-black text-xs tracking-widest shadow-xl shadow-primary/20" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-[1rem] border-1 shadow-sm p-4 md:p-8 bg-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                      <h3 className="text-2xl font-black">Patient Information</h3>
                      <p className="text-sm text-muted-foreground font-medium">Verify your details or login to continue.</p>
                    </div>
                    {profile && (
                      <div className="flex items-center gap-4 bg-primary/5 pl-4 pr-1 py-1 rounded-full border border-primary/10">
                        <span className="text-sm font-black text-primary uppercase">{profile.firstName} {profile.lastName}</span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.meta?.profilePicture} />
                          <AvatarFallback className="bg-primary/10 text-primary">{profileInitials}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>

                  {profile ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-[1rem] border-2 shadow-sm">
                          <label className="text-md font-semibold text-muted-foreground mb-1.5 block">Email Address</label>
                          <p className="font-bold text-foreground">{profile.email}</p>
                        </div>
                        <div className="p-6 rounded-[1rem] border-2 shadow-sm">
                          <label className="text-md font-semibold text-muted-foreground mb-1.5 block">Phone Number</label>
                          <p className="font-bold text-foreground">{profile.countryCode} {profile.mobile}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <BookingAuthContent onSuccess={handleAuthSuccess} />
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={goBack} className="h-10 w-full rounded-full font-bold uppercase text-xs tracking-widest sm:h-12 sm:w-auto">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={() => goToNextStep()}
                    disabled={!profile}
                    className="h-10 w-full rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-wide text-white gap-2 hover:bg-primary/90 sm:h-12 sm:w-auto sm:px-8 sm:text-sm"
                  >
                    Continue to Payment <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      case 5: // Payment
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-8 rounded-2xl border border-muted/25 sm:p-6 md:p-0 lg:grid-cols-12 lg:items-start lg:gap-10">
              {/* Summary first on mobile (order), payment on wide screens stays left via lg:col-start */}
              <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1">
                <div className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Appointment summary</h3>
                      <p className="text-xs text-muted-foreground">Review before you pay</p>
                    </div>
                  </div>
                  <div className="mb-5 rounded-xl bg-primary/5 p-4 ring-1 ring-inset ring-primary/10">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Date & time</p>
                    <p className="mt-1 text-base font-bold leading-snug text-foreground">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="mt-0.5 text-lg font-black text-primary">{formatTime(selectedSlot || "")}</p>
                  </div>

                  <dl className="space-y-0 divide-y divide-dashed divide-muted/40 text-sm">
                    <div className="flex gap-4 py-3 first:pt-0">
                      <dt className="w-[100px] shrink-0 text-muted-foreground">Service</dt>
                      <dd className="min-w-0 flex-1 text-right font-semibold text-foreground">{selectedServiceObj?.name}</dd>
                    </div>
                    <div className="flex gap-4 py-3">
                      <dt className="w-[100px] shrink-0 text-muted-foreground">Doctor</dt>
                      <dd className="min-w-0 flex-1 text-right font-semibold text-foreground">
                        Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}
                      </dd>
                    </div>
                    <div className="flex gap-4 py-3">
                      <dt className="w-[100px] shrink-0 text-muted-foreground">Clinic</dt>
                      <dd className="min-w-0 flex-1 break-words text-right font-semibold text-foreground">{selectedClinicObj?.name}</dd>
                    </div>
                  </dl>

                  <div className="space-y-3 border-dashed border-muted/30 pt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-bold tabular-nums text-foreground">${Number(selectedServiceObj?.charges || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax :</span>
                      <span />
                    </div>
                    {isCalculatingTax ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="pl-3 text-muted-foreground">{primaryTaxName}</span>
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : taxDisplayRows.length ? (
                      taxDisplayRows.map((tax) => (
                        <div key={tax.id} className="flex items-center justify-between text-sm">
                          <span className="pl-3 text-muted-foreground">{tax.name}</span>
                          <span className="font-bold tabular-nums text-foreground">${tax.amount.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span className="pl-3 text-muted-foreground">No tax applied</span>
                        <span />
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-white shadow-md shadow-primary/20">
                      <span className="text-xs font-black uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black tabular-nums">
                        ${(taxCalculation?.grandTotal || Number(selectedServiceObj?.charges || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width payment list (single column) */}
              <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-7 lg:col-start-1 lg:row-start-1">
                <div className="rounded-2xl border border-muted/40 bg-white p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Booking Note</p>
                  <textarea
                    value={bookingDescription}
                    onChange={(e) => setBookingDescription(e.target.value)}
                    placeholder="Add note for doctor (optional)"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-muted bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {enabledPaymentMethods.length > 0 ? (
                  <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
                    {enabledPaymentMethods.map(mode => {
                      const isSelected = selectedPaymentMode === mode.id
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedPaymentMode(mode.id)}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition-all outline-none sm:gap-5 sm:p-5",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isSelected
                              ? "border-primary bg-primary/[0.06] shadow-md shadow-primary/10"
                              : "border-transparent shadow-sm ring-1 ring-muted/40 hover:ring-muted-foreground/25"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14",
                              isSelected ? "bg-primary text-white shadow-inner" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {mode.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={cn("block font-bold sm:text-lg", isSelected ? "text-primary" : "text-foreground")}>
                              {mode.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">Secure, encrypted checkout</span>
                            <div className="mt-2 flex items-center gap-2 [&_img]:max-h-6 [&_img]:w-auto [&_img]:object-contain [&_img]:opacity-90">
                              {mode.badge}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-7 sm:w-7",
                              isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/35 bg-background"
                            )}
                            aria-hidden
                          >
                            {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3] sm:h-4 sm:w-4" /> : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-14 text-center">
                    <HelpCircle className="mb-4 h-14 w-14 text-muted-foreground/35" />
                    <p className="text-lg font-semibold text-muted-foreground">No payment methods available</p>
                    <p className="mt-2 max-w-sm px-4 text-sm text-muted-foreground">Please contact support to enable payment options for this clinic.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={goBack} className="rounded-full font-bold uppercase text-xs tracking-widest">
                <ChevronLeft className="h-4 w-4" />Back
              </Button>
              <Button
                disabled={isBooking}
                onClick={handleBookAppointment}
                className="h-12 px-8 rounded-full font-bold text-sm bg-primary hover:bg-primary/90 text-white gap-2 uppercase tracking-wide"
              >
                {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Confirm & Book Now
              </Button>
            </div>
          </div>
        )
      case 6: // Confirmation
        return (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col md:flex-row gap-4 items-center pb-6 mb-3 bg-white rounded-[1rem] border-2 shadow-sm p-6">
              <div className="h-12 w-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                <Check className="h-6 w-6 stroke-[4]" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2 text-center md:text-left">Booking Success!</h2>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm text-center md:text-left">Your appointment is confirmed</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Success Header & Detailed Info */}
              <div className="lg:col-span-8 space-y-10">
                {/* Main Detailed Card */}
                <div className="bg-white rounded-[1rem] border-2 shadow-sm p-6 shadow-sm relative group">
                  <div className="absolute -top-2 -right-2 p-8 opacity-20">
                    <Stethoscope className="h-32 w-32 text-primary" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
                    {/* Patient Section */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Patient Name</p>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={profile?.meta?.profilePicture} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{profileInitials}</AvatarFallback>
                          </Avatar>
                          <h3 className="text-2xl font-bold text-primary">{profile?.firstName} {profile?.lastName}</h3>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Email Address</p>
                        <p className="text-base font-bold text-semibold">{profile?.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Mobile</p>
                        <p className="text-base font-bold text-semibold">{profile?.countryCode} {profile?.mobile}</p>
                      </div>
                    </div>

                    {/* Service Type Highlight */}
                    <div className="relative overflow-hidden bg-primary/20 rounded-[1rem] border-2 shadow-sm p-6 flex flex-col justify-end min-h-[160px]">
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]  mb-1">Service Type</p>
                        <h4 className="text-2xl font-bold tracking-wide break-words">{selectedServiceObj?.name}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Booking Specifics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Scheduled Date</p>
                      <h5 className="text-lg font-bold text-primary">{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '-'}</h5>
                      <p className="text-sm font-medium text-muted-foreground">{selectedSlot ? formatTime(selectedSlot) : '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Specialist</p>
                      <h5 className="text-lg font-bold text-primary">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</h5>
                      <p className="text-sm font-medium text-muted-foreground">{typeof selectedDoctorObj?.meta?.specialties?.[0] === 'object'
                        ? (selectedDoctorObj.meta.specialties[0] as any).label || (selectedDoctorObj.meta.specialties[0] as any).value
                        : selectedDoctorObj?.meta?.specialties?.[0] || 'Medical Specialist'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">Clinic</p>
                      <h5 className="text-lg font-bold text-primary">{selectedClinicObj?.name}</h5>
                      <p className="text-sm font-medium text-muted-foreground">{selectedClinicObj?.address?.city || 'Main Wing'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment & Actions */}
              <div className="lg:col-span-4 space-y-4">
                {/* Total Paid Card */}
                <div className="bg-primary rounded-[1rem] border-2 shadow-sm p-6 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Total Amount Paid</p>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold opacity-60">$</span>
                      <span className="text-4xl font-black">{taxCalculation?.grandTotal || 0}</span>
                      <span className="text-2xl font-bold opacity-60">.00</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest">
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                        <ShieldCheck className="h-3 w-3" />
                      </div>
                      Transaction Secured
                    </div>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold text-sm rounded-xl">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleReset} className="border-2 border-primary hover:bg-primary text-primary font-bold text-sm rounded-xl">
                    Book New Appointment
                  </Button>
                </div>

                {/* Assistance Card */}
                <div className="bg-white rounded-[1rem] border-2 shadow-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-[1rem] bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Link href={`tel:${clincMobile}`}>
                        <Phone className="h-6 w-6" />
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-primary">Need Assistance?</h4>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        Our support team is available 24/7 for your health concerns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-10 pt-0 md:pt-5">
      {/* 6 Step Progress Bar */}
      <ProgressBar />

      {/* Main Container Wrapper */}
      <div className="bg-primary/5 rounded-3xl border border-muted/20">
        <div className="p-4 md:p-6 space-y-4">
          {/* Entity Header (Context) */}
          <EntityHeader />

          {/* Main Flow Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Success/Error Toasts */}
      {errorMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10">
          <X className="h-5 w-5 bg-white/20 rounded-full p-1 cursor-pointer" onClick={() => setErrorMessage("")} />
          <p className="font-bold text-sm tracking-tight">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}
