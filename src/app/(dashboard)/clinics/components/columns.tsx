"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Key, Eye } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { ClinicFormDialog } from "./clinic-form-dialog"
import { ResendCredentialsDialog } from "@/components/resend-credentials-dialog"
import type { Clinic } from "@/types/clinic.types"
import { usePermissions } from "@/hooks/use-permissions"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ClinicViewDialog } from "./clinic-view-dialog"

interface GetColumnsHandlers {
  onDeleteClinic: (id: string) => void
  onToggleStatus: (id: string, nextStatus: boolean) => void
  onResendCredentials: (user: { id: string; name: string; email: string; avatar?: string; role?: string }) => Promise<void>
}

const SPECIALIZATIONS_MAX_VISIBLE = 2

function SpecializationsOverflowCell({ specs, title }: { specs: string[], title: string }) {
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

  const visible = specs.slice(0, SPECIALIZATIONS_MAX_VISIBLE)
  const extra = specs.length - SPECIALIZATIONS_MAX_VISIBLE

  const tagClassName = "inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"

  if (specs.length <= SPECIALIZATIONS_MAX_VISIBLE) {
    return (
      <div className="flex flex-wrap gap-1 items-center hidden lg:flex">
        {specs.map((spec) => (
          <span key={typeof spec === "string" ? spec : (spec as any)._id} className={tagClassName}>
            {typeof spec === "string" ? spec : (spec as any).label || (spec as any).value || (spec as any).name || ""}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 items-center hidden lg:flex">
      {visible.map((spec) => (
        <span key={typeof spec === "string" ? spec : (spec as any)._id} className={tagClassName}>
          {typeof spec === "string" ? spec : (spec as any).label || (spec as any).value || (spec as any).name || ""}
        </span>
      ))}
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
          className="w-56 max-h-48 overflow-y-auto p-3"
          align="start"
          side="bottom"
          onMouseEnter={openPopover}
          onMouseLeave={scheduleClose}
        >
          <div className="flex flex-col gap-1.5">
            {specs.slice(SPECIALIZATIONS_MAX_VISIBLE).map((spec) => {
              const specId = typeof spec === "string" ? spec : (spec as any)._id
              return (
                <span key={specId} className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 w-fit">
                  {typeof spec === "string" ? spec : (spec as any).label || (spec as any).value || (spec as any).name || ""}
                </span>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}


export function getColumns({ onDeleteClinic, onToggleStatus, onResendCredentials }: GetColumnsHandlers): ColumnDef<Clinic>[] {
  return [
    {
      id: "clinic",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic" />,
      cell: ({ row }) => {
        const clinic = row.original
        const avatar = clinic.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        const clinicLogo = clinic.cliniclogo

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={`${clinic.name} logo`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <AvatarFallback className={`text-xs font-semibold bg-primary/10 text-primary ${clinicLogo ? 'hidden' : ''}`}>
                {avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{clinic.name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {clinic.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "clinicAdmin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic Admin" className="hidden sm:table-cell" />,
      cell: ({ row }) => {
        const clinic = row.original
        const adminName = `${clinic.clinicAdmin?.firstName || ''} ${clinic.clinicAdmin?.lastName || ''}`.trim()
        const adminAvatar = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        const adminProfileImage = clinic.clinicAdmin?.meta?.profilePicture

        return (
          <div className="items-center gap-3 hidden sm:flex">
            <Avatar className="h-9 w-9">
              {adminProfileImage ? (
                <img
                  src={adminProfileImage}
                  alt={`${adminName} profile`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <AvatarFallback className={`text-xs font-semibold bg-primary/10 text-primary ${adminProfileImage ? 'hidden' : ''}`}>
                {adminAvatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{adminName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {clinic.clinicAdmin?.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" className="hidden md:table-cell" />,
      cell: ({ row }) => {
        const clinic = row.original
        const countryCode = clinic.countryCode || '+1'
        const mobile = clinic.mobile || ''
        const fullNumber = mobile ? `${countryCode} ${mobile}` : 'N/A'
        return <span className="text-sm font-medium hidden md:table-cell">{fullNumber}</span>
      },
    },
    {
      accessorKey: "specialties",
      header: "Specialization",
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true

        const specialties = row.getValue(id) as any[]

        if (!specialties || specialties.length === 0) return filterValue === "General"

        return specialties.some(s =>
          (s?.label || s?.value || s?.name || "").toLowerCase().includes(filterValue.toLowerCase())
        )
      },
      cell: ({ row }) => <SpecializationsOverflowCell specs={row.getValue("specialties") as any[]} title="All Specializations" />,
    },
    {
      accessorKey: "address",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Clinic Address" className="hidden lg:table-cell" />,
      cell: ({ row }) => {
        const address = row.getValue("address") as any
        const addressString = address ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''}, ${address.country || ''} ${address.postalCode || ''}`.trim() : 'No address'
        return <span className="text-sm text-muted-foreground max-w-[200px] truncate block hidden lg:block">{addressString}</span>
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const clinic = row.original
        return <Switch checked={clinic.isActive} onCheckedChange={(checked) => onToggleStatus(clinic._id, checked)} className="cursor-pointer" />
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const clinic = row.original
        const admin = clinic.clinicAdmin
        const adminName = `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() || "Unknown"
        const adminEmail = admin?.email || ""
        const [deleteId, setDeleteId] = useState<string | null>(null)
        const { can } = usePermissions()

        return (
          <div className="flex items-center gap-1">
            <ClinicViewDialog clinic={clinic} trigger={
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton>
                    <Eye className="size-4" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View</p>
                </TooltipContent>
              </Tooltip>
            } />
            {can("clinic_edit") && (
              <ClinicFormDialog
                clinicToEdit={clinic}
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
            {can("clinic_resend_credential") && (
              <ResendCredentialsDialog
                user={{
                  name: adminName,
                  email: adminEmail,
                  role: "Clinic Admin",
                  avatar: admin?.meta?.profilePicture || admin?.meta?.avatar || undefined,
                }}
                onConfirm={() => onResendCredentials({
                  id: admin?._id || "",
                  name: adminName,
                  email: adminEmail,
                  role: "Clinic Admin",
                  avatar: admin?.meta?.profilePicture || admin?.meta?.avatar || undefined,
                })}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton disabled={!adminEmail}>
                        <Key />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resend Credentials</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}
            {can("clinic_delete") && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton
                      color="red"
                      onClick={() => setDeleteId(clinic._id)}
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
                  title="Delete Clinic"
                  description={`Are you sure you want to delete ${clinic.name}?`}
                  confirmText="Delete"
                  variant="destructive"
                  onConfirm={async () => {
                    await onDeleteClinic(clinic._id)
                    setDeleteId(null)
                  }}
                  open={clinic._id === deleteId}
                  onOpenChange={(open) => setDeleteId(open ? clinic._id : null)}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]
}
