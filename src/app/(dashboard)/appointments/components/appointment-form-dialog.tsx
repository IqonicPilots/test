"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { GenericFormDialog, FormFieldConfig } from "@/components/generic-form-dialog"
import { z } from "zod"
import { startOfDay } from "date-fns"
import { useClinics, useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useServices, useServicesByFilter, useInfiniteServices } from "@/hooks/api/use-services"
import { usePatients, useInfinitePatients } from "@/hooks/api/use-patients"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useAppointmentBookSlots } from "@/hooks/api/use-doctor-sessions"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useProfile } from "@/hooks/api/use-profile"
import { taxApi } from "@/services/tax.service"
import { appointmentService, type Appointment, type AppointmentPayload } from "@/services/appointment.service"
import { usePaymentSettings } from "@/hooks/api/use-payment-settings"
import { useAppointmentSettings } from "@/hooks/api/use-appointment-settings"
import { useIntegrations } from "@/hooks/api/use-integrations"
import type { PaymentSettingsData } from "@/services/payment-settings.service"
import type { Service } from "@/types/service.types"
import type { Doctor } from "@/types/doctor.types"
import type { Clinic } from "@/types/clinic.types"
import type { Patient } from "@/types/user.types"
import type { TaxCalculationResponse } from "@/types/tax.types"
import { toast } from "sonner"
import { getReferenceId, isObject } from "@/lib/utils"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

const appointmentFormSchema = z.object({
  _id: z.string().optional(),
  patientId: z.string().min(1, { message: "Please select a patient." }),
  clinicId: z.string().min(1, { message: "Please select a clinic." }),
  doctorId: z.string().min(1, { message: "Please select a doctor." }),
  serviceId: z.string().min(1, { message: "Please select a service." }),
  appointmentDate: z.string().min(1, { message: "Please select a date." }),
  slot: z.string().min(1, { message: "Please select a time slot." }),
  status: z.string().min(1, { message: "Please select a status." }),
  paymentMode: z.string().optional(),
  description: z.string().optional(),
})

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>

interface AppointmentFormDialogProps {
  onAddAppointment: (data: AppointmentPayload) => Promise<Appointment | void> | Appointment | void
  onUpdateAppointment?: (id: string, data: Partial<AppointmentPayload>) => void
  appointmentToEdit?: Appointment | null
  trigger?: React.ReactNode
}

