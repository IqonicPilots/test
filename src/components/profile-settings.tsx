"use client"

import * as React from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { City, Country, State } from "country-state-city"

import { DobDatePicker, type DobRole, createDobSchema } from "@/components/common/DobDatePicker"
import { ImageUploader } from "@/components/common/ImageUploader"
import { PhoneInputField } from "@/components/common/PhoneInputField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useProfile, useUpdateProfile } from "@/hooks/api/use-profile"
import { useClinics } from "@/hooks/api/use-clinics"
import { useSpecialties } from "@/hooks/api/use-listings"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"
import type { ProfileAddress, UserProfile } from "@/types/user.types"
import { getStoredAuthSession, saveAuthSession } from "@/lib/auth-session"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"


const phoneRegex = /^[0-9]+$/

const baseAccountSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  mobile: z.string().optional(),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional().refine((val) => !val || /^\d+$/.test(val), {
    message: "Postal code must contain numbers only.",
  }),
  specialties: z.array(z.string()).optional(),
  clinics: z.array(z.string()).optional(),
})

function getAccountValidationSchema(role: string) {
  const doctorDobSchema = createDobSchema("doctor")
  const patientDobSchema = createDobSchema("patient")
  const receptionistDobSchema = createDobSchema("receptionist")

  const doctorAccountSchema = baseAccountSchema.extend({
    mobile: z
      .string()
      .trim()
      .min(7, { message: "Please enter a valid phone number." })
      .regex(phoneRegex, { message: "Phone number must contain digits only." }),
    countryCode: z.string().min(1, { message: "Country code is required." }),
    dob: doctorDobSchema,
    clinics: z.array(z.string()).min(1, { message: "Please select at least one clinic." }),
    gender: z.string().min(1, { message: "Please select a gender." }),
  })

  const patientAccountSchema = baseAccountSchema.extend({
    mobile: z.string().min(7, { message: "Please enter a valid phone number." }),
    countryCode: z.string().min(1, { message: "Country code is required." }),
    dob: patientDobSchema,
    gender: z.string().min(1, { message: "Please select a gender." }),
  })

  const receptionistAccountSchema = baseAccountSchema.extend({
    mobile: z.string().min(7, { message: "Please enter a valid phone number." }),
    countryCode: z.string().min(1, { message: "Country code is required." }),
    clinics: z.array(z.string()).min(1, { message: "Please select a clinic." }),
    dob: receptionistDobSchema,
    gender: z.string().min(1, { message: "Please select a gender." }),
  })

  const clinicAdminAccountSchema = baseAccountSchema.extend({
    mobile: z.string().min(7, { message: "Please enter a valid phone number." }),
    countryCode: z.string().min(1, { message: "Country code is required." }),
    dob: patientDobSchema,
    gender: z.string().min(1, { message: "Please select a gender." }),
  })

  const adminAccountSchema = baseAccountSchema

  switch (role) {
    case "doctor":
      return doctorAccountSchema
    case "patient":
      return patientAccountSchema
    case "receptionist":
      return receptionistAccountSchema
    case "clinic_admin":
      return clinicAdminAccountSchema
    case "admin":
      return adminAccountSchema
    default:
      return baseAccountSchema
  }
}

type ProfileFormState = z.infer<typeof baseAccountSchema>

const INITIAL_FORM: ProfileFormState = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  countryCode: "",
  gender: "",
  dob: "",
  bloodGroup: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  specialties: [],
  clinics: [],
}

const DOB_ROLES = new Set<DobRole>(["doctor", "patient", "receptionist", "clinic_admin", "admin"])

function getSpecialtyId(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id
    return typeof id === "string" ? id : ""
  }

  return ""
}

