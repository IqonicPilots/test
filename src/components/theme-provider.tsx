"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ThemeProviderContext } from "@/contexts/theme-context"
import { colorThemes, tweakcnThemes } from '@/config/theme-data'
import { customizerApi, type CustomizerSettings } from "@/services/customizer.service"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const LEGACY_DEFAULT_BRAND_COLORS: Record<string, string> = {
  primary: "#007bff",
  primary_foreground: "#ffffff",
  secondary: "#6c757d",
  secondary_foreground: "#ffffff",
  accent: "#f8f9fa",
  accent_foreground: "#212529",
  muted: "#e9ecef",
  muted_foreground: "#6c757d",
}

function hasOnlyLegacyDefaultBrandColors(
  brandColors: Record<string, { code: string; value: string }[]>
) {
  const keys = Object.keys(LEGACY_DEFAULT_BRAND_COLORS)
  return keys.every((key) => {
    const actual = brandColors[key]?.[0]?.code?.trim().toLowerCase()
    const expected = LEGACY_DEFAULT_BRAND_COLORS[key]?.trim().toLowerCase()
    return actual === expected
  })
}

function isForcedLightRoute(pathname: string | null) {
  if (!pathname) return false

  return (
    pathname === "/" ||
    pathname === "/landing" ||
    pathname.startsWith("/blogs-list") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/book-appointment") ||
    pathname.startsWith("/doctor-list") ||
    pathname.startsWith("/clinic-list")
  )
}


