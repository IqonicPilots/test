"use client"

import { GenericFormDialog, type FormStep } from "@/components/generic-form-dialog"
import { createDobSchema, getDobDateBounds } from "@/components/common/DobDatePicker"
import { Country, State } from "country-state-city"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import type { StaticData } from "@/types/listing.types"
import { z } from "zod"
import { useMemo } from "react"
import { useProfile } from "@/hooks/api/use-profile"

const doctorDobSchema = createDobSchema("doctor")
const doctorDobBounds = getDobDateBounds("doctor")

// Schema for Step 1 (Personal & Address)
const step1FormSchema = z.object({
  profilePicture: z.any().nullable().optional(),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  clinics: z.array(z.string()).min(1, { message: "Please select at least one clinic." }),
  mobile: z
    .string()
    .trim()
    .min(7, { message: "Please enter a valid phone number." })
    .regex(/^[0-9]+$/, { message: "Phone number must contain digits only." }),
  countryCode: z.string().min(2, { message: "Country code is required." }),
  dateOfBirth: doctorDobSchema,
  status: z.string().min(1, { message: "Please select a status." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Postal code must contain numbers only.",
    }),
  country: z.string().optional(),
})

// Schema for Step 2 (Professional)
const step2FormSchema = z.object({
  specialties: z.array(z.string()).min(1, { message: "Please select at least one specialization." }),
  experience: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[0-9]+$/.test(value), {
      message: "Experience must be a number.",
    })
    .optional(),
  description: z.string().optional(),
  signatureImage: z.any().nullable().optional(),
})

// Combined schema for final validation
const doctorFormSchema = z.object({
  profilePicture: z.any().nullable().optional(),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  clinics: z.array(z.string()).min(1, { message: "Please select at least one clinic." }),
  mobile: z
    .string()
    .trim()
    .min(7, { message: "Please enter a valid phone number." })
    .regex(/^[0-9]+$/, { message: "Phone number must contain digits only." }),
  countryCode: z.string().min(2, { message: "Country code is required." }),
  dateOfBirth: doctorDobSchema,
  status: z.string().min(1, { message: "Please select a status." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Postal code must contain numbers only.",
    }),
  country: z.string().optional(),
  specialties: z.array(z.string()).min(1, { message: "Please select at least one specialization." }),
  experience: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[0-9]+$/.test(value), {
      message: "Experience must be a number.",
    })
    .optional(),
  description: z.string().optional(),
  signatureImage: z.any().nullable().optional(),
})

type DoctorFormValues = z.infer<typeof doctorFormSchema>

export { doctorFormSchema }
export type { DoctorFormValues }

function getReferenceId(value: unknown) {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null && "_id" in value) {
    const maybeId = (value as { _id?: unknown })._id
    return typeof maybeId === "string" ? maybeId : ""
  }

  return ""
}

function getReferenceIds(values?: unknown[]) {
  return (values ?? [])
    .map((value) => getReferenceId(value))
    .filter(Boolean)
}

function getDateValue(value?: string) {
  if (!value) {
    return ""
  }

  return value.split("T")[0] ?? value
}

function getDoctorFormDefaults(doctor?: Doctor): DoctorFormValues {
  const address = doctor?.meta?.address
  const addressObject = typeof address === "object" && address !== null ? address : undefined

  return {
    profilePicture: doctor?.meta?.profilePicture ?? doctor?.meta?.avatar ?? null,
    firstName: doctor?.firstName ?? "",
    lastName: doctor?.lastName ?? "",
    email: doctor?.email ?? "",
    mobile: doctor?.mobile ?? "",
    countryCode: doctor?.countryCode ?? "",
    dateOfBirth: getDateValue(doctor?.meta?.dob),
    gender: doctor?.meta?.gender ?? "",
    status: doctor?.isActive === false ? "Inactive" : "Active",
    clinics: getReferenceIds(doctor?.meta?.clinics),
    address:
      typeof address === "string"
        ? address
        : addressObject?.street ?? "",
    city: addressObject?.city ?? doctor?.meta?.city ?? "",
    state: (addressObject?.state && addressObject?.state.length > 2 && addressObject?.country) ?
      (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name === addressObject.country || c.isoCode === addressObject.country)?.isoCode || "").find(s => s.name === addressObject.state)?.isoCode || addressObject.state) : (addressObject?.state ?? doctor?.meta?.state ?? ""),
    postalCode: addressObject?.postalCode ?? doctor?.meta?.postalCode ?? "",
    country: (addressObject?.country && addressObject?.country.length > 2) ?
      (Country.getAllCountries().find(c => c.name === addressObject.country)?.isoCode || addressObject.country) : (addressObject?.country ?? doctor?.meta?.country ?? ""),
    specialties: getReferenceIds(doctor?.meta?.specialties),
    experience: doctor?.meta?.experience !== undefined ? String(doctor.meta.experience) : "",
    description: doctor?.meta?.description ?? "",
    signatureImage: doctor?.meta?.signature ?? null,
  }
}

