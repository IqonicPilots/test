"use client"

import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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
import { PhoneInputField } from "@/components/common/PhoneInputField"
import { Checkbox } from "@/components/ui/checkbox"
import { loginUser, registerUser } from "@/services/auth.service"
import { buildStoredAuthSession, saveAuthSession } from "@/lib/auth-session"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().min(1, "Required"),
  mobile: z.string().min(6, "Invalid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm password"),
  terms: z.boolean().refine(v => v, "You must accept the terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface BookingAuthContentProps {
  onSuccess: () => void
}

export function BookingAuthContent({ onSuccess }: BookingAuthContentProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: loginUser,
    onSuccess: (data, variables) => {
      saveAuthSession(buildStoredAuthSession(data, variables.email))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      onSuccess()
    },
    onError: (error) => {
      toast.error(`Login failed: ${getApiErrorMessage(error)}`)
    }
  })

  const register = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success("Account created successfully. Please login to continue.")
      setActiveTab('login')
    },
    onError: (error) => {
      toast.error(`Registration failed: ${getApiErrorMessage(error)}`)
    }
  })

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "",
      countryCode: "", mobile: "", password: "",
      confirmPassword: "", terms: false
    }
  })

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    login.mutate(values)
  }

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    register.mutate({
      ...values,
      role: 'patient',
    })
  }

  return (
    <div className="flex-1 px-0 sm:px-2 md:px-6 py-1 sm:py-2">
      <div className="max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-xl border border-border/60 bg-muted/40 p-1 sm:mb-8 sm:h-14 sm:rounded-2xl sm:p-1.5">
            <TabsTrigger
              value="login"
              className="rounded-lg py-2 text-sm font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:rounded-xl sm:py-2.5"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-lg py-2 text-sm font-bold text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:rounded-xl sm:py-2.5"
            >
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-5">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-1.5 text-xl font-bold sm:mb-2 sm:text-2xl">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">Please log in to continue your appointment booking.</p>
            </div>

            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          className="h-11 rounded-xl border-none bg-muted/30 bg-white sm:h-12"
                          {...field}
                          disabled={login.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter your password"
                          className="h-11 rounded-xl border-none bg-muted/30 bg-white sm:h-12"
                          {...field}
                          disabled={login.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="mt-3 h-11 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:mt-4 sm:h-12 sm:text-sm"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> LOGGING IN...
                    </div>
                  ) : "CONTINUE TO BOOKING"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-5">
            <div className="mb-6 sm:mb-8">
              <h2 className="mb-1.5 text-xl font-bold sm:mb-2 sm:text-2xl">Create Account</h2>
              <p className="text-sm text-muted-foreground">Join us to manage your appointments and health records.</p>
            </div>

            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            className="h-10 rounded-xl border-none bg-muted/30 bg-white sm:h-11"
                            {...field}
                            disabled={register.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            className="h-10 rounded-xl border-none bg-muted/30 bg-white sm:h-11"
                            {...field}
                            disabled={register.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInputField
                          value={{
                            countryCode: registerForm.watch("countryCode"),
                            mobile: field.value,
                          }}
                          onChange={(val) => {
                            registerForm.setValue("countryCode", val.countryCode)
                            field.onChange(val.mobile)
                          }}
                          disabled={register.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john.doe@example.com"
                          className="h-10 rounded-xl border-none bg-muted/30 bg-white sm:h-11"
                          {...field}
                          disabled={register.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            className="h-10 rounded-xl border-none bg-muted/30 bg-white sm:h-11"
                            {...field}
                            disabled={register.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Confirm</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            className="h-10 rounded-xl border-none bg-muted/30 bg-white sm:h-11"
                            {...field}
                            disabled={register.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-2.5 rounded-2xl border bg-white p-3 sm:gap-3 sm:p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={register.isPending}
                          className='mt-0.5 border-black/30'
                        />
                      </FormControl>
                      <div className="min-w-0 flex-1 space-y-1">
                        <FormLabel className="block text-xs leading-5 font-normal text-muted-foreground">
                          I agree to the{" "}
                          <span className="font-bold text-secondary">Terms of Service</span>
                          {" "}and{" "}
                          <span className="font-bold text-secondary">Privacy Policy</span>.
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:h-12 sm:text-sm"
                  disabled={register.isPending}
                >
                  {register.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> CREATING ACCOUNT...
                    </div>
                  ) : "REGISTER & CONTINUE"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
