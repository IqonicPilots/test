"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GenericFormDialog } from "@/components/generic-form-dialog"
import { AddServiceDialog } from "./add-service-dialog"
import { useCreateBill, useUpdateBill, useBillsByEncounter } from "@/hooks/api/use-bills"
import { useService } from "@/hooks/api/use-services"
import { useCalculateTax } from "@/hooks/api/use-tax-mutation"
import type { BillItem, BillTax, BillPayload } from "@/types/bill.types"
import type { TaxCalculationResponse } from "@/types/tax.types"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

const billFormSchema = z.object({
  _items: z.array(z.any()).optional(),
  _discountValue: z.number().optional(),
  _paymentStatus: z.enum(["paid", "unpaid"]).optional(),
})

type BillFormValues = z.infer<typeof billFormSchema>

/**
 * Persist pre-tax unit price and line total from the tax API breakdown.
 * Avoids storing tax-inclusive prices (e.g. from appointmentCharge) that would
 * double-count when subtotal + tax are shown on invoices.
 */
function lineItemsWithPreTaxBase(
  items: BillItem[],
  tax: TaxCalculationResponse | null
): BillItem[] {
  const breakdown = tax?.breakdown
  if (!breakdown?.length) return items

  if (breakdown.length !== items.length) {
    const used = new Set<number>()
    return items.map((item) => {
      let idx = breakdown.findIndex(
        (b, i) =>
          !used.has(i) &&
          String(b.serviceId) === String(item.serviceId) &&
          Number(b.quantity) === Number(item.qty)
      )
      if (idx < 0) {
        idx = breakdown.findIndex(
          (b, i) => !used.has(i) && String(b.serviceId) === String(item.serviceId)
        )
      }
      if (idx < 0) return item
      used.add(idx)
      const b = breakdown[idx]!
      const q = b.quantity > 0 ? b.quantity : item.qty
      return {
        ...item,
        price: q > 0 ? b.baseAmount / q : item.price,
        total: b.baseAmount,
      }
    })
  }

  return items.map((item, i) => {
    const b = breakdown[i]
    if (!b || String(b.serviceId) !== String(item.serviceId)) return item
    const q = b.quantity > 0 ? b.quantity : item.qty
    return {
      ...item,
      price: q > 0 ? b.baseAmount / q : item.price,
      total: b.baseAmount,
    }
  })
}

interface BillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  encounter: {
    _id: string
    patient?: { _id?: string }
    doctor?: { _id?: string }
    clinic?: { _id?: string }
    service?: { _id?: string; name?: string; charges?: number | string }
  }
  onSuccess?: () => void
}