interface DoctorFormDialogProps {
  onAddDoctor: (doctor: DoctorFormValues) => void | Promise<void>
  onEditDoctor?: (doctor: DoctorFormValues) => void | Promise<void>
  clinics: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  specialties: StaticData[]
  isSubmitting?: boolean
  doctor?: Doctor
  mode?: "create" | "edit"
  trigger?: React.ReactNode
}

export function DoctorFormDialog({
  onAddDoctor,
  onEditDoctor,
  clinics,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage = false,
  isFetchingNextClinicsPage = false,
  isClinicsLoading = false,
  specialties,
  isSubmitting = false,
  doctor,
  mode = "create",
  trigger,
}: DoctorFormDialogProps) {
  const { data: profile } = useProfile()
  const role = profile?.role

  const assignedClinicIds = useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return profile.meta.clinics
      .map((clinic): string => {
        if (typeof clinic === "string") return clinic
        return (clinic as any)?._id ?? ""
      })
      .filter(Boolean)
  }, [profile])

  const isClinicAdminOrReceptionist = role === "clinic_admin" || role === "receptionist"

  const defaultValues = useMemo(() => {
    const defaults = getDoctorFormDefaults(doctor)
    // If creating a new doctor and the user is clinic_admin/receptionist, 
    // pre-fill the clinics with their assigned clinics
    if (mode === "create" && isClinicAdminOrReceptionist && assignedClinicIds.length > 0) {
      defaults.clinics = assignedClinicIds
    }
    return defaults
  }, [doctor, mode, isClinicAdminOrReceptionist, assignedClinicIds])

  const isEditMode = mode === "edit"

  // Memoize aggregated clinic options to ensure currently assigned clinics are always visible
  const clinicOptions = useMemo(() => {
    const existingIds = new Set(clinics.map((c) => c._id))
    const options = clinics.map((c) => ({ value: c._id, label: c.name }))

    if (doctor?.meta?.clinics) {
      doctor.meta.clinics.forEach((c) => {
        if (typeof c === "object" && c !== null && "_id" in c) {
          const id = (c as any)._id
          if (id && !existingIds.has(id)) {
            options.push({ value: id, label: (c as any).name || "Unknown Clinic" })
            existingIds.add(id)
          }
        }
      })
    }
    return options
  }, [clinics, doctor])

  // Memoize aggregated specialty options to ensure currently assigned specialties are always visible
  const specialtyOptions = useMemo(() => {
    const existingIds = new Set(specialties.map((s) => s._id))
    const options = specialties.map((s) => ({ value: s._id, label: s.label }))

    if (doctor?.meta?.specialties) {
      doctor.meta.specialties.forEach((s) => {
        if (typeof s === "object" && s !== null && "_id" in s) {
          const id = (s as any)._id
          if (id && !existingIds.has(id)) {
            options.push({ value: id, label: (s as any).label || (s as any).name || "Unknown Specialty" })
            existingIds.add(id)
          }
        }
      })
    }
    return options
  }, [specialties, doctor])

  // Define the two steps for the doctor form
  const doctorFormSteps: FormStep[] = useMemo(() => {
    const steps: FormStep[] = [
      {
        title: isEditMode ? "Edit Doctor" : "Add New Doctor",
        description: "Fill in the personal and address details below. All fields marked with * are required.",
        schema: step1FormSchema,
        fields: [
          // Profile Image Section
          { name: "profilePicture", label: "Profile Picture", type: "image-upload", required: false, gridClass: "col-span-2", section: "Personal Information", accept: "image/jpeg,image/gif,image/png", imageUploadMode: "avatar-click", maxFileSizeKb: 800 },
          // Personal Information Section
          { name: "firstName", label: "First Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
          { name: "lastName", label: "Last Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
          { name: "email", label: "Email", type: "email", required: true, gridClass: "col-span-1", section: "Personal Information" },
          { name: "mobile", label: "Phone Number", type: "phone", required: true, gridClass: "col-span-1", section: "Personal Information", showDialCode: true, countryCodeFieldName: "countryCode" },
          { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true, gridClass: "col-span-1", section: "Personal Information", minDate: doctorDobBounds.minDate, maxDate: doctorDobBounds.maxDate, showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select", dobRole: "doctor" },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ],
            gridClass: "col-span-1",
            section: "Personal Information"
          },
          {
            name: "clinics",
            label: "Clinic",
            type: "infinite-multi-select",
            required: true,
            onSearchChange: onClinicsSearchChange,
            onLoadMore: onClinicsLoadMore,
            hasNextPage: hasNextClinicsPage,
            isFetchingNextPage: isFetchingNextClinicsPage,
            isLoading: isClinicsLoading,
            options: clinicOptions,
            selectedOptions: (watchedValues: any) => {
              const selectedIds = Array.isArray(watchedValues.clinics) ? watchedValues.clinics : []
              return clinics
                .filter(c => selectedIds.includes(c._id))
                .map(c => ({ value: c._id, label: c.name }))
            },
            gridClass: "col-span-1",
            section: "Personal Information"
          },
          {
            name: "gender",
            label: "Gender",
            type: "radio",
            required: true,
            options: [
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ],
            gridClass: "col-span-1",
            section: "Personal Information"
          },
          // Address Information Section
          { name: "address", label: "Address", type: "textarea", required: false, rows: 3, section: "Other Information", gridClass: "col-span-1 md:col-span-2" },
          {
            name: "country",
            label: "Country",
            type: "country",
            section: "Other Information",
            gridClass: "col-span-1",
            required: false
          },
          {
            name: "state",
            label: "State",
            type: "state",
            section: "Other Information",
            gridClass: "col-span-1",
            countryFieldName: "country",
            required: false
          },
          {
            name: "city",
            label: "City",
            type: "city",
            section: "Other Information",
            gridClass: "col-span-1",
            countryFieldName: "country",
            stateFieldName: "state",
            required: false
          },
          { name: "postalCode", label: "Postal Code", type: "number", required: false, section: "Other Information", gridClass: "col-span-1" },
        ]
      },
      {
        title: "Doctor Professional Info",
        description: "Fill in the professional details below. All fields marked with * are required.",
        schema: step2FormSchema,
        fields: [
          { name: "signatureImage", label: "Signature", type: "image-upload", required: false, gridClass: "col-span-3", section: "Professional Information", accept: "image/jpeg,image/gif,image/png", imageUploadMode: "avatar-click", maxFileSizeKb: 800 },
          { name: "description", label: "Description/Biography", type: "textarea", required: false, gridClass: "col-span-3", section: "Professional Information" },
          {
            name: "specialties",
            label: "Specialization",
            type: "multi-select",
            required: true,
            options: specialtyOptions,
            gridClass: "col-span-1",
            section: "Professional Information"
          },
          { name: "experience", label: "Years of Experience", type: "number", required: false, gridClass: "col-span-1", section: "Professional Information" },
        ]
      }
    ]

    if (isClinicAdminOrReceptionist) {
      return steps.map(step => ({
        ...step,
        fields: step.fields.filter(field => field.name !== "clinics")
      }))
    }

    return steps
  }, [clinics, specialties, isClinicAdminOrReceptionist, isEditMode])

  return (
    <GenericFormDialog
      title={isEditMode ? "Edit Doctor" : "Add New Doctor"}
      description={
        isEditMode
          ? "Update the doctor details below. All fields marked with * are required."
          : undefined
      }
      triggerLabel={isEditMode ? "Edit Doctor" : "Add Doctor"}
      triggerDisabled={isSubmitting}
      trigger={trigger}
      formSchema={doctorFormSchema}
      steps={doctorFormSteps}
      defaultValues={defaultValues}
      onSubmit={isEditMode ? (onEditDoctor ?? onAddDoctor) : onAddDoctor}
      dialogSize="lg"
      showImageUpload={false}
      submitButtonText={isEditMode ? "Update Doctor" : "Save Doctor"}
      nextButtonText="Next"
      backButtonText="Back"
      cancelButtonText="Cancel"
      closeOnSubmit={true}
      enableSteps={true}
      triggerClassName="cursor-pointer bg-primary hover:bg-primary/90"
    />
  )
}
