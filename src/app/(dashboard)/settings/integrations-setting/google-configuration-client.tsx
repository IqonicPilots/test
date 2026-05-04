"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/api/axios"
import { Loader2, Copy, Info } from "lucide-react"
import { toast } from "sonner"
import { googleEventApi } from "@/services/google-event.service"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuthRole } from "@/hooks/use-auth-role"

interface GoogleConfigurationSettingsProps {
  initialData?: any
  onSaveSuccess?: () => void | Promise<void>
  zoomIntegrated?: boolean
}

export function GoogleConfigurationSettings({ initialData, onSaveSuccess, zoomIntegrated }: GoogleConfigurationSettingsProps) {
  const { role } = useAuthRole()
  const [isLoadingAuth, setIsLoadingAuth] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [appName, setAppName] = useState("KiviCare")
  const [enableConfiguration, setEnableConfiguration] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (initialData?.google) {
      const config = initialData.google
      setClientId(config.clientId || "")
      setClientSecret(config.clientSecret || "")
      setAppName(config.appName || "KiviCare")
      setEnableConfiguration(!!config.enable_configuration)
      setIsConnected(!!config.is_connected)
    }
  }, [initialData])

  const handleSave = async (overrides = {}) => {
    setIsSaving(true)
    try {
      const payload = { 
        clientId, 
        clientSecret, 
        appName, 
        enable_configuration: enableConfiguration,
        ...overrides 
      }
      await googleEventApi.saveGoogleConfig(payload)
      toast.success("Google configuration saved successfully")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const onToggleEnable = async (checked: boolean) => {
    setEnableConfiguration(checked)
    setIsSaving(true)
    try {
      await googleEventApi.saveGoogleConfig({ 
        clientId, 
        clientSecret, 
        appName, 
        enable_configuration: checked 
      })
      onSaveSuccess?.()
    } catch (err) {
      setEnableConfiguration(!checked)
      toast.error("Failed to update status")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnect = async () => {
    setIsLoadingAuth(true)
    setAuthError(null)
    try {
      if (role !== 'doctor') {
        await googleEventApi.saveGoogleConfig({ clientId, clientSecret, appName, enable_configuration: enableConfiguration })
        onSaveSuccess?.()
      }
      const data = await googleEventApi.getAuthUrl({ clientId, clientSecret })
      const url = data?.url
      if (url) window.location.href = url
      else setAuthError("Failed to retrieve Google Auth URL")
    } catch (err) {
      setAuthError(getApiErrorMessage(err))
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const handleDisconnect = async () => {
    setIsSaving(true)
    try {
      await googleEventApi.disconnect()
      setIsConnected(false)
      toast.success("Google account disconnected")
      onSaveSuccess?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // --- Doctor View: Show only the connection button ---
  if (role === 'doctor') {
    return (
      <div className="py-6 space-y-4">
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Google Integration</h3>
            <p className="text-xs text-muted-foreground">Authorize your Google account to sync appointments and events.</p>
        </div>
        
        {isConnected ? (
          <div className="flex items-center justify-between gap-6 rounded-lg bg-yellow-50/50 dark:bg-amber-950/20 border border-yellow-100 dark:border-amber-900/40 p-5">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Your Google account is connected
            </p>
            <Button 
              onClick={handleDisconnect} 
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-700 text-white"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              onClick={handleConnect} 
              disabled={isLoadingAuth || !clientId || !clientSecret || !enableConfiguration || zoomIntegrated}
            >
              {isLoadingAuth && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoadingAuth ? "Connecting..." : "Connect to Google Event"}
            </Button>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">Connection Status:</span>
            <span className={`text-sm font-bold ${isConnected ? "text-green-500" : "text-destructive"}`}>
              {isConnected ? "Connected" : "Not Connected"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Google account to sync appointments and events
          </p>
        </div>

        {zoomIntegrated && !isConnected && (
          <p className="text-xs text-amber-600 font-medium italic mt-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-100 dark:border-amber-900/50">
            Please disconnect your Zoom account to enable Google integration.
          </p>
        )}
        
        {authError && <p className="text-sm text-destructive font-medium mt-2">{authError}</p>}
        {(!clientId || !clientSecret || !enableConfiguration) && !isConnected && (
            <p className="text-xs text-amber-500 font-medium italic">Google integration is currently not configured by the administrator.</p>
        )}
      </div>
    )
  }

  // --- Admin/Other View ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enable-configuration" className="text-base">Enable Configuration</Label>
          <p className="text-xs text-muted-foreground">Enable this option to access and configure Google integration settings.</p>
        </div>
        <div className="flex items-center justify-center">
            <Switch 
                id="enable-configuration" 
                checked={enableConfiguration} 
                onCheckedChange={onToggleEnable} 
                disabled={zoomIntegrated}
            />
        </div>
      </div>

      <Separator /> 

      <div className="relative">
        {/* Mutual Exclusivity Note */}
        <p className="text-xs text-blue-500 dark:text-amber-500 mb-6">
          Note: Kivicare supports a single-provider telemedicine policy. To enable Google, please ensure Zoom is disabled.
        </p>

        {/* Mutual Exclusivity Overlay */}
        {zoomIntegrated && !enableConfiguration && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
            <div className="flex items-center gap-2 px-6 py-3 bg-background border shadow-lg rounded-full">
              <Info className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Zoom integration is active. Please disable it to configure Google.</span>
            </div>
          </div>
        )}
        
        <div className={`space-y-6 ${zoomIntegrated && !enableConfiguration ? 'pointer-events-none select-none opacity-50' : ''}`}>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-200 ${!enableConfiguration ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID <span className="text-destructive">*</span></Label>
              <Input 
                id="clientId" 
                disabled={!enableConfiguration}
                className="bg-background text-foreground"
                placeholder="Enter your Google Client ID" 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret <span className="text-destructive">*</span></Label>
              <Input 
                id="clientSecret" 
                disabled={!enableConfiguration}
                className="bg-background text-foreground"
                type="password"
                placeholder="Enter your Google Client Secret" 
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appName">App Name <span className="text-destructive">*</span></Label>
              <Input 
                id="appName" 
                disabled={!enableConfiguration}
                className="bg-background text-foreground"
                placeholder="kivicare" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>
          </div>

          <div className={`space-y-2 transition-opacity duration-200 ${!enableConfiguration ? 'opacity-50 pointer-events-none' : ''}`}>
            <Label>Google Cloud Console Redirection URL</Label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                className="bg-muted text-foreground"
                value="http://localhost:5000/api/v1/auth/google/callback"
              />
              <Button variant="outline" size="icon" disabled={!enableConfiguration} onClick={() => {
                  navigator.clipboard.writeText("http://localhost:5000/api/v1/auth/google/callback")
                  toast.success("Copied to clipboard")
              }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Copy this URL and add it to your Google Cloud Console as an authorized redirect URI</p>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => handleSave()} disabled={isSaving || !clientId || !clientSecret || !enableConfiguration}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>

          {authError && <p className="text-sm text-destructive font-medium">{authError}</p>}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guide" className="border !border-b-1 rounded-lg bg-muted/10 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <h3 className="text-foreground">Guide to setup Google.</h3>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Step 1:</strong> Go to the Google Cloud Console (console.cloud.google.com) and sign in.</p>
                  <p><strong className="text-foreground">Step 2:</strong> Create a new project or select an existing one.</p>
                  <p><strong className="text-foreground">Step 3:</strong> Navigate to "APIs & Services" &gt; "Credentials".</p>
                  <p><strong className="text-foreground">Step 4:</strong> Click "Create Credentials" and choose "OAuth client ID".</p>
                  <p><strong className="text-foreground">Step 5:</strong> Configure your OAuth consent screen if you haven't yet, and select "Web application".</p>
                  <p><strong className="text-foreground">Step 6:</strong> Under "Authorized redirect URIs", add: <u><b>http://localhost:5000/api/v1/auth/google/callback</b></u>.</p>
                  <p><strong className="text-foreground">Step 7:</strong> Copy the newly generated <strong>Client ID</strong> and <strong>Client Secret</strong> into the fields above.</p>
                  <p><strong className="text-foreground">Step 8:</strong> Click "Save Configuration" and then "Connect to Google Calendar".</p>
                  <p className="text-blue-500 italic dark:text-amber-500 mt-2">Note: This configuration will work for both Google Event and Google Meet integrations.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
