"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSystemConfig } from "@/hooks/api/use-system-config"

const languages = [
  { label: "English (USA)", code: "us", value: "en" },
  { label: "हिन्दी", code: "in", value: "hi" },
  { label: "ગુજરાતી", code: "in", value: "gu" },
  { label: "Français", code: "fr", value: "fr" },
  { label: "Deutsch", code: "de", value: "de" },
]

/**
 * Helper to get flag URL from FlagKit CDN
 */
const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`



declare global {
  interface Window {
    google: any
    googleTranslateInit: () => void
  }
}

// DOM patch to handle cases where Google Translate has moved nodes
// This is necessary because Google Translate sometimes moves nodes around,
// which can cause issues with React's reconciliation process, especially
// when components are unmounted and remounted.
if (typeof Node !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: any, child: T): T {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('Cannot remove a child from a different father.', child, this);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child] as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: any, newNode: T, referenceNode: Node | null): T {
    if (newNode === referenceNode) {
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode] as any) as T;
  };
}

/**
 * A skeleton screen that mimics the dashboard layout
 * to provide a smooth transition during language changes.
 */
const PageSkeleton = () => (
  <div className="fixed inset-0 z-[9999] bg-background animate-in fade-in duration-300 notranslate" translate="no">
    <div className="flex h-screen overflow-hidden">
      {/* Accurate Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-4 hidden md:flex flex-col gap-8 bg-background">
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="size-8 rounded skeleton-shimmer" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 skeleton-shimmer" />
            <Skeleton className="h-3 w-28 skeleton-shimmer opacity-60" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Sidebar Groups */}
          {['Main', 'Users', 'Clinic', 'Financial'].map((group) => (
            <div key={group} className="space-y-3">
              <Skeleton className="h-3 w-12 ml-2 skeleton-shimmer opacity-40" />
              <div className="space-y-1">
                {[...Array(group === 'Main' ? 3 : 2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="size-4 rounded-[2px] skeleton-shimmer" />
                    <Skeleton className="h-4 w-24 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto p-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <Skeleton className="size-8 rounded-full skeleton-shimmer" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 skeleton-shimmer" />
            <Skeleton className="h-2 w-24 skeleton-shimmer opacity-60" />
          </div>
        </div>
      </div>

      {/* Accurate Main Content Skeleton */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Accurate Header Skeleton */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 md:px-6 gap-4 bg-background">
          <Skeleton className="size-8 rounded skeleton-shimmer" />
          <div className="flex-1 max-w-sm">
            <Skeleton className="h-9 w-full rounded-md skeleton-shimmer opacity-80" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 mr-4">
              <Skeleton className="h-4 w-12 skeleton-shimmer opacity-40" />
              <Skeleton className="h-4 w-20 skeleton-shimmer opacity-40" />
              <Skeleton className="h-4 w-14 skeleton-shimmer opacity-40" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md skeleton-shimmer" />
            <Skeleton className="size-8 rounded-full skeleton-shimmer" />
          </div>
        </header>

        {/* Accurate Dashboard Area Skeleton */}
        <main className="p-4 md:p-6 space-y-8 overflow-hidden bg-background">
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 skeleton-shimmer" />
            <Skeleton className="h-4 w-60 skeleton-shimmer opacity-60" />
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl skeleton-shimmer opacity-80" />
            ))}
          </div>

          {/* Large Chart Area */}
          <div className="space-y-4">
            <Skeleton className="h-[450px] w-full rounded-xl skeleton-shimmer opacity-50" />
          </div>

          {/* Bottom Tabs & Table area */}
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-md skeleton-shimmer opacity-60" />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-xl skeleton-shimmer opacity-30" />
          </div>
        </main>
      </div>
    </div>
  </div>
)

export function LanguagePicker() {
  const { data: systemConfig } = useSystemConfig()
  const configDefault = systemConfig?.default_language ?? "en"

  const [currentLang, setCurrentLang] = React.useState("en")
  const [isChanging, setIsChanging] = React.useState(false)
  const applyTimerRef = React.useRef<number | null>(null)
  // Track whether the initial language has been resolved from cookie/config
  const initializedRef = React.useRef(false)

  // Find the current language object for the flag display
  const activeLang = languages.find(lang => lang.value === currentLang) || languages[0]

  const tryApplyLanguage = React.useCallback((langCode: string, attempt = 0) => {
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
    const maxAttempts = 50 // Increased attempts for slower environments
    const retryDelayMs = 200

    if (combo) {
      // Avoid duplicate change events when the requested language is already selected.
      if (combo.value !== langCode) {
        combo.value = langCode
        combo.dispatchEvent(new Event("change"))
      }

      applyTimerRef.current = window.setTimeout(() => {
        setIsChanging(false)
      }, 1200)
      return
    }

    if (attempt >= maxAttempts) {
      // If we failed to find the combo, we stop showing the skeleton and let it be
      setIsChanging(false)
      return
    }

    applyTimerRef.current = window.setTimeout(() => {
      tryApplyLanguage(langCode, attempt + 1)
    }, retryDelayMs)
  }, [])

  React.useEffect(() => {
    // 1. Setup the Google Translate Init Function
    if (!(window as any).googleTranslateInit) {
      ; (window as any).googleTranslateInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,gu,fr,de",
            autoDisplay: false,
          },
          "google_translate_element"
        )
      }
    }

    // 2. Load the Google Translate Script if not present
    if (!document.querySelector("#google-translate-script")) {
      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateInit"
      script.async = true
      document.body.appendChild(script)
    }

    // 3. Initialize active lang from cookie, then fallback to system config default
    if (!initializedRef.current) {
      const match = document.cookie.match(/googtrans=\/en\/([^;]+)/)
      if (match) {
        const lang = match[1]
        setCurrentLang(lang)
        initializedRef.current = true
        // If NOT english, try applying it as soon as the picker script is ready
        if (lang !== "en" && lang !== "us") {
          tryApplyLanguage(lang)
        }
      } else if (configDefault && configDefault !== "en") {
        // No cookie — use the admin-configured default language
        initializedRef.current = true
        setCurrentLang(configDefault)
        tryApplyLanguage(configDefault)
      } else {
        initializedRef.current = true
      }
    }
    
    return () => {
      if (applyTimerRef.current) {
        window.clearTimeout(applyTimerRef.current)
      }
    }
  }, [tryApplyLanguage, configDefault])

  const changeLanguage = (langCode: string) => {
    if (langCode === currentLang) {
      return
    }

    setIsChanging(true)
    setCurrentLang(langCode)

    // Set cookies for persistence (1 year)
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    const expiresStr = expires.toUTCString()
    
    const hostname = window.location.hostname
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
    const canSetDomainCookie = hostname.includes(".") && !isLocalhost && !isIpAddress

    // Add expires and secure/samesite for best compatibility
    const cookieBase = `googtrans=/en/${langCode}; path=/; expires=${expiresStr}; SameSite=Lax`
    
    if (canSetDomainCookie) {
      document.cookie = `${cookieBase}; domain=${hostname}`
    }
    document.cookie = cookieBase

    // Robustly apply language once Google Translate dropdown is ready.
    if (applyTimerRef.current) {
      window.clearTimeout(applyTimerRef.current)
    }
    tryApplyLanguage(langCode)
  }

  return (
    <>
      <div id="google_translate_element" style={{ visibility: "hidden", position: "absolute", height: 0 }}></div>

      {/* Transition Skeleton */}
      {isChanging && <PageSkeleton />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300 rounded-md"
          >
            <div className="h-5 w-7 rounded-[2px] overflow-hidden flex-shrink-0 border border-zinc-100 dark:border-zinc-800">
              <img
                src={getFlagUrl(activeLang.code)}
                alt={activeLang.label}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="notranslate text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline-block">
              {activeLang.label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="p-1 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] rounded-xl shadow-2xl border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 bg-background/95 backdrop-blur-md"
        >
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.value}
              onClick={() => changeLanguage(language.value)}
              className="flex items-center justify-between rounded-lg px-2.5 py-2.5 cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-7 rounded-[2px] overflow-hidden border border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                  <img
                    src={getFlagUrl(language.code)}
                    alt={language.label}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="notranslate text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  {language.label}
                </span>
              </div>
              {currentLang === language.value && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>



      <style dangerouslySetInnerHTML={{
        __html: `
        /* White-label: Hide ALL Google Translate branding, spinners, and tooltips */
        .skiptranslate, 
        iframe.goog-te-banner-frame, 
        .goog-te-banner, 
        #goog-gt-tt, 
        .goog-te-spinner-pos, 
        .goog-te-balloon-frame,
        .goog-logo-link,
        .goog-te-gadget span,
        .goog-te-gadget div,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        [class*="VIpgJd-ZVi9od-aZ2wEe"] { 
          display: none !important; 
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Prevent Google from moving the page content down */
        body { 
          top: 0 !important; 
          position: static !important;
          margin-top: 0 !important;
        }
        
        html {
          margin-top: 0 !important;
        }

        /* Prevent annoying hovering translations */
        #goog-gt-tt {
          display: none !important;
        }

        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        /* Speed up visual transition */
        font {
          background-color: transparent !important;
          box-shadow: none !important;
          color: inherit !important;
          vertical-align: inherit !important;
        }

        /* Force hide the Google logo in the footer/header if it appears */
        .goog-te-gadget {
          color: transparent !important;
          font-size: 0 !important;
        }

        /* Shimmer Animation for Skeletons */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background-color: #f4f4f5 !important; /* zinc-100 for light mode */
        }

        .dark .skeleton-shimmer {
          background-color: #27272a !important; /* zinc-800 for dark mode */
        }

        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0) 0,
            rgba(0, 0, 0, 0.05) 50%,
            rgba(0, 0, 0, 0)
          );
          animation: shimmer 2s infinite;
        }

        /* Shimmer effect for dark mode (white streak) */
        .dark .skeleton-shimmer::after {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0)
          );
        }
      `}} />
    </>
  )
}
