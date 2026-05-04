"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/axios"
import { Copy, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { GoogleMeetTemplate } from "@/types/google-event.types"
import { googleEventApi } from "@/services/google-event.service"
import { SettingsSkeleton } from "@/components/dashboard-page-skeleton"

const DEFAULT_TEMPLATE: GoogleMeetTemplate = {
  title: '{{service_name}}',
  description: 'New appointment\nYour have new appointment on\nDate: {{appointment_date}} , Time : {{appointment_time}} ,Patient : {{patient_name}}\nClinic: {{clinic_name}}.\nAppointment Description: {{appointment_desc}}.\nMeeting link : {{meeting_link}}\nThank you.'
};

const DYNAMIC_KEYS = ["appointment_date", "appointment_time", "service_name", "patient_name", "clinic_name", "appointment_desc", "meeting_link"];

export function GoogleMeetSettings({ 
  initialData, 
  onSaveSuccess, 
  isDisabled = false 
}: { 
  initialData?: any, 
  onSaveSuccess?: () => void | Promise<void>, 
  isDisabled?: boolean 
}) {
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [template, setTemplate] = useState<GoogleMeetTemplate>(DEFAULT_TEMPLATE)

  useEffect(() => {
    if (initialData?.google_meet?.template) {
      setTemplate(initialData.google_meet.template)
    }
  }, [initialData])

  const handleTemplateChange = (field: 'title' | 'description', value: string) => {
    setTemplate(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveTemplate = async () => {
    setIsSaving(true)
    try {
      await googleEventApi.saveMeetTemplate(template)
      toast.success("Google Meet Template saved successfully")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`{{${text}}}`)
    toast.success(`Copied {{${text}}} to clipboard`)
  }

  const isConfigured = !isDisabled;

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Mutual Exclusivity Note */}
        <p className="text-xs text-blue-500 dark:text-amber-500 mb-4">
          Note: Kivicare supports a single-provider telemedicine policy. To enable Google, please ensure Zoom is disabled.
        </p>

        {!isConfigured && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
            <div className="flex items-center gap-2 px-6 py-3 bg-background border shadow-lg rounded-full">
              <Info className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground text-sm">Configure Google to enable templates</span>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isConfigured ? 'pointer-events-none select-none opacity-50' : ''}`}>
          {isLoadingSettings ? (
            <div className="pt-4">
              <SettingsSkeleton />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-3">
                <Label className="text-base text-muted-foreground font-normal">Google Meet Title</Label>
                <Input 
                    value={template.title}
                    onChange={(e) => handleTemplateChange("title", e.target.value)}
                    className="bg-background text-foreground h-10"
                    placeholder="{{service_name}}"
                    disabled={!isConfigured}
                />
              </div>

              {/* Dynamic Keys */}
              <div className="space-y-3 pt-6">
                <Label className="text-base text-muted-foreground font-normal">Template Dynamic Keys List (click to copy)</Label>
                <div className="flex flex-wrap gap-2">
                    {DYNAMIC_KEYS.map((key) => (
                        <Button 
                            key={key} 
                            variant="ghost"
                            className="bg-[#4f67d8] hover:bg-[#3f53b5] text-white flex items-center gap-2 h-8 shrink-0"
                            onClick={() => copyToClipboard(key)}
                            disabled={!isConfigured}
                        >
                            {key} <Copy className="h-3 w-3 opacity-70" />
                        </Button>
                    ))}
                </div>
              </div>

              <div className="space-y-3 pt-6">
                <Label className="text-base text-muted-foreground font-normal">Google Meet Description</Label>
                <div className="border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/20">
                      <span className="text-sm font-medium">Normal</span>
                      <div className="flex items-center gap-3 font-serif font-medium cursor-pointer">
                          <b>B</b> <i>I</i> <u className="underline">U</u>
                      </div>
                    </div>
                    <Textarea 
                      value={template.description}
                      onChange={(e) => handleTemplateChange("description", e.target.value)}
                      className="border-0 focus-visible:ring-0 min-h-[150px] resize-y rounded-t-none"
                      placeholder="New appointment..."
                      disabled={!isConfigured}
                    />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                  <Button 
                    size="lg" 
                    onClick={handleSaveTemplate} 
                    disabled={isSaving || !isConfigured}
                    className="bg-[#4f67d8] hover:bg-[#3f53b5] text-white px-8"
                  >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                  </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
