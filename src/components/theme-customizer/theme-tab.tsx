"use client"

import { Dices, Sun, Moon, Paintbrush, Upload, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useCircularTransition } from '@/hooks/use-circular-transition'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'
import { radiusOptions, customColorGroups } from '@/config/theme-customizer-constants'
import { ColorPicker } from '@/components/color-picker'
import { customizerApi } from '@/services/customizer.service'
import { toast } from 'sonner'
import type { ImportedTheme } from '@/types/theme-customizer'
import React from 'react'
import "./circular-transition.css"

interface ThemeTabProps {
  selectedTheme: string
  setSelectedTheme: (theme: string) => void
  selectedTweakcnTheme: string
  setSelectedTweakcnTheme: (theme: string) => void
  setActivePresetType: (type: "theme" | "tweakcn" | "custom") => void
  selectedRadius: string
  setSelectedRadius: (radius: string) => void
  setImportedTheme: (theme: ImportedTheme | null) => void
  onImportClick: () => void
  customColors?: Record<string, string>
  setCustomColors?: (colors: Record<string, string>) => void
  clearAppliedCustomColors?: () => void
  lightModeLogo?: string
  setLightModeLogo?: (url: string) => void
  darkModeLogo?: string
  setDarkModeLogo?: (url: string) => void
  lightModeLogoWidth?: number
  setLightModeLogoWidth?: (width: number) => void
  lightModeLogoHeight?: number
  setLightModeLogoHeight?: (height: number) => void
  darkModeLogoWidth?: number
  setDarkModeLogoWidth?: (width: number) => void
  darkModeLogoHeight?: number
  setDarkModeLogoHeight?: (height: number) => void
}

