"use client"

import React, { useState } from "react"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { encounterService } from "@/services/encounter.service"
import { billApi } from "@/services/bill.service"
import { generateAndPrintInvoice } from "./print-invoice-pdf"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import type { Appointment } from "@/services/appointment.service"
import type { Bill } from "@/types/bill.types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

/**
 * A combined component that fetches the clinical bill for an appointment
 * and immediately triggers the PDF generation/print in a single click action.
 */
export function PrintAppointmentInvoice({
  appointment,
  variant = "list"
}: {
  appointment: Appointment;
  variant?: "list" | "dialog"
}) {
  const { currencyPrefix, currencyPostfix } = useCurrencyFormatter()
  const [loading, setLoading] = useState(false)

  const handleFetchAndPrint = async () => {
    try {
      setLoading(true)

      // 1. Get encounter for health record
      const encounter = await encounterService.getEncounterByAppointment(appointment._id)
      if (!encounter?._id) {
        toast.error("No clinical encounter found. Please check if encounter is created.")
        return
      }

      // 2. Fetch bill associated with this specific encounter
      const billData = await billApi.getAllBills(1, 1, { encounterId: encounter._id })
      if (!billData.data || billData.data.length === 0) {
        toast.error("No invoice generated yet for this encounter.")
        return
      }

      const activeBill = billData.data[0] as Bill

      // 3. Immediately trigger the PDF generation and preview
      await generateAndPrintInvoice(activeBill, appointment as any, currencyPrefix, currencyPostfix)

    } catch (error) {
      toast.error("An error occurred while generating the invoice.")
    } finally {
      setLoading(false)
    }
  }

  if (variant === "dialog") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer border border-border/40 shadow-sm transition-all border-primary/20"
        disabled={loading}
        onClick={handleFetchAndPrint}
      >
        {loading ? (
          <div className="size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <Printer className="size-3.5" />
        )}
        Print Invoice
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ActionIconButton
          disabled={loading}
          onClick={handleFetchAndPrint}
          className="border-destructive/50"
        >
          {loading ? (
            <div className="size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <Printer className="size-3.5" />
          )}
        </ActionIconButton>
      </TooltipTrigger>
      <TooltipContent>
        <p>Print Invoice</p>
      </TooltipContent>
    </Tooltip>
  )
}
