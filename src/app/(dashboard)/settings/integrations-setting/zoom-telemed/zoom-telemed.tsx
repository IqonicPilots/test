"use client"
import { useState, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getApiErrorMessage } from "@/lib/api/axios"
import { Loader2, Copy, Info, ExternalLink, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuthRole } from "@/hooks/use-auth-role"
import { zoomTelemedApi, type ZoomTelemedConfig } from "@/services/zoom-telemed.service"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ZoomTelemedSettingsProps {
  initialData?: any
  onSaveSuccess?: () => void | Promise<void>
  googleIntegrated?: boolean
}

export default function ZoomTelemedSettings({ initialData, onSaveSuccess, googleIntegrated }: ZoomTelemedSettingsProps) {
  const { role } = useAuthRole()

  // Admin state
  const [oauthEnabled, setOauthEnabled] = useState(false)
  const [s2sEnabled, setS2sEnabled] = useState(false)
  const [oauthClientId, setOauthClientId] = useState("")
  const [oauthClientSecret, setOauthClientSecret] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Doctor OAuth state
  const [isConnecting, setIsConnecting] = useState(false)
  const [doctorZoomConnected, setDoctorZoomConnected] = useState(false)

  // Doctor S2S state
  const [s2sAccountId, setS2sAccountId] = useState("")
  const [s2sClientId, setS2sClientId] = useState("")
  const [s2sClientSecret, setS2sClientSecret] = useState("")
  const [s2sConfigured, setS2sConfigured] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isZoomEnabled, setIsZoomEnabled] = useState(false)

  // Derived: compute redirect URL for Zoom OAuth
  const normalizedBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "")
  const redirectUrl = `${normalizedBackendUrl}/api/v1/settings/zoom-oauth/callback`

  useEffect(() => {
    if (initialData?.zoom_telemed) {
      const zt = initialData.zoom_telemed as ZoomTelemedConfig
      setOauthEnabled(!!zt.zoom_oauth?.enabled)
      setS2sEnabled(!!zt.zoom_s2s?.enabled)
      setOauthClientId(zt.zoom_oauth?.client_id || "")
      setOauthClientSecret(zt.zoom_oauth?.client_secret || "")
      setDoctorZoomConnected(!!zt.doctor_zoom_connected)
      setS2sConfigured(!!zt.doctor_s2s_configured)
      setIsZoomEnabled(!!zt.is_zoom_enabled)

      if (zt.doctor_s2s) {
        setS2sAccountId(zt.doctor_s2s.account_id || "")
        setS2sClientId(zt.doctor_s2s.client_id || "")
        setS2sClientSecret(zt.doctor_s2s.client_secret || "")
      }
    }
  }, [initialData])

  const handleOAuthToggle = async (checked: boolean) => {
    setOauthEnabled(checked)
    if (checked) setS2sEnabled(false)

    setIsSaving(true)
    try {
      await zoomTelemedApi.saveConfig({
        zoom_oauth: {
          enabled: checked,
          client_id: oauthClientId,
          client_secret: oauthClientSecret,
        },
      })
      toast.success(checked ? "Zoom OAuth Configuration enabled" : "Zoom OAuth Configuration disabled")
      onSaveSuccess?.()
    } catch (err) {
      setOauthEnabled(!checked)
      if (!checked) setS2sEnabled(true)
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleS2SToggle = async (checked: boolean) => {
    setS2sEnabled(checked)
    if (checked) setOauthEnabled(false)

    setIsSaving(true)
    try {
      await zoomTelemedApi.saveConfig({
        zoom_s2s: { enabled: checked },
      })
      toast.success(checked ? "Zoom Server To Server Configuration enabled" : "Zoom Server To Server Configuration disabled")
      onSaveSuccess?.()
    } catch (err) {
      setS2sEnabled(!checked)
      if (!checked) setOauthEnabled(true)
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAdmin = async () => {
    setIsSaving(true)
    try {
      await zoomTelemedApi.saveConfig({
        zoom_oauth: {
          enabled: oauthEnabled,
          client_id: oauthClientId,
          client_secret: oauthClientSecret,
        },
        zoom_s2s: {
          enabled: s2sEnabled,
        },
      })
      toast.success("Zoom Telemed configuration saved successfully")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectZoom = async () => {
    setIsConnecting(true)
    try {
      const data = await zoomTelemedApi.getOAuthUrl()
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error("Failed to get Zoom authorization URL")
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSaveDoctorS2S = async () => {
    const isNew = !s2sConfigured
    if (!s2sAccountId || !s2sClientId || (isNew && !s2sClientSecret)) {
      toast.error(isNew ? "All fields are required" : "Account ID and Client ID are required")
      return
    }
    
    setIsSaving(true)
    try {
      const payload: any = {
        account_id: s2sAccountId,
        client_id: s2sClientId,
      }
      if (s2sClientSecret) {
        payload.client_secret = s2sClientSecret
      }

      await zoomTelemedApi.saveDoctorS2S(payload)
      setS2sConfigured(true)
      toast.success("Zoom S2S credentials saved successfully")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestS2S = async () => {
    setIsTesting(true)
    try {
      const res = await zoomTelemedApi.testDoctorS2S()
      toast.success(res?.message || "Zoom S2S configuration is valid!")
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsTesting(false)
    }
  }

  const handleDoctorToggle = async (checked: boolean) => {
    setIsSaving(true)
    try {
      await zoomTelemedApi.toggle(checked)
      setIsZoomEnabled(checked)
      toast.success(checked ? "Zoom integration enabled" : "Zoom integration disabled")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setIsSaving(true)
    try {
      await zoomTelemedApi.disconnect()
      setDoctorZoomConnected(false)
      setS2sConfigured(false)
      setS2sAccountId("")
      setS2sClientId("")
      setS2sClientSecret("")
      setIsZoomEnabled(false)
      toast.success("Zoom account disconnected")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (role === "doctor") {
    const neitherEnabled = !oauthEnabled && !s2sEnabled
    if (neitherEnabled) {
      return (
        <div className="py-6">
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-5 space-y-1">
            <p className="text-sm text-yellow-700 dark:text-amber-400 font-bold">
              Zoom Telemedicine is not currently enabled by your administrator.
            </p>
            <p className="text-sm text-yellow-600 dark:text-amber-500">
              Please contact your admin to enable Zoom integration.
            </p>
          </div>
        </div>
      )
    }

    if (oauthEnabled) {
      return (
        <div className="py-6 space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Zoom Account Connection</h3>
              <Switch checked={isZoomEnabled} onCheckedChange={handleDoctorToggle} disabled={isSaving} />
            </div>
            
            <div className="flex items-center justify-between gap-6 rounded-lg bg-yellow-50/50 dark:bg-amber-950/20 border border-yellow-100 dark:border-amber-900/40 p-5">
              <p className={`text-sm font-medium ${doctorZoomConnected ? "text-green-600 dark:text-green-400" : "text-destructive font-semibold"}`}>
                {doctorZoomConnected ? "Your Zoom account is connected" : "Your Zoom account is not connected"}
              </p>
              <Button 
                onClick={doctorZoomConnected ? handleDisconnect : handleConnectZoom} 
                disabled={!isZoomEnabled || isConnecting || isSaving || googleIntegrated}
                className={!doctorZoomConnected ? "bg-orange-500 hover:bg-orange-600 text-white border-none shadow-md px-6" : ""}
              >
                {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {doctorZoomConnected ? "Disconnect" : "Connect Zoom Account"}
              </Button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">Connection Status:</span>
                <span className={`text-sm font-bold ${doctorZoomConnected ? "text-green-500" : "text-destructive"}`}>
                  {doctorZoomConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your Zoom account to enable telemedicine features
              </p>
            </div>

            {googleIntegrated && !doctorZoomConnected && (
              <p className="text-xs text-amber-600 font-medium italic bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50">
                Please disconnect your Google account to enable Zoom.
              </p>
            )}
          </div>
        </div>
      )
    }

    if (s2sEnabled) {
      return (
        <div className="py-6 space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Zoom Telemed Server To Server Oauth</h3>
                <p className="text-sm text-muted-foreground">Zoom Telemed Server To Server Oauth Configuration</p>
              </div>
              <Switch checked={isZoomEnabled} onCheckedChange={handleDoctorToggle} disabled={isSaving} />
            </div>

            <div className={`space-y-5 transition-opacity duration-200 ${!isZoomEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account ID <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="Enter Account ID"
                  value={s2sAccountId} 
                  onChange={(e) => setS2sAccountId(e.target.value)} 
                  disabled={!isZoomEnabled} 
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground italic">Find this in your Zoom app credentials</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Client ID <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="Enter Client ID"
                  value={s2sClientId} 
                  onChange={(e) => setS2sClientId(e.target.value)} 
                  disabled={!isZoomEnabled} 
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Client Secret <span className="text-destructive">*</span></Label>
                <Input 
                  placeholder="Enter Client Secret"
                  type="password" 
                  value={s2sClientSecret} 
                  onChange={(e) => setS2sClientSecret(e.target.value)} 
                  disabled={!isZoomEnabled} 
                  className="h-11"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSaveDoctorS2S} 
                  disabled={!isZoomEnabled || isSaving || googleIntegrated}
                  className="bg-primary hover:bg-primary/90 px-8 h-11 shadow-sm"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestS2S} 
                  disabled={!isZoomEnabled || isTesting}
                  className="h-11 px-6 border-muted-foreground/30 hover:bg-muted"
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Zoom Config
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-3 px-4 py-4 bg-blue-50/50 dark:bg-amber-950/20 border border-blue-100 dark:border-amber-900/40 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 shrink-0 dark:text-amber-500" />
                <p className="text-sm text-blue-600 dark:text-amber-400 font-medium">
                  Your administrator has enabled server to server authentication. Meetings will be created using these credentials.
                </p>
              </div>
            </div>
          </div>
          {googleIntegrated && !s2sConfigured && (
            <p className="text-xs text-amber-600 font-medium italic bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50 mt-2">
              Please disconnect your Google account to enable Zoom.
            </p>
          )}
        </div>
      )
    }
  }

  // ADMIN VIEW
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Zoom Telemed Configuration</h2>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-primary cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[280px]">
              <p className="text-xs">Configure Zoom Telemedicine for your clinic.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="relative pt-2">
          {/* Mutual Exclusivity Note */}
          <p className="text-xs text-blue-500 dark:text-amber-500 mb-4">
            Note: Kivicare supports a single-provider telemedicine policy. To enable Zoom, please ensure Google is disabled.
          </p>

          {googleIntegrated && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-2 px-6 py-3 bg-background border shadow-lg rounded-full">
                <Info className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Google integration is active. Please disable it to configure Zoom.</span>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${googleIntegrated ? 'pointer-events-none select-none opacity-50' : ''}`}>
            {/* OAuth Section */}
            <div className="rounded-lg border bg-card p-5 space-y-5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-foreground">Zoom OAuth Configuration</h3>
                  <p className="text-sm text-muted-foreground">Enable Zoom OAuth Configuration</p>
                </div>
                <Switch
                  id="zoom-oauth-toggle"
                  checked={oauthEnabled}
                  onCheckedChange={handleOAuthToggle}
                  disabled={isSaving || googleIntegrated}
                />
              </div>

              {oauthEnabled && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Zoom Telemed Client ID <span className="text-destructive">*</span></Label>
                      <Input 
                        placeholder="Enter Zoom Client ID" 
                        value={oauthClientId} 
                        onChange={(e) => setOauthClientId(e.target.value)} 
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Zoom Telemed Client Secret <span className="text-destructive">*</span></Label>
                      <Input 
                        type="password" 
                        placeholder="Enter Zoom Client Secret" 
                        value={oauthClientSecret} 
                        onChange={(e) => setOauthClientSecret(e.target.value)} 
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Redirect URL</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input readOnly value={redirectUrl} className="bg-muted text-xs h-10" />
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(redirectUrl)} className="h-10 w-10 shrink-0 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Add this URL to your Zoom app's redirect URLs</p>
                      </div>
                    </div>
                  </div>

                  {/* OAuth Guide Card - Moved back inside the card as per user request */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="zoom-guide" className="border !border-b-1 rounded-lg bg-muted/10 px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <h3 className="text-foreground">Guide to setup Zoom Telemed with OAuth</h3>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="space-y-3">
                          {[
                            { step: "Step 1", text: "Sign up or Sign in here", link: "Zoom market Place portal", url: "https://marketplace.zoom.us/" },
                            { step: "Step 2", text: "Click/Hover on Develop button at the right in navigation bar and click on build app", link: "Create app", url: "https://marketplace.zoom.us/develop/create" },
                            { step: "Step 3", text: "Select General App and click Create" },
                            { step: "Step 4", text: "Fill the mandatory information and In the App credentials tag you can see Client ID, Client secret And Redirect URL for OAuth." },
                            { step: "Step 5", text: "Copy and Paste Client ID, Client secret And Redirect URL here and click on save button and you are ready to go." },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-sm">
                              <span className="font-bold whitespace-nowrap min-w-[50px]">{item.step}:</span>
                              <p className="text-muted-foreground font-medium">
                                {item.text} {item.link && (
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="font-bold text-foreground hover:text-primary inline-flex items-center gap-0.5 group"
                                  >
                                    {item.link}
                                    <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                  </a>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>

            {/* S2S Section */}
            <div className="rounded-lg border bg-card p-5 space-y-5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold text-foreground">Zoom Server To Server Configuration</h3>
                  <p className="text-sm text-muted-foreground">Enable Zoom Server To Server Configuration</p>
                </div>
                <Switch
                  id="zoom-s2s-toggle"
                  checked={s2sEnabled}
                  onCheckedChange={handleS2SToggle}
                  disabled={isSaving || googleIntegrated}
                />
              </div>
              
              {s2sEnabled && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-amber-950/30 border border-blue-100 dark:border-amber-900/50 rounded-lg">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 dark:text-amber-500" />
                    <p className="text-sm text-blue-600 dark:text-amber-500 font-medium">
                      After enabling this, each doctor must configure their Server-to-Server in their own settings
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAdmin} disabled={isSaving || (!oauthEnabled && !s2sEnabled)} className="px-10 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
