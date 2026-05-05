"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { GenericFormDialog, FormFieldConfig } from "@/components/generic-form-dialog"
import { z } from "zod"
import { useCreateService, useEditService } from "@/hooks/api/use-services"
import { useProfile } from "@/hooks/api/use-profile"
import { useListingData } from "@/hooks/api/use-listings"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import type { Service } from "@/types/service.types"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"

const serviceFormSchema = z.object({
  serviceImage: z.any().optional(),
  name: z.string().min(2, { message: "Service name must be at least 2 characters." }),
  clinic: z.array(z.string()).min(1, { message: "Please select at least one clinic." }),
  doctor: z.array(z.string()).min(1, { message: "Please select at least one doctor." }),
  charges: z.string().min(1, { message: "Please enter charges." }),
  duration: z.string().min(1, { message: "Please enter duration." }),
  telemed_service: z.string().min(1, { message: "Please select an option." }),
  category: z.string().min(1, { message: "Please select a category." }),
  status: z.string().min(1, { message: "Please select a status." }),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface ServiceFormDialogProps {
  onServiceAdded?: () => void
  serviceToEdit?: Service | null
  trigger?: React.ReactNode
  clinics?: Clinic[]
  allClinics?: Clinic[]
  allDoctors?: Doctor[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  role?: string
}

function getReferenceId(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null && "_id" in value) {
    const maybeId = (value as { _id?: unknown })._id
    return typeof maybeId === "string" ? maybeId : ""
  }
  return ""
}

function getReferenceIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => getReferenceId(item)).filter(Boolean)
  }
  const id = getReferenceId(value)
  return id ? [id] : []
}