function addressToLocationFormValues(address?: ProfileAddress | null, meta?: any) {
  const countryRaw = (address?.country ?? meta?.country ?? "").trim()
  const stateRaw = (address?.state ?? meta?.state ?? "").trim()

  const allCountries = Country.getAllCountries()
  
  // Find country ISO code
  const countryIso =
    countryRaw && countryRaw.length > 2
      ? allCountries.find(
          (c) => c.name.toLowerCase() === countryRaw.toLowerCase()
        )?.isoCode ?? countryRaw
      : countryRaw.toUpperCase() || ""

  // Ensure we have the correct ISO code for state lookup
  const countryForStates =
    allCountries.find(
      (c) =>
        c.isoCode === countryIso ||
        c.name.toLowerCase() === countryRaw.toLowerCase()
    )?.isoCode ?? countryIso

  // Find state ISO code
  const stateIso =
    stateRaw && stateRaw.length > 2 && countryForStates
      ? State.getStatesOfCountry(countryForStates).find(
          (s) => s.name.toLowerCase() === stateRaw.toLowerCase()
        )?.isoCode ?? stateRaw
      : stateRaw.toUpperCase() || ""

  const res = {
    city: address?.city ?? meta?.city ?? "",
    state: stateIso,
    country: countryIso,
    postalCode: address?.postalCode ?? meta?.postalCode ?? "",
  }
  
  console.log("addressToLocationFormValues input:", { address, meta }, "output:", res)
  return res
}

function getProfileDefaults(profile: UserProfile): ProfileFormState {
  const address = profile.meta?.address
  const loc = addressToLocationFormValues(address, profile.meta)

  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
    mobile: profile.mobile ?? "",
    countryCode: profile.countryCode ?? "",
    gender: profile.meta?.gender ?? "",
    dob: profile.meta?.dob ? profile.meta.dob.split("T")[0] ?? profile.meta.dob : "",
    bloodGroup: (profile.meta?.bloodGroup ?? "").trim(),
    description: profile.meta?.description ?? "",
    address: address?.street ?? profile.meta?.addressLine1 ?? "",
    city: loc.city,
    state: loc.state,
    country: loc.country,
    postalCode: loc.postalCode,
    specialties: profile.meta?.specialties?.map(getSpecialtyId).filter(Boolean) ?? [],
    clinics: profile.meta?.clinics?.map((c: any) => {
      if (typeof c === "string") return c
      if (typeof c === "object" && c !== null) {
        return (c._id || c).toString()
      }
      return ""
    }).filter(Boolean) ?? [],
  }
}

