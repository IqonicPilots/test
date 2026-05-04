"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GenericFormDialog } from "@/components/generic-form-dialog"
import { useInfiniteEncounters } from "@/hooks/api/use-encounters"
import { BillDialog } from "@/components/encounter-clinical/bill-dialog"
import { DataTableFilterSelect } from "@/components/common/data-table-filters"
import { z } from "zod"
import type { Encounter } from "@/types/encounter.types"
import { useProfile } from "@/hooks/api/use-profile"

const addBillSchema = z.object({
  encounterId: z.string().min(1, "Please select an encounter"),
})


/** Normalized appointment status id: check_in, check-in, etc. → "checkin" */
function normalizedAppointmentStatusId(appointment: Encounter["appointment"]): string {
  if (!appointment || typeof appointment === "string") return ""
  const id = appointment.status?.id
  return String(id ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/-/g, "")
}

function isAppointmentCheckedIn(appointment: Encounter["appointment"]): boolean {
  return normalizedAppointmentStatusId(appointment) === "checkin"
}

function hasNoBillYet(e: Encounter): boolean {
  if (e.bill_status === "BILL_CREATED") return false
  const bill = e.bill
  if (bill && typeof bill === "object" && (bill as { _id?: string })._id) return false
  return true
}

/** List only visits that are checked in and do not have a bill yet (excludes unpaid existing bills). */
function isEncounterEligibleForNewBill(e: Encounter): boolean {
  return isAppointmentCheckedIn(e.appointment) && hasNoBillYet(e)
}

export function AddBillDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { data: profile } = useProfile()
  const role = profile?.role
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

  const assignedClinicIds = React.useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return (
      profile.meta.clinics
        .map((clinic): string => {
          if (typeof clinic === "string") return clinic
          return clinic?._id ?? ""
        })
        .filter(Boolean)
    )
  }, [profile])


  const [open, setOpen] = React.useState(false)
  const [billDialogOpen, setBillDialogOpen] = React.useState(false)
  const [selectedEncounter, setSelectedEncounter] = React.useState<Encounter | null>(null)
  /** When true, the add dialog is closing to open BillDialog — do not clear selectedEncounter. */
  const keepEncounterForBillRef = React.useRef(false)

  const {
    data: encountersInfiniteData,
    fetchNextPage: fetchNextEncountersPage,
    hasNextPage: hasNextEncountersPage,
    isFetchingNextPage: isFetchingNextEncountersPage,
  } = useInfiniteEncounters({
    status: "Active",
    perPage: 50,
    doctorId: isDoctor ? profile?._id : undefined,
    clinicId:
      (isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length
        ? assignedClinicIds[0]
        : undefined,
  })

  // Load every page while Add Bill is open so the list is not capped at the first page (infinite query only fetches page 1 by default).
  React.useEffect(() => {
    if (!open) return
    if (hasNextEncountersPage && !isFetchingNextEncountersPage) {
      void fetchNextEncountersPage()
    }
  }, [open, hasNextEncountersPage, isFetchingNextEncountersPage, fetchNextEncountersPage])

  const encounters = React.useMemo(() => {
    if (!encountersInfiniteData) return []
    const all = encountersInfiniteData.pages.flatMap((p: any) => p.data || [])
    return all.filter(isEncounterEligibleForNewBill)
  }, [encountersInfiniteData])

  const encounterOptions = React.useMemo(() => {
    return encounters.map((e: Encounter) => {
      const patientName = e.patient?.fullName || [e.patient?.firstName, e.patient?.lastName].filter(Boolean).join(" ") || "Unknown Patient"
      const doctorName = e.doctor?.fullName || [e.doctor?.firstName, e.doctor?.lastName].filter(Boolean).join(" ") || "Unknown Doctor"
      const date = e.encounterDate ? new Date(e.encounterDate).toLocaleDateString() : "No Date"
      return {
        label: `${patientName} - ${doctorName} (${date})`,
        value: e._id
      }
    })
  }, [encounters])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      if (keepEncounterForBillRef.current) {
        keepEncounterForBillRef.current = false
        return
      }
      setSelectedEncounter(null)
    }
  }

  const handleSubmit = (values: { encounterId: string }) => {
    const encounter = encounters.find(e => e._id === values.encounterId)
    if (encounter) {
      // Ensure the encounter object has what BillDialog needs.
      // BillDialog uses .service which might be nested in encounter.appointment.service
      const fullEncounter = {
        ...encounter,
        service: (encounter as any).service || (encounter.appointment as any)?.service
      }
      keepEncounterForBillRef.current = true
      setSelectedEncounter(fullEncounter as any)
      setBillDialogOpen(true)
      setOpen(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1">
        <Plus className="size-4" />
        Add Bill
      </Button>

      <GenericFormDialog
        title="Add Bill"
        open={open}
        onOpenChange={handleOpenChange}
        formSchema={addBillSchema}
        defaultValues={{ encounterId: "" }}
        onSubmit={handleSubmit}
        submitButtonText="Pay Bill"
        closeOnSubmit={false}
        hideTrigger
        renderContent={({ form }) => (
          <div className="space-y-2 py-2">
             <div className="space-y-2">
               <p className="text-sm font-medium">Select encounter</p>
               <p className="text-xs text-muted-foreground">
                 Checked-in visits only, with no bill created yet.
               </p>
               <DataTableFilterSelect
                 value={form.watch("encounterId")}
                 onValueChange={(val) => form.setValue("encounterId", val)}
                 placeholder="Search encounter"
                 options={encounterOptions}
                 className="w-full"
                 allLabel="Select Encounter"
               />
               {form.formState.errors.encounterId && (
                 <p className="text-xs text-red-500 mt-1">{form.formState.errors.encounterId.message}</p>
               )}
             </div>
          </div>
        )}
        dialogSize="sm"
      />

      {selectedEncounter && (
        <BillDialog
          open={billDialogOpen}
          onOpenChange={(val) => {
             setBillDialogOpen(val)
             if(!val) setSelectedEncounter(null)
          }}
          encounter={selectedEncounter as any}
          onSuccess={() => {
            onSuccess?.()
            setBillDialogOpen(false)
            setSelectedEncounter(null)
          }}
        />
      )}
    </>
  )
}