export function ServiceFormDialog({
  onServiceAdded,
  serviceToEdit,
  trigger,
  clinics = [],
  allClinics = [],
  allDoctors = [],
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  role,
}: ServiceFormDialogProps) {
  const { data: profile } = useProfile()
  const isEditing = !!serviceToEdit
  const createServiceMutation = useCreateService()
  const editServiceMutation = useEditService()

  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>(() => {
    const ids = getReferenceIds(serviceToEdit?.clinic)
    if (ids.length === 0 && clinics.length === 1) {
      return [clinics[0]._id]
    }
    return ids
  })
  const [localDoctorSearch, setLocalDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  useEffect(() => {
    const rawIds = getReferenceIds(serviceToEdit?.clinic)
    const nextIds = (rawIds.length === 0 && clinics.length === 1) ? [clinics[0]._id] : rawIds

    setSelectedClinicIds((current) => {
      const isSame = current.length === nextIds.length &&
        current.every((id, index) => id === nextIds[index])
      return isSame ? current : nextIds
    })
  }, [serviceToEdit, clinics])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(localDoctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [localDoctorSearch])

  const {
    data: dialogDoctorsData,
    fetchNextPage: fetchNextDialogDoctors,
    hasNextPage: hasNextDialogDoctors,
    isFetchingNextPage: isFetchingNextDialogDoctors,
    isLoading: isDialogDoctorsLoading,
  } = useInfiniteDoctors(10, {
    search: debouncedDoctorSearch,
    clinicId: selectedClinicIds.length > 0 ? selectedClinicIds.join(',') : undefined,
    status: "active",
  }, true)

  const dialogDoctors = useMemo<Doctor[]>(() => {
    if (!dialogDoctorsData) return []
    return dialogDoctorsData.pages.flatMap((page: any) => page.data || [])
  }, [dialogDoctorsData])

  const { data: serviceTypes = [], isLoading: loadingServiceTypes } = useListingData("service_type", true)
  const { data: specialtiesData = [], isLoading: loadingSpecialties } = useListingData("specialties", true)

  const categories = useMemo(() => {
    const combined = [...serviceTypes, ...specialtiesData]
    return Array.from(new Map(combined.map(item => [item._id, item])).values())
  }, [serviceTypes, specialtiesData])

  const loadingCategories = loadingServiceTypes || loadingSpecialties

  const formatMinutesToTime = (totalMinutes: number | string) => {
    const minutes = Number(totalMinutes) || 0
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  const handleFormSubmit = async (data: ServiceFormValues) => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("charges", data.charges)
    const [hrs, mins] = data.duration.split(':').map(Number)
    formData.append("duration", String((hrs * 60) + mins))
    formData.append("category", data.category)
    formData.append("telemed_service", String(data.telemed_service === "yes"))
    formData.append("isActive", String(data.status === "Active"))

    data.clinic.forEach((clinicId, index) => formData.append(`clinic[${index}]`, clinicId))
    data.doctor.forEach((doctorId, index) => formData.append(`doctor[${index}]`, doctorId))

    if (data.serviceImage instanceof File) {
      formData.append("serviceImage", data.serviceImage)
    }

    if (isEditing && serviceToEdit) {
      await editServiceMutation.mutateAsync({ id: serviceToEdit._id, formData })
    } else {
      await createServiceMutation.mutateAsync(formData)
    }
    onServiceAdded?.()
  }

  const allFields: FormFieldConfig[] = [
    {
      name: "serviceImage",
      label: "Service",
      type: "image-upload",
      required: false,
      gridClass: "col-span-2",
      section: "Personal Information",
      accept: "image/jpeg,image/gif,image/png",
      imageUploadMode: "avatar-click"
    },
    {
      name: "category",
      label: "Service Type",
      type: "select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: categories.map(c => ({ value: c._id, label: c.label })),
      placeholder: loadingCategories ? "Loading Service Types..." : "Select Service Type",
    },
    { name: "name", label: "Service Name", type: "text", required: true, section: "Personal Information" },
    { name: "charges", label: "Charges", type: "currency", required: true, section: "Personal Information", gridClass: "col-span-1" },
    { name: "duration", label: "Duration (minutes)", type: "time", required: true, section: "Personal Information", gridClass: "col-span-1" },
    {
      name: "clinic",
      label: "Clinic",
      type: "infinite-multi-select",
      required: true,
      section: "Personal Information",
      options: clinics.map(c => ({ value: c._id, label: c.name })),
      onLoadMore: onClinicsLoadMore,
      onSearchChange: onClinicsSearchChange,
      hasNextPage: hasNextClinicsPage,
      isFetchingNextPage: isFetchingNextClinicsPage,
      isLoading: isClinicsLoading,
      selectedOptions: (watchedValues: any) => {
        const ids = Array.isArray(watchedValues.clinic) ? watchedValues.clinic : []
        return ids.map((id: string) => {
          const matched = (allClinics || []).find((c: any) => c._id === id)
          if (matched) return { value: id, label: matched.name }
          const initialClinic = Array.isArray(serviceToEdit?.clinic)
            ? serviceToEdit.clinic.find((c: any) => (typeof c === 'object' ? c._id : c) === id)
            : serviceToEdit?.clinic
          if (initialClinic && typeof initialClinic === 'object') {
            return { value: id, label: (initialClinic as any).name || "Selected Clinic" }
          }
          return { value: id, label: "Selected Clinic" }
        })
      }
    },
    {
      name: "doctor",
      label: "Doctor",
      type: "infinite-multi-select",
      required: true,
      section: "Personal Information",
      options: dialogDoctors.map(d => ({ value: d._id, label: (d as any).fullName || `${d.firstName} ${d.lastName}` })),
      gridClass: "col-span-1",
      disabled: (values) => !Array.isArray(values.clinic) || values.clinic.length === 0,
      onLoadMore: fetchNextDialogDoctors,
      onSearchChange: setLocalDoctorSearch,
      hasNextPage: hasNextDialogDoctors,
      isFetchingNextPage: isFetchingNextDialogDoctors,
      isLoading: isDialogDoctorsLoading,
      placeholder: isDialogDoctorsLoading
        ? "Loading doctors..."
        : (selectedClinicIds.length > 0
          ? (dialogDoctors.length > 0 ? "Select Doctor" : "No doctors found for the selected clinics")
          : "Select clinic first"),
      selectedOptions: (watchedValues: any) => {
        const ids = Array.isArray(watchedValues.doctor) ? watchedValues.doctor : []
        if (ids.length === 0) return []
        return ids.map((id: string) => {
          const matchedInAll = (allDoctors || []).find((opt: any) => opt._id === id)
          if (matchedInAll) return { value: id, label: (matchedInAll as any).fullName || `${matchedInAll.firstName} ${matchedInAll.lastName}` }
          const matchedInInf = (dialogDoctors || []).find((opt: any) => opt._id === id)
          if (matchedInInf) return { value: id, label: (matchedInInf as any).fullName || `${matchedInInf.firstName} ${matchedInInf.lastName}` }
          const initialDoctor = Array.isArray(serviceToEdit?.doctor)
            ? serviceToEdit.doctor.find((d: any) => (typeof d === 'object' ? (d as any)._id : d) === id)
            : serviceToEdit?.doctor
          if (initialDoctor && typeof initialDoctor === 'object') {
            return { value: id, label: (initialDoctor as any).name || `${(initialDoctor as any).firstName} ${(initialDoctor as any).lastName}` || "Selected Doctor" }
          }
          return { value: id, label: "Selected Doctor" }
        })
      }
    },
    {
      name: "telemed_service",
      label: "Telemed Service",
      type: "select",
      required: true,
      section: "Personal Information",
      gridClass: "col-span-1",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      section: "Personal Information",
      options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
      gridClass: "col-span-1",
    },
  ]

  const fields = allFields.filter(field => {
    if (field.name === "doctor" && role === "doctor") return false
    if (field.name === "clinic" && clinics.length === 1) return false
    return true
  })

  const defaultValues = useMemo(() => {
    const doctorIds = getReferenceIds(serviceToEdit?.doctor)
    const clinicIds = getReferenceIds(serviceToEdit?.clinic)

    return {
      serviceImage: serviceToEdit?.serviceImage || "",
      name: serviceToEdit?.name || "",
      clinic: clinicIds.length > 0 ? clinicIds : (clinics.length === 1 ? [clinics[0]._id] : []),
      doctor: doctorIds.length > 0 ? doctorIds : (role === "doctor" && profile ? [profile._id] : []),
      charges: String(serviceToEdit?.charges || ""),
      duration: serviceToEdit?.duration ? formatMinutesToTime(serviceToEdit.duration) : "00:00",
      telemed_service: serviceToEdit?.telemed_service ? "yes" : "no",
      category: getReferenceId(serviceToEdit?.category),
      status: serviceToEdit?.isActive === false ? "Inactive" : "Active",
    }
  }, [serviceToEdit, role, profile, clinics])

  const onValuesChange = useCallback((values: any) => {
    const nextClinicIds = Array.isArray(values.clinic) ? values.clinic : []
    setSelectedClinicIds((currentClinicIds) =>
      currentClinicIds.length === nextClinicIds.length &&
        currentClinicIds.every((clinicId, index) => clinicId === nextClinicIds[index])
        ? currentClinicIds
        : nextClinicIds
    )
  }, [])

  return (
    <GenericFormDialog
      title={isEditing ? "Edit Service" : "Add New Service"}
      description="Fill in the service details below."
      triggerLabel={isEditing ? "Edit" : "Add Service"}
      trigger={trigger}
      formSchema={serviceFormSchema}
      defaultValues={defaultValues}
      fields={fields}
      onValuesChange={onValuesChange}
      onSubmit={handleFormSubmit}
      dialogSize="lg"
      submitButtonText={isEditing ? "Update Service" : "Save Service"}
    />
  )
}
