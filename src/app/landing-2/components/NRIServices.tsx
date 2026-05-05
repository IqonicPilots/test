"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomArrowIcon } from "./CustomIcons"

export function NRIServices() {
  return (
    <section id="nri-services" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-[#316DFF]">
            <span className="mr-1.5 text-[#316DFF]">•</span>
            NRI Dental Care
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#161A2D]">
            Your trusted dental care — no matter where you live.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Card 1: Experience & Doctor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-[#F2F7FF] p-10 rounded-[20px] shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-6">
              <p className="text-[#626467] leading-relaxed">
                Toothmate Multispeciality Dental Clinic offers exclusive dental treatment packages for NRI patients who visit Surat, India.
              </p>
              <p className="text-[#626467] leading-relaxed">
                We understand that managing dental care abroad can be expensive and time-consuming — that’s why we provide world-class treatment, affordable pricing, and personalized care all in one.
              </p>
              <div className="flex items-center space-x-4 p-4 bg-blue-50 border-t border-blue-100">
                <img src="/landing-2/wp-content/uploads/2025/11/dr-mayuri-image.jpg" className="w-12 h-12 rounded-[10px] object-cover" />
                <div>
                  <h4 className="font-bold text-[#161A2D]">Dr. Mayuri Variya</h4>
                  <p className="text-xs text-[#626467]">Lead Dental Surgeon</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Benefits List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#F2F7FF] p-10 rounded-[20px] shadow-sm"
          >
            <h3 className="text-xl font-bold text-[#161A2D] mb-8">Why NRIs Choose Toothmate</h3>
            <ul className="space-y-4">
              {[
                "Flexible Appointments based on travel",
                "Advanced Equipment & Standards",
                "Transparent & Affordable Pricing",
                "English Speaking Staff",
                "Online Consultation Support"
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3 group">
                  <div className="w-5 h-5 bg-[#316DFF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#316DFF] transition-colors">
                    <CheckCircle2 className="w-3 h-3 text-[#316DFF] group-hover:text-white" />
                  </div>
                  <span className="text-[#626467] font-medium text-sm group-hover:text-[#161A2D] transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card 3: Treatments & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F2F7FF] p-10 rounded-[20px] shadow-sm flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-[#161A2D] mb-8">Popular Treatments</h3>
              <ul className="space-y-4 mb-8">
                {[
                  "Full Mouth Rehabilitation",
                  "Smile Makeover / Cosmetic Dentistry",
                  "Dental Implants & Crowns",
                  "Root Canal & Restorations",
                  "Teeth Whitening",
                  "Gum Care & Maintenance"
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3 group">
                    <div className="w-5 h-5 bg-[#316DFF]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#316DFF] transition-colors">
                      <CheckCircle2 className="w-3 h-3 text-[#316DFF] group-hover:text-white" />
                    </div>
                    <span className="text-[#626467] font-medium text-sm group-hover:text-[#161A2D] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-full py-7 font-black shadow-lg shadow-blue-500/20 group">
              Make An Appointment <CustomArrowIcon className="ml-2 h-4 w-4 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        <div className="mt-16 text-center text-[#626467] text-sm font-medium">
          Join us and create smiles that truly inspire confidence. <span className="text-[#316DFF] font-bold">Contact Us</span>
        </div>
      </div>
    </section>
  )
}