const formatSlotLabel = (slot: string) => {
  const [hours, minutes] = slot.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function AppointmentFormDialog({ onAddAppointment, onUpdateAppointment, appointmentToEdit, trigger }: AppointmentFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!appointmentToEdit
  const initialAppointmentDate = appointmentToEdit?.schedule?.startDate?.split("T")[0] || ""
  const [selectedClinic, setSelectedClinic] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResponse | null>(null)
  const [isCalculatingTax, setIsCalculatingTax] = useState(false)
  const [clinicSearch, setClinicSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")

  const debouncedClinicSearch = useDebouncedValue(clinicSearch, 300)
  const debouncedDoctorSearch = useDebouncedValue(doctorSearch, 300)
  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300)
  const debouncedServiceSearch = useDebouncedValue(serviceSearch, 300)

  const previousDateRef = useRef<string>(initialAppointmentDate)

  const { data: paymentSettings } = usePaymentSettings()
  const { data: appointmentSettings } = useAppointmentSettings()
  const { isTelemedEnabled } = useIntegrations()
  const { formatCurrency } = useCurrencyFormatter(true)

  // Authentication and Profile Data for automated pre-selection
  const { role } = useAuthRole()
  const { data: profile } = useProfile()

  const userClinicId = useMemo(() => {
    if ((role !== 'clinic_admin' && role !== 'receptionist') || !profile?.meta?.clinics?.length) return ""
    const clinic = profile.meta.clinics[0]
    return typeof clinic === 'string' ? clinic : clinic._id
  }, [role, profile])

  useEffect(() => {
    if (!isEditing && (role === 'clinic_admin' || role === 'receptionist') && userClinicId && !selectedClinic) {
      setSelectedClinic(userClinicId)
    }
    if (!isEditing && role === 'doctor' && profile?._id && !selectedDoctor) {
      setSelectedDoctor(profile._id)
    }
  }, [role, userClinicId, selectedClinic, isEditing, profile?._id, selectedDoctor])

  // Fetch larger lists for dropdowns
  const {
    data: infiniteClinics,
    fetchNextPage: fetchNextClinics,
    hasNextPage: hasNextClinics,
    isFetchingNextPage: isFetchingNextClinics,
    isFetching: isClinicsFetching
  } = useInfiniteClinics(10, { search: debouncedClinicSearch, isActive: true }, isDialogOpen)

  const clinics = useMemo(() => {
    const baseClinics = infiniteClinics?.pages.flatMap(page => page.data) || []
    if (role === 'doctor' && profile?.meta?.clinics?.length) {
      const docClinicIds = profile.meta.clinics.map((c: any) => typeof c === 'string' ? c : c._id)
      return baseClinics.filter(c => docClinicIds.includes(c._id))
    }
    return baseClinics as Clinic[]
  }, [infiniteClinics, role, profile])

  const {
    data: infiniteDoctors,
    fetchNextPage: fetchNextDoctors,
    hasNextPage: hasNextDoctors,
    isFetchingNextPage: isFetchingNextDoctors,
    isFetching: isDoctorsFetching
  } = useInfiniteDoctors(10, { clinicId: selectedClinic, search: debouncedDoctorSearch, status: "active" }, isDialogOpen && !!selectedClinic)

  const doctors = useMemo(() => {
    return infiniteDoctors?.pages.flatMap(page => page.data) || []
  }, [infiniteDoctors])

  const {
    data: infiniteServices,
    fetchNextPage: fetchNextServices,
    hasNextPage: hasNextServices,
    isFetchingNextPage: isFetchingNextServices,
    isFetching: isServicesFetching
  } = useInfiniteServices(10, { clinicId: selectedClinic, doctorId: selectedDoctor, search: debouncedServiceSearch, status: "active" }, isDialogOpen && !!selectedClinic && !!selectedDoctor)

  const allServices = useMemo(() => {
    return infiniteServices?.pages.flatMap(page => page.data) || []
  }, [infiniteServices])

  const {
    data: infinitePatients,
    fetchNextPage: fetchNextPatients,
    hasNextPage: hasNextPatients,
    isFetchingNextPage: isFetchingNextPatients,
    isFetching: isPatientsFetching
  } = useInfinitePatients(10, { search: debouncedPatientSearch, status: "active" }, isDialogOpen)

  const patients = useMemo(() => {
    return infinitePatients?.pages.flatMap(page => page.data) || []
  }, [infinitePatients])

  // Dynamic slot fetching
  const hasDateSelected = Boolean(selectedDate)
  const { data: slotData, isLoading: isLoadingSlots } = useAppointmentBookSlots({
    clinicId: selectedClinic,
    doctorId: selectedDoctor,
    date: hasDateSelected ? selectedDate : undefined,
    serviceId: selectedService,
    enabled: isDialogOpen,
  })

  // Client-side filtering as a robust backup
  const services = useMemo(() => {
    if (!selectedClinic || !selectedDoctor) return []
    return allServices.filter((s: Service) => {
      // Check clinic - allow if no specific clinics assigned (general) or if it matches
      const clinicArr = Array.isArray(s.clinic) ? s.clinic : (s.clinic ? [s.clinic] : [])
      const hasClinic = clinicArr.length === 0 || clinicArr.some((c: any) => getReferenceId(c) === selectedClinic)

      // Check doctor - allow if no specific doctors assigned (general) or if it matches
      const doctorArr = Array.isArray(s.doctor) ? s.doctor : (s.doctor ? [s.doctor] : [])
      const hasDoctor = doctorArr.length === 0 || doctorArr.some((d: any) => getReferenceId(d) === selectedDoctor)

      // We show all services including telemed regardless of integration status
      return hasClinic && hasDoctor
    })
  }, [allServices, selectedClinic, selectedDoctor])

  const slotOptions = useMemo(() => {
    let slots = slotData?.availableSlots || []

    // If editing, ensure the current slot is available in the options list
    if (isEditing && appointmentToEdit?.schedule?.startTime) {
      const currentSlot = appointmentToEdit.schedule.startTime
      if (!slots.includes(currentSlot)) {
        slots = [...slots, currentSlot].sort()
      }
    }

    return slots.map(slot => ({
      value: slot,
      label: formatSlotLabel(slot)
    }))
  }, [slotData, isEditing, appointmentToEdit])

  const selectedServiceData = useMemo(
    () => services.find((service: Service) => service._id === selectedService) ?? null,
    [services, selectedService]
  )

  const paymentModeOptions = useMemo(() => {
    const settings: PaymentSettingsData = paymentSettings || {}
    const modeMap: Array<{ value: string; label: string; isActive: boolean }> = [
      { value: "pay_later", label: "Pay Later", isActive: settings.pay_later?.isActive === true },
      { value: "paypal", label: "Paypal", isActive: settings.paypal?.isActive === true },
      { value: "razorpay", label: "Razorpay", isActive: settings.razorpay?.isActive === true },
      { value: "stripe", label: "Stripe", isActive: settings.stripe?.isActive === true },
    ]
    const options = modeMap
      .filter((mode) => mode.isActive)
      .map((mode) => ({ value: mode.value, label: mode.label }))

    const currentMode = appointmentToEdit?.paymentMode
    if (currentMode && !options.some((option) => option.value === currentMode)) {
      options.push({
        value: currentMode,
        label: currentMode
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      })
    }

    return options
  }, [paymentSettings, appointmentToEdit?.paymentMode])

  const taxRequestKeyRef = useRef<string>("")
  useEffect(() => {
    if (!isDialogOpen) {
      setTaxCalculation(null)
      setIsCalculatingTax(false)
      taxRequestKeyRef.current = ""
      return
    }

    if (!selectedService || !selectedClinic || !selectedDoctor) {
      setTaxCalculation(null)
      taxRequestKeyRef.current = ""
      return
    }

    const currentKey = JSON.stringify({
      selectedClinic,
      selectedDoctor,
      selectedService
    })

    if (taxRequestKeyRef.current === currentKey) return
    taxRequestKeyRef.current = currentKey

    let isMounted = true
    const timer = setTimeout(async () => {
      try {
        setIsCalculatingTax(true)
        const response = await taxApi.calculateTax({
          clinicId: selectedClinic,
          doctorId: selectedDoctor,
          serviceItems: [{ serviceId: selectedService, quantity: 1 }],
        })
        if (isMounted) setTaxCalculation(response)
      } catch {
        if (isMounted) setTaxCalculation(null)
      } finally {
        if (isMounted) setIsCalculatingTax(false)
      }
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [selectedService, selectedClinic, selectedDoctor, isDialogOpen])

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (open) {
      if (!isEditing) {
        setTaxCalculation(null)
        setIsCalculatingTax(false)
        setSelectedService("")
        setSelectedDate("")
        setSelectedClinic(role === 'clinic_admin' || role === 'receptionist' ? userClinicId : "")
        setSelectedDoctor(role === 'doctor' ? profile?._id || "" : "")
      }
    }
  }

  // Sync selected values with appointmentToEdit when editing
  useEffect(() => {
    if (isEditing && appointmentToEdit) {
      const clinicId = getReferenceId(appointmentToEdit.clinic ?? appointmentToEdit.clinicId)
      if (clinicId) setSelectedClinic(clinicId)

      const doctorId = getReferenceId(appointmentToEdit.doctor ?? appointmentToEdit.doctorId)
      if (doctorId) setSelectedDoctor(doctorId)

      const serviceId = getReferenceId(appointmentToEdit.service ?? appointmentToEdit.serviceId)
      if (serviceId) setSelectedService(serviceId)

      if (appointmentToEdit.schedule?.startDate) {
        setSelectedDate(String(appointmentToEdit.schedule.startDate).split('T')[0])
      }
    }
  }, [isEditing, appointmentToEdit])

  useEffect(() => {
    previousDateRef.current = appointmentToEdit?.schedule?.startDate?.split("T")[0] || ""
  }, [appointmentToEdit])

  const handleValuesChange = (values: any, form?: any) => {
    if (!isEditing && paymentModeOptions.length === 1) {
      const onlyMode = paymentModeOptions[0]?.value
      if (onlyMode && values.paymentMode !== onlyMode) {
        form?.setValue("paymentMode", onlyMode, { shouldDirty: false, shouldValidate: true })
      }
    }

    if (values.clinicId !== selectedClinic) {
      setSelectedClinic(values.clinicId || "")
      setSelectedDoctor("")
      setSelectedService("")
      setSelectedDate("")
    }
    if (values.doctorId !== selectedDoctor) {
      setSelectedDoctor(values.doctorId || "")
      setSelectedService("")
    }
    const nextAppointmentDate = values.appointmentDate || ""
    if (nextAppointmentDate !== selectedDate) {
      setSelectedDate(nextAppointmentDate)
    }
    if (nextAppointmentDate !== previousDateRef.current) {
      previousDateRef.current = nextAppointmentDate
      // Date drives slot availability, so clear any previously selected slot once.
      if (values.slot) {
        form?.setValue("slot", "", { shouldDirty: true, shouldValidate: false })
      }
    }
    if (values.serviceId !== selectedService) {
      setSelectedService(values.serviceId || "")
    }
  }

  const loadRazorpayScript = async () => {
    if (typeof window === "undefined") return false
    if ((window as any).Razorpay) return true

    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleFormSubmit = async (data: AppointmentFormValues) => {
    const statusLabels: Record<string, string> = {
      booked: "Booked",
      check_in: "Check In",
      checkout: "Check Out",
      cancelled: "Cancelled",
    }

    if (isEditing && onUpdateAppointment && appointmentToEdit?._id) {
      const updatePayload: Partial<AppointmentPayload> = {
        appointmentDate: data.appointmentDate,
        slot: data.slot,
        description: data.description,
        status: data.status ? {
          id: data.status,
          label: statusLabels[data.status] || data.status
        } : undefined,
        paymentMode: data.paymentMode,
      }
      onUpdateAppointment(appointmentToEdit._id, updatePayload)
    } else {
      const mode = data.paymentMode || "pay_later"
      const clientRef = `appt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      let verifiedPayment:
        | {
          orderId?: string
          transactionId?: string
          payerId?: string
          payerEmail?: string
          amount?: number
          currency?: string
          status?: string
        }
        | null = null

      if (mode === "paypal") {
        try {
          const order = await appointmentService.createPaypalOrderForCheckout({
            amount: grandTotalAmount,
            clientRef,
          })
          if (!order.approveUrl) {
            toast.error("Unable to start PayPal payment")
            return
          }

          const popup = window.open(order.approveUrl, "paypal-payment", "width=640,height=760")
          if (!popup) {
            toast.error("PayPal popup was blocked")
            return
          }

          const status = await new Promise<"success" | "failed">((resolve) => {
            const messageHandler = async (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return
              const payloadData = event.data as any
              if (payloadData?.type !== "paypal-payment-result") return
              if (payloadData?.clientRef !== clientRef) return
              window.removeEventListener("message", messageHandler)
              clearInterval(closeCheckTimer)

              if (payloadData.status === "success" && payloadData.orderId) {
                try {
                  const verified = await appointmentService.capturePaypalForCheckout({
                    orderId: payloadData.orderId,
                    payerId: payloadData.payerId,
                  })
                  verifiedPayment = verified
                  resolve("success")
                } catch {
                  resolve("failed")
                }
              } else {
                resolve("failed")
              }
            }
            window.addEventListener("message", messageHandler)
            const closeCheckTimer = window.setInterval(() => {
              if (!popup || popup.closed) {
                window.removeEventListener("message", messageHandler)
                clearInterval(closeCheckTimer)
                resolve("failed")
              }
            }, 500)
          })

          if (status !== "success") {
            toast.error("PayPal payment failed")
            return
          }
        } catch {
          toast.error("Unable to initialize PayPal payment")
          return
        }
      } else if (mode === "stripe") {
        try {
          const checkout = await appointmentService.createStripeCheckoutForCheckout({
            amount: grandTotalAmount,
            clientRef,
          })
          if (!checkout.checkoutUrl) {
            toast.error("Unable to start Stripe payment")
            return
          }

          const popup = window.open(checkout.checkoutUrl, "stripe-payment", "width=640,height=760")
          if (!popup) {
            toast.error("Stripe popup was blocked")
            return
          }

          const status = await new Promise<"success" | "failed">((resolve) => {
            const messageHandler = async (event: MessageEvent) => {
              if (event.origin !== window.location.origin) return
              const payloadData = event.data as any
              if (payloadData?.type !== "stripe-payment-result") return
              if (payloadData?.clientRef !== clientRef) return
              window.removeEventListener("message", messageHandler)
              clearInterval(closeCheckTimer)

              if (payloadData.status === "success" && payloadData.sessionId) {
                try {
                  const verified = await appointmentService.verifyStripeForCheckout({
                    sessionId: payloadData.sessionId,
                  })
                  verifiedPayment = { ...verified, orderId: verified.sessionId }
                  resolve("success")
                } catch {
                  resolve("failed")
                }
              } else {
                resolve("failed")
              }
            }
            window.addEventListener("message", messageHandler)
            const closeCheckTimer = window.setInterval(() => {
              if (!popup || popup.closed) {
                window.removeEventListener("message", messageHandler)
                clearInterval(closeCheckTimer)
                resolve("failed")
              }
            }, 500)
          })

          if (status !== "success") {
            toast.error("Stripe payment failed")
            return
          }
        } catch {
          toast.error("Unable to initialize Stripe payment")
          return
        }
      } else if (mode === "razorpay") {
        try {
          const isRazorpayLoaded = await loadRazorpayScript()
          if (!isRazorpayLoaded) {
            toast.error("Unable to load Razorpay checkout")
            return
          }

          const order = await appointmentService.createRazorpayOrderForCheckout({
            amount: grandTotalAmount,
          })

          const status = await new Promise<"success" | "failed">((resolve) => {
            const RazorpayCtor = (window as any).Razorpay
            if (!RazorpayCtor) {
              resolve("failed")
              return
            }
            const razorpay = new RazorpayCtor({
              key: order.keyId,
              amount: order.amount,
              currency: order.currency,
              name: order.name || "Appointment Payment",
              description: order.description || "Appointment charge",
              order_id: order.orderId,
              handler: async (response: any) => {
                try {
                  const verified = await appointmentService.verifyRazorpayForCheckout({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  })
                  verifiedPayment = verified
                  resolve("success")
                } catch {
                  resolve("failed")
                }
              },
              modal: { ondismiss: () => resolve("failed") },
            })
            razorpay.on("payment.failed", () => resolve("failed"))
            razorpay.open()
          })

          if (status !== "success") {
            toast.error("Razorpay payment failed")
            return
          }
        } catch {
          toast.error("Unable to initialize Razorpay payment")
          return
        }
      }

      const verifiedPaymentData = (verifiedPayment || {}) as {
        orderId?: string
        transactionId?: string
        payerId?: string
        payerEmail?: string
        amount?: number
        currency?: string
        status?: string
      }

      const payload: AppointmentPayload = {
        clinicId: data.clinicId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        serviceId: data.serviceId,
        appointmentDate: data.appointmentDate,
        slot: data.slot,
        status: data.status,
        appointmentCharge: grandTotalAmount,
        paymentMode: data.paymentMode,
        paymentStatus: mode === "pay_later" ? "pending" : "paid",
        paymentDetails: mode === "pay_later"
          ? undefined
          : {
            orderId: verifiedPaymentData.orderId,
            transactionId: verifiedPaymentData.transactionId,
            payerId: verifiedPaymentData.payerId,
            payerEmail: verifiedPaymentData.payerEmail,
            amount: verifiedPaymentData.amount ?? grandTotalAmount,
            currency: verifiedPaymentData.currency,
            status: verifiedPaymentData.status || "completed",
          },
        description: data.description,
      }

      await onAddAppointment(payload)
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["doctorSessions"] })
      if (mode !== "pay_later") {
        toast.success("Payment completed and appointment created")
      }
    }
  }

  const editableFieldNamesInEditMode = new Set(["appointmentDate", "slot", "description", "status", "paymentMode"])

  const fields: FormFieldConfig[] = ([
    {
      name: "clinicId",
      label: "Clinic",
      type: "infinite-select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: (() => {
        const opts = clinics.map(c => ({ value: c._id, label: c.name }))
        if (isEditing && appointmentToEdit && isObject(appointmentToEdit.clinic)) {
          const c = appointmentToEdit.clinic as any
          if (c._id && !opts.find(o => o.value === c._id)) {
            opts.push({ value: c._id, label: c.name })
          }
        }
        return opts
      })(),
      placeholder: "Select Clinic",
      disabled: isEditing || (role === "clinic_admin" || role === "receptionist"),
      onSearchChange: setClinicSearch,
      onLoadMore: fetchNextClinics,
      hasNextPage: hasNextClinics,
      isFetchingNextPage: isFetchingNextClinics,
      isLoading: isClinicsFetching
    },
    {
      name: "doctorId",
      label: "Doctor",
      type: "infinite-select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: (() => {
        const opts = doctors.map(d => ({ value: d._id, label: `${d.firstName} ${d.lastName}` }))
        if (isEditing && appointmentToEdit && isObject(appointmentToEdit.doctor)) {
          const d = appointmentToEdit.doctor as any
          if (d._id && !opts.find(o => o.value === d._id)) {
            opts.push({ value: d._id, label: d.fullName || `${d.firstName} ${d.lastName}` })
          }
        }
        return opts
      })(),
      placeholder: "Select Doctor",
      disabled: isEditing || !selectedClinic || role === "doctor",
      onSearchChange: setDoctorSearch,
      onLoadMore: fetchNextDoctors,
      hasNextPage: hasNextDoctors,
      isFetchingNextPage: isFetchingNextDoctors,
      isLoading: isDoctorsFetching
    },
    {
      name: "patientId",
      label: "Patient",
      type: "infinite-select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: (() => {
        const opts = patients.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName}` }))
        if (isEditing && appointmentToEdit && isObject(appointmentToEdit.patient)) {
          const p = appointmentToEdit.patient as any
          if (p._id && !opts.find(o => o.value === p._id)) {
            opts.push({ value: p._id, label: p.fullName || `${p.firstName} ${p.lastName}` })
          }
        }
        return opts
      })(),
      placeholder: "Select Patient",
      disabled: isEditing,
      onSearchChange: setPatientSearch,
      onLoadMore: fetchNextPatients,
      hasNextPage: hasNextPatients,
      isFetchingNextPage: isFetchingNextPatients,
      isLoading: isPatientsFetching
    },
    {
      name: "serviceId",
      label: "Service",
      type: "infinite-select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: (() => {
        const opts = services.map((s: Service) => ({
          value: s._id,
          label: `${s.name}${s.telemed_service ? " (Telemed)" : ""}`
        }))
        if (isEditing && appointmentToEdit && isObject(appointmentToEdit.service)) {
          const s = appointmentToEdit.service as any
          if (s._id && !opts.find(o => o.value === s._id)) {
            opts.push({ value: s._id, label: s.name })
          }
        }
        return opts
      })(),
      placeholder: "Select Service",
      disabled: isEditing || !selectedDoctor,
      onSearchChange: setServiceSearch,
      onLoadMore: fetchNextServices,
      hasNextPage: hasNextServices,
      isFetchingNextPage: isFetchingNextServices,
      isLoading: isServicesFetching
    },
    {
      name: "appointmentDate",
      label: "Date",
      type: "date",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      minDate: startOfDay(new Date()),
      maxDate: new Date(new Date().getFullYear() + 100, 11, 31),
      showMonthDropdown: true,
      showYearDropdown: true,
    },
    {
      name: "slot",
      label: "Slot Time",
      type: "select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: slotOptions,
      disabled: !selectedDate || !selectedService || isLoadingSlots,
      placeholder: !selectedDate
        ? "Select date first"
        : isLoadingSlots
          ? "Loading slots..."
          : slotOptions.length === 0
            ? "No available slots for the selected date and doctor."
            : "Select time slot",
      className: "disabled:cursor-not-allowed disabled:opacity-60",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: [
        { value: "booked", label: "Booked" },
        { value: "check_in", label: "Check In" },
        { value: "checkout", label: "Check Out" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      name: "paymentMode",
      label: "Payment Mode",
      type: "select",
      section: "Personal Information",
      gridClass: "col-span-1",
      options: paymentModeOptions,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      section: "Personal Information",
      gridClass: "col-span-2",
      placeholder: "Add any additional notes...",
    },
  ] as FormFieldConfig[])
    .filter(f => {
      if (f.name === "patientId" && role === "patient") return false
      if (f.name === "clinicId" && (role === "clinic_admin" || role === "receptionist")) return false
      if (f.name === "doctorId" && role === "doctor") return false
      if (f.name === "status" && role === "patient") return false
      if (f.name === "description" && appointmentSettings?.enable_appointment_description === false) return false
      if (f.name === "paymentMode") {
        if (isEditing) {
          // Edit mode: hide for everyone except admin
          if (role !== "admin") return false
        } else {
          // Add mode: hide for everyone except patient
          if (role !== "patient") return false
        }
      }
      return true
    })
    .map((field) => {
      if (!isEditing) return field
      if (editableFieldNamesInEditMode.has(field.name)) return field
      return { ...field, disabled: true }
    })

  const defaultValues = useMemo(() => {
    if (appointmentToEdit) {
      return {
        _id: appointmentToEdit._id,
        patientId: getReferenceId(appointmentToEdit.patient ?? appointmentToEdit.patientId) || "",
        clinicId: getReferenceId(appointmentToEdit.clinic ?? appointmentToEdit.clinicId) || "",
        doctorId: getReferenceId(appointmentToEdit.doctor ?? appointmentToEdit.doctorId) || "",
        serviceId: getReferenceId(appointmentToEdit.service ?? appointmentToEdit.serviceId) || "",
        appointmentDate: appointmentToEdit.schedule?.startDate?.split('T')[0] || "",
        slot: appointmentToEdit.schedule?.startTime || "09:00",
        status: appointmentToEdit.status?.id || "booked",
        paymentMode: appointmentToEdit.paymentMode,
        description: appointmentToEdit.description,
      }
    }
    return {
      patientId: role === "patient" ? profile?._id || "" : "",
      clinicId: (role === "clinic_admin" || role === "receptionist") ? userClinicId : "",
      doctorId: role === "doctor" ? profile?._id || "" : "",
      serviceId: "",
      appointmentDate: "",
      slot: "",
      status: "booked",
      paymentMode: "pay_later",
      description: "",
    }
  }, [appointmentToEdit, role, profile?._id, userClinicId, paymentModeOptions])

  const currency = (value: number | string | undefined) =>
    formatCurrency(Number(value || 0))

  const subtotalAmount = taxCalculation?.totalBaseAmount ?? Number(selectedServiceData?.charges || 0)
  const taxAmount = taxCalculation?.totalTaxAmount ?? 0
  const grandTotalAmount = taxCalculation?.grandTotal ?? subtotalAmount + taxAmount

  return (
    <GenericFormDialog
      title={isEditing ? "Edit Appointment" : "Add New Appointment"}
      description="Fill in the appointment details."
      triggerLabel={isEditing ? "Edit" : "Add Appointment"}
      trigger={trigger}
      formSchema={appointmentFormSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleFormSubmit}
      onValuesChange={handleValuesChange}
      onOpenChange={handleDialogOpenChange}
      dialogSize="lg"
      submitButtonText={isEditing ? "Update Appointment" : "Save Appointment"}
      renderFooterContent={() => {
        if (!selectedServiceData) return null

        return (
          <div className="rounded-md border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency(subtotalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className={taxAmount > 0 ? "text-destructive" : ""}>
                {isCalculatingTax ? "Calculating..." : currency(taxAmount)}
              </span>
            </div>

            {taxCalculation?.taxes?.length ? (
              <div className="rounded-md bg-background p-3 space-y-2">
                <p className="text-sm font-medium">Applied Tax</p>
                {taxCalculation.taxes.map((tax) => (
                  <div key={tax.taxId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {tax.taxName} {tax.taxType === "percentage" ? `(${tax.taxRate}%)` : ""}
                    </span>
                    <span className="text-destructive">{currency(tax.totalAmount)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Grand Total</span>
              <span className="text-lg font-bold text-primary">{currency(grandTotalAmount)}</span>
            </div>
          </div>
        )
      }}
    />
  )
}
