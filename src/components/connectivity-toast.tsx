"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Wifi, WifiOff } from "lucide-react"

/**
 * ConnectivityToast component monitors the browser's online/offline status
 * and displays premium, actionable toasts to the user.
 */
export function ConnectivityToast() {
  const offlineToastId = useRef<string | number | null>(null)

  useEffect(() => {
    // Handler for when the browser comes back online
    const handleOnline = () => {
      // Dismiss the persistent offline toast if it exists
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current)
        offlineToastId.current = null
      }

      // Show a success toast that automatically dismisses after 4 seconds
      toast.success("Back online", {
        description: "Your internet connection has been successfully restored. You can now continue your work.",
        duration: 4000,
        icon: (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
            <Wifi className="h-4 w-4 text-emerald-500" />
          </div>
        ),
        className: "border-emerald-500/20 bg-emerald-50/50 backdrop-blur-md dark:bg-emerald-950/20",
      })
    }

    // Handler for when the browser goes offline
    const handleOffline = () => {
      // Avoid showing multiple offline toasts
      if (!offlineToastId.current) {
        offlineToastId.current = toast.error("You are offline", {
          description: "We've detected a connection issue. Please check your internet connectivity.",
          duration: Infinity, // Keep the error visible until connection is restored
          icon: (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-4 w-4 text-destructive" />
            </div>
          ),
          className: "border-destructive/20 bg-destructive/50 backdrop-blur-md dark:bg-destructive/950/20",
        })
      }
    }

    // Add event listeners for online/offline events
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial state on mount
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      handleOffline()
    }

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)

      // If we are unmounting while offline, dismiss the toast to be safe
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current)
      }
    }
  }, [])

  // This component doesn't render any visible UI directly, it uses toasts
  return null
}
