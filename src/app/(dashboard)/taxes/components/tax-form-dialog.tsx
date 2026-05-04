"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { GenericFormDialog, FormFieldConfig } from "@/components/generic-form-dialog"
import { z } from "zod"
import { useClinics, useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useDoctors, useInfiniteDoctors } from "@/hooks/api/use-doctors"
import { useServices, useInfiniteServices } from "@/hooks/api/use-services"
import { Tax, TaxPayload } from "@/types/tax.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import type { Service } from "@/types/service.types"
import { useProfile } from "@/hooks/api/use-profile"

const taxFormSchema = z.object({
  _id: z.string().optional(),
  taxName: z.string().min(2, { message: "Tax name must be at least 2 characters." }),
  type: z.enum(["percentage", "fixed"]),
  taxRate: z.string().min(1, { message: "Please enter tax rate." }),
  /** Single clinic, or empty / omitted to apply to all clinics */
  clinicId: z.string().optional(),
  doctorIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  status: z.enum(["Active", "Inactive"]),
})

type TaxFormValues = z.infer<typeof taxFormSchema>

interface TaxFormDialogProps {
  onAddTax: (tax: TaxPayload) => void
  onUpdateTax?: (id: string, tax: Partial<TaxPayload>) => void
  taxToEdit?: Tax | null
  trigger?: React.ReactNode
  role?: any
}

function getReferenceId(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null && "_id" in value) {
    return (value as { _id: string })._id
  }
  return ""
}

function getReferenceIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => getReferenceId(item)).filter(Boolean)
  }
  const id = getReferenceId(value)
  return id ? [id] : []
}

