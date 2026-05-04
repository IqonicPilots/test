import { ForgotPasswordForm } from "./components/forgot-password-form"
import { Logo } from "@/components/logo"
import Link from "next/link"
import Image from "next/image"

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/forgotPassword.png"
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
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
