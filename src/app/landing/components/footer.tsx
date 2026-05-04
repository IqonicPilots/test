"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Logo } from '@/components/logo'
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Heart, MapPin, Mail, Phone, Loader2 } from 'lucide-react'
import { useLandingContent } from '@/contexts/landing-content-context'
import { useClinic } from '@/hooks/api/use-clinics'
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { toast } from "sonner"
import { inquiryApi } from "@/services/inquiry.service"
import { getApiErrorMessage } from "@/lib/api/axios"

const newsletterSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const socialLinksMap = {
  Twitter: Twitter,
  Linkedin: Linkedin,
  Youtube: Youtube,
  Facebook: Facebook,
  Instagram: Instagram,
  Whatsapp: WhatsAppIcon
}

export function LandingFooter() {
  const { settings, hydrated } = useLandingContent()
  const { footer } = settings
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof newsletterSchema>) {
    setIsSubmitting(true)
    try {
      await inquiryApi.createNewsletter(values)
      toast.success("Subscribed successfully.")
      form.reset()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinksConfig = (footer.socialLinks || []).filter((social: any) => {
    if (!social || !social.link) return false
    const link = social.link.toString().trim()
    return link && link !== ""
  })

  return (
    <footer className="relative overflow-hidden border-t bg-background">
      {/* Top and bottom gradient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-40 bg-gradient-to-b from-primary/25 via-accent/15 to-transparent blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-primary/20 via-accent/10 to-transparent blur-2xl"
        aria-hidden
      />

      {/* Large logo watermark */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] flex select-none items-end justify-center"
        aria-hidden
      >
        <div className="opacity-[0.09] dark:opacity-[0.07]">
          <Logo
            size={450}
            className="max-h-[min(55vw,420px)] w-auto max-w-[min(92vw,720px)] object-contain"
            srcOverride={settings.header.siteLogo}
            useConfiguredSize
          />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        {footer.showNewsletter !== false && (
          <div className="mb-16">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-2xl font-bold mb-4">{footer.newsletterTitle || "Stay updated"}</h3>
              <p className="text-muted-foreground mb-6">
                {footer.newsletterDescription || "Get the latest updates, articles, and resources sent to your inbox weekly."}
              </p>
              {hydrated && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
              {!hydrated && (
                <div className="flex flex-col gap-2 max-w-md mx-auto sm:flex-row">
                  <Skeleton className="h-10 flex-1 rounded-md" />
                  <Skeleton className="h-10 w-28 rounded-md" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Footer Content */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="text-muted-foreground mb-6 max-lg:text-center">
              {!hydrated ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                typeof footer.description === 'string' ? footer.description : "Modern healthcare management platform for clinics and hospitals. Simplify your operations with KiviCare."
              )}
            </div>
            <div className="flex space-x-4 max-lg:justify-center">
              {!hydrated ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded-full" />
                ))
              ) : (
                socialLinksConfig.map((social: any, idx: number) => {
                  const Icon = (socialLinksMap as any)[social.icon] || Twitter
                  return (
                    <Button key={idx} variant="ghost" size="icon" asChild>
                      <a href={social.link} target="_blank" rel="noopener noreferrer">
                        <Icon className="h-4 w-4" />
                      </a>
                    </Button>
                  )
                })
              )}
            </div>
          </div>

          {/* Product Links Column */}
          <div className='col-span-1 lg:col-span-1 max-md:text-center'>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 max-md:flex max-md:flex-col max-md:items-center">
              {[
                { name: 'About', href: '#features' },
                { name: 'Contact', href: '#contact' },
                { name: 'Clinics', href: '#about' },
                { name: 'Doctors', href: '#team' },
              ].map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info Column */}
          <div className='col-span-2 md:col-span-4 lg:col-span-2 max-md:text-center'>
            <h4 className="font-semibold mb-6">Contact Us</h4>
            {!hydrated ? (
              <ul className="space-y-4 max-md:flex max-md:flex-col max-md:items-center">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </li>
                ))}
              </ul>
            ) : (
              <ContactInfo footer={footer} />
            )}
          </div>
        </div>

        <Separator className="mt-8 mb-4" />

        {/* Bottom Footer */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <span>{footer.footerMadeByText || "Made with"}</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>by</span>
              <a href={footer.footerMadeByLink || "https://kivicare.com"} target='_blank' className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                {footer.footerMadeByAuthor || "Kivicare"}
              </a>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground md:justify-start">
              <span className="hidden sm:inline">•</span>
              <div>{!hydrated ? <Skeleton className="h-4 w-40" /> : (typeof footer.copyright === 'string' ? footer.copyright : `© ${new Date().getFullYear()} KiviCare. All rights reserved.`)}</div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:mt-0">
              {!hydrated ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-16" />
                ))
              ) : (
                (footer.bottomMenuLinks || []).map((link: any, idx: number) => (
                  <a key={idx} href={link.link} className="hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

function ContactInfo({ footer }: { footer: any }) {
  const isClinicMode = footer.footerContactMode === 'clinic'
  const { data: clinic, isLoading } = useClinic(footer.footerClinicId || "")

  if (isClinicMode) {
    if (isLoading) return (
      <ul className="space-y-4 max-md:flex max-md:flex-col max-md:items-center">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-4 w-40" />
          </li>
        ))}
      </ul>
    )
    if (!clinic) return <div className="text-muted-foreground text-sm italic">No clinic selected or found.</div>

    const addressParts = [
      clinic.address?.street,
      clinic.address?.city,
      clinic.address?.state,
      clinic.address?.country
    ].filter(Boolean)

    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null
    const displayPhone = clinic.countryCode ? `${clinic.countryCode} ${clinic.mobile}` : clinic.mobile

    return (
      <ul className="space-y-4 max-md:flex max-md:flex-col max-md:items-center">
        {fullAddress && (
          <li className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
            <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-primary/70" />
            <span className="text-sm leading-relaxed text-left">{fullAddress}</span>
          </li>
        )}
        {clinic.email && (
          <li className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
            <Mail className="h-5 w-5 shrink-0 text-primary/70" />
            <a href={`mailto:${clinic.email}`} className="text-sm">{clinic.email}</a>
          </li>
        )}
        {clinic.mobile && (
          <li className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
            <Phone className="h-5 w-5 shrink-0 text-primary/70" />
            <a href={`tel:${clinic.mobile}`} className="text-sm">{displayPhone}</a>
          </li>
        )}
      </ul>
    )
  }

  return (
    <ul className="space-y-4 max-md:flex max-md:flex-col max-md:items-center">
      {footer?.footerManualAddress && typeof footer.footerManualAddress === 'string' && (
        <li className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
          <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-primary/70" />
          <span className="text-sm leading-relaxed text-left">{footer.footerManualAddress}</span>
        </li>
      )}
      {footer?.footerManualEmail && typeof footer.footerManualEmail === 'string' && (
        <li className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
          <Mail className="h-5 w-5 shrink-0 text-primary/70" />
          <a href={`mailto:${footer.footerManualEmail}`} className="text-sm">{footer.footerManualEmail}</a>
        </li>
      )}
      {footer?.footerManualPhone && typeof footer.footerManualPhone === 'string' && (
        <li className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300">
          <Phone className="h-5 w-5 shrink-0 text-primary/70" />
          <a href={`tel:${footer.footerManualPhone}`} className="text-sm">{footer.footerManualPhone}</a>
        </li>
      )}
    </ul>
  )
}