export function BillDialog({
  open,
  onOpenChange,
  encounter,
  onSuccess,
}: BillDialogProps) {
  const { formatCurrency, currencyPrefix, currencyPostfix } = useCurrencyFormatter()
  const [items, setItems] = useState<BillItem[]>([])
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid")
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [taxExpanded, setTaxExpanded] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResponse | null>(null)
  const isMountedRef = useRef(true)
  const originalPaymentStatusRef = useRef<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const encounterId = encounter._id
  const patientId = encounter.patient?._id ?? ""
  const doctorId = encounter.doctor?._id ?? ""
  const clinicId = encounter.clinic?._id ?? ""

  const { mutateAsync: calculateTax } = useCalculateTax()
  const createBillMutation = useCreateBill()
  const updateBillMutation = useUpdateBill()
  const { data: existingBillsResponse, isFetched: billsQueryFetched } = useBillsByEncounter(
    encounterId,
    open
  )
  const existingBill = React.useMemo(() => {
    const bills = existingBillsResponse?.data
    if (!bills || !Array.isArray(bills) || bills.length === 0) return null
    const unpaid = bills.find((b: { paymentStatus?: string }) =>
      b.paymentStatus !== "paid"
    )
    return unpaid ?? bills[0]
  }, [existingBillsResponse])
  const svc = encounter.service
  const { data: fetchedService } = useService(svc?._id ?? "")

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setItems([])
      setDiscountValue(0)
      setPaymentStatus("unpaid")
      setTaxCalculation(null)
      originalPaymentStatusRef.current = null
    }
  }, [open])

  // Track the original payment status when bill loads to prevent auto-close on opening a paid bill
  useEffect(() => {
    if (open && originalPaymentStatusRef.current === null) {
      // If we have an existing bill, use its status. If we finished loading bills and none exist, use "unpaid".
      if (existingBill) {
        originalPaymentStatusRef.current = (existingBill as any)?.paymentStatus || "unpaid"
      } else if (existingBillsResponse) {
        originalPaymentStatusRef.current = "unpaid"
      }
    }
  }, [open, existingBill, existingBillsResponse])

  // When existing bill loads, pre-populate form
  useEffect(() => {
    if (!open || !existingBill) return
    const bill = existingBill as any
    if (bill.items && Array.isArray(bill.items) && bill.items.length > 0) {
      setItems(bill.items)
    }
    const savedDiscount = (bill as { discount_value?: number }).discount_value ?? bill.discount
    if (savedDiscount != null && savedDiscount > 0) {
      setDiscountValue(savedDiscount)
    }
    if (bill.paymentStatus) {
      const status = bill.paymentStatus
      setPaymentStatus(
        status === "paid" ? "paid" : "unpaid"
      )
    }

    // Initialize tax calculation from existing bill to avoid redundant API call
    if (bill.items && bill.items.length > 0) {
      const serviceItems = bill.items.map((i: any) => ({
        serviceId: i.serviceId,
        quantity: i.qty
      }))
      const key = JSON.stringify({
        clinicId: clinicId || null,
        doctorId: doctorId || null,
        serviceItems,
      })
      taxRequestKeyRef.current = key
      
      const preDiscountForTax =
        (Number(bill.serviceTotal) || 0) + (Number(bill.taxTotal) || 0)
      const simulatedResponse: TaxCalculationResponse = {
        totalBaseAmount: bill.serviceTotal || 0,
        totalTaxAmount: bill.taxTotal || 0,
        // `grandTotal` is pre-discount (matches tax API); not `totalAmount` which is after discount
        grandTotal: preDiscountForTax,
        taxes: (bill.taxes || []).map((t: any) => ({
          taxId: t.taxId,
          taxName: t.name,
          taxRate: t.taxValue,
          taxType: t.taxType,
          totalAmount: t.taxAmount,
          services: []
        })),
        breakdown: (bill.items || []).map((i: any) => ({
          serviceId: i.serviceId,
          serviceName: i.name,
          quantity: i.qty,
          charges: i.price,
          baseAmount: i.total,
          taxAmount: 0
        }))
      }
      setTaxCalculation(simulatedResponse)
      // Reject any in-flight tax API response from a prior render (e.g. before bill loaded)
      taxRunGenerationRef.current += 1
    }
  }, [open, existingBill, clinicId, doctorId])

  // Auto-add encounter service when dialog opens (only if no existing bill); fetch charges if missing.
  // Wait for billsByEncounter to finish so we do not pre-fill items (and run tax) before we know a bill exists.
  useEffect(() => {
    if (!open || !billsQueryFetched || existingBill) return
    const service = encounter.service
    if (!service || !service._id || !service.name) return
    let price = typeof service.charges === "number" ? service.charges : parseFloat(String(service.charges || 0)) || 0
    if (price === 0 && fetchedService?.charges != null) {
      price = typeof fetchedService.charges === "number" ? fetchedService.charges : parseFloat(String(fetchedService.charges)) || 0
    }
    setItems((prev: BillItem[]): BillItem[] => {
      if (prev.length > 0) return prev
      const existing = prev.find((i) => i.serviceId === service._id)
      if (existing) {
        if (existing.price === 0 && price > 0) {
          return prev.map((i) => (i.serviceId === service._id ? { ...i, price, total: price * (i.qty || 1) } : i))
        }
        return prev
      }
      return [
        {
          serviceId: service._id,
          name: service.name ?? "",
          qty: 1,
          price,
          total: price,
        },
      ]
    })
  }, [open, billsQueryFetched, encounter.service, fetchedService, existingBill])

  const taxRequestKeyRef = useRef<string>("")
  const taxRunGenerationRef = useRef(0)
  const serviceItems = useMemo(
    () =>
      items
        .filter((item) => item.serviceId && item.qty > 0)
        .map((item) => ({
          serviceId: item.serviceId as string,
          quantity: item.qty,
        })),
    [items]
  )
  const serviceItemsKey = useMemo(
    () =>
      JSON.stringify({
        clinicId: clinicId || null,
        doctorId: doctorId || null,
        serviceItems,
      }),
    [clinicId, doctorId, serviceItems]
  )

  useEffect(() => {
    if (!open) return
    if (!billsQueryFetched) return

    if (serviceItems.length === 0) {
      setTaxCalculation(null)
      taxRequestKeyRef.current = ""
      return
    }

    // If we already have the result for these exact items/clinic/doctor, don't call again
    if (taxRequestKeyRef.current === serviceItemsKey) return

    const runGeneration = ++taxRunGenerationRef.current
    let isCancelled = false
    taxRequestKeyRef.current = serviceItemsKey

    // Small delay to debounce rapid item changes
    const timer = setTimeout(async () => {
      try {
        const response = await calculateTax({
          serviceItems,
          clinicId: clinicId || undefined,
          doctorId: doctorId || undefined,
        })
        if (runGeneration !== taxRunGenerationRef.current) return
        if (!isCancelled && isMountedRef.current) {
          setTaxCalculation(response)
        }
      } catch {
        if (runGeneration !== taxRunGenerationRef.current) return
        if (!isCancelled && isMountedRef.current) {
          setTaxCalculation(null)
        }
      }
    }, 150)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [open, billsQueryFetched, serviceItems, serviceItemsKey, clinicId, doctorId, calculateTax])

  const appliedTaxes = useMemo((): BillTax[] => {
    return (taxCalculation?.taxes ?? []).map((tax) => ({
      taxId: tax.taxId,
      name: tax.taxName,
      taxType: tax.taxType,
      taxValue: tax.taxRate,
      taxAmount: tax.totalAmount,
    }))
  }, [taxCalculation])

  const serviceTotal = useMemo(() => {
    if (taxCalculation) return taxCalculation.totalBaseAmount
    return items.reduce((sum, i) => sum + (i.total || 0), 0)
  }, [taxCalculation, items])
  const taxTotal = useMemo(() => {
    if (taxCalculation) return taxCalculation.totalTaxAmount
    return 0
  }, [taxCalculation])
  const discountAmount = discountValue
  const hasSummaryTax = Math.abs(taxTotal) > 1e-6
  const hasSummaryDiscount = Math.abs(discountAmount) > 1e-6
  const preDiscountTotal = taxCalculation?.grandTotal ?? serviceTotal + taxTotal
  /** Maximum discount = subtotal + tax (amount before discount). */
  const maxDiscountAllowed = preDiscountTotal
  const discountExceedsSubtotalAndTax =
    maxDiscountAllowed >= 0 && discountValue > maxDiscountAllowed + 1e-6
  const totalAmount = Math.max(0, preDiscountTotal - discountAmount)
  const actualAmount = serviceTotal

  /** Per-row amounts ex. tax: align table with Subtotal (totalBaseAmount) from tax API. */
  const itemExTaxDisplay = useMemo(() => {
    const breakdown = taxCalculation?.breakdown
    if (!breakdown?.length) {
      return items.map((item) => ({
        unitExTax: item.price,
      }))
    }
    return items.map((item, index) => {
      const byIndex = breakdown[index]
      const row =
        byIndex && String(byIndex.serviceId) === String(item.serviceId)
          ? byIndex
          : breakdown.find((b) => String(b.serviceId) === String(item.serviceId))
      const qty = row && row.quantity > 0 ? row.quantity : item.qty
      if (row && qty > 0) {
        return {
          unitExTax: row.baseAmount / qty,
        }
      }
      return {
        unitExTax: item.price,
      }
    })
  }, [items, taxCalculation?.breakdown])

  const handleAddItem = useCallback((item: BillItem) => {
    setItems((prev) => [...prev, item])
    setAddServiceOpen(false)
    setEditingIndex(null)
  }, [])

  const handleUpdateItem = useCallback((index: number, item: BillItem) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? item : it))
    )
    setAddServiceOpen(false)
    setEditingIndex(null)
  }, [])

  const handleEditItem = useCallback((index: number) => {
    setEditingIndex(index)
    setAddServiceOpen(true)
  }, [])

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setEditingIndex(null)
  }, [])

  const defaultValues: BillFormValues = useMemo(
    () => ({
      _items: [],
      _discountValue: 0,
      _paymentStatus: "unpaid",
    }),
    []
  )

  const handleSubmit = useCallback(
    async (_data: BillFormValues) => {
      const cap = taxCalculation?.grandTotal ?? serviceTotal + taxTotal
      if (cap >= 0 && discountValue > cap + 1e-6) {
        return
      }
      const itemsToSave = lineItemsWithPreTaxBase(items, taxCalculation)
      const payload: BillPayload = {
        encounter: encounterId,
        clinic: clinicId,
        patient: patientId,
        doctor: doctorId || undefined,
        title: encounter.service?.name
          ? `${encounter.service.name}`
          : "General Consultation Bill",
        items: itemsToSave,
        taxes: appliedTaxes,
        discount: discountValue,
        serviceTotal,
        taxTotal,
        totalAmount,
        actualAmount,
        paymentStatus,
      }

      if (existingBill?._id) {
        await updateBillMutation.mutateAsync({
          id: existingBill._id,
          data: {
            paymentStatus,
            items: itemsToSave,
            taxes: appliedTaxes,
            discount: discountValue,
            serviceTotal,
            taxTotal,
            totalAmount,
            actualAmount,
            title: payload.title,
          },
        })
      } else {
        await createBillMutation.mutateAsync(payload)
      }

      onSuccess?.()
      onOpenChange(false)
      setItems([])
      setDiscountValue(0)
      setPaymentStatus("unpaid")
    },
    [
      encounterId,
      clinicId,
      patientId,
      doctorId,
      encounter.service?.name,
      items,
      appliedTaxes,
      discountValue,
      serviceTotal,
      taxTotal,
      totalAmount,
      actualAmount,
      paymentStatus,
      taxCalculation?.grandTotal,
      existingBill?._id,
      createBillMutation,
      updateBillMutation,
      onSuccess,
      onOpenChange,
    ]
  )

  if (!encounterId || !clinicId || !patientId) {
    return null
  }

  return (
    <>
      <GenericFormDialog<typeof billFormSchema>
        title="Edit Bill"
        hideTrigger
        open={open}
        onOpenChange={onOpenChange}
        formSchema={billFormSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        dialogSize="xl"
        cancelButtonText="Cancel"
        submitButtonText="Save"
        hideSubmitButton={false}
        submitDisabled={items.length === 0 || discountExceedsSubtotalAndTax}
        renderContent={() => (
          <div className="space-y-6">
            {/* Add items in billing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Add items in billing</h3>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                  onClick={() => setAddServiceOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Service
                </Button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="py-3 font-semibold text-foreground">Sr. No</TableHead>
                      <TableHead className="py-3 font-semibold text-foreground">Services</TableHead>
                      <TableHead className="py-3 font-semibold text-foreground">Quantity</TableHead>
                      <TableHead className="py-3 font-semibold text-foreground">Price</TableHead>
                      <TableHead className="py-3 font-semibold text-foreground">Payment Status</TableHead>
                      <TableHead className="py-3 font-semibold text-foreground w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          No items added. Click &quot;Add Service&quot; to add services.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => {
                        const ex = itemExTaxDisplay[index] ?? {
                          unitExTax: item.price,
                        }
                        return (
                        <TableRow
                          key={index}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="px-4 py-3">{index + 1}</TableCell>
                          <TableCell className="px-4 py-3 font-medium">{item.name}</TableCell>
                          <TableCell className="px-4 py-3">{item.qty}</TableCell>
                          <TableCell className="px-4 py-3">{formatCurrency(ex.unitExTax)}</TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                paymentStatus === "paid"
                                  ? "bg-green-500/15 text-green-600 border-green-500/30"
                                  : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                              )}
                            >
                              {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="cursor-pointer"
                                      onClick={() => handleEditItem(index)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="cursor-pointer text-red-500"
                                      onClick={() => handleRemoveItem(index)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Discount section */}
            <div className="space-y-3">
              <div className="flex flex-col items-end justify-end">
                <Label htmlFor="discount-value" className="self-end flex items-center gap-2">
                  <span>Discount Value</span>
                  <div className="flex items-center gap-1">
                  </div>
                </Label>
                <div className="relative mt-3 w-full max-w-[200px]">
                  {currencyPrefix && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      {currencyPrefix}
                    </div>
                  )}
                  <Input
                    id="discount-value"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    aria-invalid={discountExceedsSubtotalAndTax}
                    className={cn(
                      currencyPrefix && "pl-8",
                      (currencyPostfix || discountExceedsSubtotalAndTax) && "pr-10",
                      discountExceedsSubtotalAndTax &&
                        "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
                    )}
                    value={discountValue === 0 ? "" : discountValue}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === "" || raw === "-") {
                        setDiscountValue(0)
                        return
                      }
                      const n = parseFloat(raw)
                      setDiscountValue(Number.isFinite(n) ? n : 0)
                    }}
                  />
                  {currencyPostfix && !discountExceedsSubtotalAndTax && (
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                      {currencyPostfix}
                    </div>
                  )}
                  {discountExceedsSubtotalAndTax ? (
                    <AlertCircle
                      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-destructive"
                      aria-hidden
                    />
                  ) : null}
                </div>
                {discountExceedsSubtotalAndTax ? (
                  <p
                    className="mt-1.5 text-right text-sm text-destructive"
                    role="alert"
                  >
                    Discount value cannot be greater than subtotal + tax
                  </p>
                ) : null}
              </div> 
            </div>

            {/* Payment summary */}
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold">Payment</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(serviceTotal)}</span>
              </div>

              {hasSummaryTax ? (
                <Collapsible open={taxExpanded} onOpenChange={setTaxExpanded}>
                  <div className="flex justify-between text-sm items-center">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        Tax
                        {taxExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <span>{formatCurrency(taxTotal)}</span>
                  </div>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-md bg-muted/50 p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Applied Tax
                      </p>
                      {appliedTaxes.map((t, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm"
                        >
                          <span>{t.name}</span>
                          <span className="text-destructive font-medium">
                            {formatCurrency(t.taxAmount)}
                          </span>
                        </div>
                      ))}
                      {appliedTaxes.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No taxes applied
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}

              {hasSummaryDiscount ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span>{formatCurrency(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold text-primary pt-2 border-t">
                <span>Grand Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="space-y-3">
              <Label>Payment Status</Label>
              <RadioGroup
                value={paymentStatus}
                onValueChange={(v) =>
                  setPaymentStatus(v as "paid" | "unpaid")
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid" id="status-paid" />
                  <Label htmlFor="status-paid" className="font-normal cursor-pointer">
                    Paid
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unpaid" id="status-unpaid" />
                  <Label htmlFor="status-unpaid" className="font-normal cursor-pointer">
                    Unpaid
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-blue-500 dark:text-amber-500">
                Note: To close encounter, invoice payment is mandatory
              </p>
            </div>
          </div>
        )}
      />

      <AddServiceDialog
        open={addServiceOpen}
        onOpenChange={(open) => {
          setAddServiceOpen(open)
          if (!open) setEditingIndex(null)
        }}
        onAdd={handleAddItem}
        onUpdate={handleUpdateItem}
        editingItem={editingIndex != null ? items[editingIndex] ?? null : null}
        editingIndex={editingIndex}
        clinicId={clinicId}
        doctorId={doctorId}
      />
    </>
  )
}
