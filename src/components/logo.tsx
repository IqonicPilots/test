"use client"
import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { customizerApi } from "@/services/customizer.service"
import { getStoredAuthSession } from "@/lib/auth-session"
import { useThemeManager } from "@/hooks/use-theme-manager"

type LogoProps = Omit<
  React.ComponentProps<typeof Image>,
  "src" | "alt" | "width" | "height"
> & {
  size?: number
  alt?: string
  useDashboardDarkLogo?: boolean
  useConfiguredSize?: boolean
  srcOverride?: string
  useLandingLogo?: boolean
}

/**
 * Renders the site logo. Hydrates from customizer settings or falls back to `/logo.png`.
 */
export function Logo({
  size = 24,
  className,
  alt = "Kivicare",
  useDashboardDarkLogo = false,
  useConfiguredSize = false,
  srcOverride,
  useLandingLogo = false,
  ...props
}: LogoProps) {
  const getInitialState = (key: string, isWidthHeight: boolean = false) => {
    if (typeof window === "undefined") return isWidthHeight ? 0 : ""
    try {
      const dashboardCached = localStorage.getItem("kivicare-customizer-theme")
      const landingCached = localStorage.getItem("kivicare-landing-theme")
      
      const parseAndGet = (cached: string | null, isLanding: boolean) => {
        if (!cached) return null
        const settings = JSON.parse(cached)
        if (isLanding) {
          const header = settings?.landing_content?.header
          if (key === "light_mode_logo") return header?.siteLogo || null
          if (key === "light_mode_logo_width") return header?.siteLogoWidth || null
          if (key === "light_mode_logo_height") return header?.siteLogoHeight || null
          return null
        }
        const theme = settings?.theme
        if (key === "light_mode_logo") return theme?.light_mode_logo || settings?.light_mode_logo || null
        if (key === "dark_mode_logo") return theme?.dark_mode_logo || settings?.dark_mode_logo || null
        if (key === "light_mode_logo_width") return theme?.light_mode_logo_width || settings?.light_mode_logo_width || null
        if (key === "light_mode_logo_height") return theme?.light_mode_logo_height || settings?.light_mode_logo_height || null
        if (key === "dark_mode_logo_width") return theme?.dark_mode_logo_width || settings?.dark_mode_logo_width || null
        if (key === "dark_mode_logo_height") return theme?.dark_mode_logo_height || settings?.dark_mode_logo_height || null
        return null
      }

      // 1. Try the primary cache for the requested mode
      const primaryResult = parseAndGet(useLandingLogo ? landingCached : dashboardCached, useLandingLogo)
      if (primaryResult !== null) return primaryResult

      // 2. Fallback to the other cache
      const secondaryResult = parseAndGet(useLandingLogo ? dashboardCached : landingCached, !useLandingLogo)
      if (secondaryResult !== null) return secondaryResult
      
    } catch { }
    return isWidthHeight ? 0 : ""
  }

  const [lightModeLogo, setLightModeLogo] = React.useState<string>(() => getInitialState("light_mode_logo") as string)
  const [darkModeLogo, setDarkModeLogo] = React.useState<string>(() => getInitialState("dark_mode_logo") as string)
  const [lightModeLogoWidth, setLightModeLogoWidth] = React.useState<number>(() => getInitialState("light_mode_logo_width", true) as number)
  const [lightModeLogoHeight, setLightModeLogoHeight] = React.useState<number>(() => getInitialState("light_mode_logo_height", true) as number)
  const [darkModeLogoWidth, setDarkModeLogoWidth] = React.useState<number>(() => getInitialState("dark_mode_logo_width", true) as number)
  const [darkModeLogoHeight, setDarkModeLogoHeight] = React.useState<number>(() => getInitialState("dark_mode_logo_height", true) as number)

  const applyThemeLogos = React.useCallback((themeSettings: any = {}) => {
    // If we are in landing mode, themeSettings might actually be landing_content.header
    if (useLandingLogo) {
      setLightModeLogo(themeSettings.siteLogo || themeSettings.light_mode_logo || "")
      setLightModeLogoWidth(Number(themeSettings.siteLogoWidth || themeSettings.light_mode_logo_width || 0))
      setLightModeLogoHeight(Number(themeSettings.siteLogoHeight || themeSettings.light_mode_logo_height || 0))
    } else {
      setLightModeLogo(themeSettings.light_mode_logo ?? "")
      setDarkModeLogo(themeSettings.dark_mode_logo ?? "")
      setLightModeLogoWidth(Number.isFinite(themeSettings.light_mode_logo_width) ? Number(themeSettings.light_mode_logo_width) : 0)
      setLightModeLogoHeight(Number.isFinite(themeSettings.light_mode_logo_height) ? Number(themeSettings.light_mode_logo_height) : 0)
      setDarkModeLogoWidth(Number.isFinite(themeSettings.dark_mode_logo_width) ? Number(themeSettings.dark_mode_logo_width) : 0)
      setDarkModeLogoHeight(Number.isFinite(themeSettings.dark_mode_logo_height) ? Number(themeSettings.dark_mode_logo_height) : 0)
    }
  }, [useLandingLogo])

  React.useEffect(() => {
    let isMounted = true
    const hydrateLogos = async () => {
      try {
        const session = getStoredAuthSession()
        const pathname = typeof window !== "undefined" ? window.location.pathname : ""
        const isDashboardRoute = pathname.startsWith("/dashboard")
        if (isDashboardRoute && !session?.accessToken) {
          // Avoid transient public fallback while auth session is still being restored.
          return
        }
        const settings = session?.accessToken
          ? await customizerApi.getSettings()
          : await customizerApi.getSettingsPublic()
        if (!isMounted) return
        if (!settings || typeof settings !== "object") return

        if (useLandingLogo) {
          const header = settings?.landing_content?.header || {}
          applyThemeLogos(header)
        } else {
          const theme = settings?.theme ?? {}
          const themeSettings = {
            ...theme,
            light_mode_logo: theme?.light_mode_logo ?? settings?.light_mode_logo ?? "",
            dark_mode_logo: theme?.dark_mode_logo ?? settings?.dark_mode_logo ?? "",
            light_mode_logo_width: Number.isFinite(theme?.light_mode_logo_width)
              ? Number(theme.light_mode_logo_width)
              : Number.isFinite(settings?.light_mode_logo_width)
                ? Number(settings.light_mode_logo_width)
                : 0,
            light_mode_logo_height: Number.isFinite(theme?.light_mode_logo_height)
              ? Number(theme.light_mode_logo_height)
              : Number.isFinite(settings?.light_mode_logo_height)
                ? Number(settings.light_mode_logo_height)
                : 0,
            dark_mode_logo_width: Number.isFinite(theme?.dark_mode_logo_width)
              ? Number(theme.dark_mode_logo_width)
              : Number.isFinite(settings?.dark_mode_logo_width)
                ? Number(settings.dark_mode_logo_width)
                : 0,
            dark_mode_logo_height: Number.isFinite(theme?.dark_mode_logo_height)
              ? Number(theme.dark_mode_logo_height)
              : Number.isFinite(settings?.dark_mode_logo_height)
                ? Number(settings.dark_mode_logo_height)
                : 0,
          }
          applyThemeLogos(themeSettings)
        }
      } catch {
        // Keep previous in-memory logo when API is unavailable.
      }
    }

    const handleCustomizerThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme?: Record<string, unknown>; landing_content?: any }>
      if (useLandingLogo) {
        const header = customEvent.detail?.landing_content?.header
        if (header) applyThemeLogos(header)
      } else {
        const theme = customEvent.detail?.theme
        if (theme) applyThemeLogos(theme)
      }
    }

    const handleAuthSessionChange = () => {
      void hydrateLogos()
    }

    void hydrateLogos()
    window.addEventListener("kivicare-customizer-theme-updated", handleCustomizerThemeUpdate as EventListener)
    window.addEventListener("kivicare-auth-session-changed", handleAuthSessionChange)
    return () => {
      isMounted = false
      window.removeEventListener("kivicare-customizer-theme-updated", handleCustomizerThemeUpdate as EventListener)
      window.removeEventListener("kivicare-auth-session-changed", handleAuthSessionChange)
    }
  }, [applyThemeLogos])

  const lightLogoSrc = (srcOverride !== undefined)
    ? (srcOverride.trim() || "/logo.png")
    : (lightModeLogo || "/logo.png")
  const darkLogoSrc = darkModeLogo || "/logo.png"
  const baseLightWidth = lightModeLogoWidth > 0 ? lightModeLogoWidth : 320
  const baseLightHeight = lightModeLogoHeight > 0 ? lightModeLogoHeight : 80
  const baseDarkWidth = darkModeLogoWidth > 0 ? darkModeLogoWidth : baseLightWidth
  const baseDarkHeight = darkModeLogoHeight > 0 ? darkModeLogoHeight : baseLightHeight

  const shouldUseConfiguredLightSize = useConfiguredSize && (lightModeLogoWidth > 0 || lightModeLogoHeight > 0)
  const shouldUseConfiguredDarkSize = useConfiguredSize && (darkModeLogoWidth > 0 || darkModeLogoHeight > 0)

  const lightStyle = shouldUseConfiguredLightSize
    ? { width: lightModeLogoWidth > 0 ? lightModeLogoWidth : "auto", height: lightModeLogoHeight > 0 ? lightModeLogoHeight : size }
    : { height: size, width: "auto" }

  const darkStyle = shouldUseConfiguredDarkSize
    ? { width: darkModeLogoWidth > 0 ? darkModeLogoWidth : "auto", height: darkModeLogoHeight > 0 ? darkModeLogoHeight : size }
    : { height: size, width: "auto" }

  const isInlineImageSource = (src: string) =>
    typeof src === "string" && (src.startsWith("data:") || src.startsWith("blob:"))

  const { isDarkMode } = useThemeManager()
  
  // Decide which logo to show based on mode and availability
  const activeLogoSrc = isDarkMode ? (darkLogoSrc || lightLogoSrc) : lightLogoSrc
  const activeStyle = isDarkMode && darkModeLogo ? darkStyle : lightStyle
  const activeWidth = isDarkMode && darkModeLogo ? baseDarkWidth : baseLightWidth
  const activeHeight = isDarkMode && darkModeLogo ? baseDarkHeight : baseLightHeight

  const useInline = isInlineImageSource(activeLogoSrc)

  if (useInline) {
    return (
      <img
        key={`${isDarkMode ? 'dark' : 'light'}-inline-${activeLogoSrc}`}
        src={activeLogoSrc}
        alt={alt}
        className={cn("w-auto object-contain object-left", className)}
        style={activeStyle}
      />
    )
  }

  return (
    <Image
      key={`${isDarkMode ? 'dark' : 'light'}-${activeLogoSrc}`}
      src={activeLogoSrc}
      alt={alt}
      width={activeWidth}
      height={activeHeight}
      className={cn("w-auto object-contain object-left", className)}
      style={activeStyle}
      {...props}
    />
  )
}
