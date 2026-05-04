import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { Logo } from "@/components/logo"

import { ResetPasswordForm } from "./components/reset-password-form"

function ResetPasswordFormFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">Loading reset form...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/resetPassword.png"
          alt="Image"
          fill
          sizes="(min-width: 1024px) 50vw, 0vw"
          className="object-cover dark:brightness-[0.95] dark:invert"
        />
      </div>
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Link href="/" className="inline-flex items-center font-medium">
                <Logo size={40} useConfiguredSize useLandingLogo />
              </Link>
            </div>
            <Suspense fallback={<ResetPasswordFormFallback />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