export function TaxFormDialog({ onAddTax, onUpdateTax, taxToEdit, trigger, role: propRole }: TaxFormDialogProps) {
  const isEditing = !!taxToEdit
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  
  const { data: profile } = useProfile()
  const role = propRole || profile?.role
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

  const assignedClinicId = useMemo(() => {
    const firstClinic = profile?.meta?.clinics?.[0]
    if (!firstClinic) return ""
    return typeof firstClinic === "string" ? firstClinic : firstClinic._id
  }, [profile])

  const assignedClinics = useMemo(() => {
    if (!profile?.meta?.clinics) return []
    return profile.meta.clinics
      .map((clinic: any) => {
        if (typeof clinic === "string") return null
        return {
          _id: clinic._id,
          name: clinic.clinicName || clinic.name || "",
        }
      })
      .filter(Boolean) as Clinic[]
  }, [profile])

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")
  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [debouncedServiceSearch, setDebouncedServiceSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedServiceSearch(serviceSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [serviceSearch])

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinics,
    hasNextPage: hasNextClinics,
    isFetchingNextPage: isFetchingExtraClinics,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch }, isOpen && !isDoctor && !isClinicAdmin && !isReceptionist)

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctors,
    hasNextPage: hasNextDoctors,
    isFetchingNextPage: isFetchingExtraDoctors,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, { 
    search: debouncedDoctorSearch, 
    clinicId: selectedClinicId || (isClinicAdmin || isReceptionist || isDoctor ? assignedClinicId : undefined),
    status: "active",
  }, isOpen && !isDoctor)

  const {
    data: servicesInfiniteData,
    fetchNextPage: fetchNextServices,
    hasNextPage: hasNextServices,
    isFetchingNextPage: isFetchingExtraServices,
    isLoading: isServicesLoading,
  } = useInfiniteServices(10, { 
    search: debouncedServiceSearch, 
    clinicId: selectedClinicId || (isClinicAdmin || isReceptionist || isDoctor ? assignedClinicId : undefined) 
  }, isOpen)

  // Master lists for mapping
  const { data: allClinicsResponse } = useClinics(1, 1000, isOpen && !isDoctor && !isClinicAdmin && !isReceptionist)
  const { data: allDoctorsResponse } = useDoctors(1, 1000, isOpen && !isDoctor, { status: "active" })
  const { data: allServicesResponse } = useServices(1, 1000, undefined, isOpen)

  const allClinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    return allClinicsResponse?.data || []
  }, [allClinicsResponse, isDoctor, isClinicAdmin, isReceptionist, assignedClinics])

  const allDoctors = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName, fullName: `${profile.firstName} ${profile.lastName}` } as any]
    return allDoctorsResponse?.data || []
  }, [allDoctorsResponse, isDoctor, profile])

  const allServices = useMemo<Service[]>(() => allServicesResponse?.data || [], [allServicesResponse])

  const clinicsOptions = useMemo(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData, isDoctor, isClinicAdmin, isReceptionist, assignedClinics])

  const doctorsOptions = useMemo(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName, fullName: `${profile.firstName} ${profile.lastName}` } as any]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const servicesOptions = useMemo(() => {
    if (!servicesInfiniteData) return []
    return servicesInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [servicesInfiniteData])

  const handleFormSubmit = async (data: TaxFormValues) => {
    const rawClinic = data.clinicId?.trim() ?? ""
    const payload: TaxPayload = {
      taxName: data.taxName,
      taxRate: parseFloat(data.taxRate),
      type: data.type,
      clinicId: rawClinic ? rawClinic : undefined,
      doctorIds: data.doctorIds && data.doctorIds.length > 0 ? data.doctorIds : undefined,
      serviceIds: data.serviceIds && data.serviceIds.length > 0 ? data.serviceIds : undefined,
      isActive: data.status === "Active",
    }

    if (isEditing && onUpdateTax && taxToEdit?._id) {
      onUpdateTax(taxToEdit._id, payload)
    } else {
      onAddTax(payload)
    }
  }

  const fields: FormFieldConfig[] = [
    { name: "taxName", label: "Tax Name", type: "text", required: true, section: "Personal Information", gridClass: "col-span-1" },
    {
      name: "taxRate",
      label: "Tax Rate",
      type: "rate",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      rateTypeFieldName: "type",
      rateTypeLabel: "Type"
    },
    {
      name: "clinicId",
      label: "Clinic",
      type: "infinite-select",
      section: "Personal Information",
      gridClass: "col-span-1",
      options: clinicsOptions.map(c => ({ value: c._id, label: (c as any).clinicName || c.name })),
      onLoadMore: fetchNextClinics,
      onSearchChange: setClinicSearch,
      hasNextPage: hasNextClinics,
      isFetchingNextPage: isFetchingExtraClinics,
      isLoading: isClinicsLoading,
      disabled: isDoctor || isClinicAdmin || isReceptionist,
      infiniteSelectAllLabel: "All clinics",
      selectedOptions: (watchedValues: any) => {
        const id = typeof watchedValues.clinicId === "string" ? watchedValues.clinicId.trim() : ""
        if (!id) return []
        const matched = (allClinics || []).find((c: any) => c._id === id)
        return [
          { value: id, label: matched ? (matched as any).clinicName || matched.name : "Selected Clinic" },
        ]
      },
      placeholder: "Select Clinic",
      description: (isDoctor || isClinicAdmin || isReceptionist) ? undefined : "Note: If no clinic is selected, it will apply to all."
    },
    {
      name: "doctorIds",
      label: "Doctors",
      type: "infinite-multi-select",
      section: "Personal Information",
      gridClass: "col-span-1",
      options: doctorsOptions.map(d => ({ value: d._id, label: (d as any).fullName || `${d.firstName} ${d.lastName}` })),
      onLoadMore: fetchNextDoctors,
      onSearchChange: setDoctorSearch,
      hasNextPage: hasNextDoctors,
      isFetchingNextPage: isFetchingExtraDoctors,
      isLoading: isDoctorsLoading,
      disabled: isDoctor,
      selectedOptions: (watchedValues: any) => {
        const ids = Array.isArray(watchedValues.doctorIds) ? watchedValues.doctorIds : []
        return ids.map((id: string) => {
          const matched = (allDoctors || []).find((d: any) => d._id === id)
          const matchedInf = (doctorsOptions || []).find((d: any) => d._id === id)
          const target = matched || matchedInf
          return { value: id, label: target ? (target as any).fullName || `${target.firstName} ${target.lastName}` : "Selected Doctor" }
        })
      },
      placeholder: "Select Doctors",
      description: isDoctor ? undefined : "Note: If no doctor is selected, it will apply to all."
    },
    {
      name: "serviceIds",
      label: "Services",
      type: "infinite-multi-select",
      section: "Personal Information",
      gridClass: "col-span-1",
      options: servicesOptions.map(s => ({ value: s._id, label: s.name })),
      onLoadMore: fetchNextServices,
      onSearchChange: setServiceSearch,
      hasNextPage: hasNextServices,
      isFetchingNextPage: isFetchingExtraServices,
      isLoading: isServicesLoading,
      selectedOptions: (watchedValues: any) => {
        const ids = Array.isArray(watchedValues.serviceIds) ? watchedValues.serviceIds : []
        return ids.map((id: string) => {
          const matched = (allServices || []).find((s: any) => s._id === id)
          const matchedInf = (servicesOptions || []).find((s: any) => s._id === id)
          const target = matched || matchedInf
          return { value: id, label: target ? target.name : "Selected Service" }
        })
      },
      placeholder: "Select Services",
      description: "Note: If no service is selected, it will apply to all."
    },
    {
      name: "status",
      label: "Status",
      type: "radio",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
  ]

  const defaultValues = useMemo(() => {
    if (taxToEdit) {
      const clinicIdList = getReferenceIds((taxToEdit as any).clinicIds || (taxToEdit as any).clinicId)
      return {
        _id: taxToEdit._id,
        taxName: taxToEdit.taxName,
        type: taxToEdit.type,
        taxRate: taxToEdit.taxRate.toString(),
        clinicId: clinicIdList[0] || "",
        doctorIds: getReferenceIds(taxToEdit.doctorIds || (taxToEdit as any).doctors),
        serviceIds: getReferenceIds(taxToEdit.serviceIds || (taxToEdit as any).services),
        status: (taxToEdit.isActive ? "Active" : "Inactive") as "Active" | "Inactive",
      }
    }
    return {
      taxName: "",
      type: "percentage" as const,
      taxRate: "",
      clinicId: (isClinicAdmin || isReceptionist || isDoctor) && assignedClinicId ? assignedClinicId : "",
      doctorIds: isDoctor && profile?._id ? [profile._id] : [],
      serviceIds: [],
      status: "Active" as const,
    }
  }, [taxToEdit, isClinicAdmin, isReceptionist, isDoctor, assignedClinicId, profile?._id])

  const onValuesChange = useCallback((values: any) => {
    // Sync clinic selection for filtering doctors and services
    const raw = typeof values.clinicId === "string" ? values.clinicId.trim() : ""
    if (raw !== selectedClinicId) {
      setSelectedClinicId(raw)
    }
  }, [selectedClinicId])

  return (
    <GenericFormDialog
      title={isEditing ? "Edit Tax" : "Add New Tax"}
      description="Configure tax settings. Leave fields empty to apply as 'All'."
      triggerLabel={isEditing ? "Edit Tax" : "Add Tax"}
      trigger={trigger}
      formSchema={taxFormSchema}
      defaultValues={defaultValues}
      fields={fields}
      onValuesChange={onValuesChange}
      onSubmit={handleFormSubmit}
      dialogSize="lg"
      submitButtonText={isEditing ? "Update Tax" : "Save Tax"}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  )
}
