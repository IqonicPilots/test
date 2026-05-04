"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Eye, Mail, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { TaxFormDialog } from "./tax-form-dialog"
import { TaxViewDialog } from "./tax-view-dialog"
import type { Tax, TaxPayload } from "@/types/tax.types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface GetColumnsHandlers {
  onDeleteTax: (id: string) => void
  onToggleStatus: (id: string) => void
  onUpdateTax: (id: string, tax: Partial<TaxPayload>) => void
  onAddTax: (tax: TaxPayload) => void
  can: (permission: string) => boolean
  formatCurrency: (v: number, options?: { decimals?: number; hidePostfix?: boolean }) => string
}

function getTaxDoctorDisplayName(doctor: unknown): string {
  if (!doctor || typeof doctor !== "object") return "Doctor"
  const d = doctor as { fullName?: string; firstName?: string; lastName?: string }
  return (
    d.fullName ||
    `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
    "Doctor"
  )
}

function getTaxDoctorListLine(doctor: unknown): string {
  const name = getTaxDoctorDisplayName(doctor)
  if (!doctor || typeof doctor !== "object") return name
  const email = (doctor as { email?: string }).email
  if (email && String(email).trim()) return `${name} — ${String(email).trim()}`
  return name
}

function getTaxServiceName(service: unknown): string {
  if (!service || typeof service !== "object") return "Service"
  return String((service as { name?: string }).name || "Service")
}

function TaxDoctorsColumnCell({ taxDoctors }: { taxDoctors: unknown[] }) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openPopover = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => () => clearCloseTimer(), [])

  if (taxDoctors.length === 0) {
    return (
      <div className="hidden lg:flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">AD</AvatarFallback>
        </Avatar>
        <span className="text-sm">All Doctor</span>
      </div>
    )
  }

  const firstDoctor = taxDoctors[0]
  const fullName = getTaxDoctorDisplayName(firstDoctor)
  const doctorEmail =
    firstDoctor && typeof firstDoctor === "object" && "email" in firstDoctor
      ? String((firstDoctor as { email?: string }).email || "").trim()
      : ""
  const doctorImage =
    firstDoctor && typeof firstDoctor === "object" && "meta" in firstDoctor
      ? String((firstDoctor as { meta?: { profilePicture?: string } }).meta?.profilePicture || "")
      : ""
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
  const extra = taxDoctors.length - 1
  const restDoctors = taxDoctors.slice(1)

  if (taxDoctors.length === 1) {
    return (
      <div className="hidden lg:flex items-center gap-2 min-w-0">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={doctorImage} alt={fullName} />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm">{fullName}</span>
          {doctorEmail && (
            <span className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">
                {doctorEmail}
              </span>
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex items-center gap-2 min-w-0">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={doctorImage} alt={fullName} />
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm">{fullName}</span>
        <div className="flex items-center gap-1">
          {doctorEmail && (
            <span className="flex items-start gap-1 min-w-0">
              <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">
                {doctorEmail}
              </span>
            </span>
          )}
          <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="mt-0.5 w-fit inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500/25 transition-colors"
                onMouseEnter={openPopover}
                onMouseLeave={scheduleClose}
              >
                +{extra}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 max-h-48 overflow-y-auto p-3"
              align="start"
              side="bottom"
              onMouseEnter={openPopover}
              onMouseLeave={scheduleClose}
            >
              <div className="flex flex-col gap-1.5">
                {restDoctors.map((doctor, i) => {
                  const d = doctor && typeof doctor === "object" ? (doctor as { _id?: string }) : null
                  return (
                    <span
                      key={d?._id ?? i}
                      className="inline-flex items-start rounded px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 w-full break-words [overflow-wrap:anywhere]"
                    >
                      {getTaxDoctorListLine(doctor)}
                    </span>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

function TaxServicesColumnCell({
  taxServices,
  formatCurrency,
}: {
  taxServices: unknown[]
  formatCurrency: (v: number, options?: { hidePostfix?: boolean }) => string
}) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openPopover = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => () => clearCloseTimer(), [])

  if (taxServices.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">AS</AvatarFallback>
        </Avatar>
        <span className="text-sm">All Service</span>
      </div>
    )
  }

  const first = taxServices[0]
  const serviceName = getTaxServiceName(first)
  const serviceImage =
    first && typeof first === "object" ? String((first as { serviceImage?: string }).serviceImage || "") : ""
  const extra = taxServices.length - 1
  const rest = taxServices.slice(1)
  const initials = serviceName.substring(0, 2).toUpperCase()

  if (taxServices.length === 1) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={serviceImage} alt={serviceName} />
          <AvatarFallback className="text-xs font-semibold font-medium bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm min-w-0 [overflow-wrap:anywhere]">{serviceName}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={serviceImage} alt={serviceName} />
        <AvatarFallback className="text-xs font-semibold font-medium bg-primary/10 text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap items-center gap-2 min-w-0 min-h-[1.5rem]">
        <span className="font-medium text-sm min-w-0 [overflow-wrap:anywhere]">{serviceName}</span>
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500/25 transition-colors"
              onMouseEnter={openPopover}
              onMouseLeave={scheduleClose}
            >
              +{extra}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 max-h-48 overflow-y-auto p-3"
            align="start"
            side="bottom"
            onMouseEnter={openPopover}
            onMouseLeave={scheduleClose}
          >
            <div className="flex flex-col gap-1.5">
              {rest.map((raw, i) => {
                if (!raw || typeof raw !== "object") return null
                const s = raw as { _id?: string; name?: string; charges?: number; duration?: number }
                return (
                  <div
                    key={s._id ?? i}
                    className="rounded px-2.5 py-1.5 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 w-full min-w-0"
                  >
                    <div className="font-medium [overflow-wrap:anywhere]">{getTaxServiceName(s)}</div>

                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export function getColumns({
  onDeleteTax,
  onToggleStatus,
  onUpdateTax,
  onAddTax,
  can,
  formatCurrency,
}: GetColumnsHandlers): ColumnDef<Tax>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" className="hidden xl:table-cell" />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt
        return (
          <span className="hidden xl:table-cell">
            {date ? new Date(date).toLocaleDateString() : "N/A"}
          </span>
        )
      },
    },
    {
      accessorKey: "taxName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tax Name" />,
      cell: ({ row }) => <span className="font-medium text-sm">{row.getValue("taxName")}</span>,
    },
    {
      accessorKey: "taxRate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tax Rate" />,
      cell: ({ row }) => {
        const tax = row.original
        const isPercent = tax.type === "percentage"
        return (
          <span className="text-sm font-semibold text-foreground">
            {isPercent ? `${tax.taxRate}%` : formatCurrency(tax.taxRate, { hidePostfix: true })}
          </span>
        )
      },
    },
    {
      accessorKey: "clinicId",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" className="hidden md:table-cell" />,
      cell: ({ row }) => {
        const tax = row.original
        const clinic = tax.clinicId

        if (!clinic) {
          return (
            <div className="hidden md:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">AC</AvatarFallback>
              </Avatar>
              <span className="text-sm">All Clinic</span>
            </div>
          )
        }

        const clinicName = typeof clinic === "object" ? clinic.name : "Clinic"
        const clinicEmail = typeof clinic === "object" ? clinic.email || "" : ""
        const clinicLogo = typeof clinic === "object" ? clinic.cliniclogo || "" : ""

        return (
          <div className="hidden md:flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={clinicLogo} alt={clinicName} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {clinicName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{clinicName}</span>
              {clinicEmail && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{clinicEmail}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const clinic = row.original.clinicId
        if (value === "all_clinic") return !clinic

        const clinicId = typeof clinic === 'string' ? clinic : clinic?._id
        return clinicId === value
      }
    },
    {
      accessorKey: "doctorIds",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Doctor" className="hidden lg:table-cell" />,
      cell: ({ row }) => {
        const tax = row.original
        const taxDoctors = Array.isArray(tax.doctorIds) ? tax.doctorIds : []
        return <TaxDoctorsColumnCell taxDoctors={taxDoctors} />
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const rowDoctors = row.original.doctorIds || []
        if (value === "all_doctor") return rowDoctors.length === 0

        return Array.isArray(rowDoctors) && rowDoctors.some(doc => {
          const docId = typeof doc === 'string' ? doc : doc._id
          return docId === value
        })
      }
    },
    {
      accessorKey: "serviceIds",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Service" />,
      cell: ({ row }) => {
        const tax = row.original
        const taxServices = Array.isArray(tax.serviceIds) ? tax.serviceIds : []
        return <TaxServicesColumnCell taxServices={taxServices} formatCurrency={formatCurrency} />
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const rowServices = row.original.serviceIds || []
        if (value === "all_service") return rowServices.length === 0

        return Array.isArray(rowServices) && rowServices.some(srv => {
          const srvId = typeof srv === 'string' ? srv : srv._id
          return srvId === value
        })
      }
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const tax = row.original
        return (
          <Switch
            checked={tax.isActive}
            onCheckedChange={() => onToggleStatus(tax._id)}
            className="cursor-pointer"
            disabled={!can("tax_edit")}
          />
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true
        const isActive = value === "Active"
        return row.original.isActive === isActive
      }
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const tax = row.original
        const [showDelete, setShowDelete] = useState(false)
        return (
          <div className="flex items-center gap-1">
            {can("tax_view") && (
              <TaxViewDialog
                tax={tax}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Eye />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}
            {can("tax_edit") && (
              <TaxFormDialog
                taxToEdit={tax}
                onAddTax={onAddTax}
                onUpdateTax={onUpdateTax}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Pencil />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}
            {can("tax_delete") && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton
                      color="red"
                      onClick={() => setShowDelete(true)} 
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>

                <ConfirmDialog
                  title="Delete Tax"
                  description={`Are you sure you want to delete ${tax.taxName}?`}
                  confirmText="Delete"
                  variant="destructive"
                  open={showDelete}
                  onOpenChange={setShowDelete}
                  onConfirm={async () => {
                    await onDeleteTax(tax._id)
                    setShowDelete(false)
                  }}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]
}
