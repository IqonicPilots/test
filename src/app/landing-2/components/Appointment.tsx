"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import { Phone, Mail, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomArrowIcon } from "./CustomIcons"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  treatment: z.string().min(1, "Treatment is required"),
  message: z.string().optional(),
})

export function Appointment() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      treatment: "",
      message: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast.success("Appointment request sent successfully!")
    form.reset()
  }

  return (
    <section id="book-appoinment" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#F2F7FF] rounded-[60px] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
            {/* Left Side: Info */}
            <div className="lg:w-[40%] bg-[#161A2D] p-12 md:p-16 text-white flex flex-col justify-center space-y-10 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <span className="text-[#316DFF] font-black tracking-widest uppercase text-sm">
                  Book An Appointment
                </span>
                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  Take the first step to a perfect smile
                </h2>
                <p className="text-white/40 text-lg">
                  Fill out the form and our team will get back to you within 24 hours to confirm your slot.
                </p>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="w-14 h-14 bg-[#316DFF]/10 rounded-2xl flex items-center justify-center text-[#316DFF] group-hover:bg-[#316DFF] group-hover:text-white transition-all">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Call Us Anytime</p>
                    <p className="text-xl font-black">+91 81414 75777</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="w-14 h-14 bg-[#316DFF]/10 rounded-2xl flex items-center justify-center text-[#316DFF] group-hover:bg-[#316DFF] group-hover:text-white transition-all">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Email Support</p>
                    <p className="text-xl font-black">hello@kivicare.com</p>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-white/5 relative z-10">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold text-white/60">Professional Care & Modern Equipment</span>
                </div>
              </div>

              {/* Decorative background shape */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#316DFF] rounded-full blur-[120px] opacity-20" />
            </div>

            {/* Right Side: Form */}
            <div className="lg:w-[60%] p-12 md:p-20 bg-white">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Full Name" {...field} className="h-16 rounded-[24px] border-gray-100 bg-gray-50/50 px-8 font-bold focus:ring-[#316DFF] transition-all" />
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
                          <FormControl>
                            <Input placeholder="Email Address" {...field} className="h-16 rounded-[24px] border-gray-100 bg-gray-50/50 px-8 font-bold focus:ring-[#316DFF] transition-all" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Phone Number" {...field} className="h-16 rounded-[24px] border-gray-100 bg-gray-50/50 px-8 font-bold focus:ring-[#316DFF] transition-all" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="treatment"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Select Treatment" {...field} className="h-16 rounded-[24px] border-gray-100 bg-gray-50/50 px-8 font-bold focus:ring-[#316DFF] transition-all" />
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
                        <FormControl>
                          <Textarea placeholder="Tell us about your dental concerns..." {...field} className="min-h-[160px] rounded-[32px] border-gray-100 bg-gray-50/50 px-8 py-6 font-bold focus:ring-[#316DFF] transition-all resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full h-16 bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-[24px] text-lg font-black shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 group">
                    Send Appointment Request <CustomArrowIcon className="ml-2 h-5 w-5 group-hover:translate-x-1" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
