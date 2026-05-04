"use client"

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useLandingContent } from '../../../contexts/landing-content-context'

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    question: 'What is KiviCare?',
    answer:
      'KiviCare is an all-in-one clinic management system that helps healthcare providers manage patients, appointments, billing, and electronic health records (EHR) from a single platform.',
  },
  {
    value: 'item-2',
    question: 'Does KiviCare support online appointment booking?',
    answer:
      'Yes, KiviCare includes an online appointment scheduling system that allows patients to book appointments and clinics to manage schedules with automated reminders.',
  },
  {
    value: 'item-3',
    question: 'Can I manage multiple clinics with KiviCare?',
    answer:
      'Yes, KiviCare supports multi-clinic management, allowing you to manage multiple locations, doctors, and operations from one centralized system.',
  },
  {
    value: 'item-4',
    question: 'Does KiviCare support telemedicine?',
    answer:
      'Yes, KiviCare supports telemedicine features including video consultations and remote patient care.',
  },
  {
    value: 'item-5',
    question: 'Can I accept online payments?',
    answer:
      'Yes, KiviCare supports secure online payments with integrations like Stripe, Razorpay, and PayPal.',
  },
  {
    value: 'item-6',
    question: 'Is KiviCare customizable?',
    answer:
      'Yes, KiviCare is highly customizable and can be tailored to match your clinic’s workflow and operational needs.',
  },
  {
    value: 'item-7',
    question: 'Does KiviCare support SMS and WhatsApp notifications?',
    answer:
      'Yes, KiviCare integrates with services like Twilio to send automated SMS and WhatsApp notifications for appointments and updates.',
  },
  {
    value: 'item-8',
    question: 'Is patient data secure?',
    answer:
      'Yes, KiviCare is built with modern security practices including role-based access control and secure data handling to protect patient information.',
  },
  {
    value: 'item-9',
    question: 'Does KiviCare support multiple languages?',
    answer:
      'Yes, KiviCare supports multiple languages, making it suitable for clinics serving patients across different regions.',
  },
  {
    value: 'item-10',
    question: 'Is KiviCare suitable for small and large clinics?',
    answer:
      'Yes, KiviCare is scalable and works for individual doctors, small clinics, and large healthcare organizations.',
  },
  {
    value: 'item-11',
    question: 'Do you provide support and setup assistance?',
    answer:
      'Yes, our team provides full support including setup, customization, and ongoing assistance to ensure smooth implementation.',
  },
  {
    value: 'item-12',
    question: 'How can I get started?',
    answer:
      'You can get started by booking a demo or contacting us on LinkedIn to discuss your requirements.',
  },
]

const FaqSection = () => {
  const { settings, hydrated } = useLandingContent()
  const { faq } = settings

  if (!faq.show) return null

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Skeleton className="h-6 w-16 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="max-w-4xl mx-auto space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-md border p-4 flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayFaqItems = faq.faqItems && faq.faqItems.length > 0 ? faq.faqItems : []

  return (
    <section id="faq" className="py-24 sm:py-32 relative z-0">
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: faq.sectionBgColor || undefined }}
      />
      {!faq.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-background" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4"
            style={{
              backgroundColor: faq.sectionHighlightColor ? `${faq.sectionHighlightColor}15` : undefined,
              color: faq.sectionHighlightColor || undefined,
              borderColor: faq.sectionHighlightColor ? `${faq.sectionHighlightColor}40` : undefined
            }}
          >
            {faq.badge || "FAQ"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {faq.title || "Frequently Asked Questions"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {faq.description || "Find answers to help you get started with KiviCare."}
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <div className='bg-transparent'>
            <div className='p-0'>
              <Accordion type='single' collapsible className='space-y-5'>
                {displayFaqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className='rounded-md !border bg-transparent'>
                    <AccordionTrigger className='cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full'>
                          <CircleHelp className='size-5' />
                        </div>
                        <span className='text-start font-semibold'>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-4 bg-transparent whitespace-pre-wrap'>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              {faq.subDescription || "Still have questions? We're here to help."}
            </p>
            {faq.showButton && (
              <Button className='cursor-pointer' asChild>
                <a href={faq.buttonLink || "#contact"}>
                  {faq.buttonText || "Contact Support"}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
