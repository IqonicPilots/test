"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useService, useServicesByFilter } from "@/hooks/api/use-services"
import type { Service } from "@/types/service.types"
import type { BillItem } from "@/types/bill.types"
import { cn } from "@/lib/utils"

const addServiceFormSchema = z.object({
  serviceId: z.string().min(1, { message: "Service is required." }),
  price: z.string().min(1, { message: "Price is required." }),
  quantity: z.string().min(1, { message: "Quantity is required." }),
})

type AddServiceFormValues = z.infer<typeof addServiceFormSchema>

function chargesFromService(service: Service | undefined): number {
  if (!service) return 0
  return typeof service.charges === "number" ? service.charges : parseFloat(String(service.charges || 0)) || 0
}

function idEquals(a: unknown, b: string): boolean {
  return String(a) === String(b)
}

function normalizeServiceId(id: unknown): string {
  if (id == null) return ""
  if (typeof id === "string") return id
  if (typeof id === "object" && id !== null && "$oid" in id) {
    return String((id as { $oid: string }).$oid)
  }
  if (typeof id === "object" && id !== null && "toString" in id && typeof (id as { toString: () => string }).toString === "function") {
    return String((id as { toString: () => string }).toString())
  }
  return String(id)
}

function extractServices(data: unknown): Service[] {
  let raw: Service[] = []
  if (!data) return []
  if (Array.isArray((data as { data?: unknown }).data)) raw = (data as { data: Service[] }).data
  else {
    const inner = (data as { data?: { data?: unknown } }).data
    if (inner && Array.isArray(inner.data)) raw = inner.data as Service[]
  }
  return raw.map((s) => ({ ...s, _id: normalizeServiceId(s._id) }))
}

interface AddServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: BillItem) => void
  onUpdate?: (index: number, item: BillItem) => void
  editingItem?: BillItem | null
  editingIndex?: number | null
  clinicId?: string
  doctorId?: string
}

const emptyValues: AddServiceFormValues = {
  serviceId: "",
  price: "",
  quantity: "1",
}

export function AddServiceDialog({
  open,
  onOpenChange,
  onAdd,
  onUpdate,
  editingItem,
  editingIndex,
  clinicId,
  doctorId,
}: AddServiceDialogProps) {
  const { data: filteredServicesData } = useServicesByFilter(clinicId, doctorId, 1, 100)

  const services = useMemo(
    () => extractServices(filteredServicesData),
    [filteredServicesData]
  )

  const serviceOptions = useMemo(
    () =>
      services.map((s) => ({
        value: s._id,
        label: s.name,
      })),
    [services]
  )

  const isEditing = editingItem != null && editingIndex != null && onUpdate != null

  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(addServiceFormSchema),
    defaultValues: emptyValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const serviceId = useWatch({ control: form.control, name: "serviceId" })

  const detailId = open && serviceId ? serviceId : ""
  const { data: serviceDetail } = useService(detailId)

  // Clear the form when closed so a reopen never shows the previous service/price. Also apply defaults when open.
  useEffect(() => {
    if (!open) {
      form.reset(emptyValues)
      form.clearErrors()
      return
    }
    if (isEditing && editingItem) {
      form.reset({
        serviceId: normalizeServiceId(editingItem.serviceId) || "",
        price: String(editingItem.price ?? ""),
        quantity: String(editingItem.qty ?? 1),
      })
    } else {
      form.reset(emptyValues)
    }
    form.clearErrors()
  }, [open, isEditing, editingItem, form])

  // If no service is selected, keep price blank without validating (empty price is valid until submit)
  useEffect(() => {
    if (!open) return
    if (serviceId) return
    form.setValue("price", "", { shouldValidate: false, shouldDirty: false })
    form.clearErrors("price")
  }, [open, serviceId, form])

  // When serviceId or the loaded list changes, set price from the list row
  useEffect(() => {
    if (!open || !serviceId) return
    const svc = services.find((s) => idEquals(s._id, serviceId))
    if (!svc) return
    const next = String(chargesFromService(svc))
    form.setValue("price", next, { shouldValidate: true, shouldDirty: true, shouldTouch: true })
  }, [open, serviceId, services, form])

  // If list row has no/0 charges, fill from GET /services/:id
  useEffect(() => {
    if (!open || !serviceId || !serviceDetail) return
    if (!idEquals(normalizeServiceId(serviceDetail._id), serviceId)) return
    const fromList = services.find((s) => idEquals(s._id, serviceId))
    const listC = fromList ? chargesFromService(fromList) : 0
    const c = chargesFromService(serviceDetail)
    if (c === 0) return
    const cur = (form.getValues("price") ?? "").trim()
    if (cur === "" || (listC === 0 && c > 0)) {
      form.setValue("price", String(c), { shouldValidate: true, shouldDirty: true, shouldTouch: true })
    }
  }, [open, serviceId, serviceDetail, services, form])

  const onSubmit = useCallback(
    (data: AddServiceFormValues) => {
      const service = services.find((s) => idEquals(s._id, data.serviceId))
      let price = parseFloat(data.price) || 0
      if (price === 0) {
        price = chargesFromService(service) || chargesFromService(serviceDetail)
      }
      const qty = parseInt(data.quantity, 10) || 1
      const total = price * qty

      const item: BillItem = {
        serviceId: data.serviceId,
        name: service?.name ?? editingItem?.name ?? "Unknown Service",
        qty,
        price,
        total,
      }
      if (isEditing && onUpdate) {
        onUpdate(editingIndex!, item)
      } else {
        onAdd(item)
      }
      onOpenChange(false)
    },
    [editingItem?.name, editingIndex, isEditing, onAdd, onOpenChange, onUpdate, serviceDetail, services]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[700px] overflow-y-auto max-h-[90vh] border-border"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edit the service in the bill" : "Add a service to the bill"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div>
              <p className="text-xs font-medium text-muted-foreground tracking-wide mb-3">SERVICE DETAILS</p>
              <div
                className={cn(
                  "grid gap-4",
                  "grid-cols-1 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]"
                )}
              >
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>
                        Service <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="cursor-pointer w-full min-w-0 overflow-hidden"
                          >
                            <SelectValue
                              placeholder="Select service"
                              className="block max-w-full truncate"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[60]">
                          {serviceOptions
                            .filter((o) => o.value !== "")
                            .map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Price <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="decimal"
                          readOnly
                          placeholder="—"
                          className="bg-muted/50 cursor-not-allowed"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantity <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="e.g. 1"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    )
}
