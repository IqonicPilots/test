"use client"

import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { GoogleMeetSettings } from "@/app/(dashboard)/settings/integrations-setting/google-meet/google-meet-client"
import ZoomTelemedSettings from "@/app/(dashboard)/settings/integrations-setting/zoom-telemed/zoom-telemed"
import { GoogleEventTemplateSettings } from "./google-event-template/google-event-client"
import { GoogleConfigurationSettings } from "./google-configuration-client"
import { googleEventApi } from "@/services/google-event.service"
import { SettingsSkeleton } from "@/components/dashboard-page-skeleton"

export default function Page() {
  const [integrationsData, setIntegrationsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchIntegrations = async () => {
    try {
      const data = await googleEventApi.getIntegrations()
      setIntegrationsData(data?.data || {})
    } catch (err) {
      console.error("Failed to fetch integrations:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const isConfigEnabled = !!integrationsData?.google?.enable_configuration
  const isZoomConfigured = !!(integrationsData?.zoom_telemed?.zoom_oauth?.enabled || integrationsData?.zoom_telemed?.zoom_s2s?.enabled)
  const isGoogleConfigured = !!integrationsData?.google?.enable_configuration
  const isZoomIntegrated = !!(integrationsData?.zoom_telemed?.doctor_zoom_connected || integrationsData?.zoom_telemed?.doctor_s2s_configured)
  const isGoogleIntegrated = !!integrationsData?.google?.is_connected
  
  const accordionItems = [
    {
      value: "google-configuration",
      title: "Google Configuration",
      content: <GoogleConfigurationSettings initialData={integrationsData} onSaveSuccess={fetchIntegrations} zoomIntegrated={isZoomConfigured} />,
    },
    {
      value: "google-event-template",
      title: "Google Event Template Settings",
      content: <GoogleEventTemplateSettings initialData={integrationsData} onSaveSuccess={fetchIntegrations} isDisabled={!isConfigEnabled} />,
    },
    { 
      value: "google-meet", 
      title: "Google Meet Settings", 
      content: <GoogleMeetSettings initialData={integrationsData} onSaveSuccess={fetchIntegrations} isDisabled={!isConfigEnabled} /> 
    },
    { value: "zoom-telemed", title: "Zoom Telemed Settings", content: <ZoomTelemedSettings initialData={integrationsData} onSaveSuccess={fetchIntegrations} googleIntegrated={isGoogleConfigured} /> },
  ]

  if (isLoading) {
    return (
      <div className="pt-4">
        <SettingsSkeleton />
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-2 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">Integration Settings</h2>
      </div>
      <Accordion type="single" collapsible className="min-w-0 w-full max-w-full space-y-4" defaultValue="google-configuration">
        {accordionItems.map((item) => (
          <AccordionItem key={item.value} value={item.value} className="rounded-md !border">
            <AccordionTrigger className="cursor-pointer px-4 hover:no-underline">
              <div className="flex min-w-0 items-start text-left">
                <span className="break-words">{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="min-w-0 px-3 sm:px-4">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

