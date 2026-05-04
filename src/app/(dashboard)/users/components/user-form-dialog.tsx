"use client"

import { createDobSchema, getDobDateBounds } from "@/components/common/DobDatePicker"
import { GenericFormDialog, FormFieldConfig } from "@/components/generic-form-dialog"
import { z } from "zod"

const patientDobSchema = createDobSchema("patient")
const patientDobBounds = getDobDateBounds("patient")

const patientFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  clinic: z.string().min(1, {
    message: "Please select a clinic.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  countryCode: z.string().min(1, {
    message: "Please select a country code.",
  }),
  mobile: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  dateOfBirth: patientDobSchema,
  status: z.string().min(1, {
    message: "Please select a status.",
  }),
  bloodGroup: z.string().optional(),
  gender: z.string().min(1, {
    message: "Please select a gender.",
  }),
  address: z.string().min(3, {
    message: "Address must be at least 3 characters.",
  }),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Postal code must contain numbers only.",
    }),
  profileImage: z.any().optional(),
})

type PatientFormValues = z.infer<typeof patientFormSchema>

interface PatientFormDialogProps {
  onAddPatient: (patient: PatientFormValues) => void
}

export function PatientFormDialog({ onAddPatient }: PatientFormDialogProps) {
  const fields: FormFieldConfig[] = [
    { name: "profileImage", label: "Profile", type: "image-upload", required: false, gridClass: "md:col-span-2", section: "Personal Information", accept: "image/jpeg,image/gif,image/png", imageUploadMode: "avatar-click", maxFileSizeKb: 800 },
    { name: "firstName", label: "First Name", type: "text", required: true, section: "Personal Information", gridClass: "col-span-1" },
    { name: "lastName", label: "Last Name", type: "text", required: true, section: "Personal Information", gridClass: "col-span-1" },
    { name: "email", label: "Email", type: "email", required: true, section: "Personal Information", gridClass: "col-span-1" },
    {
      name: "mobile",
      label: "Phone Number",
      type: "phone",
      required: true,
      section: "Personal Information",
      showDialCode: true,
      countryCodeFieldName: "countryCode",
      gridClass: "col-span-1",
    },
    { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true, section: "Personal Information", gridClass: "col-span-1", minDate: patientDobBounds.minDate, maxDate: patientDobBounds.maxDate, showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select", dobRole: "patient" },
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
    {
      name: "bloodGroup",
      label: "Blood Group",
      type: "select",
      section: "Personal Information",
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
    },
    {
      name: "gender",
      label: "Gender",
      type: "radio",
      required: true,
      section: "Personal Information",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
        { value: "Other", label: "Other" },
      ],
      gridClass: "col-span-1",
    },
    { name: "address", label: "Address", type: "textarea", required: true, rows: 3, section: "Other Information", gridClass: "col-span-1 md:col-span-2 lg:col-span-3" },
    { name: "city", label: "City", type: "text", section: "Other Information", gridClass: "col-span-1" },
    { name: "country", label: "Country", type: "text", section: "Other Information", gridClass: "col-span-1" },
    { name: "postalCode", label: "Postal Code", type: "number", section: "Other Information", gridClass: "col-span-1" },
  ]

  return (
    <GenericFormDialog
      title="Add New Patient"
      description="Fill in the patient details below. All fields marked with * are required."
      triggerLabel="Add Patient"
      formSchema={patientFormSchema}
      defaultValues={{
        firstName: "",
        lastName: "",
        clinic: "",
        email: "",
        countryCode: "",
        mobile: "",
        dateOfBirth: "",
        status: "Active",
        bloodGroup: "",
        gender: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
        profileImage: "",
      }}
      fields={fields}
      onSubmit={(data) => {
        onAddPatient(data)
      }}
      dialogSize="lg"
      showImageUpload
      imageUploadLabel="Patient"
      submitButtonText="Save Patient"
    />
  )
}
