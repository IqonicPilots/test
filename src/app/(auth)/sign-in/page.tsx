"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "./components/login-form"
import { Logo } from "@/components/logo"
import Link from "next/link"
import Image from "next/image"
import { getStoredAuthSession } from "@/lib/auth-session"

export default function LoginPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const session = getStoredAuthSession()
    if (session?.accessToken) {
      router.replace("/dashboard")
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return null

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/signin.png"
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
                <Logo size={50} useConfiguredSize useLandingLogo />
              </Link>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
