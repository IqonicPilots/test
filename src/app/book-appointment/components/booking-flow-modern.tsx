"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfToday, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { getStoredAuthSession } from '@/lib/auth-session'
import { BookingAuthContent } from './booking-auth-content'
import { Calendar } from '@/components/ui/calendar'
import { CalendarWithPresets } from '@/components/common/CalendarWithPresets'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Check, ChevronRight, ChevronLeft, Loader2, Calendar as CalendarIcon, Clock, CreditCard, Stethoscope, Building2, LayoutDashboard, RefreshCcw, Search, Video, X, CalendarPlus, ShieldCheck, Lock, ArrowLeft, Star, Mail, Phone, Wallet, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInfiniteClinics } from '@/hooks/api/use-clinics'
import { useInfiniteDoctors } from '@/hooks/api/use-doctors'
import { useInfiniteServices } from '@/hooks/api/use-services'
import { useProfile } from '@/hooks/api/use-profile'
import { useAppointmentBookSlots } from '@/hooks/api/use-doctor-sessions'
import { usePublicPaymentSettings } from '@/hooks/api/use-payment-settings'
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

const formatTime = (time: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours || '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${minutes} ${ampm}`
}

export function BookingFlowModern({ isCalendly = false }: { isCalendly?: boolean } = {}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState<Step>('clinic')
  const [history, setHistory] = useState<Step[]>([])
  const [isBackNavigation, setIsBackNavigation] = useState(false)

  // Selection State
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedServiceName, setSelectedServiceName] = useState<string>("")
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
    { id: 'clinic', label: 'Clinic', description: 'Choose your preferred location to proceed with booking.', icon: <Building2 className="h-4 w-4" /> },
    { id: 'doctor', label: 'Doctor', description: 'Pick a specific Doctor for your service', icon: <Stethoscope className="h-4 w-4" /> },
    { id: 'service', label: 'Service', description: 'Please select a service from options', icon: <RefreshCcw className="h-4 w-4" /> },
    { id: 'auth', label: 'Account', description: 'Sign in to confirm booking', icon: <User className="h-4 w-4" /> },
    { id: 'datetime', label: 'Time', description: 'Select date to see a timeline of slots', icon: <CalendarIcon className="h-4 w-4" /> },
    { id: 'payment', label: 'Review', description: 'Confirm and book your appointment', icon: <CreditCard className="h-4 w-4" /> },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  // Data Fetching
  const session = getStoredAuthSession()
  const isPatient = !session || session.user.role === 'patient'
  const { data: profile } = useProfile({ enabled: !!session?.accessToken })

  const {
    data: clinicsInfiniteData,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(20, { isActive: true, search: clinicSearch })

  const {
    data: doctorsInfiniteData,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(20, { clinicId: selectedClinic || undefined, status: 'active', search: doctorSearch }, !!selectedClinic)

  const {
    data: servicesInfiniteData,
    isLoading: isServicesLoading,
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
  const selectedClinicObj = useMemo(() => clinics.find(c => c._id === selectedClinic), [clinics, selectedClinic])
  const selectedDoctorObj = useMemo(() => doctors.find(d => d._id === selectedDoctor), [doctors, selectedDoctor])
  const selectedServiceObj = useMemo(() => services.find(s => s._id === selectedService), [services, selectedService])
  const selectedServiceDisplayName = selectedServiceObj?.name || selectedServiceName
  const getDoctorSpecialty = (doctor: any) => {
    const first = doctor?.meta?.specialties?.[0]
    if (!first) return "Specialist"
    if (typeof first === "object") return first.label || first.value || "Specialist"
    return first || "Specialist"
  }
  const getServiceCategory = (service: any) => {
    const category = service?.category
    if (!category) return "Professional Care"
    if (typeof category === "object") return category.label || category.value || "Professional Care"
    return category
  }
  const getServiceName = (service: any) => service?.name || selectedServiceDisplayName || "Service"
  const baseAmount = Number(selectedServiceObj?.charges || 0)
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
    setHistory(prev => prev.slice(0, -1))
    setCurrentStep(prev)
  }

  useEffect(() => {
    if (!isBackNavigation) return
    setIsBackNavigation(false)
  }, [currentStep, isBackNavigation])

  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep === 'clinic' && !isClinicsLoading && !selectedClinic && clinics.length === 1) {
      setSelectedClinic(clinics[0]._id)
      goToNextStep('doctor')
    }
  }, [currentStep, clinics, isClinicsLoading, selectedClinic, isBackNavigation])

  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep === 'doctor' && !isDoctorsLoading && !selectedDoctor && doctors.length === 1) {
      setSelectedDoctor(doctors[0]._id)
      goToNextStep('service')
    }
  }, [currentStep, doctors, isDoctorsLoading, selectedDoctor, isBackNavigation])

  useEffect(() => {
    if (isBackNavigation) return
    if (currentStep === 'service' && !isServicesLoading && !selectedService && services.length === 1) {
      setSelectedService(services[0]._id)
      setSelectedServiceName(services[0].name || "")
      handleServiceNext(services[0]._id)
    }
  }, [currentStep, services, isServicesLoading, selectedService, profile, isBackNavigation])

  useEffect(() => {
    if (selectedServiceObj?.name) {
      setSelectedServiceName(selectedServiceObj.name)
    }
  }, [selectedServiceObj])

  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    setCurrentStep('datetime')
  }

  const handleServiceNext = (serviceId?: string) => {
    const effectiveServiceId = serviceId || selectedService
    if (effectiveServiceId) {
      if (!profile) goToNextStep('auth')
      else goToNextStep('datetime')
    }
  }

  const handleReset = () => {
    setSelectedClinic(null)
    setSelectedDoctor(null)
    setSelectedService(null)
    setSelectedServiceName('')
    setSelectedSlot(null)
    setBookingDescription('')
    setSelectedDate(startOfToday())
    setTaxCalculation(null)
    setIsBooked(false)
    setHistory([])
    setIsSuccessDialogOpen(false)
    setIsErrorDialogOpen(false)
    setCurrentStep('clinic')
  }

  const handleBookAppointment = async () => {
    if (!selectedClinic || !selectedDoctor || !selectedService || !selectedSlot) return
    setIsBooking(true)
    try {
      const amount = totalAmount
      const clientRef = `appointment_${Date.now()}`

      if (selectedPaymentMode === 'pay_later') {
        const payload = {
          clinicId: selectedClinic as string,
          doctorId: selectedDoctor as string,
          patientId: profile?._id as string,
          serviceId: selectedService as string,
          appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
          slot: selectedSlot as string,
          status: 'booked',
          paymentMode: 'pay_later',
          paymentStatus: 'pending',
          appointmentCharge: amount,
          taxAmount: taxAmount,
          description: bookingDescription || undefined,
        }
        await appointmentService.createAppointment(payload as any)
        setIsBooked(true)
        setIsSuccessDialogOpen(true)
      } else if (selectedPaymentMode === 'razorpay') {
        const res = await loadRazorpay()
        if (!res) throw new Error('Razorpay SDK failed to load')
        const result = await appointmentService.createRazorpayOrderForCheckout({ amount })
        if (result?.orderId) {
          const options = {
            key: result.keyId,
            amount: result.amount,
            currency: result.currency,
            name: "Kivicare Clinic",
            description: `Appointment booking`,
            order_id: result.orderId,
            handler: async (response: any) => {
              const payload = {
                clinicId: selectedClinic as string,
                doctorId: selectedDoctor as string,
                patientId: profile?._id as string,
                serviceId: selectedService as string,
                appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
                slot: selectedSlot as string,
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
              setIsSuccessDialogOpen(true)
            },
            prefill: { name: profile ? `${profile.firstName} ${profile.lastName}` : '', email: profile?.email, contact: profile?.mobile },
            theme: { color: "#3B82F6" }
          }
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        }
      } else {
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
          if (!popup) {
            setErrorMessage('Popup blocked. Please allow popups.')
            setIsErrorDialogOpen(true)
            setIsBooking(false)
            return
          }
          const handleMsg = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return
            if (event.data?.type === `${selectedPaymentMode}-payment-result` && event.data.status === 'success') {
              const payload = {
                clinicId: selectedClinic as string,
                doctorId: selectedDoctor as string,
                patientId: profile?._id as string,
                serviceId: selectedService as string,
                appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
                slot: selectedSlot as string,
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
              setIsSuccessDialogOpen(true)
              window.removeEventListener('message', handleMsg)
            }
          }
          window.addEventListener('message', handleMsg)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking failed')
      setIsErrorDialogOpen(true)
    } finally {
      setIsBooking(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'clinic':
        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Select a Clinic</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">{steps[0].description}</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clinics..."
                  className="pl-9 h-10 bg-white border-muted/50 rounded-xl text-sm"
                  value={clinicSearch}
                  onChange={(e) => setClinicSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="custom-scrollbar grid grid-cols-1 gap-5 overflow-visible max-h-none p-1.5 pr-0 sm:max-h-[500px] sm:overflow-y-auto sm:pr-2 lg:grid-cols-2">
              {isClinicsLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-muted/40 animate-pulse rounded-2xl" />) :
                clinics.map(clinic => (
                  <Card
                    key={clinic._id}
                    className={cn(
                      "cursor-pointer transition-all duration-300 border shadow-sm rounded-2xl overflow-hidden group",
                      selectedClinic === clinic._id ? "border-secondary ring-1 ring-secondary/20 shadow-md translate-y-[-2px]" : "hover:border-muted-foreground/30 hover:shadow-md"
                    )}
                    onClick={() => { setSelectedClinic(clinic._id); goToNextStep('doctor'); }}
                  >
                    <CardContent className="p-0">
                      <div className="p-2 flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full border bg-muted/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {clinic.cliniclogo ? <img src={clinic.cliniclogo} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-muted-foreground/50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold truncate">{clinic.name}</h3>
                            <Badge variant="outline" className="shrink-0 bg-orange-50 text-orange-600 border-orange-100 flex items-center gap-1 text-[9px] py-0 h-4">
                              <Star className="h-2 w-2 fill-current" /> Top Rated
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 font-medium">
                            {clinic.address?.street}, {clinic.address?.city}, {clinic.address?.country}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 pt-1.5 pb-1 bg-muted/5 border-t-2 border-dashed flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm pt-1 font-medium text-muted-foreground min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="text-foreground truncate">{clinic.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0 ml-4">
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="text-foreground">{clinic.countryCode ? `${clinic.countryCode} ` : ''}{clinic.mobile || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </div>
        )
      case 'doctor':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Pick Your Specialist</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">{steps[1].description}</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search doctors..."
                  className="pl-9 h-10 bg-white border-muted/50 rounded-xl text-sm focus-visible:ring-secondary/20"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="custom-scrollbar grid grid-cols-1 gap-4 overflow-visible max-h-none p-1.5 pr-0 sm:max-h-[500px] sm:overflow-y-auto sm:pr-2 md:grid-cols-2 lg:grid-cols-3">
              {isDoctorsLoading ? Array(6).fill(0).map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />) :
                doctors.length === 0 ? <div className="col-span-full py-20 text-center"><Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" /><p className="text-muted-foreground font-medium">No doctors found in this clinic</p></div> :
                  doctors.map(doctor => (
                    <Card
                      key={doctor._id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 border shadow-sm rounded-2xl overflow-hidden group",
                        selectedDoctor === doctor._id ? "border-secondary ring-1 ring-secondary/20 shadow-md translate-y-[-2px]" : "hover:border-muted-foreground/30 hover:shadow-md"
                      )}
                      onClick={() => { setSelectedDoctor(doctor._id); goToNextStep('service'); }}
                    >
                      <CardContent className="p-0">
                        <div className="p-2 flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-muted/20 shrink-0">
                            <AvatarImage src={doctor.meta?.profilePicture} />
                            <AvatarFallback className="bg-primary/10 text-primary">{doctor.firstName[0]}{doctor.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold truncate">Dr. {doctor.firstName} {doctor.lastName}</h3>
                              <Badge className="shrink-0 bg-secondary text-white hover:bg-secondary text-[10px] font-bold px-2 py-0.5 h-5 uppercase tracking-tighter">
                                Available
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {getDoctorSpecialty(doctor)}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 pt-1.5 pb-1 bg-muted/5 border-t-2 border-dashed flex items-center justify-between">
                          <div className="flex items-center pt-1 gap-1  text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-semibold">{doctor.meta?.experience || 0} Years Experience</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              }
            </div>
          </div>
        )
      case 'service':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Which service are you looking for?</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">{steps[2].description}</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-9 h-10 bg-white border-muted/50 rounded-xl text-sm focus-visible:ring-secondary/20"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="custom-scrollbar grid grid-cols-1 gap-5 overflow-visible max-h-none p-1.5 pr-0 sm:max-h-[500px] sm:overflow-y-auto sm:pr-2 md:grid-cols-2 lg:grid-cols-3">
              {isServicesLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />) :
                services.length === 0 ? <p className="col-span-full text-center py-10">No services available</p> :
                  services.map(service => (
                    <Card
                      key={service._id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 border shadow-sm rounded-2xl overflow-hidden group",
                        selectedService === service._id ? "border-secondary bg-secondary/5 ring-1 ring-secondary/20 shadow-md translate-y-[-2px]" : "hover:border-secondary/30 hover:shadow-md"
                      )}
                      onClick={() => {
                        setSelectedService(service._id)
                        setSelectedServiceName(service.name || '')
                        handleServiceNext(service._id)
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="p-2 flex items-center gap-3">
                          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-colors border overflow-hidden", selectedService === service._id ? "bg-secondary text-white border-secondary" : "bg-secondary/10 text-secondary border-secondary/20")}>
                            {service.serviceImage ? (
                              <img src={service.serviceImage} alt={service.name} className="h-full w-full object-cover" />
                            ) : (
                              <img src="https://placehold.co/200x200/fee2e2/fb7d77?text=Service" alt="No image" className="h-full w-full object-cover opacity-50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={cn("font-bold truncate transition-colors", selectedService === service._id ? "text-foreground" : "text-foreground")}>
                              {getServiceName(service)}
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium">
                              {getServiceCategory(service)}
                            </p>
                          </div>
                          {/* {selectedService === service._id && <Check className="h-4 w-4 text-secondary" />} */}
                        </div>
                        <div className="px-4 pt-1.5 pb-1 bg-muted/5 border-t-2 border-dashed flex items-center justify-between">
                          <div className="flex items-center pt-1 gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-semibold">{service.duration} Mins</span>
                          </div>
                          <span className="text-sm font-black text-secondary uppercase">${service.charges}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              }
            </div>
          </div>
        )
      case 'auth':
        return (
          <div className="lg:w-full animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
              <div>
                <h2 className="text-xl font-bold text-foreground">Account Access</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">Sign in or create an account to proceed with booking.</p>
              </div>
            </div>

            <div className="max-w-xl mx-auto pr-0 overflow-visible sm:max-h-[550px] sm:overflow-y-auto sm:pr-3 custom-scrollbar">
              <BookingAuthContent onSuccess={handleAuthSuccess} />
            </div>
          </div>
        )
      case 'datetime':
        return (
          <div className="flex flex-1 min-h-0 flex-col space-y-4 sm:space-y-6">
            <div className="mb-1 flex flex-col justify-between gap-2 sm:mb-2 sm:gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">Select Date & Time</h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">{steps[4].description}</p>
              </div>
            </div>

            <div className="mt-1 grid min-h-0 flex-1 grid-cols-1 gap-4 sm:mt-2 sm:gap-8 lg:grid-cols-12 lg:gap-0">
               {/* Left Column: Calendar */}
               <div className="lg:col-span-6 flex flex-col items-center justify-start lg:pr-10 xl:pr-12 lg:border-r lg:border-dashed border-muted">
                  <div className="w-full max-w-sm lg:max-w-[430px]">
                    <Calendar 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={(d) => d && setSelectedDate(d)} 
                      disabled={(d) => d < startOfToday() || isSameDay(d, startOfToday())}
                      className="mx-auto origin-top rounded-xl border-none shadow-none scale-100 sm:scale-105 lg:mt-2 lg:scale-100 lg:[&_.rdp-month]:w-full lg:[&_.rdp-caption_label]:text-lg lg:[&_.rdp-caption_label]:font-bold lg:[&_.rdp-head_cell]:text-sm lg:[&_.rdp-head_cell]:font-semibold lg:[&_.rdp-day_button]:h-11 lg:[&_.rdp-day_button]:w-11 lg:[&_.rdp-day_button]:text-base lg:[&_.rdp-nav_button]:h-9 lg:[&_.rdp-nav_button]:w-9"
                      classNames={{
                        day_selected: "bg-primary text-white hover:bg-primary hover:text-white rounded-full",
                        day_today: "bg-muted text-muted-foreground rounded-full",
                      }}
                    />
                  </div>
               </div>

               {/* Right Column: Slots */}
               <div className="flex min-h-0 flex-col lg:col-span-6 lg:pl-12">
                  <div className="mb-4 flex items-center justify-between sm:mb-8">
                     <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground sm:text-lg">Available Slots</h3>
                        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-widest">{format(selectedDate, 'MMMM dd, yyyy')}</p>
                     </div>
                     <Badge className="rounded-lg border-none bg-muted px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted sm:px-3 sm:text-xs">
                        {slots.length} Slots Available
                     </Badge>
                  </div>

                  {isSlotsLoading ? (
                    <div className="custom-scrollbar grid max-h-none flex-1 grid-cols-2 gap-2.5 overflow-visible pr-0 sm:max-h-[400px] sm:overflow-y-auto sm:pr-2 sm:gap-3 lg:grid-cols-3 lg:gap-2.5">
                      {Array(9).fill(0).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-2xl" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[2rem] border border-dashed border-muted/30">
                      <p className="text-muted-foreground font-bold">No slots available for this period</p>
                    </div>
                  ) : (
                    <div className="custom-scrollbar grid max-h-none flex-1 grid-cols-2 gap-2.5 overflow-visible pr-0 sm:max-h-[400px] sm:overflow-y-auto sm:pr-2 sm:gap-3 lg:grid-cols-3">
                      {slots.map(s => (
                        <button 
                          key={s} 
                          onClick={() => {
                            setSelectedSlot(s)
                            setTimeout(() => goToNextStep('payment'), 300)
                          }}
                          className={cn(
                            "flex h-11 items-center justify-center rounded-lg border px-2 text-[11px] font-bold shadow-sm transition-all sm:h-12 sm:rounded-xl sm:text-[12px] lg:h-11 lg:text-[11px]", 
                            selectedSlot === s 
                              ? "bg-primary text-white border-primary shadow-lg scale-[1.03]" 
                              : "bg-white hover:border-primary/40 hover:shadow-md"
                          )}
                        >
                          {formatTime(s)}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSlot && (
                    <Button onClick={() => goToNextStep('payment')} className="mt-5 h-8 w-full rounded-xl bg-secondary text-xs font-black uppercase tracking-wide text-white shadow-md shadow-secondary/20 transition-all hover:scale-[1.01] hover:bg-secondary/90 sm:mt-6 sm:h-12 sm:rounded-xl sm:text-xs sm:tracking-wide sm:shadow-lg lg:mt-5 lg:h-11">
                      Confirm Appointment Time
                    </Button>
                  )}
               </div>
            </div>
          </div>
        )
      case 'payment': {
        const amount = totalAmount
        if (isBooked) {
          if (isCalendly) {
            return (
              <div className="flex min-h-0 flex-1 flex-col py-4">
                <div className="mx-auto w-full max-w-4xl rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:p-6">
                  <div className="mb-5 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Check className="h-7 w-7" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground">Booking Confirmed!</h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Selected Appointment Details</p>
                  </div>
                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Clinic</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{selectedClinicObj?.name || "N/A"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Specialist</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Service</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{selectedServiceDisplayName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-primary">
                        <CalendarIcon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Schedule</p>
                      <h4 className="mt-1 text-2xl font-black text-foreground">{format(selectedDate, 'MMMM dd, yyyy')}</h4>
                      <p className="mt-1 text-lg font-bold text-primary">{selectedSlot ? formatTime(selectedSlot) : "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
          return (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-start py-4 animate-in fade-in zoom-in duration-500 sm:justify-center sm:py-6">
              {/* Success Header */}
              <div className="mb-6 text-center sm:mb-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-green-50 text-green-600 shadow-sm ring-4 ring-green-50/50 sm:mb-6 sm:h-20 sm:w-20 sm:ring-8">
                  <Check className="h-8 w-8 stroke-[3] sm:h-10 sm:w-10" />
                </div>
                <h2 className="mb-1 text-3xl font-black tracking-tight text-gray-900 sm:mb-2 sm:text-4xl sm:tracking-tighter">Booking Confirmed!</h2>
                <p className="text-xs font-bold uppercase opacity-60 text-muted-foreground sm:text-sm">Selected Appointment Details</p>
              </div>

              {/* Centered Summary Card */}
              <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[1rem] border bg-white p-4 shadow-md sm:p-8 sm:shadow-2xl lg:p-10">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-secondary" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl opacity-30" />

                <h3 className="mb-5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-secondary sm:mb-8 sm:text-[10px] sm:tracking-[0.2em]">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Details
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                </h3>

                <div className="mb-6 grid grid-cols-1 gap-5 sm:mb-10 sm:gap-8 md:grid-cols-2">
                  {/* Left Column: Entities */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Clinic with Logo */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md ring-1 ring-gray-100 sm:h-16 sm:w-16 sm:rounded-2xl">
                        {selectedClinicObj?.cliniclogo ? (
                          <img src={selectedClinicObj.cliniclogo} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-6 w-6 text-secondary sm:h-7 sm:w-7" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Clinic</p>
                        <h4 className="truncate text-base font-black leading-tight text-black/80 sm:text-lg">{selectedClinicObj?.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-bold italic">{selectedClinicObj?.address?.city}, {selectedClinicObj?.address?.country}</p>
                      </div>
                    </div>

                    {/* Doctor and Service Section */}
                    <div className="space-y-4 sm:space-y-6">
                      {/* Doctor Section */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-100 sm:h-14 sm:w-14 sm:rounded-2xl">
                          <AvatarImage src={selectedDoctorObj?.meta?.profilePicture} />
                          <AvatarFallback className="bg-secondary/10 text-secondary font-black">DR</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Specialist</p>
                          <h4 className="font-black text-black/80 text-base leading-tight">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</h4>
                          <p className="text-[11px] text-muted-foreground font-bold">Medical Expert</p>
                        </div>
                      </div>

                      {/* Service Section */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md ring-1 ring-gray-100 sm:h-14 sm:w-14 sm:rounded-2xl">
                          {selectedServiceObj?.serviceImage ? (
                            <img src={selectedServiceObj.serviceImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Stethoscope className="h-6 w-6 text-secondary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="mb-0.5 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Service</p>
                        <h4 className="font-black text-black/80 text-base leading-tight">{selectedServiceDisplayName}</h4>
                          <p className="text-[11px] text-muted-foreground font-bold italic">{selectedServiceObj?.duration} Mins Session</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Schedule */}
                  <div className="flex flex-col justify-center rounded-[1rem] border border-gray-100 bg-gray-50/50 p-4 text-center sm:p-8">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-secondary shadow-sm sm:mb-4 sm:h-12 sm:w-12">
                      <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-secondary sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">Schedule</p>
                    <h4 className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">{format(selectedDate, 'MMMM dd, yyyy')}</h4>
                    <p className="mt-1 text-base font-black text-secondary sm:text-lg">{selectedSlot ? formatTime(selectedSlot) : 'N/A'}</p>
                  </div>
                </div>

                {/* Summary Footer Actions */}
                <div className="mt-auto flex flex-col justify-center gap-3 border-t-2 border-dashed border-gray-100 pt-5 sm:flex-row sm:gap-4 sm:pt-8">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="h-10 w-full rounded-xl text-xs font-bold sm:h-11 sm:w-auto"
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Book New
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="h-10 w-full rounded-xl text-xs font-bold sm:h-11 sm:w-auto"
                  >
                    <Link href="/dashboard" className="flex items-center justify-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        if (isCalendly) {
          return (
            <div className="flex flex-1 min-h-0 flex-col space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-foreground">Review & Payment</h2>
                <p className="text-sm text-muted-foreground">Confirm your appointment details and complete booking.</p>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="flex min-h-0 flex-col lg:col-span-7">
                  <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h3 className="mb-4 text-sm font-bold text-foreground">Booking Summary</h3>
                    <div className="space-y-3">
                      {selectedClinicObj && <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Clinic</p><p className="mt-0.5 text-sm font-semibold text-foreground">{selectedClinicObj.name}</p></div>}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Doctor</p><p className="mt-0.5 text-sm font-semibold text-foreground">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</p></div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Service</p><p className="mt-0.5 text-sm font-semibold text-foreground">{selectedServiceDisplayName}</p></div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Schedule</p><p className="mt-0.5 text-sm font-semibold text-foreground">{format(selectedDate, 'MMMM dd, yyyy')} • {selectedSlot ? formatTime(selectedSlot) : 'N/A'}</p></div>
                    </div>
                    <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
                      <div className="flex items-center justify-between text-xs"><span className="font-semibold text-muted-foreground">Subtotal</span><span className="font-semibold text-foreground">${baseAmount.toFixed(2)}</span></div>
                      <div className="mt-2 text-xs font-semibold text-muted-foreground">Tax:</div>
                      <div className="mt-1 space-y-1">
                        {isCalculatingTax ? <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{primaryTaxName}</span><span className="font-semibold text-foreground">Calculating...</span></div> : taxDisplayRows.length ? taxDisplayRows.map((tax) => <div key={tax.id} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{tax.name}</span><span className="font-semibold text-foreground">${tax.amount.toFixed(2)}</span></div>) : <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">No tax applied</span><span className="font-semibold text-foreground">$0.00</span></div>}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-2.5"><span className="text-sm font-bold text-foreground">Total</span><span className="text-xl font-black text-primary">${amount.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex min-h-0 flex-col lg:col-span-5">
                  <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h3 className="mb-3 text-sm font-bold text-foreground">Payment Method</h3>
                    <div className="space-y-2.5">
                      {([{ id: 'pay_later', label: 'Pay Later at Clinic', icon: <Clock className="h-4 w-4" /> }, { id: 'stripe', label: 'Credit/Debit Card', icon: <CreditCard className="h-4 w-4" /> }, { id: 'paypal', label: 'PayPal', icon: <Wallet className="h-4 w-4" /> }, { id: 'razorpay', label: 'Razorpay', icon: <Banknote className="h-4 w-4" /> }] as const).map((mode) => {
                        const isEnabled = (settings as any)[mode.id]?.isActive
                        if (!isEnabled && mode.id !== 'pay_later') return null
                        const isSelected = selectedPaymentMode === mode.id
                        return <button key={mode.id} onClick={() => setSelectedPaymentMode(mode.id)} className={cn("w-full rounded-lg border px-3 py-2.5 text-left transition-all", isSelected ? "border-primary bg-primary/[0.07] shadow-sm" : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50")}><div className="flex items-center gap-2.5"><div className={cn("flex h-7 w-7 items-center justify-center rounded-md", isSelected ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500")}>{mode.icon}</div><span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>{mode.label}</span></div></button>
                      })}
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Booking Note</label>
                      <textarea value={bookingDescription} onChange={(e) => setBookingDescription(e.target.value)} placeholder="Add note for doctor (optional)" rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <Button disabled={isBooking} onClick={handleBookAppointment} className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">{isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{isBooking ? 'Processing...' : 'Confirm & Book Appointment'}</Button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="flex flex-1 min-h-0 flex-col space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="mb-1 flex flex-col justify-between gap-2 sm:mb-2 sm:gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">Review & Payment</h2>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-[13px]">Please confirm your appointment details and select a payment method.</p>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3 sm:p-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Booking Note
              </label>
              <textarea
                value={bookingDescription}
                onChange={(e) => setBookingDescription(e.target.value)}
                placeholder="Add note for doctor (optional)"
                rows={3}
                className="w-full resize-none rounded-lg border border-muted bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 md:flex-row">
              {/* Rest of the payment step... */}
              <div className="flex min-h-0 flex-col md:w-[58%]">
                <div className="flex flex-1 flex-col rounded-[1rem] border bg-white p-4 shadow-sm sm:p-6 lg:p-10">
                  {/* ... contents ... */}
                  <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase opacity-80 sm:mb-8 sm:text-sm">
                    <CreditCard className="h-5 w-5 text-secondary" />
                    Payment Method
                  </h3>

                  <div className="space-y-4 text-left">
                    {([
                      { id: 'pay_later', label: 'Pay Later at Clinic', icon: <Clock className="h-5 w-5" />, logo: <div className="text-[10px] font-black opacity-40 uppercase px-2 py-1 bg-gray-100 rounded-md">Pay Later</div> },
                      { id: 'stripe', label: 'Credit/Debit Card', icon: <CreditCard className="h-5 w-5" />, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 w-auto" /> },
                      { id: 'paypal', label: 'PayPal Account', icon: <Wallet className="h-5 w-5" />, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5 w-auto" /> },
                      { id: 'razorpay', label: 'Razorpay Secure', icon: <Banknote className="h-5 w-5" />, logo: <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-5 w-auto" /> }
                    ] as const).map(mode => {
                      const isEnabled = (settings as any)[mode.id]?.isActive
                      if (!isEnabled && mode.id !== 'pay_later') return null
                      const isSelected = selectedPaymentMode === mode.id
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedPaymentMode(mode.id)}
                          className={cn(
                            "w-full rounded-xl border-2 p-3 transition-all flex items-center justify-between gap-2 text-left cursor-pointer outline-none sm:rounded-2xl sm:p-5 sm:gap-4",
                            isSelected
                              ? "border-secondary bg-secondary/5 shadow-md scale-[1.01] z-10"
                              : "border-gray-100 hover:border-secondary/20 hover:bg-gray-50 bg-white"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 sm:h-6 sm:w-6",
                              isSelected ? "border-secondary bg-white" : "border-gray-300 bg-white"
                            )}>
                              {isSelected && <div className="h-3 w-3 rounded-full bg-secondary animate-in zoom-in-50 duration-300 shadow-sm" />}
                            </div>

                            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                              <div className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center transition-all border shadow-sm sm:h-11 sm:w-11 sm:rounded-xl",
                                isSelected ? "bg-white text-secondary border-secondary/10" : "bg-gray-100 text-gray-400 border-gray-100"
                              )}>
                                {mode.icon}
                              </div>
                              <div className="min-w-0">
                                <p className={cn("truncate font-bold text-[13px] tracking-tight sm:text-sm", isSelected ? "text-secondary" : "text-gray-900")}>{mode.label}</p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide opacity-60 sm:text-[10px] sm:tracking-widest">Verified Payment</p>
                              </div>
                            </div>
                          </div>
                          <div className={cn("hidden px-2 min-w-[56px] transition-all sm:block sm:px-3 sm:min-w-[70px]", isSelected ? "opacity-100 scale-110" : "opacity-80 group-hover:opacity-100")}>
                            {mode.logo}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 pt-2 sm:mt-auto sm:pt-10">
                    <Button
                      disabled={isBooking}
                      onClick={handleBookAppointment}
                      className="flex w-full items-center justify-center rounded-xl bg-primary px-3 py-3 text-[11px] font-black uppercase tracking-wide text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.01] hover:bg-primary sm:rounded-2xl sm:p-6 sm:text-sm sm:tracking-wider sm:shadow-lg sm:shadow-primary/30"
                    >
                      {isBooking ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <ShieldCheck className="h-5 w-5 mr-3" />}
                      {isBooking ? 'Processing Application...' : 'Confirm & Book'}
                    </Button>
                    <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-wide text-muted-foreground opacity-60 sm:mt-4 sm:text-[10px] sm:tracking-widest">
                      Secure 256-bit encrypted checkout
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Summary Card */}
              <div className="flex min-h-0 flex-col md:w-[42%]">
                <div className="flex flex-1 flex-col rounded-[1rem] border bg-white p-4 shadow-sm h-auto md:h-[650px] sm:p-6 lg:p-10">
                  <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase opacity-80 sm:mb-8 sm:text-sm lg:mb-10">
                    <LayoutDashboard className="h-5 w-5 text-secondary" />
                    Order Summary
                  </h3>

                  <div className="custom-scrollbar flex-1 space-y-3 overflow-visible pr-0 sm:space-y-5 sm:pr-2 md:space-y-6 md:overflow-y-auto">
                    {/* Clinic */}
                    {selectedClinicObj && (
                      <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm sm:h-14 sm:w-14 sm:rounded-xl">
                          {selectedClinicObj?.cliniclogo ? (
                            <img src={selectedClinicObj.cliniclogo} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-secondary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Selected Clinic</p>
                          <h4 className="truncate text-base font-black text-gray-900 sm:text-lg">{selectedClinicObj?.name}</h4>
                          <p className="text-xs text-muted-foreground font-bold truncate opacity-70 italic">
                            {selectedClinicObj?.address?.city}, {selectedClinicObj?.address?.country}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Provider */}
                    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4">
                      <Avatar className="h-12 w-12 rounded-lg border-2 border-white shadow-sm sm:h-14 sm:w-14 sm:rounded-xl">
                        <AvatarImage src={selectedDoctorObj?.meta?.profilePicture} />
                        <AvatarFallback className="bg-secondary/10 text-secondary font-black">DR</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Assigned Doctor</p>
                        <h4 className="truncate text-base font-black text-gray-900 sm:text-lg">Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}</h4>
                        <p className="text-xs text-muted-foreground font-bold truncate opacity-70">
                          {typeof selectedDoctorObj?.meta?.specialties?.[0] === 'object'
                            ? (selectedDoctorObj.meta.specialties[0] as any).label || (selectedDoctorObj.meta.specialties[0] as any).value
                            : selectedDoctorObj?.meta?.specialties?.[0] || 'Medical Specialist'}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm sm:h-14 sm:w-14 sm:rounded-xl">
                        {selectedServiceObj?.serviceImage ? (
                          <img src={selectedServiceObj.serviceImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Stethoscope className="h-6 w-6 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Selected Service</p>
                        <h4 className="truncate text-base font-black text-gray-900 sm:text-lg">{selectedServiceDisplayName}</h4>
                        <p className="text-xs text-muted-foreground font-bold truncate opacity-70">
                          {selectedServiceObj?.duration} Minute Session
                        </p>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:gap-4 sm:rounded-2xl sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm sm:h-14 sm:w-14 sm:rounded-xl">
                        <CalendarIcon className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-secondary sm:text-[10px] sm:tracking-widest">Appointment Schedule</p>
                        <h4 className="truncate text-base font-black text-gray-900 sm:text-lg">{format(selectedDate, 'MMMM dd, yyyy')}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-secondary" />
                          <span className="text-xs font-black text-secondary uppercase">{selectedSlot ? formatTime(selectedSlot) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-4 border-t-2 border-dashed border-gray-100 pt-4 sm:mt-auto sm:pt-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 sm:text-[11px] sm:tracking-[0.2em]">Total Amount</p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-0.5 italic">All inclusive of taxes</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-bold text-muted-foreground">
                          Subtotal: ${baseAmount.toFixed(2)}
                        </span>
                        <span className="block text-xs font-bold text-muted-foreground">Tax:</span>
                        {isCalculatingTax ? (
                          <span className="block pl-2 text-xs font-bold text-muted-foreground">{primaryTaxName}: Calculating...</span>
                        ) : taxDisplayRows.length ? (
                          taxDisplayRows.map((tax) => (
                            <span key={tax.id} className="block pl-2 text-xs font-bold text-muted-foreground">
                              {tax.name}: ${tax.amount.toFixed(2)}
                            </span>
                          ))
                        ) : (
                          <span className="block pl-2 text-xs font-bold text-muted-foreground">No tax applied</span>
                        )}
                        <span className="text-3xl font-black tracking-tighter text-secondary sm:text-4xl">${amount.toFixed(2)}</span>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1 opacity-60">Payable Now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
      default: return null
    }
  }

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

  return (
    <div className="max-w-7xl mx-auto min-h-[500px] flex flex-col">
      {/* Stepper Navigation */}
      <div className="mb-8 mt-4 px-2 sm:mb-12 sm:px-4">
        <div className="relative mx-auto grid max-w-4xl grid-cols-3 gap-y-4 gap-x-2 px-2 sm:flex sm:justify-between sm:px-4">
          {/* Connecting Lines Track (Gray) */}
          <div className="absolute top-5 left-8 right-8 hidden h-0.5 bg-muted/40 z-0 sm:block" />

          {/* Progress Line (Green) */}
          <div
            className="absolute top-5 left-8 hidden h-0.5 bg-green-500 transition-all duration-700 ease-in-out z-0 sm:block"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 4rem)'
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isActive = step.id === currentStep
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-xs font-bold transition-all sm:h-10 sm:w-10 sm:text-base",
                  isActive ? "border-secondary text-secondary scale-110 shadow-md ring-4 ring-secondary/5" :
                    isCompleted ? "border-green-500 bg-green-500 text-white" :
                      "border-muted text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : idx + 1}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-[9px] font-black uppercase tracking-wide leading-tight sm:text-[10px] sm:tracking-widest whitespace-normal sm:whitespace-nowrap",
                    isActive ? "text-secondary" :
                      isCompleted ? "text-green-600" :
                        "text-muted-foreground/60"
                  )}>
                    <span className="sm:hidden">{step.label}</span>
                    <span className="hidden sm:inline">{idx + 1}. {step.label}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Step Content Container */}
      <div className="relative flex flex-1 flex-col rounded-[1rem] border bg-accent/10 p-3 shadow-sm overflow-visible sm:overflow-hidden lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 min-h-0">
              {renderStep()}
            </div>
            {/* Action Bar Footer */}
            {!isBooked && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:pt-0">
                <Button
                  variant="outline"
                  onClick={goBack}
                  disabled={history.length === 0}
                  className={cn(
                    "h-10 w-full px-4 text-sm font-bold text-muted-foreground sm:h-auto sm:w-auto sm:px-0",
                    history.length === 0 && "hidden sm:inline-flex sm:opacity-0 sm:invisible"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-muted-foreground border border-muted-foreground/5">
                    Step {currentStepIndex + 1} of 6
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        {/* YOUR SELECTIONS Bar */}
        {!isBooked && selectedClinicObj && (
          <div className="mt-4 flex flex-col items-start gap-3 border-t border-primary/30 pt-4 animate-in slide-in-from-bottom-2 duration-500 sm:mt-6 sm:flex-row sm:items-center sm:gap-6 sm:pt-5">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
              YOUR SELECTIONS:
            </span>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-2.5">
              {selectedClinicObj && (
                <Badge variant="outline" className="h-7 rounded-full border-primary bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary shadow-sm sm:px-3.5 sm:text-xs flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> {selectedClinicObj?.name}
                </Badge>
              )}
              {selectedDoctorObj && (
                <Badge variant="outline" className="h-7 rounded-full border-primary bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary sm:px-3.5 sm:text-xs flex items-center gap-2">
                  <User className="h-3 w-3" /> Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}
                </Badge>
              )}
              {(selectedServiceObj || selectedServiceDisplayName) && (
                <Badge variant="outline" className="h-7 rounded-full border-primary bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary transition-all animate-in zoom-in-50 sm:px-3.5 sm:text-xs flex items-center gap-2">
                  <RefreshCcw className="h-3 w-3" /> {selectedServiceDisplayName}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {isCalendly ? (
        <>
          <CalendlyBookingResultDialog type="success" open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen} onDashboard={() => router.push('/dashboard')} onRepeat={handleReset} />
          <CalendlyBookingResultDialog type="error" open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen} message={errorMessage} onDashboard={() => router.push('/dashboard')} onRepeat={() => { setIsErrorDialogOpen(false); setCurrentStep('datetime'); setSelectedSlot(null); }} />
        </>
      ) : (
        <>
          <BookingResultDialog type="success" open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen} onDashboard={() => router.push('/dashboard')} onRepeat={handleReset} />
          <BookingResultDialog type="error" open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen} message={errorMessage} onDashboard={() => router.push('/dashboard')} onRepeat={() => { setIsErrorDialogOpen(false); setCurrentStep('datetime'); setSelectedSlot(null); }} />
        </>
      )}
    </div>
  )
}

function CalendlyBookingResultDialog({ type, open, onOpenChange, message, onDashboard, onRepeat }: { type: 'success' | 'error', open: boolean, onOpenChange: (o: boolean) => void, message?: string, onDashboard: () => void, onRepeat: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 p-3 backdrop-blur-[2px] sm:p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-7">
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 rounded-full transition-colors hover:bg-muted/50" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
            <div className={cn("mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full", type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
              {type === 'success' ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
            </div>
            <h2 className="mb-3 text-4xl font-black tracking-tight">{type === 'success' ? 'Appointment Booked!' : 'Booking Failed'}</h2>
            <p className="mb-6 px-1 text-base leading-relaxed text-muted-foreground">
              {type === 'success' ? 'Your visit has been successfully scheduled. Details are available on your dashboard.' : message || 'Something went wrong while processing your booking.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={onRepeat} variant="outline" className="h-12 flex-1 rounded-2xl text-sm font-bold uppercase tracking-wide">Book Another</Button>
              <Button onClick={onDashboard} className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90">Dashboard</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function BookingResultDialog({ type, open, onOpenChange, message, onDashboard, onRepeat }: { type: 'success' | 'error', open: boolean, onOpenChange: (o: boolean) => void, message?: string, onDashboard: () => void, onRepeat: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border bg-card p-5 text-center shadow-xl sm:max-w-lg sm:rounded-[3rem] sm:p-10 sm:shadow-2xl"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full transition-colors hover:bg-muted/50 sm:right-6 sm:top-6 sm:h-10 sm:w-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
            </Button>
            <div className={cn("mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full sm:mb-8 sm:h-24 sm:w-24", type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
              {type === 'success' ? <Check className="h-8 w-8 sm:h-12 sm:w-12" /> : <X className="h-8 w-8 sm:h-12 sm:w-12" />}
            </div>
            <h2 className="mb-2 text-4xl font-black tracking-tight sm:mb-4 sm:text-3xl sm:tracking-tighter">{type === 'success' ? 'Appointment Booked!' : 'Booking Failed'}</h2>
            <p className="mb-6 px-2 text-center text-sm leading-relaxed text-muted-foreground sm:mb-10 sm:px-4 sm:text-lg">
              {type === 'success' ? 'Your visit has been successfully scheduled. Details are available on your dashboard.' : message || 'Something went wrong while processing your booking.'}
            </p>
            <div className="flex gap-2.5 sm:gap-4">
              <Button onClick={onRepeat} variant="outline" className="h-10 flex-1 rounded-xl border font-bold uppercase tracking-wide transition-all hover:scale-[1.02] sm:h-14 sm:rounded-2xl sm:border-2 sm:tracking-widest">Book Another</Button>
              <Button onClick={onDashboard} className="h-10 flex-1 rounded-xl bg-secondary font-bold uppercase tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-secondary/90 sm:h-14 sm:rounded-2xl sm:tracking-widest">Dashboard</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