export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const pathname = usePathname()

  const getInitialTheme = React.useCallback((): Theme => {
    if (typeof window === "undefined") return defaultTheme
    try {
      const stored = window.localStorage.getItem(storageKey) as Theme | null
      if (stored === "light" || stored === "dark" || stored === "system") return stored

      const serverTheme = window.document.documentElement.getAttribute("data-initial-theme") as Theme | null
      if (serverTheme === "light" || serverTheme === "dark" || serverTheme === "system") return serverTheme
    } catch { }

    return defaultTheme
  }, [defaultTheme, storageKey])

  const [theme, setTheme] = React.useState<Theme>(getInitialTheme)
  const [publicCustomizer, setPublicCustomizer] = React.useState<CustomizerSettings | null>(null)

  // Hydrate stored theme after mount (only for non-forced-light routes).
  React.useEffect(() => {
    if (typeof window === "undefined") return

    // IF it's a forced light route, ensure we are in light mode in-memory
    // without writing to localStorage (so we don't break dashboard preference)
    if (isForcedLightRoute(pathname)) {
      if (theme !== "light") {
        setTheme("light")
      }
      return
    }

    const stored = window.localStorage.getItem(storageKey) as Theme | null
    if (stored && stored !== theme) {
      setTheme(stored)
      return
    }

    // Customizer mode is treated as a default fallback only when user has no preference yet.
    const mode = publicCustomizer?.theme?.mode
    if (!stored && mode && mode !== theme) {
      setTheme(mode)
    }
  }, [pathname, storageKey, theme, defaultTheme, publicCustomizer])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    let isMounted = true

    const hydratePublicCustomizer = async () => {
      try {
        const settings = await customizerApi.getSettingsPublic()
        if (!isMounted) return
        setPublicCustomizer(settings)
      } catch {
        if (!isMounted) return
        setPublicCustomizer(null)
      }
    }

    hydratePublicCustomizer()

    const handleUpdate = () => {
      hydratePublicCustomizer()
    }
    window.addEventListener('kivicare-customizer-updated', handleUpdate)

    return () => {
      isMounted = false
      window.removeEventListener('kivicare-customizer-updated', handleUpdate)
    }
  }, [])

  // Apply theme class before paint to prevent "dark flash" when navigating back from dashboard.
  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    const resetTheme = () => {
      // Comprehensive cleanup of ALL inline CSS variables set on :root/html
      const inlineStyles = root.style
      for (let i = inlineStyles.length - 1; i >= 0; i--) {
        const property = inlineStyles[i]
        if (property && property.startsWith("--")) {
          root.style.removeProperty(property)
        }
      }
    }

    // Always clean up before applying new theme to ensure no "leaked" styles from previous mode.
    resetTheme()
    root.classList.remove("light", "dark")

    const resolveMode = (): "light" | "dark" => {
      if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return theme as "light" | "dark"
    }

    const forcedLight = isForcedLightRoute(pathname)
    const mode = forcedLight ? "light" : resolveMode()
    root.classList.add(mode)

    try {
      const savedTheme = publicCustomizer
      const activeThemeSettings = forcedLight
        ? savedTheme?.landing_theme
        : savedTheme?.theme

      if (activeThemeSettings) {
        const preset = activeThemeSettings.preset || ""
        const tweakcnPreset = activeThemeSettings.tweakcn_preset || ""
        const radius = activeThemeSettings.radius ?? 0.5
        const persistedCustomColors = activeThemeSettings.custom_colors || activeThemeSettings.brand_colors
        const hasCustomColors =
          !!persistedCustomColors &&
          (
            forcedLight ||
            !hasOnlyLegacyDefaultBrandColors(
              persistedCustomColors as Record<string, { code: string; value: string }[]>
            )
          )

        root.style.setProperty('--radius', `${radius}rem`)

        let styles: Record<string, string> = {}
        if (tweakcnPreset) {
          const themeObj = tweakcnThemes.find(t => t.value === tweakcnPreset)
          if (themeObj) {
            styles = mode === "dark" ? themeObj.preset.styles.dark : themeObj.preset.styles.light
          }
        } else if (preset) {
          const themeObj = colorThemes.find(t => t.value === preset)
          if (themeObj) {
            styles = mode === "dark" ? themeObj.preset.styles.dark : themeObj.preset.styles.light
          }
        } else if (hasCustomColors) {
          // Custom mode uses default preset as base, then overlays custom colors.
          const defaultTheme = colorThemes.find(t => t.value === "default")
          if (defaultTheme) {
            styles = mode === "dark" ? defaultTheme.preset.styles.dark : defaultTheme.preset.styles.light
          }
        }

        Object.entries(styles).forEach(([key, value]) => {
          if (key === "radius") return
          root.style.setProperty(`--${key}`, value as string)
        })

        const shouldApplyCustomColors =
          !tweakcnPreset &&
          !preset
        if (
          shouldApplyCustomColors &&
          persistedCustomColors &&
          hasCustomColors
        ) {
          Object.entries(persistedCustomColors).forEach(([key, values]) => {
            const firstColor = (values as any)?.[0]?.code
            if (firstColor) {
              root.style.setProperty(`--${key.replace(/_/g, '-')}`, firstColor)
            }
          })
        }
      }
    } catch (e) {
      // Silent catch
    }
  }, [theme, pathname, publicCustomizer])

  // Cross-tab synchronization
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        // Read the new mode and update state to trigger re-render
        try {
          if (e.key === storageKey && e.newValue) {
            const mode = e.newValue as Theme
            setTheme(mode)
          }
        } catch (err) { }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [storageKey])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, newTheme)

        try {
          setPublicCustomizer((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              theme: {
                ...prev.theme,
                mode: newTheme,
              },
            }
          })
        } catch (e) { }

        const root = window.document.documentElement

        // Comprehensive cleanup before manual class switch
        const resetTheme = () => {
          const inlineStyles = root.style
          for (let i = inlineStyles.length - 1; i >= 0; i--) {
            const property = inlineStyles[i]
            if (property && property.startsWith("--")) {
              root.style.removeProperty(property)
            }
          }
        }
        resetTheme()

        root.classList.remove("light", "dark")
        const actualMode = newTheme === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : newTheme
        root.classList.add(actualMode)
      }
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
