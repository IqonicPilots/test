"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUploader } from "@/components/common/ImageUploader"
import { DobDatePicker, type DobRole } from "@/components/common/DobDatePicker"
import { PhoneInputField } from "@/components/common/PhoneInputField"
import { Country, State, City } from "country-state-city"
import { Plus, Upload, ChevronLeft, ChevronRight, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { DataTableInfiniteFilterSelect, type FilterOption } from "./common/data-table-filters"
import { useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

// Types for the generic dialog component
export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "password"
  | "number"
  | "date"
  | "time"
  | "select"
  | "multi-select"
  | "radio"
  | "textarea"
  | "phone"
  | "image-upload"
  | "file"
  | "currency"
  | "rate"
  | "country"
  | "state"
  | "city"
  | "infinite-select"
  | "infinite-multi-select"
  | "custom"

export interface FormFieldConfig {
  name: string
  label: string
  type: FormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  validation?: any // Zod validation rules
  options?: { value: string; label: string }[] // For select/radio
  defaultValue?: any
  rows?: number // For textarea
  className?: string
  gridClass?: string // Grid layout class (e.g., "col-span-2")
  section?: string // Group fields by section
  showDialCode?: boolean // For phone input
  countryCodeFieldName?: string
  rateTypeFieldName?: string
  rateTypeLabel?: string
  accept?: string // For image upload
  imageUploadMode?: "buttons" | "avatar-click"
  imageUploadVariant?: "avatar" | "banner"
  maxFileSizeKb?: number
  minDate?: Date
  maxDate?: Date
  showMonthDropdown?: boolean
  showYearDropdown?: boolean
  dropdownMode?: "select" | "scroll"
  dobRole?: DobRole
  disabled?: boolean | ((values: any) => boolean)
  readOnly?: boolean | ((values: any) => boolean)
  countryFieldName?: string
  stateFieldName?: string
  onSearchChange?: (value: string) => void
  onLoadMore?: () => void
  onValueChange?: (value: string, form?: UseFormReturn<any>) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  isLoading?: boolean
  emptyText?: string
  /** Overrides the trigger/clear label for `infinite-select` / `infinite-multi-select` (e.g. "All clinics" to enable clearing to apply-to-all). */
  infiniteSelectAllLabel?: string
  selectedOptions?: FilterOption[] | ((watchedValues: any) => FilterOption[])
  render?: (form: UseFormReturn<any>) => React.ReactNode
}

export interface FormStep {
  title: string
  description?: string
  fields: FormFieldConfig[]
  schema?: z.ZodObject<any> // Optional step-specific validation
}

export interface GenericFormDialogProps<T extends z.ZodObject<any>> {
  // Dialog configuration
  title: string
  description?: string
  triggerLabel?: string
  triggerIcon?: React.ReactNode
  triggerClassName?: string
  triggerDisabled?: boolean

  // Form configuration
  formSchema: T
  defaultValues: z.infer<T>
  fields?: FormFieldConfig[] // Legacy single-step support
  steps?: FormStep[] // New multi-step support

  // Callbacks
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  onStepChange?: (currentStep: number, stepData: any) => void // Optional callback for step changes

  // Optional customization
  dialogSize?: "sm" | "md" | "lg" | "xl"
  showImageUpload?: boolean
  imageUploadLabel?: string
  resetOnSubmit?: boolean
  closeOnSubmit?: boolean
  cancelButtonText?: string
  submitButtonText?: string
  nextButtonText?: string
  backButtonText?: string
  trigger?: React.ReactNode // Custom trigger button
  enableSteps?: boolean // Enable multi-step mode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  onValuesChange?: (values: z.infer<T>, form: UseFormReturn<z.infer<T>>) => void
  isSubmitting?: boolean
  submitDisabled?: boolean
  validationMode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all"
  reValidateMode?: "onBlur" | "onChange" | "onSubmit"
  resetOnDefaultValuesChange?: boolean
  hideSubmitButton?: boolean
  dialogContentClassName?: string
  disableOpenAutoFocus?: boolean
  hideSectionHeadings?: boolean
  renderContent?: (args: {
    form: UseFormReturn<z.infer<T>>
    values: z.infer<T>
    isSubmitting: boolean
  }) => React.ReactNode
  renderFooterContent?: (args: {
    form: UseFormReturn<z.infer<T>>
    values: z.infer<T>
    isSubmitting: boolean
  }) => React.ReactNode
  formRef?: React.MutableRefObject<UseFormReturn<z.infer<T>> | null>
}

type FormValues = Record<string, any>

/** Fills required radio fields with the first option when the value is still empty (avoids reset() wiping a useEffect-applied default). */
function mergeFirstRequiredRadioDefaults(
  values: Record<string, any>,
  fieldConfigs: FormFieldConfig[]
): Record<string, any> {
  const next = { ...values }
  for (const f of fieldConfigs) {
    if (f.type !== "radio" || !f.required) continue
    const cur = next[f.name]
    if (cur != null && cur !== "") continue
    const first = f.options?.[0]?.value
    if (first != null && first !== "") {
      next[f.name] = String(first)
    }
  }
  return next
}

function GenericFormDialogInner<T extends z.ZodObject<any>>({
  title,
  description = "",
  triggerLabel = "Add New",
  triggerIcon = <Plus className="h-4 w-4" />,
  triggerClassName = "cursor-pointer bg-primary hover:bg-primary/90",
  triggerDisabled = false,
  formSchema,
  defaultValues,
  fields = [],
  steps = [],
  onSubmit,
  onStepChange,
  dialogSize = "lg",
  showImageUpload = false,
  imageUploadLabel = "Profile Photo",
  resetOnSubmit = true,
  closeOnSubmit = true,
  cancelButtonText = "Cancel",
  submitButtonText = "Save",
  nextButtonText = "Next",
  backButtonText = "Back",
  trigger,
  enableSteps = false,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onValuesChange,
  isSubmitting = false,
  submitDisabled = false,
  validationMode = "onSubmit",
  reValidateMode = "onChange",
  resetOnDefaultValuesChange = false,
  hideSubmitButton = false,
  dialogContentClassName,
  disableOpenAutoFocus = false,
  hideSectionHeadings = true,
  renderContent,
  renderFooterContent,
  formRef,
}: GenericFormDialogProps<T>) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepData] = useState<Record<string, any>>({})
  const isOpen = controlledOpen ?? open

  // Determine if we're using multi-step mode
  const isMultiStep = enableSteps && steps.length > 0
  const currentFields = isMultiStep ? steps[currentStep]?.fields || [] : fields
  const allFieldConfigs: FormFieldConfig[] = useMemo(
    () => (isMultiStep ? steps.flatMap((s) => s.fields) : fields),
    [isMultiStep, steps, fields]
  )

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: mergeFirstRequiredRadioDefaults(
      defaultValues as Record<string, any>,
      allFieldConfigs
    ) as any,
    mode: validationMode,
    reValidateMode,
  })
  const isBusy = isSubmitting || form.formState.isSubmitting
  const { currencyPrefix, currencyPostfix } = useCurrencyFormatter(true)

  if (formRef) {
    formRef.current = form as any
  }

  const watchedValues = form.watch()
  useEffect(() => {
    if (!onValuesChange) {
      return
    }

    const subscription = form.watch((value) => {
      onValuesChange(value as z.infer<T>, form)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [form, onValuesChange])

  useEffect(() => {
    if (resetOnDefaultValuesChange && isOpen) {
      form.reset(
        mergeFirstRequiredRadioDefaults(
          defaultValues as Record<string, any>,
          allFieldConfigs
        ) as any
      )
    }
  }, [defaultValues, form, isOpen, resetOnDefaultValuesChange])

  // Reset form when dialog opens programmatically (via controlledOpen prop)
  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (controlledOpen && !hasOpened) {
      form.reset(
        mergeFirstRequiredRadioDefaults(
          defaultValues as Record<string, any>,
          allFieldConfigs
        ) as any
      )
      setHasOpened(true)
    } else if (!controlledOpen && hasOpened) {
      setHasOpened(false)
    }
    // allFieldConfigs omitted: parent `fields` arrays are often new references each render;
    // merge uses the configs from the render that triggered this open/reset transition.
  }, [controlledOpen, defaultValues, form, hasOpened])

  // Image handlers removed as they are now encapsulated in the field render

  // Removed: Aggressive reset on defaultValues change, as it causes resets on every parent render when using object literals.
  // The reset is already handled in handleOpenChange when the dialog opens.

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const currentStepFields = steps[currentStep]?.fields || []
    const fieldNames = currentStepFields.map(f => f.name)

    // Clear previous errors for current step fields
    fieldNames.forEach(fieldName => {
      form.clearErrors(fieldName as any)
    })

    // Validate only current step fields using form validation
    const currentValues = form.getValues()
    const stepValues: Record<string, any> = {}

    fieldNames.forEach(fieldName => {
      stepValues[fieldName] = currentValues[fieldName]
    })

    // Trigger form validation for current step fields
    const isValid = await form.trigger(fieldNames as any)

    if (isValid) {
      // Save step data
      const newStepData = { ...stepData, ...stepValues }
      setStepData(newStepData)

      // Call step change callback
      if (onStepChange) {
        onStepChange(currentStep, stepValues)
      }

      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      // Log validation errors for debugging
      const errors = form.formState.errors
      console.log('Validation errors:', errors)
    }
  }

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (currentStep > 0) {
      // Clear errors for the step we're moving to
      const previousStepFields = steps[currentStep - 1]?.fields || []
      previousStepFields.forEach(field => {
        form.clearErrors(field.name as any)
      })
      setCurrentStep(currentStep - 1)
    }
  }

  const onFormSubmit = async (data: z.infer<T>) => {
    try {
      if (isMultiStep) {
        // Combine all step data with final form data
        const finalData = { ...stepData, ...data }
        await onSubmit(finalData)
      } else {
        await onSubmit(data)
      }

      if (resetOnSubmit && !closeOnSubmit) {
        form.reset()
        setStepData({})
        setCurrentStep(0)
      }
      if (closeOnSubmit) {
        handleOpenChange(false)
      }
    } catch (error) {
      // Do not close/reset if onSubmit fails!
    }
  }

  const handleOnError = (errors: any) => {
    console.log('Form validation errors:', errors)
  }

  const handleCancel = () => {
    form.reset()
    setStepData({})
    setCurrentStep(0)
    handleOpenChange(false)
  }

  // Reset form when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStepData({})
      setCurrentStep(0)
    } else if (defaultValues) {
      // Clear data from previous clinic instances if any
      setStepData({})
      setCurrentStep(0)

      // Sync form with defaultValues when opening (crucial for Edit mode)
      form.reset(
        mergeFirstRequiredRadioDefaults(
          defaultValues as Record<string, any>,
          allFieldConfigs
        ) as any
      )
    }
    if (controlledOpen === undefined) {
      setOpen(isOpen)
    }
    onOpenChange?.(isOpen)
  }

  // Get unique sections from current fields
  // Get unique sections from current fields, including an empty string for fields without sections
  const sections = Array.from(new Set(currentFields.map(f => f.section || "")))

  // Dialog size mapping
  const sizeClasses = {
    sm: "sm:max-w-[500px]",
    md: "sm:max-w-[700px]",
    lg: "sm:max-w-[900px]",
    xl: "sm:max-w-[1200px]",
  }

  const getDefaultInputPlaceholder = (label: string) => `Enter ${label.toLowerCase()}`

  const renderField = (field: FormFieldConfig) => {
    switch (field.type) {
      case "text":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder || getDefaultInputPlaceholder(field.label)}
                    className={cn(
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                    {...formField}
                    value={formField.value ?? ""}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case "email":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder || "Enter your email"}
                    className={cn(
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                    {...formField}
                    value={formField.value ?? ""}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )
      case "tel":
      case "password":
      case "number":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder || getDefaultInputPlaceholder(field.label)}
                    className={cn(
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                    {...formField}
                    value={formField.value ?? ""}
                    readOnly={typeof field.readOnly === "function" ? field.readOnly(watchedValues) : field.readOnly}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "date":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              // Parse value if it exists and check for validity
              let parsedDate: Date | undefined = undefined;
              if (formField.value && typeof formField.value === 'string' && formField.value.trim() !== '') {
                const val = String(formField.value);
                let date: Date;

                if (val.includes('-') && !val.includes('T')) {
                  const parts = val.split('-');
                  if (parts.length === 3) {
                    const [year, month, day] = parts.map(Number);
                    date = new Date(year, month - 1, day);
                  } else {
                    date = new Date(val);
                  }
                } else {
                  date = new Date(val);
                }

                if (date && !isNaN(date.getTime())) {
                  parsedDate = date;
                }
              }

              return (
                <FormItem>
                  <FormLabel>
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <DobDatePicker
                    role={field.dobRole ?? "patient"}
                    value={parsedDate}
                    onChange={(date) => {
                      formField.onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }}
                    minDate={field.minDate}
                    maxDate={field.maxDate}
                    showMonthDropdown={field.showMonthDropdown}
                    showYearDropdown={field.showYearDropdown}
                    dropdownMode={field.dropdownMode}
                    placeholder={field.placeholder || "Select date"}
                    className={cn(
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                  />
                  {field.description && <FormDescription>{field.description}</FormDescription>}
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "select":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <Select
                  onValueChange={(val) => {
                    formField.onChange(val)
                    field.onValueChange?.(val, form)
                  }}
                  value={formField.value ? String(formField.value) : undefined}
                  disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn(
                        "cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-60",
                        field.className || "",
                        fieldState.error ? "border-destructive" : "",
                      )}
                    >
                      <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options
                      ?.filter((option) => option.value !== "")
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "multi-select":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <MultiSelect
                    options={field.options ?? []}
                    value={Array.isArray(formField.value) ? formField.value : []}
                    onChange={formField.onChange}
                    placeholder={field.isLoading ? "Loading..." : (field.placeholder || `Select ${field.label}`)}
                    emptyText={field.isLoading ? "Loading..." : (field.emptyText || "No options available")}
                    disabled={field.isLoading || (typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled)}
                    className={cn(field.className || "", fieldState.error ? "border-destructive" : "")}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "radio":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    value={
                      formField.value != null && formField.value !== ""
                        ? String(formField.value)
                        : undefined
                    }
                    className="flex flex-wrap gap-x-6 gap-y-2 min-h-10"
                  >
                    {field.options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <RadioGroupItem
                          value={option.value}
                          id={`${field.name}-${option.value}`}
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={`${field.name}-${option.value}`}
                          className="text-sm font-medium cursor-pointer select-none"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "textarea":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || getDefaultInputPlaceholder(field.label)}
                    rows={field.rows || 3}
                    className={cn(
                      "resize-y",
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                    {...(formField as any)}
                    value={formField.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "phone":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const countryCodeFieldName =
                field.countryCodeFieldName ??
                (field.name === "mobile" ? "countryCode" : `${field.name}CountryCode`)
              const countryCodeValue = form.watch(countryCodeFieldName as any) ?? ""

              return (
                <FormItem>
                  <FormLabel>
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <input type="hidden" {...form.register(countryCodeFieldName as any)} />
                  <FormControl>
                    <PhoneInputField
                      value={{
                        countryCode: String(countryCodeValue || ""),
                        mobile: String(formField.value || ""),
                      }}
                      onChange={(value) => {
                        form.setValue(countryCodeFieldName as any, value.countryCode as any, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        formField.onChange(value.mobile)
                      }}
                      className={fieldState.error ? "!border-destructive" : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "image-upload":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField }) => (
              <FormItem className={cn(field.gridClass)}>
                <ImageUploader
                  label={field.label}
                  value={formField.value}
                  required={field.required}
                  accept={field.accept}
                  maxFileSizeKb={field.maxFileSizeKb}
                  variant={field.imageUploadVariant}
                  onChange={formField.onChange}
                  onError={(message) => {
                    form.setError(field.name as any, {
                      type: "manual",
                      message,
                    })
                  }}
                  clearError={() => {
                    form.clearErrors(field.name as any)
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "file":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem className={field.gridClass || "col-span-1"}>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id={field.name}
                      style={{ display: 'none' }}
                      accept={field.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          formField.onChange(file)
                        }
                      }}
                      disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                    />
                    <div className={cn(
                      "flex items-center gap-3 h-10 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background",
                      fieldState.error ? "border-destructive" : "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    )}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 text-[11px] font-bold uppercase tracking-tight"
                        onClick={() => document.getElementById(field.name)?.click()}
                        disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                      >
                        <Upload className="size-3 mr-1.5" />
                        Browse
                      </Button>
                      <span className="text-[11px] font-medium text-muted-foreground truncate flex-1">
                        {formField.value instanceof File
                          ? formField.value.name
                          : typeof formField.value === 'string' && formField.value
                            ? formField.value.split('/').pop()
                            : "No file selected"
                        }
                      </span>
                    </div>
                  </div>
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "currency":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem className={field.gridClass || "col-span-1"}>
                <FormLabel>
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 border-r border-gray-400 pr-2">{currencyPrefix}</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className={cn(
                        "pl-10 pr-12  appearance-none bg-background",
                        fieldState.error && "border-destructive"
                      )}
                      {...formField}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 ">{currencyPostfix}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "rate":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const rateTypeFieldName = field.rateTypeFieldName || "rateType"
              const typeValue = form.watch(rateTypeFieldName as any)

              return (
                <FormItem className={field.gridClass || "col-span-1"}>
                  <div className="flex gap-2">
                    <FormLabel className="w-20">
                      {field.rateTypeLabel || "Type"}
                      {field.required && <span className="text-destructive">*</span>}
                    </FormLabel>
                    <FormLabel className="flex-1">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </FormLabel>
                  </div>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control as any}
                      name={rateTypeFieldName as any}
                      render={({ field: typeField }) => (
                        <Select
                          onValueChange={typeField.onChange}
                          defaultValue={typeField.value}
                          value={typeField.value}
                          disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                        >
                          <FormControl>
                            <SelectTrigger className="w-20 cursor-pointer flex-shrink-0 h-10">
                              <span className="flex items-center">
                                {typeField.value === "fixed" ? currencyPrefix : "%"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent side="top">
                            <SelectItem value="fixed">Fixed Rate ({currencyPrefix})</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder={field.placeholder || "Enter value"}
                        className={cn(
                          "flex-1 h-10",
                          fieldState.error ? "border-destructive" : "",
                        )}
                        disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                        {...formField}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "time":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const [hours, minutes] = (formField.value || "00:00").split(":")

              return (
                <FormItem className={field.gridClass || "col-span-1"}>
                  <FormLabel htmlFor="duration-picker">
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        id="duration-hours"
                        placeholder="HH"
                        min="0"
                        max="23"
                        className={cn(
                          "w-full text-center appearance-none bg-background",
                          fieldState.error && "border-destructive"
                        )}
                        value={hours}
                        onChange={(e) => {
                          let val = parseInt(e.target.value || "0")
                          if (val > 23) val = 23
                          if (val < 0) val = 0
                          const newHours = String(val).padStart(2, "0")
                          formField.onChange(`${newHours}:${minutes}`)
                        }}
                      />
                      <span className="text-lg font-bold">:</span>
                      <Input
                        type="number"
                        id="duration-minutes"
                        placeholder="MM"
                        min="0"
                        max="59"
                        className={cn(
                          "w-full text-center appearance-none bg-background",
                          fieldState.error && "border-destructive"
                        )}
                        value={minutes}
                        onChange={(e) => {
                          let val = parseInt(e.target.value || "0")
                          if (val > 59) val = 59
                          if (val < 0) val = 0
                          const newMinutes = String(val).padStart(2, "0")
                          formField.onChange(`${hours}:${newMinutes}`)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "country":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const countries = Country.getAllCountries().map(c => ({
                value: c.isoCode,
                label: c.name
              }))

              return (
                <FormItem>
                  <FormLabel>
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <Select
                    onValueChange={(val) => {
                      formField.onChange(val)
                      // Reset state and city when country changes
                      const stateField = fields.find(f => f.type === "state" && f.countryFieldName === field.name)
                      const cityField = fields.find(f => f.type === "city" && f.countryFieldName === field.name)
                      if (stateField) form.setValue(stateField.name as any, "" as any)
                      if (cityField) form.setValue(cityField.name as any, "" as any)
                    }}
                    value={formField.value ? String(formField.value) : undefined}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          "cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-60",
                          field.className || "",
                          fieldState.error ? "border-destructive" : "",
                        )}
                      >
                        <SelectValue placeholder={field.placeholder || "Select Country"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "state":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const countryFieldName = field.countryFieldName || "country"
              const countryCode = form.watch(countryFieldName as any) as string | undefined
              const states = countryCode ? State.getStatesOfCountry(countryCode).map(s => ({
                value: s.isoCode,
                label: s.name
              })) : []

              return (
                <FormItem>
                  <FormLabel>
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <Select
                    onValueChange={(val) => {
                      formField.onChange(val)
                      // Reset city when state changes
                      const cityField = fields.find(f => f.type === "city" && f.stateFieldName === field.name)
                      if (cityField) form.setValue(cityField.name as any, "" as any)
                    }}
                    value={formField.value ? String(formField.value) : undefined}
                    disabled={!countryCode || (typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled)}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          "cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-60",
                          field.className || "",
                          fieldState.error ? "border-destructive" : "",
                        )}
                      >
                        <SelectValue placeholder={field.placeholder || (countryCode ? "Select State" : "Select Country first")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {states.length > 0 ? (
                        states.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled className="text-center opacity-80">
                          No states available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "city":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => {
              const countryFieldName = field.countryFieldName || "country"
              const stateFieldName = field.stateFieldName || "state"
              const countryCode = form.watch(countryFieldName as any) as string | undefined
              const stateCode = form.watch(stateFieldName as any) as string | undefined

              const cities = (countryCode && stateCode) ? City.getCitiesOfState(countryCode, stateCode).map(c => ({
                value: c.name, // Cities usually don't have ISO codes in this lib, using name
                label: c.name
              })) : []

              return (
                <FormItem>
                  <FormLabel>
                    {field.label}{field.required && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <Select
                    onValueChange={formField.onChange}
                    value={formField.value ? String(formField.value) : undefined}
                    disabled={!stateCode || (typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled)}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          "cursor-pointer w-full disabled:cursor-not-allowed disabled:opacity-60",
                          field.className || "",
                          fieldState.error ? "border-destructive" : "",
                        )}
                      >
                        <SelectValue placeholder={field.placeholder || (stateCode ? "Select City" : "Select State first")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.length > 0 ? (
                        cities.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled className="text-center opacity-80">
                          No cities available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        )

      case "infinite-select":
      case "infinite-multi-select":
        return (
          <FormField
            key={field.name}
            control={form.control as any}
            name={field.name as any}
            render={({ field: formField, fieldState }: any) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">
                  {field.label}{field.required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <DataTableInfiniteFilterSelect
                    value={formField.value}
                    onValueChange={(val: any) => {
                      formField.onChange(val)
                      if (field.onValueChange) field.onValueChange(val, form)
                    }}
                    onSearchChange={field.onSearchChange}
                    onLoadMore={field.onLoadMore}
                    hasNextPage={field.hasNextPage}
                    isFetchingNextPage={field.isFetchingNextPage}
                    isLoading={field.isLoading}
                    options={field.options || []}
                    selectedOptions={typeof field.selectedOptions === 'function' ? field.selectedOptions(watchedValues) : (field.selectedOptions || [])}
                    multiple={field.type.includes("multi")}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    allLabel={field.infiniteSelectAllLabel ?? `Select ${field.label}`}
                    disabled={typeof field.disabled === 'function' ? field.disabled(watchedValues) : field.disabled}
                    className={cn(
                      "w-full pt-1.5",
                      field.className || "",
                      fieldState.error ? "border-destructive" : "",
                    )}
                  />
                </FormControl>
                {field.description && <FormDescription className="text-xs text-blue-500 dark:text-amber-500">{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "custom":
        return field.render ? field.render(form) : null

      default:
        return null
    }
  }

  const handleCustomTriggerClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    const triggerContainer = event.currentTarget
    const hasDisabledControl = Boolean(
      triggerContainer.querySelector("button:disabled, [aria-disabled='true'], [data-disabled='true']")
    )

    if (hasDisabledControl) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    handleOpenChange(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger ? (
        trigger ? (
          <span
            onClick={handleCustomTriggerClick}
            style={{ display: "contents" }}
          >
            {trigger}
          </span>
        ) : (
          <DialogTrigger asChild>
            <Button className={triggerClassName} disabled={triggerDisabled}>
              {triggerIcon}
              {triggerLabel}
            </Button>
          </DialogTrigger>
        )
      ) : null}
      <DialogContent
        className={cn(
          sizeClasses[dialogSize],
          "min-w-0 overflow-x-hidden overflow-y-auto max-h-[90vh] border-border",
          dialogContentClassName
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          if (disableOpenAutoFocus) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isMultiStep ? steps[currentStep]?.title || title : title}
          </DialogTitle>
          {description && (
            <DialogDescription>
              {isMultiStep
                ? steps[currentStep]?.description || description
                : description
              }
            </DialogDescription>
          )}

        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="space-y-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLElement
                if (
                  e.target instanceof HTMLTextAreaElement ||
                  target?.isContentEditable ||
                  target?.getAttribute("data-allow-enter") === "true" ||
                  Boolean(target?.closest?.('[data-allow-enter="true"]'))
                ) {
                  return
                }
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >

            {renderContent
              ? renderContent({
                form,
                values: watchedValues as z.infer<T>,
                isSubmitting: isBusy,
              })
              : sections.map((section) => {
                return (
                  <div key={section} className={cn(hideSectionHeadings ? "space-y-0" : "space-y-4")}>
                    {!hideSectionHeadings && section ? (
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {section}
                      </h3>
                    ) : null}

                    <div className={cn(
                      "flex min-w-0 flex-col gap-4 md:grid",
                      (section === "Personal Information" || section === "Clinic Information")
                        ? "md:grid-cols-2"
                        : "md:grid-cols-2 lg:grid-cols-3"
                    )}>
                      {currentFields
                        .filter((f) => (f.section || "") === section)
                        .map((field) => (
                          <div key={field.name} className={cn("col-span-1 min-w-0", field.gridClass)}>
                            {renderField(field)}
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })}

            {renderFooterContent
              ? renderFooterContent({
                form,
                values: watchedValues as z.infer<T>,
                isSubmitting: isBusy,
              })
              : null}

            <DialogFooter>
              {isMultiStep ? (
                <>
                  {/* Multi-step navigation */}
                  <div className="flex justify-end gap-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={currentStep === 0 ? handleCancel : handleBack}
                      className="cursor-pointer"
                      disabled={isBusy}
                    >
                      {currentStep > 0 && <ChevronLeft className="h-4 w-4" />}
                      {currentStep === 0 ? cancelButtonText : backButtonText}
                    </Button>

                    <div className="flex gap-2">
                      {currentStep < steps.length - 1 ? (
                        <Button
                          type="button"
                          onClick={(e) => handleNext(e)}
                          className="cursor-pointer"
                          disabled={isBusy}
                        >
                          {nextButtonText}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={form.handleSubmit(onFormSubmit, handleOnError)}
                          className="cursor-pointer"
                          disabled={isBusy || submitDisabled}
                        >
                          {submitButtonText}
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Single-step buttons */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="cursor-pointer"
                    disabled={isBusy}
                  >
                    {cancelButtonText}
                  </Button>
                  {!hideSubmitButton ? (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onFormSubmit, handleOnError)}
                      className="cursor-pointer"
                      disabled={isBusy || submitDisabled}
                    >
                      {submitButtonText}
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    </Button>
                  ) : null}
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export const GenericFormDialog = memo(
  GenericFormDialogInner
) as typeof GenericFormDialogInner
