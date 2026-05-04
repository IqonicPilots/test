"use client"

import { useState } from "react"
import { Plus, Calendar, User, UserRound, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEncounterableAppointments, useCreateEncounter } from "@/hooks/api/use-encounters"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export function AddEncounterDialog() {
  const [open, setOpen] = useState(false)
  const [selectedApptId, setSelectedApptId] = useState<string>("")

  const { data: appointments, isLoading } = useEncounterableAppointments()
  const createMutation = useCreateEncounter()

  const handleCreate = async () => {
    if (!selectedApptId) return

    const appt = appointments?.find((a: any) => a.appointmentId === selectedApptId)
    if (!appt) return

    await createMutation.mutateAsync({
      appointment: appt.appointmentId,
      clinic: appt.clinicId,
      doctor: appt.doctorId,
      patient: appt.patientId,
      encounterDate: new Date().toISOString()
    })
    
    setOpen(false)
    setSelectedApptId("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <Plus className="size-3.5" />
          Add Encounter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] gap-6 px-6 py-5">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold tracking-tight">Add Encounter</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select an appointment to start a new clinical encounter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2.5">
            <Label htmlFor="appointment" className="text-sm font-medium text-foreground/80">
              Available Appointments
            </Label>
            {isLoading ? (
              <Skeleton className="h-[52px] w-full rounded-md" />
            ) : appointments && appointments.length > 0 ? (
              <Select value={selectedApptId} onValueChange={setSelectedApptId}>
                <SelectTrigger 
                   id="appointment" 
                   className="w-full min-h-[52px] h-auto px-4 py-3 text-left focus:ring-primary/20 border-input transition-colors"
                >
                  <SelectValue placeholder="Select appointment...">
                    {selectedApptId && (() => {
                      const appt = appointments?.find((a: any) => a.appointmentId === selectedApptId)
                      if (!appt) return null
                      return (
                        <div className="flex flex-col items-start gap-0.5 pointer-events-none">
                          <span className="font-bold text-sm text-foreground">{appt.patientName}</span>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                             <span>{appt.date ? format(new Date(appt.date), "MMM dd, yyyy") : "N/A"}</span>
                             <span className="text-muted-foreground/40">•</span>
                             <span>{appt.serviceName}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {appointments.map((appt: any) => (
                    <SelectItem 
                      key={appt.appointmentId} 
                      value={appt.appointmentId}
                      className="cursor-pointer px-4 py-3 transition-colors"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-semibold text-sm">{appt.patientName}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                          <div className="flex items-center gap-1.5 opacity-80">
                            <Calendar className="size-3" />
                            {appt.date ? format(new Date(appt.date), "MMM dd, yyyy") : "N/A"}
                          </div>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="font-medium">{appt.serviceName}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/20 text-center animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground font-medium max-w-[300px]">
                  No pending appointments found. All checked-in patients already have encounters.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end items-center gap-2.5 pt-2">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedApptId || createMutation.isPending}
            className="min-w-[140px] shadow-sm shadow-primary/20"
          >
            {createMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              "Create Encounter"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
