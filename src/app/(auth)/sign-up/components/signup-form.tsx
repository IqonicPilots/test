"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PhoneInputField } from "@/components/common/PhoneInputField"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClinics } from "@/hooks/api/use-clinics"
import { useRegister, useRestoreAccount } from "@/hooks/api/use-auth"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"
import * as React from "react"
import type { RegisterRole } from "@/types/auth.types"

const roleOptions = [
  { label: "Patient", value: "patient" },
  { label: "Doctor", value: "doctor" },
  { label: "Receptionist", value: "receptionist" },
] as const

const registerRoles = roleOptions.map((option) => option.value) as [RegisterRole, ...RegisterRole[]]

const signupFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    countryCode: z.string().trim().min(1, "Country code is required"),
    mobile: z.string().trim().min(6, "Phone number is required"),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.union([z.literal(""), z.enum(registerRoles)]),
    clinicId: z.union([z.string(), z.array(z.string())]).optional(),
    terms: z.boolean().refine((value) => value, {
      message: "You must accept the terms and privacy policy",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }

    if (!data.role) {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Select a role",
      })
    }

    if ((data.role === "doctor" || data.role === "receptionist") && (!data.role || !data.clinicId || (Array.isArray(data.clinicId) && data.clinicId.length === 0))) {
      ctx.addIssue({
        code: "custom",
        path: ["clinicId"],
        message: "Clinic is required for this role",
      })
    }
  })

type SignupFormValues = z.infer<typeof signupFormSchema>

const defaultValues: SignupFormValues = {
  firstName: "",
  lastName: "",
  countryCode: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  clinicId: "",
  terms: false,
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const register = useRegister()
  const restore = useRestoreAccount()
  const [showRestore, setShowRestore] = React.useState(false)
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinics(1, 100, true, { isActive: true })
  const clinics = clinicsData?.data ?? []

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues,
  })

  const selectedRole = form.watch("role")

  // Reset clinicId when role changes
  React.useEffect(() => {
    form.setValue("clinicId", selectedRole === "doctor" ? [] : "")
  }, [selectedRole, form])

  const userEmail = form.watch("email")

  function onSubmit(values: SignupFormValues) {
    setShowRestore(false)
    register.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      countryCode: values.countryCode.trim(),
      mobile: values.mobile.trim(),
      email: values.email.trim(),
      password: values.password,
      role: values.role as RegisterRole,
      clinics: Array.isArray(values.clinicId) ? values.clinicId : values.clinicId ? [values.clinicId] : undefined,
    }, {
      onError: (error: any) => {
        if (error?.response?.status === 409 || error?.status === 409) {
          setShowRestore(true)
        }
      }
    })
  }

  const handleRestore = (e: React.MouseEvent) => {
    e.preventDefault()
    if (userEmail) {
      restore.mutate({ email: userEmail })
    }
  }

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information to create a new account
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John"
                      autoComplete="given-name"
                      disabled={register.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe"
                      autoComplete="family-name"
                      disabled={register.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Phone Number</FormLabel>
                  <input type="hidden" {...form.register("countryCode")} />
                  <FormControl>
                    <PhoneInputField
                      value={{
                        countryCode: form.watch("countryCode") ?? defaultValues.countryCode,
                        mobile: field.value ?? "",
                      }}
                      onChange={(value) => {
                        form.setValue("countryCode", value.countryCode, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        field.onChange(value.mobile)
                      }}
                      disabled={register.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    disabled={register.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter password"
                      autoComplete="new-password"
                      disabled={register.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      disabled={register.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={register.isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map((roleOption) => (
                      <SelectItem key={roleOption.value} value={roleOption.value}>
                        {roleOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedRole === "doctor" || selectedRole === "receptionist") && (
            <FormField
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Clinic</FormLabel>
                  {selectedRole === "doctor" ? (
                    <FormControl>
                      <MultiSelect
                        options={clinics.map((c: any) => ({ label: c.name, value: c._id }))}
                        value={(field.value as string[]) || []}
                        onChange={field.onChange}
                        placeholder={isLoadingClinics ? "Loading clinics..." : "Choose your clinics"}
                        disabled={register.isPending || isLoadingClinics}
                      />
                    </FormControl>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as string}
                      disabled={register.isPending || isLoadingClinics}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isLoadingClinics ? "Loading clinics..." : "Choose your clinic"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clinics.map((clinic: any) => (
                          <SelectItem key={clinic._id} value={clinic._id}>
                            {clinic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      disabled={register.isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I agree to the{" "}
                      <a href="#" className="underline underline-offset-4 hover:text-primary">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full cursor-pointer" disabled={register.isPending || restore.isPending}>
            {register.isPending ? "Creating Account..." : "Create Account"}
          </Button>

          {showRestore && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex flex-col gap-3">
              <p className="text-sm text-destructive font-medium">
                This email is associated with a deleted account.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestore}
                disabled={restore.isPending}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors"
                type="button"
              >
                {restore.isPending ? "Restoring..." : "Restore Account instead?"}
              </Button>
            </div>
          )}

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
