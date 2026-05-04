"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/axios"
import { Loader2, Copy, Info } from "lucide-react"
import { toast } from "sonner"
import { GoogleEventTemplate, GoogleEventRole } from "@/types/google-event.types"
import { googleEventApi } from "@/services/google-event.service"
import { SettingsSkeleton } from "@/components/dashboard-page-skeleton"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"

const DYNAMIC_KEYS = [
  "appointment_date", "appointment_time", "service_name", 
  "patient_name", "patient_email", "doctor_name", 
  "doctor_email", "clinic_name", "clinic_email", "clinic_address"
];

const DEFAULT_TEMPLATES: GoogleEventTemplate[] = [
  { role: 'patient', title: 'Appointment for {{service_name}}', description: 'Appointment booked at {{clinic_name}} ' },
  { role: 'doctor', title: '{{service_name}}', description: 'New appointment: {{patient_name}} on {{appointment_date}} at {{appointment_time}} ' },
  { role: 'receptionist', title: '{{service_name}}', description: 'Clinic Appointment: {{patient_name}} with {{doctor_name}}' }
];

export function GoogleEventTemplateSettings({ 
  initialData, 
  onSaveSuccess,
  isDisabled = false 
}: { 
  initialData?: any, 
  onSaveSuccess?: () => void | Promise<void>, 
  isDisabled?: boolean 
}) {
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<GoogleEventRole>('patient')
  const [templates, setTemplates] = useState<GoogleEventTemplate[]>(DEFAULT_TEMPLATES)

  useEffect(() => {
    if (initialData?.google_event?.templates) {
      const existingTemplates = initialData.google_event.templates
      if (existingTemplates.length > 0) {
         setTemplates(DEFAULT_TEMPLATES.map(def => {
           const found = existingTemplates.find((t: GoogleEventTemplate) => t.role === def.role)
           return found || def;
         }))
      }
    }
  }, [initialData])

  const handleTemplateChange = (field: 'title' | 'description', value: string) => {
    setTemplates(prev => prev.map(t => t.role === activeTab ? { ...t, [field]: value } : t))
  }

  const handleSaveTemplates = async () => {
    setIsSaving(true)
    try {
      await googleEventApi.saveTemplates(templates)
      toast.success("Google Event Templates saved successfully")
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
  const activeTemplate = templates.find(t => t.role === activeTab) || templates[0]

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

        <div className={`space-y-2 ${!isConfigured ? 'pointer-events-none select-none opacity-50' : ''}`}>
          {isLoadingTemplates ? (
            <div className="pt-4">
              <SettingsSkeleton />
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs 
                value={activeTab} 
                onValueChange={(val) => setActiveTab(val as GoogleEventRole)} 
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 md:w-[450px] bg-muted p-1 h-12 rounded-lg border border-border">
                  {['patient', 'doctor', 'receptionist'].map((role) => (
                    <TabsTrigger
                      key={role}
                      value={role}
                      className="capitalize rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      {role}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label className="text-base text-muted-foreground font-normal">Google Event Title</Label>
                <Input 
                    value={activeTemplate.title}
                    onChange={(e) => handleTemplateChange("title", e.target.value)}
                    className="bg-background text-foreground h-10"
                    placeholder="{{service_name}}"
                    disabled={!isConfigured}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base text-muted-foreground font-normal">Template Dynamic Keys List (click to copy)</Label>
                <div className="flex flex-wrap gap-2">
                    {DYNAMIC_KEYS.map((key) => (
                        <Button 
                            key={key} 
                            variant="default"
                            className="bg-[#4f67d8] hover:bg-[#3f53b5] text-white flex items-center gap-2 h-8 shrink-0"
                            onClick={() => copyToClipboard(key)}
                            disabled={!isConfigured}
                        >
                            {key} <Copy className="h-4 w-4 opacity-70" />
                        </Button>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base text-muted-foreground font-normal">Google Event Description</Label>
                <div className="border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/20">
                      <span className="text-sm font-medium">Normal</span>
                      <div className="flex items-center gap-3 font-serif font-medium cursor-pointer">
                          <b>B</b> <i>I</i> <u className="underline">U</u>
                      </div>
                    </div>
                    <Textarea 
                      value={activeTemplate.description}
                      onChange={(e) => handleTemplateChange("description", e.target.value)}
                      className="border-0 focus-visible:ring-0 min-h-[120px] resize-y rounded-t-none"
                      placeholder="Appointment booked at {{clinic_name}}..."
                      disabled={!isConfigured}
                    />
                </div>
              </div>

              <div className="flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={handleSaveTemplates} 
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