function updateStoredSession(profile: UserProfile) {
  const storedSession = getStoredAuthSession()

  if (!storedSession) {
    return
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim()

  saveAuthSession({
    ...storedSession,
    user: {
      ...storedSession.user,
      name: fullName || storedSession.user.name,
      email: profile.email || storedSession.user.email,
      role: profile.role || storedSession.user.role,
      avatar:
        profile.meta?.profilePicture ?? profile.meta?.avatar ?? "",
    },
  })
}

export function ProfileSettings() {
  const { data: profile, isLoading, isError, error } = useProfile()
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinics(1, 100, true, { isActive: true })
  const clinics = clinicsData?.data ?? []
  const { data: specialties = [] } = useSpecialties()
  const role = profile?.role ?? "patient"
  const updateProfileMutation = useUpdateProfile()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormState>({
    resolver: zodResolver(getAccountValidationSchema(role)),
    defaultValues: INITIAL_FORM,
  })

  const [profilePictureValue, setProfilePictureValue] = React.useState<File | string | null>(null)
  const [signatureImageValue, setSignatureImageValue] = React.useState<File | string | null>(null)

  // Sync profile to form state during render to prevent race conditions in children
  const syncedProfileIdRef = React.useRef<string | null>(null)
  if (profile && profile._id !== syncedProfileIdRef.current) {
    const defaults = getProfileDefaults(profile)
    reset(defaults)
    setProfilePictureValue(profile.meta?.profilePicture ?? profile.meta?.avatar ?? "")
    setSignatureImageValue(profile.meta?.signature ?? "")
    syncedProfileIdRef.current = profile._id
  }

  // Watch fields for dependent calculations (like states/cities)
 watch("country")
 watch("state")
 watch("clinics")
 watch("specialties")

  const formValues = watch()
  const showMobile = role === "doctor" || role === "patient" || role === "receptionist" || role === "clinic_admin"
  const showAddress = role === "doctor" || role === "patient" || role === "receptionist" || role === "clinic_admin"
  const showGender = role === "doctor" || role === "patient" || role === "receptionist" || role === "clinic_admin"
  const showDob = role === "doctor" || role === "patient" || role === "receptionist" || role === "clinic_admin"
  const showBloodGroup = role === "patient"
  const showDescription = role === "doctor"
  const showSpecialties = role === "doctor"
  const showSignature = role === "doctor"
  const showClinic = role === "clinic_admin" || role === "doctor" || role === "receptionist"
  const dobRole: DobRole = role && DOB_ROLES.has(role as DobRole) ? (role as DobRole) : "patient"

  const countryOptions = React.useMemo(() => {
    const countries = Country.getAllCountries()
      .map((c) => ({ value: c.isoCode, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
    console.log("countryOptions re-computed, count:", countries.length)
    return countries
  }, [])

  const stateOptions = React.useMemo(() => {
    if (!formValues.country) {
      return []
    }
    const states = State.getStatesOfCountry(formValues.country).map((s) => ({
      value: s.isoCode,
      label: s.name,
    }))
    console.log("stateOptions re-computed for:", formValues.country, "count:", states.length)
    return states
  }, [formValues.country])

  const cityOptions = React.useMemo(() => {
    if (!formValues.country || !formValues.state) {
      return []
    }
    return City.getCitiesOfState(formValues.country, formValues.state).map((c) => ({
      value: c.name,
      label: c.name,
    }))
  }, [formValues.country, formValues.state])

  async function onFormSubmit(values: ProfileFormState) {
    if (!profile) return

    const formData = new FormData()
    formData.append("firstName", values.firstName.trim())
    formData.append("lastName", values.lastName.trim())
    formData.append("email", values.email.trim().toLowerCase())

    if (showMobile) {
      if (values.mobile?.trim()) {
        formData.append("mobile", values.mobile.trim())
      }
      if (values.countryCode?.trim()) {
        formData.append("countryCode", values.countryCode.trim().toUpperCase())
      }
    }

    if (showGender && values.gender) {
      formData.append("gender", values.gender)
    }

    if (showDob && values.dob) {
      formData.append("dob", values.dob)
    }

    if (showBloodGroup && values.bloodGroup?.trim()) {
      formData.append("bloodGroup", values.bloodGroup.trim())
    }

    if (showDescription && values.description?.trim()) {
      formData.append("description", values.description.trim())
    }

    if (showAddress) {
      if (values.address?.trim()) {
        formData.append("address", values.address.trim())
      }
      if (values.city?.trim()) {
        formData.append("city", values.city.trim())
      }
      const countryName = values.country
        ? Country.getCountryByCode(values.country)?.name || values.country
        : ""
      const stateName =
        values.country && values.state
          ? State.getStateByCodeAndCountry(values.state, values.country)?.name ||
            values.state
          : values.state || ""
      if (stateName.trim()) {
        formData.append("state", stateName.trim())
      }
      if (countryName.trim()) {
        formData.append("country", countryName.trim())
      }
      if (values.postalCode?.trim()) {
        formData.append("postalCode", values.postalCode.trim())
      }
    }

    if (showSpecialties && values.specialties && values.specialties.length > 0) {
      values.specialties.forEach((specialtyId, index) => {
        formData.append(`specialties[${index}]`, specialtyId)
      })
    }
    
    if (showClinic && values.clinics && values.clinics.length > 0) {
      values.clinics.forEach((clinicId, index) => {
        formData.append(`clinics[${index}]`, clinicId)
      })
    }

    if (profilePictureValue instanceof File) {
      formData.append("profilePicture", profilePictureValue)
    } else if (profilePictureValue === "" || profilePictureValue === null) {
      formData.append("profilePicture", "")
    }

    if (showSignature) {
      if (signatureImageValue instanceof File) {
        formData.append("signatureImage", signatureImageValue)
      } else if (signatureImageValue === "" || signatureImageValue === null) {
        formData.append("signatureImage", "")
      }
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: (updatedProfile) => {
        updateStoredSession(updatedProfile)
        const defaults = getProfileDefaults(updatedProfile)
        reset(defaults)
        setProfilePictureValue(
          updatedProfile.meta?.profilePicture ?? updatedProfile.meta?.avatar ?? ""
        )
        setSignatureImageValue(updatedProfile.meta?.signature ?? "")
        toast.success("Profile updated successfully")
      },
    })
  }

  function handleReset() {
    if (!profile) return
    reset(getProfileDefaults(profile))
    setProfilePictureValue(profile.meta?.profilePicture ?? profile.meta?.avatar ?? "")
    setSignatureImageValue(profile.meta?.signature ?? "")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {error?.message || "Unable to load profile."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <ImageUploader
            label="Profile Picture"
            value={profilePictureValue}
            onChange={(value) => setProfilePictureValue(value)}
            onError={(message) => toast.error(message)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            {...register("firstName")}
            className={cn(errors.firstName && "border-destructive")}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            {...register("lastName")}
            className={cn(errors.lastName && "border-destructive")}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className={cn(errors.email && "border-destructive")}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {showMobile ? (
          <div className="space-y-2">
            <Label htmlFor="mobile">
              Phone Number{" "}
              {(role as string) !== "admin" && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              name="mobile"
              control={control}
              render={({ field }) => (
                <PhoneInputField
                  value={{
                    countryCode: formValues.countryCode || "",
                    mobile: field.value || "",
                  }}
                  onChange={(value) => {
                    field.onChange(value.mobile)
                    setValue("countryCode", value.countryCode, { shouldValidate: true })
                  }}
                  disabled={updateProfileMutation.isPending}
                  className={cn(errors.mobile && "border-destructive")}
                />
              )}
            />
            {errors.mobile && (
              <p className="text-xs text-destructive">{errors.mobile.message}</p>
            )}
          </div>
        ) : null}

        {showDob ? (
          <div className="space-y-2">
            <Label>
              Date of Birth{" "}
              {(role as string) !== "admin" && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              name="dob"
              control={control}
              render={({ field }) => (
                <DobDatePicker
                  role={dobRole}
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  placeholder="Select date"
                  className={cn("w-full", errors.dob && "border-destructive")}
                />
              )}
            />
            {errors.dob && (
              <p className="text-xs text-destructive">{errors.dob.message}</p>
            )}
          </div>
        ) : null}

        {showBloodGroup ? (
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Controller
              name="bloodGroup"
              control={control}
              render={({ field }) => (
                <Select
                  key={field.value || "empty"}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="bloodGroup" className={cn("w-full cursor-pointer", errors.bloodGroup && "border-destructive")}>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.bloodGroup && (
              <p className="text-xs text-destructive">{errors.bloodGroup.message}</p>
            )}
          </div>
        ) : null}

        {showGender ? (
          <div className="space-y-2">
            <Label>
              Gender {(role as string) !== "admin" && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex min-h-10 flex-wrap gap-4 sm:gap-6"
                >
                  {["Male", "Female", "Other"].map((option) => (
                    <div key={option} className="flex items-center space-x-3">
                      <RadioGroupItem value={option} id={`gender-${option}`} className="h-5 w-5" />
                      <label
                        htmlFor={`gender-${option}`}
                        className="cursor-pointer select-none text-sm font-medium"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors.gender && (
              <p className="text-xs text-destructive">{errors.gender.message}</p>
            )}
          </div>
        ) : null}

        {showClinic ? (
          <div className="space-y-2">
            <Label htmlFor="clinics">
              Clinic{" "}
              {(role === "doctor" || role === "receptionist") && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            {role === "doctor" ? (
              <Controller
                name="clinics"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={clinics.map((c) => ({ label: c.name, value: c._id }))}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder={isLoadingClinics ? "Loading clinics..." : "Choose your clinics"}
                    disabled={isLoadingClinics || updateProfileMutation.isPending}
                    className={cn(errors.clinics && "border-destructive")}
                  />
                )}
              />
            ) : (
              <Controller
                name="clinics"
                control={control}
                render={({ field }) => (
                  <Select
                    key={field.value?.[0] || "unassigned"}
                    value={field.value?.[0] || ""}
                    onValueChange={(value) => field.onChange([value])}
                    disabled={isLoadingClinics || updateProfileMutation.isPending}
                  >
                    <SelectTrigger className={cn("w-full cursor-pointer", errors.clinics && "border-destructive")}>
                      <SelectValue
                        placeholder={isLoadingClinics ? "Loading clinics..." : "Choose your clinic"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic._id} value={clinic._id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.clinics && (
              <p className="text-xs text-destructive">{errors.clinics.message}</p>
            )}
          </div>
        ) : null}

        {showAddress ? (
          <>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                className={cn(errors.address && "border-destructive")}
                placeholder="Enter your address"
                rows={3}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-country">Country</Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select
                    key={field.value || "empty-country"}
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setValue("state", "", { shouldValidate: true })
                      setValue("city", "", { shouldValidate: true })
                    }}
                    disabled={updateProfileMutation.isPending}
                  >
                    <SelectTrigger
                      id="profile-country"
                      className={cn("w-full cursor-pointer", errors.country && "border-destructive")}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-state">State</Label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <Select
                    key={`${formValues.country}-${field.value}` || "empty-state"}
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setValue("city", "", { shouldValidate: true })
                    }}
                    disabled={!formValues.country || updateProfileMutation.isPending}
                  >
                    <SelectTrigger
                      id="profile-state"
                      className={cn("w-full cursor-pointer", errors.state && "border-destructive")}
                    >
                      <SelectValue
                        placeholder={
                          formValues.country ? "Select state" : "Select country first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-city">City</Label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select
                    key={`${formValues.country}-${formValues.state}-${field.value}` || "empty-city"}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!formValues.state || updateProfileMutation.isPending}
                  >
                    <SelectTrigger id="profile-city" className={cn("w-full cursor-pointer", errors.city && "border-destructive")}>
                      <SelectValue
                        placeholder={
                          formValues.state ? "Select city" : "Select state first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                className={cn(errors.postalCode && "border-destructive")}
                placeholder="Enter postal code"
              />
              {errors.postalCode && (
                <p className="text-xs text-destructive">{errors.postalCode.message}</p>
              )}
            </div>
          </>
        ) : null}

        {showDescription ? (
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              className={cn(errors.description && "border-destructive")}
              placeholder="Enter your description"
              rows={4}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        ) : null}

        {showSpecialties ? (
          <div className="space-y-2 md:col-span-3">
            <Label>
              Specialization {role === "doctor" && <span className="text-destructive">*</span>}
            </Label>
            <Controller
              name="specialties"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={specialties.map((s: any) => ({ label: s.label, value: s._id }))}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Select Specializations"
                  className={cn(errors.specialties && "border-destructive")}
                />
              )}
            />
            {errors.specialties && (
              <p className="text-xs text-destructive">{errors.specialties.message}</p>
            )}
          </div>
        ) : null}

        {showSignature ? (
          <div className="md:col-span-3">
            <ImageUploader
              label="Signature Image"
              value={signatureImageValue}
              onChange={(value) => setSignatureImageValue(value)}
              onError={(message) => toast.error(message)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row md:col-span-3">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={handleReset}
            disabled={updateProfileMutation.isPending}
          >
            Reset
          </Button>
        </div>
      </div>
    </form>
  )
}
