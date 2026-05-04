"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useLogin, useRestoreAccount } from "@/hooks/api/use-auth"
import { cn } from "@/lib/utils"
import * as React from "react"

const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const login = useLogin()
  const restore = useRestoreAccount()
  const [showRestore, setShowRestore] = React.useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  })

  const userEmail = form.watch("email")

  function onSubmit(values: LoginFormValues) {
    setShowRestore(false)
    login.mutate({ email: values.email.trim(), password: values.password.trim() }, {
      onError: (error: any) => {
        if (error?.response?.status === 409 || error?.status === 409) {
          setShowRestore(true)
        }
      }
    })
  }

  const handleRestore = (e: React.MouseEvent) => {
    e.preventDefault()
    if (userEmail) {
      restore.mutate({ email: userEmail })
    }
  }

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    disabled={login.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={login.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full cursor-pointer" disabled={login.isPending || restore.isPending}>
            {login.isPending ? "Logging in..." : "Login"}
          </Button>

          {showRestore && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex flex-col gap-3">
              <p className="text-sm text-destructive font-medium">
                Your account is currently deleted. Would you like to restore it?
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestore}
                disabled={restore.isPending}
                className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors"
                type="button"
              >
                {restore.isPending ? "Restoring..." : "Restore Account"}
              </Button>
            </div>
          )}

        </div>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  )
}
