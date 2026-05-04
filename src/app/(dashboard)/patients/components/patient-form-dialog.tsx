"use client"

import { createDobSchema, getDobDateBounds } from "@/components/common/DobDatePicker"
import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { Country, State } from "country-state-city"
import type { Patient } from "@/types/user.types"
import { z } from "zod"

const patientDobSchema = createDobSchema("patient")
const patientDobBounds = getDobDateBounds("patient")

const patientFormSchema = z.object({
  profilePicture: z.any().nullable().optional(),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobile: z.string().min(7, { message: "Please enter a valid phone number." }),
  countryCode: z.string().min(1, { message: "Country code is required." }),
  dateOfBirth: patientDobSchema,
  gender: z.string().min(1, { message: "Please select a gender." }),
  bloodGroup: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.string().min(1, { message: "Please select a status." }),
})

export type PatientFormValues = z.infer<typeof patientFormSchema>

interface PatientFormDialogProps {
  onSubmit: (patient: PatientFormValues) => void | Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  patient?: Patient | null
  isSubmitting?: boolean
  trigger?: React.ReactNode
  hideTrigger?: boolean
}

function getDateValue(value?: string) {
  if (!value) {
    return ""
  }

  return value.split("T")[0] ?? value
}

function getPatientFormDefaults(patient?: Patient | null): PatientFormValues {
  const address = patient?.meta?.address

  return {
    profilePicture: patient?.meta?.profilePicture ?? patient?.meta?.avatar ?? null,
    firstName: patient?.firstName ?? "",
    lastName: patient?.lastName ?? "",
    email: patient?.email ?? "",
    mobile: patient?.mobile ?? "",
    countryCode: patient?.countryCode ?? "",
    dateOfBirth: getDateValue(patient?.meta?.dob),
    gender: patient?.meta?.gender ?? "",
    bloodGroup: patient?.meta?.bloodGroup ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: (address?.state && address.state.trim().length > 2 && address.country) ?
      (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name.toLowerCase() === address.country?.trim().toLowerCase() || c.isoCode === address.country?.trim())?.isoCode || "").find(s => s.name.toLowerCase() === address.state?.trim().toLowerCase())?.isoCode || address.state.trim()) : (address?.state?.trim() ?? ""),
    country: (address?.country && address.country.trim().length > 2) ?
      (Country.getAllCountries().find(c => c.name.toLowerCase() === address.country?.trim().toLowerCase())?.isoCode || address.country?.trim()) : (address?.country?.trim() ?? ""),
    postalCode: address?.postalCode ?? "",
    status: patient?.isActive === false ? "Inactive" : "Active",
  }
}

export function PatientFormDialog({
  onSubmit,
  open,
  onOpenChange,
  mode,
  patient,
  isSubmitting = false,
  trigger,
  hideTrigger = false,
}: PatientFormDialogProps) {
  const isEditMode = mode === "edit"

  const fields: FormFieldConfig[] = [
    {
      name: "profilePicture",
      label: "Profile Picture",
      type: "image-upload",
      required: false,
      gridClass: "md:col-span-2",
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
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
      gridClass: "col-span-1",
      section: "Personal Information",
      minDate: patientDobBounds.minDate,
      maxDate: patientDobBounds.maxDate,
      showMonthDropdown: true,
      showYearDropdown: true,
      dropdownMode: "select",
      dobRole: "patient",
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
      name: "bloodGroup",
      label: "Blood Group",
      type: "select",
      options: [
        { value: "A+", label: "A+" },
        { value: "A-", label: "A-" },
        { value: "B+", label: "B+" },
        { value: "B-", label: "B-" },
        { value: "AB+", label: "AB+" },
        { value: "AB-", label: "AB-" },
        { value: "O+", label: "O+" },
        { value: "O-", label: "O-" },
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
      name: "street",
      label: "Address",
      type: "textarea",
      rows: 3,
      section: "Other Information",
      gridClass: "md:col-span-2",
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
    { name: "postalCode", label: "Postal Code", type: "number", section: "Other Information", gridClass: "col-span-1" },
  ]

  return (
    <GenericFormDialog
      title={isEditMode ? "Edit Patient" : "Add New Patient"}
      description="Fill in the patient details below. All fields marked with * are required."
      triggerLabel={isEditMode ? "Edit Patient" : "Add Patient"}
      triggerDisabled={isSubmitting}
      trigger={trigger}
      formSchema={patientFormSchema}
      defaultValues={getPatientFormDefaults(patient)}
      fields={fields}
      onSubmit={onSubmit}
      dialogSize="lg"
      submitButtonText={isEditMode ? "Update Patient" : "Save Patient"}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger={hideTrigger}
    />
  )
}
