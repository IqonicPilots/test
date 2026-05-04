"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Activity, Printer, Trash2, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { BillViewDialog } from "./bill-view-dialog"
import type { Bill } from "@/types/bill.types"
import { usePermissions } from "@/hooks/use-permissions"
import { generateAndPrintInvoice } from "@/components/invoice/print-invoice-pdf"
import { encounterService } from "@/services/encounter.service"
import { appointmentService } from "@/services/appointment.service"
import { useDeleteBill } from "@/hooks/api/use-bills"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"

const generateAvatar = (name?: string) => {
  if (!name) return "U"
  const words = name.trim().split(" ")
  return words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const getEmail = (value: any) => {
  if (!value || typeof value !== "object") return undefined
  return (
    value.email ||
    value.userEmail ||
    value.clinicEmail ||
    value?.user?.email ||
    value?.clinicAdmin?.email
  )
}

const getAvatarUrl = (value: any, type: "person" | "clinic") => {
  if (!value || typeof value !== "object") return undefined
  if (type === "clinic") {
    return value.cliniclogo || value.logo
  }
  return (
    value?.meta?.profilePicture ||
    value?.meta?.avatar ||
    value?.profilePicture ||
    value?.avatar
  )
}

const getPatientInfo = (bill: Bill) => {
  const patient = bill.patient
  if (!patient || typeof patient === "string") return null
  const p = patient as { fullName?: string; firstName?: string; lastName?: string }
  return {
    name: p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown",
    email: getEmail(patient),
    avatar: getAvatarUrl(patient, "person"),
  }
}

const getDoctorInfo = (bill: Bill) => {
  const doctor = bill.doctor
  if (!doctor || typeof doctor === "string") return null
  const d = doctor as { fullName?: string; firstName?: string; lastName?: string }
  return {
    name: d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Unknown",
    email: getEmail(doctor),
    avatar: getAvatarUrl(doctor, "person"),
  }
}

const getClinicInfo = (bill: Bill) => {
  const clinic = bill.clinic
  if (!clinic || typeof clinic === "string") return null
  const c = clinic as { name?: string; clinicName?: string }
  return {
    name: c.name || c.clinicName || "Unknown",
    email: getEmail(clinic),
    avatar: getAvatarUrl(clinic, "clinic"),
  }
}

export function getColumns(formatCurrency: (value: number) => string, role?: string): ColumnDef<Bill>[] {
  const columns: ColumnDef<Bill>[] = [
    {
      accessorKey: "billId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bill ID" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-mono font-medium text-muted-foreground uppercase">
          {row.getValue("billId") || "-"}
        </span>
      ),
    },
    {
      id: "patient",
      accessorFn: (row) => getPatientInfo(row)?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Patient" />
      ),
      cell: ({ row }) => {
        const bill = row.original
        const info = getPatientInfo(bill)
        if (!info) return <span className="text-muted-foreground">-</span>

        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={info.avatar} alt={info.name} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(info.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{info.name}</span>
              {info.email && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{info.email}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "doctor",
      accessorFn: (row) => getDoctorInfo(row)?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Doctor" className="hidden md:table-cell" />
      ),
      cell: ({ row }) => {
        const bill = row.original
        const info = getDoctorInfo(bill)
        if (!info) return <span className="hidden md:table-cell text-muted-foreground">-</span>

        return (
          <div className="hidden md:flex items-center gap-3 min-w-[160px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={info.avatar} alt={info.name} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(info.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{info.name}</span>
              {info.email && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{info.email}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: "clinic",
      accessorFn: (row) => getClinicInfo(row)?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clinic" className="hidden lg:table-cell" />
      ),
      cell: ({ row }) => {
        const bill = row.original
        const info = getClinicInfo(bill)
        if (!info) return <span className="hidden lg:table-cell text-muted-foreground">-</span>

        return (
          <div className="hidden lg:flex items-center gap-3 min-w-[140px]">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={info.avatar} alt={info.name} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {generateAvatar(info.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{info.name}</span>
              {info.email && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{info.email}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service Name" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="hidden sm:inline-block text-sm font-medium">{row.getValue("title") || "-"}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {formatCurrency(Number(row.getValue("totalAmount")) || 0)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment Status" />
      ),
      cell: ({ row }) => {
        const status = (row.getValue("paymentStatus") as string) || "unpaid"
        const displayLabel = status === "paid" ? "Paid" : "Unpaid"
        return (
          <StatusBadge status={displayLabel} />
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const bill = row.original
        return (
          <BillActionCell bill={bill} />
        )
      },
    },
  ]

  if (role === "doctor") {
    return columns.filter((col) => col.id !== "doctor")
  }

  if (role === "patient") {
    return columns.filter((col) => col.id !== "patient")
  }

  return columns
}

function BillActionCell({ bill }: { bill: Bill }) {
  const router = useRouter()
  const [isPrinting, setIsPrinting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const encounterId = typeof bill.encounter === "string" ? bill.encounter : (bill.encounter as { _id?: string })?._id
  const { can } = usePermissions()
  const deleteMutation = useDeleteBill()

  const { currencyPrefix, currencyPostfix } = useCurrencyFormatter()
  const handlePrint = async () => {
    try {
      setIsPrinting(true)
      let activeAppt = undefined
      if (encounterId) {
        try {
          const encounter = await encounterService.getEncounterById(encounterId)
          const apptId = typeof encounter.appointment === "string" ? encounter.appointment : (encounter.appointment as any)?._id
          if (apptId) {
            activeAppt = await appointmentService.getAppointmentById(apptId)
          }
        } catch (error) {
          console.error("Failed to fetch appointment for bill:", error)
        }
      }
      await generateAndPrintInvoice(bill, activeAppt, currencyPrefix, currencyPostfix)
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(bill._id)
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center gap-1">
      {can("billing_view") && (
        <BillViewDialog
          bill={bill}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <ActionIconButton>
                  <Eye className="size-3.5" />
                </ActionIconButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>View</p>
              </TooltipContent>
            </Tooltip>
          }
        />
      )}
      {can("billing_print") && (
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionIconButton
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <div className="size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Printer className="size-3.5" />
              )}
            </ActionIconButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>Print</p>
          </TooltipContent>
        </Tooltip>
      )}
      {encounterId && can("encounter_dashboard") && can("billing_encounter") && (
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionIconButton
              onClick={() =>
                router.push(`/encounters/add?encounterId=${encounterId}`)
              }
            >
              <Activity className="size-3.5" />
            </ActionIconButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>Encounter</p>
          </TooltipContent>
        </Tooltip>
      )}
      {can("billing_delete") && (
        <>
          <ActionIconButton
            title="Delete Bill"
            color="red"
            onClick={() => {
              if (bill.paymentStatus === "paid") {
                toast.error("Cannot delete bill because it is already paid.")
                return
              }
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 className="size-3.5" />
          </ActionIconButton>

          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title="Delete Billing Record?"
            description="Are you sure you want to permanently delete this bill? This will also re-open the associated encounter for re-billing."
            onConfirm={handleDelete}
            variant="destructive"
            confirmText="Delete"
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  )
}