export function ThemeTab({
  selectedTheme,
  setSelectedTheme,
  selectedTweakcnTheme,
  setSelectedTweakcnTheme,
  setActivePresetType,
  selectedRadius,
  setSelectedRadius,
  setImportedTheme,
  onImportClick,
  customColors = {},
  setCustomColors = () => { },
  clearAppliedCustomColors = () => { },
  lightModeLogo = "",
  setLightModeLogo = () => { },
  darkModeLogo = "",
  setDarkModeLogo = () => { },
  lightModeLogoWidth = 0,
  setLightModeLogoWidth = () => { },
  lightModeLogoHeight = 0,
  setLightModeLogoHeight = () => { },
  darkModeLogoWidth = 0,
  setDarkModeLogoWidth = () => { },
  darkModeLogoHeight = 0,
  setDarkModeLogoHeight = () => { },
}: ThemeTabProps) {
  const {
    isDarkMode,
    applyTheme,
    applyTweakcnTheme,
    applyRadius,
  } = useThemeManager()

  const { toggleTheme } = useCircularTransition()
  const nonDefaultThemes = React.useMemo(
    () => colorThemes.filter((theme) => theme.value !== "default"),
    []
  )
  const selectedThemeValue = nonDefaultThemes.some((theme) => theme.value === selectedTheme)
    ? selectedTheme
    : ""

  // --- Mutual exclusivity helpers ---

  const activateThemePreset = (value: string) => {
    setSelectedTheme(value)
    setSelectedTweakcnTheme("")
    setCustomColors({}) // clear custom colors
    clearAppliedCustomColors()
    setActivePresetType("theme")
    setImportedTheme(null)
    applyTheme(value, isDarkMode)
  }

  const activateTweakcnPreset = (value: string) => {
    const preset = tweakcnThemes.find(t => t.value === value)?.preset
    if (!preset) return
    setSelectedTweakcnTheme(value)
    setSelectedTheme("")
    setCustomColors({}) // clear custom colors
    clearAppliedCustomColors()
    setActivePresetType("tweakcn")
    setImportedTheme(null)
    applyTweakcnTheme(preset, isDarkMode)
  }

  const handleCustomColorChange = (cssVar: string, value: string) => {
    const next = { ...customColors, [cssVar]: value }
    // If user sets a value → switch to custom mode, clear presets
    if (value) {
      setSelectedTheme("")
      setSelectedTweakcnTheme("")
      setActivePresetType("custom")
      setImportedTheme(null)
    }
    setCustomColors(next)
    // Live-apply to DOM
    document.documentElement.style.setProperty(cssVar, value)
  }

  const handleRandomShadcn = () => {
    const randomTheme = nonDefaultThemes[Math.floor(Math.random() * nonDefaultThemes.length)]
    if (!randomTheme) return
    activateThemePreset(randomTheme.value)
  }

  const handleRandomTweakcn = () => {
    const randomTheme = tweakcnThemes[Math.floor(Math.random() * tweakcnThemes.length)]
    activateTweakcnPreset(randomTheme.value)
  }

  const handleRadiusSelect = (radius: string) => {
    setSelectedRadius(radius)
    applyRadius(radius)
  }

  const handleLightMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === false) return
    toggleTheme(event)
  }

  const handleDarkMode = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDarkMode === true) return
    toggleTheme(event)
  }

  const [isUploadingLight, setIsUploadingLight] = React.useState(false)
  const [isUploadingDark, setIsUploadingDark] = React.useState(false)
  const lightLogoInputRef = React.useRef<HTMLInputElement>(null)
  const darkLogoInputRef = React.useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (type === 'light') setIsUploadingLight(true)
      else setIsUploadingDark(true)

      const url = await customizerApi.uploadLogo(file)
      if (type === 'light') setLightModeLogo(url)
      else setDarkModeLogo(url)
      toast.success("Logo uploaded successfully")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      if (type === 'light') setIsUploadingLight(false)
      else setIsUploadingDark(false)
    }
  }

  const isCustomActive = Object.values(customColors ?? {}).some(v => !!v)

  return (
    <div className="p-4 space-y-6">

      {/* Shadcn UI Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Theme Presets</Label>
          <Button variant="outline" size="sm" onClick={handleRandomShadcn} className="cursor-pointer">
            <Dices className="h-3.5 w-3.5 mr-1.5" />
            Random
          </Button>
        </div>

        <Select value={selectedThemeValue} onValueChange={activateThemePreset}>
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Choose Shadcn Theme" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <div className="p-2">
              {nonDefaultThemes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.accent }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.muted }}
                      />
                    </div>
                    <span>{theme.name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Tweakcn Theme Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Tweakcn Theme Presets</Label>
          <Button variant="outline" size="sm" onClick={handleRandomTweakcn} className="cursor-pointer">
            <Dices className="h-3.5 w-3.5 mr-1.5" />
            Random
          </Button>
        </div>

        <Select value={selectedTweakcnTheme} onValueChange={activateTweakcnPreset}>
          <SelectTrigger className="w-full cursor-pointer">
            <SelectValue placeholder="Choose Tweakcn Theme" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <div className="p-2">
              {tweakcnThemes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.accent }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: theme.preset.styles.light.muted }}
                      />
                    </div>
                    <span>{theme.name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Custom Colors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Paintbrush className="h-3.5 w-3.5" />
            Custom Colors
          </Label>
          {isCustomActive && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Set individual colors manually. Selecting a preset above will clear these overrides.
        </p>

        <Accordion type="multiple" className="w-full space-y-1">
          {(customColorGroups ?? []).map((group) => (
            <AccordionItem key={group.label} value={group.label} className="border border-border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 transition-colors text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-muted/10">
                {group.colors.map((color) => (
                  <ColorPicker
                    key={color.cssVar}
                    label={color.name}
                    cssVar={color.cssVar}
                    value={customColors[color.cssVar] || ""}
                    onChange={handleCustomColorChange}
                  />
                ))}
              </AccordionContent
              >
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Separator />

      {/* Radius Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Radius</Label>
        <div className="grid grid-cols-5 gap-2">
          {radiusOptions.map((option) => (
            <div
              key={option.value}
              className={`relative cursor-pointer rounded-md p-3 border transition-colors ${selectedRadius === option.value
                  ? "border-primary"
                  : "border-border hover:border-border/60"
                }`}
              onClick={() => handleRadiusSelect(option.value)}
            >
              <div className="text-center">
                <div className="text-xs font-medium">{option.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mode Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={!isDarkMode ? "secondary" : "outline"}
            size="sm"
            onClick={handleLightMode}
            className="cursor-pointer"
          >
            <Sun className="h-4 w-4 mr-1" />
            Light
          </Button>
          <Button
            variant={isDarkMode ? "secondary" : "outline"}
            size="sm"
            onClick={handleDarkMode}
            className="cursor-pointer"
          >
            <Moon className="h-4 w-4 mr-1" />
            Dark
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: This sets the default mode for first-time/login users. After that, users can switch Light/Dark from the header and that preference is used.
        </p>
      </div>

      <Separator />

      {/* Logos Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Logos</Label>
        <p className="text-xs text-muted-foreground">
          Recommended: transparent PNG, ratio around 4:1 (e.g. 320x80), and maximum size 800KB.
        </p>

        <div className="space-y-3">
          {/* Light Mode Logo */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Light Mode Logo</Label>
            <div className="space-y-3 rounded-md border p-3">
              <div className="h-14 w-full overflow-hidden rounded border bg-muted/30">
                {lightModeLogo ? (
                  <img alt="Light logo preview" className="h-full w-full object-contain" src={lightModeLogo} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                )}
              </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingLight}
                    onClick={() => lightLogoInputRef.current?.click()}
                    className="cursor-pointer"
                  >
                    {isUploadingLight ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    Upload
                  </Button>
                  <input
                    ref={lightLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'light')}
                  />
                  {lightModeLogo && (
                  <Button variant="outline" size="sm" onClick={() => setLightModeLogo("")} className="cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Width (px)</Label>
                  <Input
                    type="number"
                    value={lightModeLogoWidth || ""}
                    onChange={(e) => setLightModeLogoWidth(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Height (px)</Label>
                  <Input
                    type="number"
                    value={lightModeLogoHeight || ""}
                    onChange={(e) => setLightModeLogoHeight(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode Logo */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Dark Mode Logo (Dashboard only)</Label>
            <div className="space-y-3 rounded-md border p-3">
              <div className="h-14 w-full overflow-hidden rounded border bg-muted/30">
                {darkModeLogo ? (
                  <img alt="Dark logo preview" className="h-full w-full object-contain" src={darkModeLogo} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                )}
              </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingDark}
                    onClick={() => darkLogoInputRef.current?.click()}
                    className="cursor-pointer"
                  >
                    {isUploadingDark ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                    Upload
                  </Button>
                  <input
                    ref={darkLogoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'dark')}
                  />
                  {darkModeLogo && (
                  <Button variant="outline" size="sm" onClick={() => setDarkModeLogo("")} className="cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Width (px)</Label>
                  <Input
                    type="number"
                    value={darkModeLogoWidth || ""}
                    onChange={(e) => setDarkModeLogoWidth(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Height (px)</Label>
                  <Input
                    type="number"
                    value={darkModeLogoHeight || ""}
                    onChange={(e) => setDarkModeLogoHeight(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
