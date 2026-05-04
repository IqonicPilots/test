"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppointmentSettings, useSaveAppointmentSettings } from "@/hooks/api/use-appointment-settings"
import type { AppointmentSettingsData } from "@/services/appointment-settings.service"
import { SettingsSkeleton } from "@/components/dashboard-page-skeleton"

export default function AppointmentSettingPage() {
  const { data, isLoading } = useAppointmentSettings()
  const { mutate: saveSettings, isPending: isSaving } = useSaveAppointmentSettings()
  const [form, setForm] = useState<AppointmentSettingsData | null>(null)

  useEffect(() => {
    if (data) {
      setForm(data)
    }
  }, [data])

  const updateField = <K extends keyof AppointmentSettingsData>(key: K, value: AppointmentSettingsData[K]) => {
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, [key]: value }
    })
  }

  const handleSave = () => {
    if (!form) return
    saveSettings({ data: form })
  }

  if (isLoading || !form) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Appointment Cancellation Buffer */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground/90">Appointment Cancellation Buffer</h3>
          <p className="text-xs text-muted-foreground mt-1">
            To prevent appointments from getting canceled too close to the appointment time by patients, you can set a cancellation buffer.
          </p>
        </div>
        
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-cancellation-buffer" className="text-sm font-medium text-foreground/90">
              Enable Cancellation Buffer
            </Label>
            <Switch
              id="enable-cancellation-buffer"
              checked={form.enable_cancellation_buffer}
              onCheckedChange={(checked) => updateField("enable_cancellation_buffer", checked)}
              disabled={isSaving}
            />
          </div>

          {form.enable_cancellation_buffer && (
            <div className="space-y-1.5 max-w-[200px] animate-in fade-in slide-in-from-top-1 duration-300">
              <Label htmlFor="cancellation-hours" className="text-xs text-muted-foreground">
                Select Hours
              </Label>
              <Input
                id="cancellation-hours"
                type="number"
                min={0}
                value={form.cancellation_buffer_hours}
                onChange={(e) => updateField("cancellation_buffer_hours", parseInt(e.target.value) || 0)}
                disabled={isSaving}
                className="h-9 text-foreground/90"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="email-reminder" className="text-sm font-medium text-foreground/90">
              Appointment Email Reminder
            </Label>
            <Switch
              id="email-reminder"
              checked={form.enable_email_reminder}
              onCheckedChange={(checked) => updateField("enable_email_reminder", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="appointment-description" className="text-sm font-medium text-foreground/90">
              Appointment Description
            </Label>
            <Switch
              id="appointment-description"
              checked={form.enable_appointment_description}
              onCheckedChange={(checked) => updateField("enable_appointment_description", checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="min-w-[100px] cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}

