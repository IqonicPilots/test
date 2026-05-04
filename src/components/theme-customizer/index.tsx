"use client"

import React from 'react'
import { Layout, Loader2, Palette, RotateCcw, Save, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useSidebarConfig } from '@/contexts/sidebar-context'
import { tweakcnThemes } from '@/config/theme-data'
import { baseColors, customColorGroups } from '@/config/theme-customizer-constants'
import { customizerApi } from '@/services/customizer.service'
import { ThemeTab } from './theme-tab'
import { LayoutTab } from './layout-tab'
import { ImportModal } from './import-modal'
import { cn } from '@/lib/utils'
import type { ImportedTheme } from '@/types/theme-customizer'
import { toast } from 'sonner'

interface ThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * When true, no sheet/modal UI is rendered (admin hid the customizer), but API hydration
   * and theme re-apply on light/dark change still run so ModeToggle keeps working.
   */
  uiHidden?: boolean
  /**
   * Only platform admins may persist customizer changes to the server. Non-admins still get
   * the admin-configured theme but must not overwrite saved settings (e.g. via mode auto-save).
   */
  allowServerPersistence?: boolean
}

export function ThemeCustomizer({
  open,
  onOpenChange,
  uiHidden = false,
  allowServerPersistence = true,
}: ThemeCustomizerProps) {
  const { applyImportedTheme, isDarkMode, resetTheme, applyRadius, brandColorsValues, setBrandColorsValues, applyTheme, applyTweakcnTheme, setTheme, theme } = useThemeManager()
  const { config: sidebarConfig, updateConfig: updateSidebarConfig } = useSidebarConfig()

  const [activeTab, setActiveTab] = React.useState("theme")
  const [selectedTheme, setSelectedTheme] = React.useState<string>("default")
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = React.useState<string>("")
  const [activePresetType, setActivePresetType] = React.useState<"theme" | "tweakcn" | "custom">("theme")
  const [selectedRadius, setSelectedRadius] = React.useState<string>("0.5rem")
  const [customColors, setCustomColors] = React.useState<Record<string, string>>({})
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importedTheme, setImportedTheme] = React.useState<ImportedTheme | null>(null)
  const [isHydratedFromApi, setIsHydratedFromApi] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Logo States
  const [lightModeLogo, setLightModeLogo] = React.useState<string>("")
  const [darkModeLogo, setDarkModeLogo] = React.useState<string>("")
  const [lightModeLogoWidth, setLightModeLogoWidth] = React.useState<number>(0)
  const [lightModeLogoHeight, setLightModeLogoHeight] = React.useState<number>(0)
  const [darkModeLogoWidth, setDarkModeLogoWidth] = React.useState<number>(0)
  const [darkModeLogoHeight, setDarkModeLogoHeight] = React.useState<number>(0)
  const hasAppliedHydratedBrandColors = React.useRef(false)
  const hasCompletedInitialHydration = React.useRef(false)
  const isHydratingRef = React.useRef(false)
  const lastSavedMode = React.useRef<"light" | "dark" | "system" | null>(null)
  // Track current radius in a ref so effects with stale closures can still re-apply it
  const currentRadiusRef = React.useRef<string>(selectedRadius)
  React.useEffect(() => { currentRadiusRef.current = selectedRadius }, [selectedRadius])

  const handleReset = () => {
    // Complete reset to application defaults

    // 1. Reset all state variables to initial values
    setSelectedTheme("default")
    setSelectedTweakcnTheme("")
    setActivePresetType("theme")
    setSelectedRadius("0.5rem")
    setCustomColors({})
    setImportedTheme(null) // Clear imported theme
    hasAppliedHydratedBrandColors.current = false
    setBrandColorsValues({}) // Clear brand colors state

    // 2. Clear custom CSS variables first
    resetTheme()

    // 3. Re-apply dashboard baseline preset so reset is isolated from landing defaults
    applyTheme("default", isDarkMode)

    // 4. Reset the radius to default
    applyRadius("0.5rem")

    // 5. Reset sidebar to defaults
    updateSidebarConfig({ variant: "inset", collapsible: "offcanvas", side: "left" })

    // 6. Reset Logos
    setLightModeLogo("")
    setDarkModeLogo("")
    setLightModeLogoWidth(0)
    setLightModeLogoHeight(0)
    setDarkModeLogoWidth(0)
    setDarkModeLogoHeight(0)
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    // Clear other selections to indicate custom import is active
    setSelectedTheme("")
    setSelectedTweakcnTheme("")

    // Apply the imported theme
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const buildSettingsPayload = React.useCallback(() => {
    const radiusNumber = Number.parseFloat(selectedRadius.replace("rem", ""))
    const sidebarVariantMap: Record<"sidebar" | "floating" | "inset", string> = {
      sidebar: "default",
      floating: "floating",
      inset: "inset",
    }
    const sidebarCollapsibleMap: Record<"offcanvas" | "icon" | "none", string> = {
      offcanvas: "off_canvas",
      icon: "icon",
      none: "none",
    }

    const allCustomColorNames = customColorGroups.reduce<Record<string, string>>((acc, group) => {
      group.colors.forEach((color) => {
        acc[color.cssVar] = color.name
      })
      return acc
    }, {})

    const isCustomMode = activePresetType === "custom"

    const sourceColorMap =
      activePresetType === "custom" && Object.keys(customColors).length > 0
        ? customColors
        : brandColorsValues

    // Persist ONLY user-provided custom colors in custom mode.
    const customColorsPayload = Object.entries(isCustomMode ? sourceColorMap : {}).reduce<
      Record<string, Array<{ code: string; value: string }>>
    >((acc, [cssVar, code]) => {
      const normalizedCode = typeof code === "string" ? code.trim() : ""
      if (!normalizedCode) return acc
      const apiKey = cssVar.replace(/^--/, "").replace(/-/g, "_")
      acc[apiKey] = [{ code: normalizedCode, value: allCustomColorNames[cssVar] || apiKey }]
      return acc
    }, {})

    const useTweakcnPreset = activePresetType === "tweakcn" && !!selectedTweakcnTheme
    const themePreset = isCustomMode ? "" : (useTweakcnPreset ? "" : (selectedTheme || "default"))
    const tweakcnPreset = useTweakcnPreset ? selectedTweakcnTheme : ""

    return {
      theme: {
        preset: themePreset,
        tweakcn_preset: tweakcnPreset,
        radius: Number.isFinite(radiusNumber) ? radiusNumber : 0.5,
        mode: theme,
        custom_colors: customColorsPayload,
        light_mode_logo: lightModeLogo,
        dark_mode_logo: darkModeLogo,
        light_mode_logo_width: lightModeLogoWidth,
        light_mode_logo_height: lightModeLogoHeight,
        dark_mode_logo_width: darkModeLogoWidth,
        dark_mode_logo_height: darkModeLogoHeight,
      },
      layout: {
        sidebar_variant: sidebarVariantMap[sidebarConfig.variant],
        sidebar_collapsible: sidebarCollapsibleMap[sidebarConfig.collapsible],
        sidebar_position: sidebarConfig.side,
      },
    }
  }, [activePresetType, brandColorsValues, customColors, darkModeLogo, darkModeLogoHeight, darkModeLogoWidth, lightModeLogo, lightModeLogoHeight, lightModeLogoWidth, selectedRadius, selectedTheme, selectedTweakcnTheme, sidebarConfig.collapsible, sidebarConfig.side, sidebarConfig.variant, theme])

  const hydrateCustomizerFromApi = async () => {
    if (isHydratingRef.current) return
    isHydratingRef.current = true
    try {
      const settings = await customizerApi.getSettingsPublic()
      if (!settings) {
        setIsHydratedFromApi(true)
        return
      }

      const themeSettings = settings?.theme
      const layoutSettings = settings?.layout
      // Do not force mode from customizer settings during hydration.
      // Header mode toggle is the active user preference after first load.
      const isDark = isDarkMode

      if (typeof themeSettings?.radius === 'number') {
        const radiusRem = `${themeSettings.radius}rem`
        setSelectedRadius(radiusRem)
        currentRadiusRef.current = radiusRem
        applyRadius(radiusRem)
      }

      if (themeSettings?.light_mode_logo) setLightModeLogo(themeSettings.light_mode_logo)
      if (themeSettings?.dark_mode_logo) setDarkModeLogo(themeSettings.dark_mode_logo)
      if (typeof themeSettings?.light_mode_logo_width === 'number') setLightModeLogoWidth(themeSettings.light_mode_logo_width)
      if (typeof themeSettings?.light_mode_logo_height === 'number') setLightModeLogoHeight(themeSettings.light_mode_logo_height)
      if (typeof themeSettings?.dark_mode_logo_width === 'number') setDarkModeLogoWidth(themeSettings.dark_mode_logo_width)
      if (typeof themeSettings?.dark_mode_logo_height === 'number') setDarkModeLogoHeight(themeSettings.dark_mode_logo_height)

      if (themeSettings?.mode === 'light' || themeSettings?.mode === 'dark' || themeSettings?.mode === 'system') {
        lastSavedMode.current = themeSettings.mode
      }

      const persistedCustomColors = themeSettings?.custom_colors || themeSettings?.brand_colors
      const hasPersistedCustomColors =
        !!persistedCustomColors && Object.keys(persistedCustomColors).length > 0
      // Custom colors are active only when preset selectors are empty.
      const shouldUseCustomMode =
        hasPersistedCustomColors &&
        (!themeSettings?.tweakcn_preset || themeSettings.tweakcn_preset.trim() === "") &&
        (!themeSettings?.preset || themeSettings.preset.trim() === "")

      if (shouldUseCustomMode && persistedCustomColors) {
        const nextBrandColors: Record<string, string> = {}
        Object.entries(persistedCustomColors).forEach(([key, values]) => {
          const firstColor = (values as any)?.[0]?.code
          if (!firstColor) return
          const cssVar = `--${key.replace(/_/g, '-')}`
          nextBrandColors[cssVar] = firstColor
        })

        if (Object.keys(nextBrandColors).length > 0) {
          // Build base variables from default preset, then overlay saved custom colors.
          applyTheme("default", isDark)
          Object.entries(nextBrandColors).forEach(([cssVar, value]) => {
            document.documentElement.style.setProperty(cssVar, value)
          })
          setBrandColorsValues(nextBrandColors)
          setCustomColors(nextBrandColors)
          setSelectedTheme("")
          setSelectedTweakcnTheme("")
          setActivePresetType('custom')
        } else {
          setBrandColorsValues({})
          setCustomColors({})
        }
      } else if (themeSettings?.tweakcn_preset) {
        setSelectedTweakcnTheme(themeSettings.tweakcn_preset)
        setSelectedTheme('')
        setActivePresetType('tweakcn')
        setCustomColors({})
        setBrandColorsValues({})
        const preset = tweakcnThemes.find(t => t.value === themeSettings.tweakcn_preset)?.preset
        if (preset) applyTweakcnTheme(preset, isDark)
      } else {
        const presetName = themeSettings?.preset || "default"
        setSelectedTheme(presetName)
        setSelectedTweakcnTheme('')
        setActivePresetType('theme')
        setCustomColors({})
        setBrandColorsValues({})
        applyTheme(presetName, isDark)
      }

      if (layoutSettings) {
        const variantMap: Record<string, 'sidebar' | 'floating' | 'inset'> = {
          default: 'sidebar', sidebar: 'sidebar', floating: 'floating', inset: 'inset',
        }
        const collapsibleMap: Record<string, 'offcanvas' | 'icon' | 'none'> = {
          off_canvas: 'offcanvas', offcanvas: 'offcanvas', icon: 'icon', none: 'none',
        }
        updateSidebarConfig({
          variant: layoutSettings.sidebar_variant ? variantMap[layoutSettings.sidebar_variant] ?? 'sidebar' : 'sidebar',
          collapsible: layoutSettings.sidebar_collapsible ? collapsibleMap[layoutSettings.sidebar_collapsible] ?? 'offcanvas' : 'offcanvas',
          side: layoutSettings.sidebar_position ?? 'left',
        })
      }

      setIsHydratedFromApi(true)
      hasCompletedInitialHydration.current = true
    } catch {
      setIsHydratedFromApi(true)
    } finally {
      isHydratingRef.current = false
    }
  }

  // Real-time update for components listening to the customizer (e.g. Logo)
  React.useEffect(() => {
    if (!isHydratedFromApi) return
    const payload = buildSettingsPayload()
    localStorage.setItem('kivicare-customizer-theme', JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('kivicare-customizer-theme-updated', { detail: { theme: payload.theme } }))
  }, [lightModeLogo, darkModeLogo, lightModeLogoWidth, lightModeLogoHeight, darkModeLogoWidth, darkModeLogoHeight, buildSettingsPayload, isHydratedFromApi])

  const handleSave = async () => {
    if (!allowServerPersistence) return
    try {
      setIsSaving(true)
      const payload = buildSettingsPayload()
      await customizerApi.saveSettings(payload)
      await hydrateCustomizerFromApi()
      localStorage.setItem('kivicare-customizer-theme', JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('kivicare-customizer-updated'))
      window.dispatchEvent(new CustomEvent('kivicare-customizer-theme-updated', { detail: { theme: payload.theme } }))

      lastSavedMode.current = theme
      toast.success("Customizer settings saved")
    } catch {
      toast.error("Failed to save customizer settings")
    } finally {
      setIsSaving(false)
    }
  }

  React.useEffect(() => {
    hydrateCustomizerFromApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!open) return
    hydrateCustomizerFromApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Re-apply the preset whenever the user toggles dark/light mode AFTER hydration.
  // Also re-apply radius via ref since closures here would otherwise be stale.
  React.useEffect(() => {
    if (!isHydratedFromApi) return
    if (importedTheme) {
      applyImportedTheme(importedTheme, isDarkMode)
    } else if (activePresetType === 'custom') {
      const colorMap = Object.keys(customColors).length > 0 ? customColors : brandColorsValues
      if (Object.keys(colorMap).length > 0) {
        applyTheme('default', isDarkMode)
        Object.entries(colorMap).forEach(([cssVar, value]) => {
          if (value) {
            document.documentElement.style.setProperty(cssVar, value)
          }
        })
      }
    } else if (activePresetType === 'tweakcn' && selectedTweakcnTheme) {
      const preset = tweakcnThemes.find(t => t.value === selectedTweakcnTheme)?.preset
      if (preset) applyTweakcnTheme(preset, isDarkMode)
    } else if (activePresetType === 'theme' && selectedTheme) {
      applyTheme(selectedTheme, isDarkMode)
    }
    // Always re-apply radius after theme change since applyTheme may reset it
    if (currentRadiusRef.current) applyRadius(currentRadiusRef.current)
  }, [isDarkMode, isHydratedFromApi, importedTheme, activePresetType, customColors, brandColorsValues, selectedTweakcnTheme, selectedTheme, applyImportedTheme, applyTweakcnTheme, applyTheme])

  if (uiHidden) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side={sidebarConfig.side === "left" ? "right" : "left"}
          className="w-[400px] p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col"
          onInteractOutside={(e) => {
            // Prevent the sheet from closing when dialog is open
            if (importModalOpen) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">Customizer</SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="cursor-pointer h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="cursor-pointer h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground sr-only">
              Customize the them and layout of your dashboard.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="py-2">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-12 p-1.5">
                  <TabsTrigger
                    value="theme"
                    className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Palette className="h-4 w-4 mr-1" /> Theme
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Layout className="h-4 w-4 mr-1" /> Layout
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="theme" className="flex-1 mt-0">
                <ThemeTab
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                  selectedTweakcnTheme={selectedTweakcnTheme}
                  setSelectedTweakcnTheme={setSelectedTweakcnTheme}
                  setActivePresetType={setActivePresetType}
                  selectedRadius={selectedRadius}
                  setSelectedRadius={setSelectedRadius}
                  setImportedTheme={setImportedTheme}
                  onImportClick={handleImportClick}
                  customColors={customColors}
                  setCustomColors={setCustomColors}
                  clearAppliedCustomColors={() => setBrandColorsValues({})}
                  lightModeLogo={lightModeLogo}
                  setLightModeLogo={setLightModeLogo}
                  darkModeLogo={darkModeLogo}
                  setDarkModeLogo={setDarkModeLogo}
                  lightModeLogoWidth={lightModeLogoWidth}
                  setLightModeLogoWidth={setLightModeLogoWidth}
                  lightModeLogoHeight={lightModeLogoHeight}
                  setLightModeLogoHeight={setLightModeLogoHeight}
                  darkModeLogoWidth={darkModeLogoWidth}
                  setDarkModeLogoWidth={setDarkModeLogoWidth}
                  darkModeLogoHeight={darkModeLogoHeight}
                  setDarkModeLogoHeight={setDarkModeLogoHeight}
                />
              </TabsContent>

              <TabsContent value="layout" className="flex-1 mt-0">
                <LayoutTab />
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t p-3">
            <Button onClick={handleSave} disabled={isSaving} className="w-full cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Customizer
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  )
}

// Floating trigger button - positioned dynamically based on sidebar side
export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  const { config: sidebarConfig } = useSidebarConfig()

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed z-50 h-12 w-12 cursor-pointer rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        /* Centered on large screens; bottom corner on narrow viewports so forms (e.g. Settings) are not covered */
        "max-lg:top-auto max-lg:-translate-y-0 max-lg:bottom-[max(1rem,env(safe-area-inset-bottom,0px))]",
        "lg:top-1/2 lg:-translate-y-1/2",
        sidebarConfig.side === "left" ? "right-4" : "left-4"
      )}
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}
