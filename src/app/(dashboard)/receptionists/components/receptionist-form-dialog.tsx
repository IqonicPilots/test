"use client"

import { createDobSchema, getDobDateBounds } from "@/components/common/DobDatePicker"
import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { Country, State } from "country-state-city"
import type { Clinic } from "@/types/clinic.types"
import type { Receptionist } from "@/types/user.types"
import { z } from "zod"
import { useMemo } from "react"
import { useProfile } from "@/hooks/api/use-profile"

const receptionistDobSchema = createDobSchema("receptionist")
const receptionistDobBounds = getDobDateBounds("receptionist")

const receptionistFormSchema = z.object({
  profileImage: z.any().nullable().optional(),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobile: z.string().min(7, { message: "Please enter a valid phone number." }),
  countryCode: z.string().min(1, { message: "Country code is required." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
  dateOfBirth: receptionistDobSchema,
  clinicId: z.string().min(1, { message: "Please select a clinic." }),
  status: z.string().min(1, { message: "Please select a status." }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Postal code must contain numbers only.",
    }),
})

export type ReceptionistFormValues = z.infer<typeof receptionistFormSchema>

interface ReceptionistFormDialogProps {
  onSubmit: (receptionist: ReceptionistFormValues) => void | Promise<void>
  clinics: Clinic[]
  receptionist?: Receptionist | null
  mode?: "create" | "edit"
  isSubmitting?: boolean
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
}

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

function getDateValue(value?: string) {
  if (!value) {
    return ""
  }

  return value.split("T")[0] ?? value
}

function getReceptionistFormDefaults(receptionist?: Receptionist | null): ReceptionistFormValues {
  const address = receptionist?.meta?.address
  const addressObject = typeof address === "object" && address !== null ? address : undefined

  return {
    profileImage: receptionist?.meta?.profilePicture ?? receptionist?.meta?.avatar ?? null,
    firstName: receptionist?.firstName ?? "",
    lastName: receptionist?.lastName ?? "",
    email: receptionist?.email ?? "",
    mobile: receptionist?.mobile ?? "",
    countryCode: receptionist?.countryCode ?? "",
    gender: receptionist?.meta?.gender ?? "",
    dateOfBirth: getDateValue(receptionist?.meta?.dob),
    clinicId: getReferenceId(receptionist?.meta?.clinics?.[0]),
    status: receptionist?.isActive === false ? "Inactive" : "Active",
    address:
      typeof address === "string"
        ? address
        : addressObject?.street ?? "",
    city: addressObject?.city ?? "",
    state: (addressObject?.state && addressObject?.state.length > 2 && addressObject?.country) ?
      (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name === addressObject.country || c.isoCode === addressObject.country)?.isoCode || "").find(s => s.name === addressObject.state)?.isoCode || addressObject.state) : (addressObject?.state ?? ""),
    country: (addressObject?.country && addressObject?.country.length > 2) ?
      (Country.getAllCountries().find(c => c.name === addressObject.country)?.isoCode || addressObject.country) : (addressObject?.country ?? ""),
    postalCode: addressObject?.postalCode ?? "",
  }
}

export function ReceptionistFormDialog({
  onSubmit,
  clinics,
  receptionist,
  mode = "create",
  isSubmitting = false,
  trigger,
  open,
  onOpenChange,
  hideTrigger = false,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
}: ReceptionistFormDialogProps) {
  const { data: profile } = useProfile()
  const role = profile?.role

  const assignedClinicId = useMemo(() => {
    const firstClinic = profile?.meta?.clinics?.[0]
    if (!firstClinic) return ""
    return typeof firstClinic === "string" ? firstClinic : firstClinic._id
  }, [profile])

  const isClinicAdmin = role === "clinic_admin"

  const defaultValues = useMemo(() => {
    const defaults = getReceptionistFormDefaults(receptionist)
    if (mode === "create" && isClinicAdmin && assignedClinicId) {
      defaults.clinicId = assignedClinicId
    }
    return defaults
  }, [receptionist, mode, isClinicAdmin, assignedClinicId])

  const isEditMode = mode === "edit"

  // Memoize aggregated clinic options to ensure the currently assigned clinic is always visible
  const clinicOptions = useMemo(() => {
    const existingIds = new Set(clinics.map((c) => c._id))
    const options = clinics.map((c) => ({ value: c._id, label: c.name }))

    const assignedClinic = receptionist?.meta?.clinics?.[0]
    if (assignedClinic && typeof assignedClinic === "object" && "_id" in assignedClinic) {
      const id = (assignedClinic as any)._id
      if (id && !existingIds.has(id)) {
        options.push({ value: id, label: (assignedClinic as any).name || "Unknown Clinic" })
        existingIds.add(id)
      }
    }
    return options
  }, [clinics, receptionist])

  const fields: FormFieldConfig[] = useMemo(() => {
    const allFields: FormFieldConfig[] = [
      {
        name: "profileImage",
        label: "Profile Picture",
        type: "image-upload",
        required: false,
        gridClass: "col-span-2",
        section: "Personal Information",
        accept: "image/jpeg,image/gif,image/png",
        imageUploadMode: "avatar-click",
        maxFileSizeKb: 800,
      },
      { name: "firstName", label: "First Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
      { name: "lastName", label: "Last Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
      { name: "email", label: "Email", type: "email", required: true, gridClass: "col-span-1", section: "Personal Information" },
      {
        name: "mobile",
        label: "Phone Number",
        type: "phone",
        required: true,
        gridClass: "col-span-1",
        section: "Personal Information",
        countryCodeFieldName: "countryCode",
      },
      {
        name: "clinicId",
        label: "Clinic Name",
        type: "infinite-select",
        required: true,
        options: clinicOptions,
        gridClass: "col-span-1",
        section: "Personal Information",
        onLoadMore: onClinicsLoadMore,
        onSearchChange: onClinicsSearchChange,
        hasNextPage: hasNextClinicsPage,
        isFetchingNextPage: isFetchingNextClinicsPage,
        isLoading: isClinicsLoading,
        selectedOptions: (watchedValues: any) => {
          const id = watchedValues.clinicId
          if (!id) return []
          const label = clinicOptions.find(opt => opt.value === id)?.label || "Selected Clinic"
          return [{ value: id, label }]
        }
      },
      {
        name: "dateOfBirth",
        label: "Date of Birth",
        type: "date",
        required: true,
        gridClass: "col-span-1",
        section: "Personal Information",
        minDate: receptionistDobBounds.minDate,
        maxDate: receptionistDobBounds.maxDate,
        showMonthDropdown: true,
        showYearDropdown: true,
        dropdownMode: "select",
        dobRole: "receptionist",
      },
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
        section: "Personal Information",
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
        section: "Personal Information",
      },
      {
        name: "address",
        label: "Address",
        type: "textarea",
        required: false,
        rows: 3,
        section: "Other Information",
        gridClass: "col-span-1 md:col-span-2",
      },
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
    ]

    if (isClinicAdmin) {
      return allFields.filter(field => field.name !== "clinicId")
    }

    return allFields
  }, [clinics, isClinicAdmin])

  return (
    <GenericFormDialog
      title={isEditMode ? "Edit Receptionist" : "Add New Receptionist"}
      description="Fill in the receptionist details below. All fields marked with * are required."
      triggerLabel={isEditMode ? "Edit Receptionist" : "Add Receptionist"}
      triggerDisabled={isSubmitting}
      trigger={trigger}
      formSchema={receptionistFormSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={onSubmit}
      dialogSize="lg"
      submitButtonText={isEditMode ? "Update Receptionist" : "Save Receptionist"}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger={hideTrigger}
    />
  )
}
