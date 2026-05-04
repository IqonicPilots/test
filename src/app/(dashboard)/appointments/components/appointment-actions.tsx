"use client"

import { useState } from "react"
import { Pencil, LogIn, LogOut, Trash2, Eye, Activity, XCircle, Star, Video, AlertCircle, Loader2 } from "lucide-react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import type { Appointment, AppointmentPayload } from "@/services/appointment.service"
import { AppointmentFormDialog } from "./appointment-form-dialog"
import { AppointmentViewDialog } from "./appointment-view-dialog"
import { useRegenerateTelemedLink } from "@/hooks/use-appointments"
import { encounterService } from "@/services/encounter.service"
import { getApiErrorMessage } from "@/lib/api/axios"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { ReviewFormDialog } from "@/components/review-form-dialog"
import { PrintAppointment } from "@/components/invoice/print-encounter-pdf-template"
import { parseTimeToMinutes } from "@/lib/calendar-time-utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AppointmentActionsProps {
  appointment: Appointment
  onAddAppointment: (data: AppointmentPayload) => void
  onUpdateAppointment: (id: string, data: Partial<AppointmentPayload>) => void
  onDeleteAppointment: (id: string) => void
  /** "list" = icon-only (table), "dialog" = icon+label (calendar dialog). Default "list" for columns. */
  variant?: "list" | "dialog"
}

