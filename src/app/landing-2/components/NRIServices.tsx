"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Plane , Star} from "lucide-react"
import { Button } from "@/components/ui/button"
import { CustomArrowIcon } from "./CustomIcons"

export function NRIServices() {
  return (
    <section id="nri-services" className="py-10 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-[#316DFF]">
            <span className="mr-1.5 text-[#316DFF]">•</span>
            NRI DENTAL SERVICES AT KIVICARE
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
                Kivicare Multispeciality Dental Clinic offers exclusive dental treatment packages for NRI patients who visit Surat, India.
              </p>
              <p className="text-[#626467] leading-relaxed">
                We understand that managing dental care abroad can be expensive and time-consuming — that’s why we provide world-class treatment, affordable pricing, and personalized care all in one.
              </p>
              <div className="flex items-center space-x-4 p-4 border-t border-blue-200">
                <img src="/landing-2/wp-content/uploads/2025/11/dr-mayuri-image.jpg" className="w-12 h-12 rounded-[10px] object-cover" />
                <div>
                  <h4 className="font-bold text-[#161A2D]">Dr. Mayuri Ranpariya</h4>
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
                ["Flexible Appointments :", "Planned according to your travel dates"],
                ["Comprehensive Care :", "From root canal to implants — all under one roof."],
                ["Advanced Equipment :", "International-standard sterilization & technology."],
                ["Transparent Pricing :", "Clear treatment plans with no hidden costs."],
                ["Follow-up Support :", "Online consultation even after you return abroad."],
                ["Comfort & Care :", "English-speaking staff and friendly environment."],
              ].map(([title, description], i) => (
                <li key={i} className="flex items-start space-x-3 group">
                  <CheckCircle2 className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0" />
                  <div className="">
                    <span className="text-[#161A2D] font-semibold text-md mr-1">{title}</span>
                    <span className="text-[#626467] font-medium text-sm group-hover:text-[#161A2D] transition-colors">{description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card 3: Treatments & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F2F7FF] p-10 rounded-[20px] shadow-sm flex flex-col justify-start"
          >
            <div className="mb-5 border-b border-blue-200">
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
                    <CheckCircle2 className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0" />
                    <span className="text-[#626467] font-medium text-sm group-hover:text-[#161A2D] transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button className="w-full bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-full py-7 font-black group">
              Make An Appointment <CustomArrowIcon className="h-4 w-4 group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>

        <div className="mt-12 text-center text-[#626467] text-md font-medium">
          Join us and create smiles that truly inspire confidence. <span className="text-[#316DFF] font-bold">Contact Us</span>
        </div>
        <p className="text-xl mt-2 font-semibold text-[#161A2D] sm:text-2xl flex items-center justify-center gap-2">
          4.9/5 <Star className="h-6 w-6 fill-[#316DFF] text-[#316DFF]" /> Our 4k Patient Review
        </p>
      </div>
    </section>
  )
}
