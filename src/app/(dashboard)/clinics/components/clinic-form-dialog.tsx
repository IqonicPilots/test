"use client"

import { createDobSchema, getDobDateBounds } from "@/components/common/DobDatePicker"
import { GenericFormDialog, FormStep } from "@/components/generic-form-dialog"
import { Country, State } from "country-state-city"
import { z } from "zod"
import { useCreateClinic, useUpdateClinic } from "@/hooks/api/use-clinics"
import { useListingData } from "@/hooks/api/use-listings"
import type { Clinic } from "@/types/clinic.types"
import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { SystemConfig } from "@/types/system-config.types"
import { normalizeDialCountryCode } from "@/components/common/PhoneInputField"

const clinicAdminDobSchema = createDobSchema("clinic_admin")
const clinicAdminDobBounds = getDobDateBounds("clinic_admin")

const clinicFormSchema = z.object({
  // Clinic Basic Information
  profileImage: z.any().optional(),
  name: z.string().min(2, { message: "Clinic name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  contactNo: z.string().min(7, { message: "Please enter a valid contact number." }),
  contactNoCountryCode: z.string().optional(),
  status: z.string().min(1, { message: "Please select a status." }),
  clinicSpecialties: z.array(z.string()).min(1, { message: "Please select at least one speciality." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  city: z.string().min(2, { message: "City must be at least 2 characters." }),
  state: z.string().min(2, { message: "State must be at least 2 characters." }),
  country: z.string().min(2, { message: "Country must be at least 2 characters." }),
  postalCode: z
    .string()
    .min(3, { message: "Postal code must be at least 3 characters." })
    .regex(/^\d+$/, { message: "Postal code must contain numbers only." }),

  // Clinic Admin Information  
  adminProfileImage: z.any().optional(),
  adminFirstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  adminLastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  adminEmail: z.string().email({ message: "Please enter a valid admin email." }),
  adminMobile: z.string().min(7, { message: "Please enter a valid contact number." }),
  adminMobileCountryCode: z.string().optional(),
  adminDateOfBirth: clinicAdminDobSchema,
  adminGender: z.string().min(1, { message: "Please select a gender." }),
  adminAddress: z.string().optional(),
  adminCity: z.string().optional(),
  adminState: z.string().optional(),
  adminCountry: z.string().optional(),
  adminPostalCode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Postal code must contain numbers only.",
    }),
})

type ClinicFormValues = z.infer<typeof clinicFormSchema>

interface ClinicFormDialogProps {
  onAddClinic?: (clinic: ClinicFormValues) => void
  clinicToEdit?: Clinic | null
  trigger?: React.ReactNode
}

export function ClinicFormDialog({ onAddClinic, clinicToEdit, trigger }: ClinicFormDialogProps) {
  const queryClient = useQueryClient()
  const createClinicMutation = useCreateClinic()
  const updateClinicMutation = useUpdateClinic()
  const isEditing = !!clinicToEdit
  const { data: specialities = [], isLoading: loadingSpecialities } = useListingData("specialties", true)

  const systemDialFallback = () => {
    const cfg = queryClient.getQueryData<SystemConfig>(["system-config"])
    return normalizeDialCountryCode(cfg?.country_code) || "+1"
  }

  const handleCreateClinic = async (data: ClinicFormValues) => {
    const formData = new FormData()
    const clinicDial = data.contactNoCountryCode?.trim() || systemDialFallback()
    const adminDial = data.adminMobileCountryCode?.trim() || systemDialFallback()

    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('mobile', data.contactNo)
    formData.append('countryCode', clinicDial)
    formData.append('isActive', String(data.status === 'Active'))

    const countryName = data.country ?
      (Country.getCountryByCode(data.country)?.name || data.country) : ""
    const stateName = (data.country && data.state) ?
      (State.getStateByCodeAndCountry(data.state, data.country)?.name || data.state) : (data.state || "")

    formData.append('address[street]', data.address)
    formData.append('address[city]', data.city)
    formData.append('address[state]', stateName)
    formData.append('address[country]', countryName)
    formData.append('address[postalCode]', data.postalCode)

    formData.append('clinicAdmin[email]', data.adminEmail)
    formData.append('clinicAdmin[firstName]', data.adminFirstName)
    formData.append('clinicAdmin[lastName]', data.adminLastName)
    formData.append('clinicAdmin[mobile]', data.adminMobile)
    formData.append('clinicAdmin[countryCode]', adminDial)
    formData.append('clinicAdmin[dob]', data.adminDateOfBirth)
    formData.append('clinicAdmin[gender]', data.adminGender)

    if (data.adminAddress?.trim()) {
      formData.append('clinicAdmin[address][street]', data.adminAddress.trim())
    }
    if (data.adminCity?.trim()) {
      formData.append('clinicAdmin[address][city]', data.adminCity.trim())
    }
    const adminCountryName = data.adminCountry ?
      (Country.getCountryByCode(data.adminCountry)?.name || data.adminCountry) : ""
    const adminStateName = (data.adminCountry && data.adminState) ?
      (State.getStateByCodeAndCountry(data.adminState, data.adminCountry)?.name || data.adminState) : (data.adminState || "")

    if (adminStateName.trim()) {
      formData.append('clinicAdmin[address][state]', adminStateName.trim())
    }
    if (adminCountryName.trim()) {
      formData.append('clinicAdmin[address][country]', adminCountryName.trim())
    }
    if (data.adminPostalCode?.trim()) {
      formData.append('clinicAdmin[address][postalCode]', data.adminPostalCode.trim())
    }

    if (data.profileImage instanceof File) {
      formData.append('cliniclogo', data.profileImage)
    } else if (data.profileImage === "" || data.profileImage === null) {
      formData.append('cliniclogo', "")
    }

    if (data.adminProfileImage instanceof File) {
      formData.append('clinicAdmin[profilePicture]', data.adminProfileImage)
    } else if (data.adminProfileImage === "" || data.adminProfileImage === null) {
      formData.append('clinicAdmin[profilePicture]', "")
    }

    data.clinicSpecialties.forEach((specialityId, index) => {
      formData.append(`clinic_specialties[${index}]`, specialityId)
    })

    if (isEditing && clinicToEdit) {
      await updateClinicMutation.mutateAsync({ id: clinicToEdit._id, data: formData })
    } else {
      await createClinicMutation.mutateAsync(formData)
    }

    onAddClinic?.(data)
  }

  const steps: FormStep[] = [
    {
      title: isEditing ? "Edit Clinic" : "Add New Clinic",
      description: isEditing ? "Update clinic details below." : "Fill in the clinic details below. All fields marked with * are required.",
      fields: [
        { name: "profileImage", label: "Clinic Profile Picture / Logo", type: "image-upload", required: false, gridClass: "col-span-2", section: "Personal Information", accept: "image/jpeg,image/gif,image/png", imageUploadMode: "avatar-click", maxFileSizeKb: 800 },
        { name: "name", label: "Clinic Name", type: "text", required: true, section: "Personal Information" },
        { name: "email", label: "Clinic Email", type: "email", required: true, section: "Personal Information" },
        { name: "contactNo", label: "Phone Number", type: "phone", required: true, section: "Personal Information" },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ],
          section: "Personal Information",
        },
        {
          name: "clinicSpecialties",
          label: "Speciality",
          type: "multi-select",
          required: true,
          isLoading: loadingSpecialities,
          emptyText: "No specialities available",
          options: specialities.map(speciality => ({
            value: speciality._id,
            label: speciality.label
          })),
          section: "Personal Information"
        },
        { name: "address", label: "Address", type: "textarea", required: true, rows: 3, section: "Personal Information", gridClass: "col-span-1 md:col-span-2" },
        {
          name: "country",
          label: "Country",
          type: "country",
          required: true,
          section: "Personal Information",
          gridClass: "col-span-1"
        },
        {
          name: "state",
          label: "State",
          type: "state",
          required: true,
          section: "Personal Information",
          gridClass: "col-span-1",
          countryFieldName: "country"
        },
        {
          name: "city",
          label: "City",
          type: "city",
          required: true,
          section: "Personal Information",
          gridClass: "col-span-1",
          countryFieldName: "country",
          stateFieldName: "state"
        },
        { name: "postalCode", label: "Postal Code", type: "number", required: true, section: "Personal Information", gridClass: "col-span-1" },
      ]
    },
    {
      title: "Clinic Admin Information",
      description: "Fill in the clinic admin details below. All fields marked with * are required.",
      fields: [
        { name: "adminProfileImage", label: "Admin", type: "image-upload", required: false, gridClass: "col-span-2", section: "Personal Information", accept: "image/jpeg,image/gif,image/png", imageUploadMode: "avatar-click", maxFileSizeKb: 800 },
        { name: "adminFirstName", label: "First Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
        { name: "adminLastName", label: "Last Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
        { name: "adminEmail", label: "Email", type: "email", required: true, gridClass: "col-span-1", section: "Personal Information" },
        { name: "adminMobile", label: "Phone Number", type: "phone", required: true, gridClass: "col-span-1", section: "Personal Information", showDialCode: true },
        { name: "adminDateOfBirth", label: "Date of Birth", type: "date", required: true, gridClass: "col-span-1", section: "Personal Information", minDate: clinicAdminDobBounds.minDate, maxDate: clinicAdminDobBounds.maxDate, showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select", dobRole: "clinic_admin" },
        {
          name: "adminGender",
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
        { name: "adminAddress", label: "Address", type: "textarea", required: false, rows: 3, section: "Other Information", gridClass: "col-span-1 md:col-span-2" },
        {
          name: "adminCountry",
          label: "Country",
          type: "country",
          required: false,
          section: "Other Information",
          gridClass: "col-span-1"
        },
        {
          name: "adminState",
          label: "State",
          type: "state",
          required: false,
          section: "Other Information",
          gridClass: "col-span-1",
          countryFieldName: "adminCountry"
        },
        {
          name: "adminCity",
          label: "City",
          type: "city",
          required: false,
          section: "Other Information",
          gridClass: "col-span-1",
          countryFieldName: "adminCountry",
          stateFieldName: "adminState"
        },
        { name: "adminPostalCode", label: "Postal Code", type: "number", required: false, section: "Other Information", gridClass: "col-span-1" },
      ]
    }
  ]

  return (
    <GenericFormDialog
      key={clinicToEdit?._id || "new"}
      title={isEditing ? "Edit Clinic" : "Add New Clinic"}
      description="Fill in the clinic details below. All fields marked with * are required."
      triggerLabel={isEditing ? "Edit Clinic" : "Add Clinic"}
      trigger={trigger}
      formSchema={clinicFormSchema}
      defaultValues={{
        profileImage: clinicToEdit?.cliniclogo || "",
        name: clinicToEdit?.name || "",
        email: clinicToEdit?.email || "",
        contactNo: clinicToEdit?.mobile || "",
        contactNoCountryCode: clinicToEdit?.countryCode || "",
        status: clinicToEdit?.isActive === false ? "Inactive" : "Active",
        clinicSpecialties: clinicToEdit?.specialties?.map((speciality) => speciality?._id).filter(Boolean) || [],
        address: clinicToEdit?.address?.street || "",
        city: clinicToEdit?.address?.city || "",
        state: (clinicToEdit?.address?.state && clinicToEdit?.address?.state.length > 2 && clinicToEdit?.address?.country) ?
          (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name === clinicToEdit.address?.country || c.isoCode === clinicToEdit.address?.country)?.isoCode || "").find(s => s.name === clinicToEdit.address?.state)?.isoCode || clinicToEdit.address?.state) : (clinicToEdit?.address?.state ?? ""),
        country: (clinicToEdit?.address?.country && clinicToEdit?.address?.country.length > 2) ?
          (Country.getAllCountries().find(c => c.name === clinicToEdit.address?.country)?.isoCode || clinicToEdit.address?.country) : (clinicToEdit?.address?.country ?? ""),
        postalCode: clinicToEdit?.address?.postalCode || "",
        adminProfileImage: clinicToEdit?.clinicAdmin?.meta?.profilePicture || "",
        adminFirstName: clinicToEdit?.clinicAdmin?.firstName || "",
        adminLastName: clinicToEdit?.clinicAdmin?.lastName || "",
        adminEmail: clinicToEdit?.clinicAdmin?.email || "",
        adminMobile: clinicToEdit?.clinicAdmin?.mobile || "",
        adminMobileCountryCode:
          clinicToEdit?.clinicAdmin?.countryCode || clinicToEdit?.countryCode || "",
        adminDateOfBirth: (clinicToEdit?.clinicAdmin?.meta?.dob || (clinicToEdit?.clinicAdmin as any)?.dob)
          ? String(clinicToEdit?.clinicAdmin?.meta?.dob || (clinicToEdit?.clinicAdmin as any)?.dob).split('T')[0]
          : "",
        adminGender: clinicToEdit?.clinicAdmin?.meta?.gender || (clinicToEdit?.clinicAdmin as any)?.gender || "Male",
        adminAddress: clinicToEdit?.clinicAdmin?.meta?.address?.street || "",
        adminCity: clinicToEdit?.clinicAdmin?.meta?.address?.city || "",
        adminState: (clinicToEdit?.clinicAdmin?.meta?.address?.state && clinicToEdit?.clinicAdmin?.meta?.address?.state.length > 2 && clinicToEdit?.clinicAdmin?.meta?.address?.country) ?
          (State.getStatesOfCountry(Country.getAllCountries().find(c => c.name === clinicToEdit.clinicAdmin.meta?.address?.country || c.isoCode === clinicToEdit.clinicAdmin.meta?.address?.country)?.isoCode || "").find(s => s.name === clinicToEdit.clinicAdmin.meta?.address?.state)?.isoCode || clinicToEdit.clinicAdmin.meta?.address?.state) : (clinicToEdit?.clinicAdmin?.meta?.address?.state ?? ""),
        adminCountry: (clinicToEdit?.clinicAdmin?.meta?.address?.country && clinicToEdit?.clinicAdmin?.meta?.address?.country.length > 2) ?
          (Country.getAllCountries().find(c => c.name === clinicToEdit.clinicAdmin.meta?.address?.country)?.isoCode || clinicToEdit.clinicAdmin.meta?.address?.country) : (clinicToEdit?.clinicAdmin?.meta?.address?.country ?? ""),
        adminPostalCode: clinicToEdit?.clinicAdmin?.meta?.address?.postalCode || "",
      }}
      steps={steps}
      enableSteps={true}
      onSubmit={handleCreateClinic}
      dialogSize="lg"
      submitButtonText={isEditing ? "Update Clinic" : "Save Clinic"}
    />
  )
}
