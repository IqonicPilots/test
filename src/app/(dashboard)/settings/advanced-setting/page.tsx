"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdvancedSettings, useSaveAdvancedSettings } from "@/hooks/api/use-advanced-settings"
import { type PermissionModuleData } from "@/services/advanced-settings.service"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

export default function AdvancedSettingsPage() {
  const { data: settings, isLoading, refetch } = useAdvancedSettings()
  const { mutate: saveSettings, isPending: isSaving } = useSaveAdvancedSettings()
  const [activeRole, setActiveRole] = useState("")
  const [localSettings, setLocalSettings] = useState<PermissionModuleData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
      setHasChanges(false)
      if (settings.roles?.length > 0 && !activeRole) {
        setActiveRole(settings.roles[0].key)
      }
    }
  }, [settings, activeRole])

  const handleTogglePermission = (roleKey: string, moduleKey: string, permKey: string, enabled: boolean) => {
    if (!localSettings) return
    setHasChanges(true)

    setLocalSettings(prev => {
      if (!prev) return null
      const updatedRoles = prev.roles.map(role => {
        if (role.key === roleKey) {
          const updatedModules = role.modules.map(module => {
            if (module.key === moduleKey) {
              const updatedPerms = module.permissions.map(perm => {
                if (perm.key === permKey) {
                  return { ...perm, enabled, status: (enabled ? 'active' : 'inactive') as "active" | "inactive" }
                }
                return perm
              })
              return { ...module, permissions: updatedPerms }
            }
            return module
          })
          return { ...role, modules: updatedModules }
        }
        return role
      })
      return { ...prev, roles: updatedRoles }
    })
  }

  const handleSave = () => {
    if (localSettings) {
      saveSettings({ data: localSettings })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-32" />)}
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    )
  }

  if (!localSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">Failed to load permission settings.</p>
        <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <Tabs value={activeRole} onValueChange={setActiveRole} className="min-w-0 w-full max-w-full gap-3">
        <div className="sticky top-0 z-40 min-w-0 bg-card">
          <h2 className="px-0 text-xl font-semibold">Advanced Settings</h2>
          <p className="mb-4 font-medium text-pretty text-muted-foreground">Fine-tune permissions and access levels across all modules.</p>
          
          <TabsList className="relative z-10 grid h-auto w-full min-w-0 grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 md:z-auto md:flex md:h-12 md:min-h-12 md:justify-start md:gap-1 md:overflow-x-auto md:p-1 md:[scrollbar-width:thin]">
            {localSettings.roles.map((role) => (
              <TabsTrigger
                key={role.key}
                value={role.key}
                className="h-auto min-h-10 w-full justify-center whitespace-normal px-2 text-center text-sm leading-tight data-[state=active]:bg-background data-[state=active]:shadow-sm md:h-10 md:min-h-0 md:w-auto md:shrink-0 md:whitespace-nowrap md:px-4 lg:px-6"
              >
                {role.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {localSettings.roles.map((role) => (
          <TabsContent
            key={role.key}
            value={role.key}
            className="relative min-w-0 max-w-full focus-visible:outline-none"
          >
              <div className="pt-2 pb-4">
                <h3 className="text-xl font-semibold">
                  {role.name} Permissions
                </h3>
                <p className="text-sm mt-1 text-muted-foreground">Configure what users with the {role.name} role can see and do.</p>
              </div>

              <Accordion 
                type="single" collapsible
                defaultValue={role.modules.length > 0 ? role.modules[0].key : undefined} 
                className="min-w-0 w-full space-y-4 pb-8 pt-2"
              >
                {role.modules.map((module) => (
                  <AccordionItem
                    key={module.key}
                    value={module.key}
                    className="rounded-md !border bg-card"
                  >
                    <AccordionTrigger className="cursor-pointer gap-2 px-3 py-3 transition-colors hover:bg-muted/30 hover:no-underline sm:gap-4 sm:px-4">
                      <div className="flex min-w-0 items-start text-left text-base font-semibold">
                        <span className="break-words">{module.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="border-t pt-0 text-muted-foreground">
                        {module.permissions.map((perm, index) => {
                          const isMasterEnabled = module.permissions[0].enabled;
                          if (index > 0 && !isMasterEnabled) return null;
                          return (
                            <div
                              key={perm.key}
                              className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-sm font-medium break-words text-foreground">
                                  {perm.label}  
                                </span>
                                <Badge 
                                  variant="secondary"
                                  className={`shrink-0 ${
                                      perm.status === 'active' 
                                      ? 'text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                      : 'text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                  }`}
                                >
                                  {perm.status === 'active' ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <Switch 
                                  className="shrink-0 self-start sm:self-auto"
                                  checked={perm.enabled} 
                                  onCheckedChange={(val) => handleTogglePermission(role.key, module.key, perm.key, val)}
                              />
                            </div>
                          );
                        })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {hasChanges && (
                <div className="sticky bottom-0 z-20 mt-4 flex w-full justify-end border-t bg-card/95 p-3 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="h-10 w-full min-w-[140px] cursor-pointer font-bold sm:w-auto"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
