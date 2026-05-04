"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

function StripeCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const appointmentId = searchParams.get("appointmentId") || ""
    const clientRef = searchParams.get("clientRef") || ""
    const sessionId = searchParams.get("session_id") || ""
    const status = searchParams.get("status")
    const failed = status === "cancelled" || !sessionId

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "stripe-payment-result",
          appointmentId,
          clientRef,
          sessionId,
          status: failed ? "failed" : "success",
          error: failed
            ? status === "cancelled"
              ? "Payment cancelled"
              : "Payment incomplete"
            : undefined,
        },
        window.location.origin
      )
    }

    window.close()
  }, [searchParams])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Finishing Stripe payment...
    </div>
  )
}

export default function StripeCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Finishing Stripe payment...</div>}>
      <StripeCallbackContent />
    </Suspense>
  )
}
