"use client"

import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { usePermissions } from "@/hooks/use-permissions"
import { Calendar, Key, Star, Trash2, Pencil, Eye, PlusCircle } from "lucide-react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DoctorViewDialog } from "./doctor-view-dialog"
import { Switch } from "@/components/ui/switch"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DoctorFormDialog } from "./doctor-form-dialog"
import { ResendCredentialsDialog } from "@/components/resend-credentials-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ServiceFormDialog } from "@/app/(dashboard)/services/components/service-form-dialog"
import { ReviewFormDialog } from "@/components/review-form-dialog"
import { useResendCredentials } from "@/hooks/api/use-auth"
import type { DoctorFormValues } from "./doctor-form-dialog"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import type { StaticData } from "@/types/listing.types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface DoctorTableRow {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  avatarUrl?: string
  mobile: string
  specializations: string[]
  clinic: string[]
  registeredOn: string
  status: string
  sourceDoctor: Doctor
}

interface ColumnHandlers {
  onDeleteDoctor: (id: string) => void
  onEditDoctor: (id: string, doctor: DoctorFormValues) => void | Promise<void>
  onAddDoctor: (doctor: DoctorFormValues) => void | Promise<void>
  onToggleStatus: (id: string, nextStatus: boolean) => void
  clinics: Clinic[]
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  isClinicsLoading?: boolean
  specialties: StaticData[]
  isBusy?: boolean
  isEditBusy?: boolean
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
          <span key={spec} className={tagClassName}>
            {spec}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 items-center hidden lg:flex">
      {visible.map((spec) => (
        <span key={spec} className={tagClassName}>
          {spec}
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
            {specs.slice(SPECIALIZATIONS_MAX_VISIBLE).map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center rounded px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400 w-fit"
              >
                {spec}
              </span>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function getColumns({
  onDeleteDoctor,
  onEditDoctor,
  onAddDoctor,
  onToggleStatus,
  clinics,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  specialties,
  isBusy = false,
  isEditBusy = false,
}: ColumnHandlers): ColumnDef<DoctorTableRow>[] {
  return [
    {
      id: "doctor",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Doctor" />
      ),
      cell: ({ row }) => {
        const doctor = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={doctor.avatarUrl} alt={`${doctor.firstName} ${doctor.lastName}`} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {doctor.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{doctor.firstName} {doctor.lastName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {doctor.email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      id: "clinic",
      accessorFn: (row) => row.clinic.join(", "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clinic" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => <SpecializationsOverflowCell specs={row.original.clinic} title="All Clinics" />,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return row.original.clinic.includes(value)
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone Number" className="hidden md:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium hidden md:table-cell">{row.getValue("mobile")}</span>
      ),
    },
    {
      id: "specializations",
      accessorFn: (row) => row.specializations.join(", "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Specialization" className="hidden lg:table-cell" />
      ),
      cell: ({ row }) => <SpecializationsOverflowCell specs={row.original.specializations} title="All Specializations" />,
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        return row.original.specializations.includes(value)
      },
    },

    {
      accessorKey: "registeredOn",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Registered On" className="hidden xl:table-cell" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("registeredOn") as string
        return (
          <span className="text-sm font-medium hidden xl:table-cell">
            {new Date(date).toLocaleDateString()}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const doctor = row.original
        const isActive = doctor.status === "Active"
        return (
          <Switch
            checked={isActive}
            disabled={isBusy}
            onCheckedChange={(checked) => onToggleStatus(doctor.id, checked)}
            className="cursor-pointer"
          />
        )
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const doctor = row.original
        const router = useRouter()
        const [deleteId, setDeleteId] = useState<string | null>(null)
        const { role, can } = usePermissions()
        const resendCredentialsMutation = useResendCredentials()

        const handleResendCredentials = async () => {
          if (!doctor.id) {
            throw new Error("Unable to resend credentials: missing user id.")
          }

          await resendCredentialsMutation.mutateAsync({ userId: doctor.id })
        }

        return (
          <div className="flex items-center gap-1">
            {can("doctor_view") && (
              <DoctorViewDialog
                doctor={doctor.sourceDoctor}
                trigger={
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
                }
              />
            )}

            {can("doctor_edit") && (
              <DoctorFormDialog
                mode="edit"
                doctor={doctor.sourceDoctor}
                clinics={clinics}
                onClinicsLoadMore={onClinicsLoadMore}
                onClinicsSearchChange={onClinicsSearchChange}
                hasNextClinicsPage={hasNextClinicsPage}
                isFetchingNextClinicsPage={isFetchingNextClinicsPage}
                isClinicsLoading={isClinicsLoading}
                specialties={specialties}
                isSubmitting={isEditBusy}
                onAddDoctor={onAddDoctor}
                onEditDoctor={(values) => onEditDoctor(doctor.id, values)}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton disabled={isEditBusy}>
                        <Pencil className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("doctor_review_get") && (
              <ReviewFormDialog
                role={role || undefined}
                doctorId={doctor.id}
                targetName={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Star className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reviews</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("doctor_resend_credential") && (
              <ResendCredentialsDialog
                user={{
                  name: `${doctor.firstName} ${doctor.lastName}`,
                  email: doctor.email || "",
                  role: "Doctor",
                  avatar: doctor.avatar
                }}
                onConfirm={handleResendCredentials}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <Key className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resend Credentials</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("doctor_session") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton onClick={() => router.push(`/doctor-sessions?doctorId=${doctor.id}`)}>
                    <Calendar className="size-4" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sessions</p>
                </TooltipContent>
              </Tooltip>
            )}

            {can("doctor_service") && (
              <ServiceFormDialog
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ActionIconButton>
                        <PlusCircle className="size-4" />
                      </ActionIconButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add Service</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}

            {can("doctor_delete") && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionIconButton
                      color="red"
                      onClick={() => setDeleteId(doctor.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                    >
                      <Trash2 className="size-4" />
                    </ActionIconButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>

                <ConfirmDialog
                  title="Delete Doctor"
                  description={`Are you sure you want to delete Dr. ${doctor.firstName} ${doctor.lastName}?`}
                  confirmText="Delete"
                  variant="destructive"
                  onConfirm={async () => {
                    await onDeleteDoctor(doctor.id)
                    setDeleteId(null)
                  }}
                  open={doctor.id === deleteId}
                  onOpenChange={(open) => setDeleteId(open ? doctor.id : null)}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]
}
