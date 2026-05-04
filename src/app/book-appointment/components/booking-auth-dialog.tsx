"use client"

import React, { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { PhoneInputField } from "@/components/common/PhoneInputField"
import { Checkbox } from "@/components/ui/checkbox"
import { loginUser, registerUser } from "@/services/auth.service"
import { buildStoredAuthSession, saveAuthSession } from "@/lib/auth-session"
import { useMutation } from "@tanstack/react-query"
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

interface BookingAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BookingAuthDialog({ open, onOpenChange, onSuccess }: BookingAuthDialogProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  
  const login = useMutation({
    mutationFn: loginUser,
    onSuccess: (data, variables) => {
      saveAuthSession(buildStoredAuthSession(data, variables.email))
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <div className="bg-primary p-8 text-primary-foreground">
             <DialogHeader className="mb-6">
                <DialogTitle className="text-3xl font-bold text-white">Welcome</DialogTitle>
                <p className="text-primary-foreground/80">Please login or create an account to continue your booking.</p>
             </DialogHeader>
             <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 border border-white/20">
                <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white">Register</TabsTrigger>
             </TabsList>
          </div>

          <div className="p-8 bg-background">
            <TabsContent value="login" className="mt-0 outline-none">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} disabled={login.isPending} />
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="Enter your password" {...field} disabled={login.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={login.isPending}>
                    {login.isPending ? "Logging in..." : "Continue to Booking"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="mt-0 outline-none">
               <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} disabled={register.isPending} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} disabled={register.isPending} />
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
                        <FormLabel>Phone Number</FormLabel>
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} disabled={register.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} disabled={register.isPending} />
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
                          <FormLabel>Confirm</FormLabel>
                          <FormControl>
                            <PasswordInput placeholder="••••••••" {...field} disabled={register.isPending} />
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={register.isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                             I agree to the Terms of Service and Privacy Policy.
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={register.isPending}>
                    {register.isPending ? "Creating Account..." : "Register & Continue"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
