"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Mail, Pencil, Trash2, Video } from "lucide-react"
import { useState } from "react"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Switch } from "@/components/ui/switch"
import type { Service } from "@/types/service.types"
import type { Doctor } from "@/types/doctor.types"
import type { Clinic } from "@/types/clinic.types"
import { ServiceFormDialog } from "./service-form-dialog"
import { ServiceViewDialog } from "./service-view-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ServiceColumnHandlers {
  onDeleteService: (id: string) => void
  onToggleStatus: (id: string, nextStatus: boolean) => void
  allDoctors: Doctor[]
  allClinics: Clinic[]
  formatCurrency: (value: number) => string
  onClinicsLoadMore?: () => void
  onClinicsSearchChange?: (value: string) => void
  hasNextClinicsPage?: boolean
  isFetchingNextClinicsPage?: boolean
  onDoctorsLoadMore?: () => void
  onDoctorsSearchChange?: (value: string) => void
  hasNextDoctorsPage?: boolean
  isFetchingNextDoctorsPage?: boolean
  isClinicsLoading?: boolean
  isDoctorsLoading?: boolean
  role?: string
}

export function getColumns({
  onDeleteService,
  onToggleStatus,
  allDoctors,
  allClinics,
  formatCurrency,
  onClinicsLoadMore,
  onClinicsSearchChange,
  hasNextClinicsPage,
  isFetchingNextClinicsPage,
  isClinicsLoading,
  role
}: ServiceColumnHandlers): ColumnDef<Service>[] {
  const columns: ColumnDef<Service>[] = [
    {
      id: "service",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Service" />
      ),
      cell: ({ row }) => {
        const svc = row.original
        const name = svc.name || "N/A"
        const avatarText = name?.trim()?.substring(0, 2).toUpperCase() || "NA"
        return (
          <div className="flex items-center gap-2">
            <div className="relative flex shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={svc.serviceImage} alt={name} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {avatarText}
                </AvatarFallback>
              </Avatar>
              {svc.telemed_service && (
                <div 
                  className="absolute -top-1.5 -left-1.5 bg-background rounded-full p-[1px] shadow-sm ring-1 ring-border/50"
                  title="Telemedicine Service"
                >
                  <div className="bg-blue-500/10 rounded-full w-[16px] h-[16px] flex items-center justify-center">
                    <Video className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm">{name}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "clinic",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clinic" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => {
        const svc = row.original
        const clinicValue = Array.isArray(svc.clinic)
          ? svc.clinic[0]
          : svc.clinic
        const clinic = clinicValue && typeof clinicValue === "object"
          ? (clinicValue as Record<string, unknown>)
          : ({ name: (clinicValue as string) || "N/A", _id: "" } as Record<
              string,
              unknown
            >)
        const clinicId =
          typeof clinic._id === "string"
            ? clinic._id
            : typeof clinicValue === "string"
              ? clinicValue
              : ""
        const clinicFromList = clinicId
          ? allClinics.find((c) => c._id === clinicId)
          : undefined

        const clinicName = String(clinic.name || clinicFromList?.name || "N/A")
        const clinicEmail =
          (typeof clinic.email === "string" && clinic.email) ||
          clinicFromList?.email ||
          ""
        const clinicLogoRaw =
          (typeof clinic.cliniclogo === "string" && clinic.cliniclogo) ||
          clinicFromList?.cliniclogo ||
          ""
        const clinicLogo = typeof clinicLogoRaw === "string" ? clinicLogoRaw : ""
        return (
          <div className="items-center gap-2 hidden sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarImage src={clinicLogo} alt={clinicName} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {clinicName?.trim()?.substring(0, 2).toUpperCase() || "NA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm">
                {clinicName || "N/A"}
              </span>
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
        const val = row.getValue(id)
        const clinicId = val && typeof val === 'object' ? (val as any)._id : String(val)
        return clinicId === value
      },
    },
    {
      id: "doctor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Doctor" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => {
        const svc = row.original
        let doctorName = "N/A"
        let doctorEmail = ""
        let doctorImage = ""

        if (svc.doctor) {
          if (typeof svc.doctor === "object") {
            doctorName =
              svc.doctor.name ||
              `${svc.doctor.firstName || ""} ${svc.doctor.lastName || ""}`.trim() ||
              "N/A"
            doctorEmail =
              typeof (svc.doctor as unknown as { email?: string }).email ===
              "string"
                ? (svc.doctor as unknown as { email?: string }).email || ""
                : ""
            doctorImage =
              (svc.doctor as unknown as { meta?: { profilePicture?: string } })
                .meta?.profilePicture ||
              (svc.doctor as unknown as { profilePicture?: string })
                .profilePicture ||
              ""
          } else {
            const foundDoctor = allDoctors.find((d) => d._id === svc.doctor)
            if (foundDoctor) {
              doctorName = `${foundDoctor.firstName} ${foundDoctor.lastName}`
              doctorEmail = foundDoctor.email || ""
              doctorImage =
                foundDoctor.meta?.profilePicture ||
                foundDoctor.meta?.avatar ||
                ""
            }
          }
        }

        return (
          <div className="items-center gap-2 hidden sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarImage src={doctorImage} alt={doctorName} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {doctorName?.trim()?.substring(0, 2).toUpperCase() || "NA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm">{doctorName}</span>
              {doctorEmail && (
                <div className="flex items-start gap-1 min-w-0">
                  <Mail className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-words text-xs text-muted-foreground whitespace-normal [overflow-wrap:anywhere]">{doctorEmail}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const val = row.getValue(id)
        const doctorId = val && typeof val === 'object' ? (val as any)._id : String(val)
        return doctorId === value
      },
    },

    {
      accessorKey: "charges",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Charges" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {formatCurrency(Number(row.getValue("charges") || 0))}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => (
        <span className="text-sm hidden sm:inline-flex">{row.getValue("duration")} min</span>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" className="hidden sm:table-cell" />
      ),
      cell: ({ row }) => {
        const svc = row.original
        const categoryLabel =
          svc.category && typeof svc.category === "object"
            ? (svc.category as any).label
            : svc.category || "N/A"
        return (
          <span className="text-sm hidden sm:inline-flex">
            {categoryLabel as string}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        if (!value || value === "all") return true
        const val = row.getValue(id)
        if (typeof val === "object" && val !== null) {
          return (val as { _id: string })._id === value
        }
        return String(val) === value
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const svc = row.original
        const { can } = usePermissions()
        return (
          <Switch
            checked={svc.isActive}
            disabled={!can("service_edit")}
            onCheckedChange={(checked) => onToggleStatus(svc._id, checked)}
            className="cursor-pointer"
          />
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true
        return String(row.getValue(id)) === value
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: function ActionCell({ row }) {
        const svc = row.original
        const { can } = usePermissions()
        const [showDelete, setShowDelete] = useState(false)

        return (
          <div className="flex items-center gap-1">
            {can("service_view") && (
              <ServiceViewDialog
                service={svc}
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
            {can("service_edit") && (
              <ServiceFormDialog
                serviceToEdit={svc}
                clinics={allClinics}
                allClinics={allClinics}
                allDoctors={allDoctors}
                onClinicsLoadMore={onClinicsLoadMore}
                onClinicsSearchChange={onClinicsSearchChange}
                hasNextClinicsPage={hasNextClinicsPage}
                isFetchingNextClinicsPage={isFetchingNextClinicsPage}
                isClinicsLoading={isClinicsLoading}
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
            {can("service_delete") && (
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
                  title="Delete Service"
                  description={`Are you sure you want to delete ${svc.name}?`}
                  confirmText="Delete"
                  variant="destructive"
                  open={showDelete}
                  onOpenChange={setShowDelete}
                  onConfirm={async () => {
                    await onDeleteService(svc._id);
                    setShowDelete(false);
                  }}
                />
              </>
            )}
          </div>
        )
      },
    },
  ]

  if (role === "doctor") {
    return columns.filter((col) => col.id !== "doctor")
  }

  return columns
}
