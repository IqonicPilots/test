"use client"

import * as React from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"
import {
  configurationSettingsApi,
  type ConfigurationSettings,
} from "@/services/configuration-settings.service"

type ConfigKey = keyof ConfigurationSettings

interface ConfigItem {
  id: ConfigKey
  label: string
}

interface ConfigSection {
  id: string
  title: string
  items: ConfigItem[]
}

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    id: "module-config",
    title: "Module config",
    items: [
      { id: "receptionist", label: "Receptionist" },
      { id: "billing", label: "Billing Records" },
    ],
  },
  {
    id: "encounter-module",
    title: "Encounter Module",
    items: [
      { id: "problem", label: "Problem" },
      { id: "observations", label: "Observations" },
      { id: "note", label: "Note" },
    ],
  },
  {
    id: "prescription-module",
    title: "Prescription Module",
    items: [{ id: "prescription", label: "Prescription" }],
  },
]

export function ConfigurationsContent() {
  const queryClient = useQueryClient()
  const [states, setStates] = React.useState<ConfigurationSettings>({
    receptionist: true,
    billing: true,
    problem: true,
    observations: true,
    note: true,
    prescription: true,
  })

  const { data: fetchedConfig, isLoading } = useQuery<ConfigurationSettings>({
    queryKey: ["configuration-settings"],
    queryFn: () => configurationSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })

  React.useEffect(() => {
    if (fetchedConfig) {
      setStates({
        receptionist: fetchedConfig.receptionist,
        billing: fetchedConfig.billing,
        problem: fetchedConfig.problem,
        observations: fetchedConfig.observations,
        note: fetchedConfig.note,
        prescription: fetchedConfig.prescription,
      })
    }
  }, [fetchedConfig])

  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (nextSettings: ConfigurationSettings) =>
      configurationSettingsApi.saveSettings(nextSettings),
  })

  const handleToggle = (id: ConfigKey, checked: boolean) => {
    setStates((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSave = async () => {
    try {
      await saveSettings(states)
      queryClient.invalidateQueries({ queryKey: ["system-config"] })
      toast.success("Settings updated successfully", {
        icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      })
    } catch (error) {
      toast.error(`Failed to save settings: ${getApiErrorMessage(error)}`)
    }
  }

  return (
    <div className="min-w-0 max-w-full pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid min-w-0 gap-8">
        {CONFIG_SECTIONS.map((section) => (
          <div key={section.id} className="min-w-0 overflow-hidden transition-all duration-300">
            <div className="text-base font-semibold text-foreground/90">{section.title}</div>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center  gap-4"
                  >
                    <span className="text-sm font-medium leading-none">{item.label}</span>
                    <Switch
                      id={item.id}
                      checked={states[item.id]}
                      onCheckedChange={(checked) => handleToggle(item.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          size="lg"
          className="w-full min-w-[120px] cursor-pointer shadow-lg shadow-primary/20 sm:w-auto"
        >
          {isLoading ? (
            <>
              Loading...
            </>
          ) : isSaving ? (
            <>
              Saving...
            </>
          ) : (
            <>
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function Page() {
  return <ConfigurationsContent />
}
