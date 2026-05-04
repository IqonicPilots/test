"use client"

import { useEffect, useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Mail, MessageCircle, Headphones, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useLandingContent } from '../../../contexts/landing-content-context'
import { inquiryApi } from "@/services/inquiry.service"
import { getApiErrorMessage } from "@/lib/api/axios"

const contactFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(7, {
    message: "Phone number must be at least 7 characters.",
  }),
  clinicName: z.string().min(2, {
    message: "Clinic name must be at least 2 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
})

const WHATSAPP_LINK = "https://wa.me/919876543210?text=Hi%20KiviCare%20team%2C%20I%20need%20help%20with%20clinic%20setup."

const WhatsAppIcon = ({ className }: { className?: string }) => {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.55 0 .27 5.28.27 11.79c0 2.08.54 4.11 1.57 5.91L0 24l6.48-1.7a11.72 11.72 0 0 0 5.56 1.42h.01c6.5 0 11.78-5.28 11.78-11.79 0-3.15-1.23-6.1-3.31-8.45Zm-8.47 18.21h-.01a9.77 9.77 0 0 1-4.98-1.36l-.36-.21-3.85 1 1.03-3.74-.24-.38a9.77 9.77 0 0 1-1.5-5.21c0-5.39 4.39-9.78 9.79-9.78 2.61 0 5.07 1.02 6.92 2.87a9.7 9.7 0 0 1 2.86 6.91c0 5.4-4.39 9.79-9.78 9.79Zm5.36-7.34c-.29-.14-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.91 1.12-.17.19-.33.22-.62.07-.29-.14-1.2-.44-2.29-1.4-.85-.76-1.43-1.7-1.6-1.99-.17-.29-.02-.45.13-.59.14-.14.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.47-.64-.48l-.55-.01c-.19 0-.5.07-.76.36-.26.29-.99.97-.99 2.37s1.01 2.76 1.15 2.95c.14.19 1.97 3.01 4.77 4.22.66.29 1.18.46 1.58.59.66.21 1.26.18 1.74.11.53-.08 1.7-.69 1.94-1.36.24-.67.24-1.25.17-1.36-.07-.11-.26-.17-.55-.31Z" />
    </svg>
  )
}

export function ContactSection() {
  const { settings, hydrated } = useLandingContent()
  const { contact } = settings
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      clinicName: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof contactFormSchema>) {
    setIsSubmitting(true)
    try {
      await inquiryApi.createInquiry(values)
      toast.success("Inquiry sent successfully.")
      form.reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!contact.show) return null

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Skeleton className="h-6 w-32 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-full max-w-md mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-sm mx-auto" />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!contact.show) return null

  return (
    <section id="contact" className="relative z-0 py-24 sm:py-28">
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: contact.sectionBgColor || undefined }}
      />
      {!contact.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-background" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Get In Touch
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {contact.title || "Need help or have questions?"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {contact.description || "Our team is here to help you get started with KiviCare. Choose the best way to connect with us."}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 max-w-6xl mx-auto items-start">
          <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <Card className="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-background to-muted/30 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
              <CardHeader className="pb-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Talk to Our Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Connect with our team to discuss your clinic requirements and get the best solution. We&apos;re here to help you automate your practice.
                </p>
                <div className="space-y-4 pt-2">
                  <Badge className="px-3 py-1 font-medium bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                    Trusted by 5000+ clinics
                  </Badge>
                  <Button
                    asChild
                    className="h-10 rounded-md px-6 has-[>svg]:px-4 cursor-pointer bg-[#25d366] hover:bg-[#128c7e] text-white transition-all font-semibold shadow-md active:scale-95"
                  >
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="mr-2 h-4 w-4 fill-white" />
                      Contact Us on WhatsApp
                    </a>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Or use the form to send a direct inquiry.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5 rounded-3xl bg-accent/10 border border-primary/10 shadow-sm">
                <CardContent className="p-0 flex flex-col items-center text-center">
                  <div className="size-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary tracking-tight">24/7</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Global Support</p>
                </CardContent>
              </Card>
              <Card className="p-5 rounded-3xl bg-accent/10 border border-primary/10 shadow-sm">
                <CardContent className="p-0 flex flex-col items-center text-center">
                  <div className="size-10 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary tracking-tight">100%</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Data Ownership</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            <Card className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 border-border shadow-2xl shadow-primary/5">
              <CardHeader>
                <CardTitle className="leading-none font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {contact.formTitle || "Send us a message"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="clinic@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 98765 43210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clinicName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinic Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smile Dental Clinic" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us how we can help you with KiviCare solutions..."
                              rows={10}
                              className="min-h-50 bg-muted/20 border-border focus:bg-background transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : (contact.submitButtonText || "Send Message")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
