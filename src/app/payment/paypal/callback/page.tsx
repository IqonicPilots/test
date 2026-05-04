"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"

function PaypalCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const appointmentId = searchParams.get("appointmentId") || ""
    const clientRef = searchParams.get("clientRef") || ""
    const orderId = searchParams.get("token") || ""
    const payerId = searchParams.get("PayerID") || ""
    const status = searchParams.get("status")
    const failed = status === "cancelled" || !orderId || !payerId

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "paypal-payment-result",
          appointmentId,
          clientRef,
          orderId,
          payerId,
          status: failed ? "failed" : "success",
          error: failed ? "Payment cancelled or incomplete" : undefined,
        },
        window.location.origin
      )
    }

    window.close()
  }, [searchParams])

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      Finishing PayPal payment...
    </div>
  )
}

export default function PaypalCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Finishing PayPal payment...</div>}>
      <PaypalCallbackContent />
    </Suspense>
  )
}