export function AppointmentActions({
  appointment,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  variant = "list",
}: AppointmentActionsProps) {
  const router = useRouter()
  const { role, can } = usePermissions()
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const isPatient = role === "patient"
  const statusId = appointment.status?.id
  const isBooked = statusId === "booked"
  const isCheckedIn = statusId === "check_in" || statusId === "check-in"
  const isCheckedOut = statusId === "checkout" || statusId === "check_out" || statusId === "complete" || statusId === "completed"
  const isCancelled = statusId === "cancelled"

  const handleCheckOut = async () => {
    setIsCheckingStatus(true)
    try {
      const encounter = await encounterService.getEncounterByAppointment(appointment._id)

      // If an encounter exists and is explicitly marked as 'active', block checkout (represents an open/unpaid encounter).
      if (encounter && (encounter.encounter_status || encounter.status)?.toLowerCase() === "active") {
        toast.error("Please close the Encounter to checkout patient", {
          icon: <AlertCircle className="size-4 text-destructive" />
        })
        return
      }

      // Proceed with update if encounter is closed or doesn't exist
      await onUpdateAppointment(appointment._id, { status: { id: "checkout", label: "Check Out" } })
    } catch (error) {
      toast.error(`Checkout failed: ${getApiErrorMessage(error)}`)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleOpenEncounter = async () => {
    const params = new URLSearchParams()
    try {
      if (appointment._id) {
        const encounter = await encounterService.getEncounterByAppointment(appointment._id)
        if (encounter?._id) {
          params.set("encounterId", encounter._id)
        }
      }
    } catch (error) {
      if (!(isAxiosError(error) && error.response?.status === 404)) {
        toast.error(`Failed to open encounter: ${getApiErrorMessage(error)}`)
        return
      }
    }

    if (!params.get("encounterId") && appointment._id) {
      params.set("appointmentId", appointment._id)
    }
    if (params.toString()) router.push(`/encounters/add?${params.toString()}`)
  }

  const canCheckInNow = (() => {
    if (!appointment.schedule?.startDate || !appointment.schedule?.startTime) return false
    const mins = parseTimeToMinutes(appointment.schedule.startTime)
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    const apptDate = new Date(appointment.schedule.startDate)
    apptDate.setHours(hours, minutes, 0, 0)
    const now = new Date()
    const hoursDiff = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    // Show if appointment is within next 24 hours OR has already started (but not concluded)
    return hoursDiff <= 24
  })()

  const isAdmin = role === "admin"
  const showCheckIn = !isPatient && canCheckInNow && !isCheckedIn && !isCheckedOut && !isCancelled
  const showCheckOut = !isPatient && isCheckedIn && !isCancelled

  // Visibility flags based on requirements and role permissions
  const canView = can("appointment_view")
  const canPrint = (isCheckedIn || isCheckedOut) && can("appointment_export")
  const canEdit = (isPatient ? isBooked : (!isCheckedOut && !isCancelled)) && can("appointment_edit")
  const canEncounter = (isPatient ? isCheckedIn : (isCheckedIn || isCheckedOut)) && can("appointment_encounter") && appointment.encounter_status === "CREATED"
  const canReview = isPatient && isCheckedOut
  const canDelete = !isPatient && can("appointment_delete")

  const regenerateTelemed = useRegenerateTelemedLink()
  const isTelemed = (appointment.service as any)?.telemed_service
  const telemedType = appointment.telemedicine?.type
  const isHost = role === "doctor" || role === "admin" || role === "receptionist" || role === "clinic_admin"

  let telemedLink = ""
  if (telemedType === "zoom") {
    telemedLink = (isHost ? appointment.telemedicine?.zoom?.startUrl : appointment.telemedicine?.zoom?.joinUrl) || ""
  } else if (telemedType === "google_meet") {
    telemedLink = appointment.telemedicine?.googleMeet?.url || ""
  }

  const hasLink = !!telemedLink
  const meetingLabel = isHost ? "Start Meeting" : "Join Meeting"

  // Requirement: Video icon appears ONLY AFTER check-in
  // If link missing after check-in, show warning icon for staff
  const showTelemedLink = isTelemed && isCheckedIn && hasLink
  const showTelemedWarning = isTelemed && isCheckedIn && !hasLink && !isPatient

  const containerClass =
    variant === "dialog"
      ? "flex justify-end items-center gap-2 mt-4"
      : "flex items-center gap-1"

  const isList = variant === "list"

  return (
    <div className={containerClass}>
      {/* View Action */}
      {canView && isList && (
        <AppointmentViewDialog
          appointment={appointment}
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

      {/* Edit Action */}
      {canEdit && (
        <AppointmentFormDialog
          appointmentToEdit={appointment}
          onAddAppointment={onAddAppointment}
          onUpdateAppointment={onUpdateAppointment}
          trigger={
            isList ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton>
                    <Pencil className="size-3.5" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" size="sm" className="cursor-pointer border border-border/40 shadow-sm transition-all border-primary/20">
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )
          }
        />
      )}

      {/* Check In Action (Staff Only) */}
      {showCheckIn && canEdit && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                onClick={() => onUpdateAppointment(appointment._id, { status: { id: "check_in", label: "Check In" } })}
              >
                <LogIn className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Check In</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="cursor-pointer"
            onClick={() => onUpdateAppointment(appointment._id, { status: { id: "check_in", label: "Check In" } })}
          >
            <LogIn className="size-3.5" />
            Check-in
          </Button>
        )
      )}

      {/* Encounter Action */}
      {canEncounter && can("encounter_dashboard") && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton onClick={handleOpenEncounter}>
                <Activity className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Encounter</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer border border-border/40 shadow-sm transition-all border-primary/20"
            onClick={handleOpenEncounter}
          >
            <Activity className="size-3.5" />
            Encounter
          </Button>
        )
      )}

      {/* Telemedicine Action (Active Link) */}
      {showTelemedLink && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                onClick={() => window.open(telemedLink, "_blank")}
              >
                <Video className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>{meetingLabel}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(telemedLink, "_blank")}
          >
            <Video className="size-3.5" />
            {meetingLabel}
          </Button>
        )
      )}

      {/* Telemedicine Action (Missing Link - Regenerate) */}
      {showTelemedWarning && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                onClick={() => regenerateTelemed.mutate(appointment._id)}
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                disabled={regenerateTelemed.isPending}
              >
                <AlertCircle className={cn("size-3.5", regenerateTelemed.isPending && "animate-pulse")} />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Missing Meeting Link - Click to Regenerate</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            onClick={() => regenerateTelemed.mutate(appointment._id)}
            disabled={regenerateTelemed.isPending}
          >
            <AlertCircle className={cn("size-3.5", regenerateTelemed.isPending && "animate-pulse")} />
            Regenerate Link
          </Button>
        )
      )}

      {/* Review Action (Patient Only - After Checkout) */}
      {canReview && (
        <ReviewFormDialog
          role={role || undefined}
          doctorId={typeof appointment.doctor === "object" ? appointment.doctor?._id : (typeof appointment.doctor === "string" ? appointment.doctor : undefined)}
          targetName={typeof appointment.doctor === "object" ? appointment.doctor?.fullName : undefined}
          trigger={
            isList ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ActionIconButton>
                    <Star className="size-3.5" />
                  </ActionIconButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Review</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer border-amber-200 bg-amber-50"
              >
                <Star className="size-3.5" />
                Review
              </Button>
            )
          }
        />
      )}

      {/* Print / Download Invoice Action */}
      {canPrint && (
        <>
          {/* <PrintAppointmentInvoice appointment={appointment} variant={variant} /> */}
          <PrintAppointment appointment={appointment} variant={variant} />
        </>
      )}

      {/* Check Out Action (Staff Only) */}
      {showCheckOut && canEdit && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                onClick={handleCheckOut}
                disabled={isCheckingStatus}
              >
                <LogOut className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Check Out</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="cursor-pointer"
            onClick={handleCheckOut}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <Loader2 className="size-3.5 animate-spin mr-2" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            {isCheckingStatus ? "Checking..." : "Check-out"}
          </Button>
        )
      )}

      {/* Cancel Action */}
      {canEdit && !showCheckOut && (
        isList ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                color="red"
                className="border-destructive/50 text-destructive hover:text-destructive"
                onClick={() => onUpdateAppointment(appointment._id, { status: { id: "cancelled", label: "Cancelled" } })}
              >
                <XCircle className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => onUpdateAppointment(appointment._id, { status: { id: "cancelled", label: "Cancelled" } })}
          >
            <XCircle className="size-3.5" />
            Cancel
          </Button>
        )
      )}

      <DeleteAction
        appointment={appointment}
        onDeleteAppointment={onDeleteAppointment}
        variant={variant}
        canDelete={canDelete}
      />

    </div>
  )
}

function DeleteAction({
  appointment,
  onDeleteAppointment,
  variant,
  canDelete
}: {
  appointment: Appointment
  onDeleteAppointment: (id: string) => void
  variant: "list" | "dialog"
  canDelete: boolean
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const isList = variant === "list"

  if (!canDelete) return null

  const handleDelete = () => {
    onDeleteAppointment(appointment._id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      {isList ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionIconButton
              color="red"
              title="Delete"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-3.5" />
            </ActionIconButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Appointment?"
        description="Are you sure you want to permanently delete this appointment? This will also delete any associated clinical encounters and bills."
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  )
}
