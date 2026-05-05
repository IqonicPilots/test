"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Clock } from "lucide-react"
import { CustomArrowIcon } from "./CustomIcons"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-4 pb-6 pt-24 sm:pt-28 md:px-6 md:pt-32">
      <div className="relative rounded-[40px] pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden text-white">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/dark-section-bg-image.png"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-100"
          />
        </div>

        {/* Animated Side Characters */}
        <motion.img
          src="/landing-2/wp-content/uploads/2025/09/hero-character-img-1.png"
          alt="Doctor Character Left"
          className="absolute left-50 top-[40%] -translate-y-1/2 w-48 h-auto z-20 hidden lg:block lg:block -rotate-6"
          animate={{ rotate: [-10, -5, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src="/landing-2/wp-content/uploads/2025/09/hero-character-img-2.png"
          alt="Doctor Character Right"
          className="absolute right-40 top-32 w-48 h-auto z-20 hidden lg:block rotate-6"
          animate={{ rotate: [5, 10, 5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-4 md:px-12 relative z-10">
          {/* Top Content */}
          <div className="max-w-6xl mx-auto text-center space-y-8 mb-24">
            {/* Satisfied Clients Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                    alt={`Patient ${i}`}
                    className="w-6 h-6 rounded-full border border-white/20 object-cover"
                  />
                ))}
              </div>
              <span className="text-white/80 text-xs font-black">
                15k+ Satisfied Patients
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-[65px] font-black leading-[1.2] tracking-wide"
            >
              Transforming{" "}
              <span className="relative inline-flex items-center bg-white/10 rounded-full border border-white/20 mx-2 overflow-hidden align-middle">
                <img
                  src="/landing-2/wp-content/uploads/2025/09/hero-title-image.jpg"
                  alt="Smile accent"
                  className="h-10 md:h-14 w-auto object-cover rounded-full"
                />
              </span>{" "}
              smiles <br />
              with expert care
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="max-w-xl mx-auto leading-relaxed"
            >
              Experience personalized dental treatment designed to restore, protect, and enhance your smile with comfort and confidence.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button variant={"default"} size={"lg"} className="bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-full px-8 py-6 text-base font-bold transition-all group">
                Start Your Smile Journey <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>

          {/* Bottom Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Comprehensive Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#FFFFFF1A] p-10 rounded-[40px] relative overflow-hidden group h-full flex flex-col justify-between min-h-[340px]"
            >
              <div className="absolute top-8 right-8 w-12 h-12 bg-[#316DFF] rounded-full flex items-center justify-center border border-white/20 z-20 shadow-lg transition-all duration-500 group-hover:scale-110">
                <CustomArrowIcon className="h-6 w-6 text-white transition-transform duration-500 group-hover:rotate-[-45deg]" />
              </div>
              <h3 className="text-[18px] font-black mb-12 leading-tight w-[50%]">Comprehensive Dental Care</h3>
              <div className="space-y-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                      alt="User"
                      className="w-10 h-10 rounded-full border-4 border-[#316DFF] object-cover"
                    />
                  ))}
                </div>
                <p className="text-[16px] leading-relaxed">More than 4,000 satisfied customers trust our services.</p>
              </div>
            </motion.div>

            {/* Card 2: Image Card with Tags */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-[40px] overflow-hidden min-h-[340px] group h-full"
            >
              <img
                src="/landing-2/wp-content/uploads/2025/09/hero-info-item-image-1.jpg"
                alt="Treatment"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161A2D] via-[#161A2D]/40 to-transparent z-0" />
              <div className="absolute bottom-6 left-5 right-5 space-y-4">
                <h3 className="text-xl font-black leading-tight">Comprehensive Dental Care</h3>
                <div className="flex flex-wrap gap-2">
                  {["Smiles", "Dentistry", "Cavity"].map((tag) => (
                    <span
                      key={tag}
                      className="px-5 py-2 rounded-full border border-white/40 bg-transparent text-sm font-bold text-white transition-colors hover:bg-[#316DFF] hover:border-[#316DFF]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 3: Opening Hours */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#3D548C]/90 p-10 rounded-[40px] flex flex-col justify-between h-full min-h-[340px] backdrop-blur-sm shadow-xl"
            >
              <div className="space-y-8">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-[18px]">Opening Hours</span>
                </div>

                <div className="space-y-6">
                  <div className="border-t border-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white text-[16px]">Morning</span>
                    <span className="font-bold text-white text-[16px]">9AM - 1PM</span>
                  </div>
                  <div className="border-t border-white/10" />
                  <div className="flex justify-between items-center">
                    <span className="text-white text-[16px]">Evening</span>
                    <span className="font-bold text-white text-[16px]">4PM - 8:30PM</span>
                  </div>
                </div>
              </div>

              <Button variant={"default"} size={"lg"} className="w-full bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-full px-8 py-6 text-base font-bold transition-all group mt-8">
                Make An Appointment <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Card 4: Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative rounded-[40px] overflow-hidden min-h-[340px] group h-full"
            >
              <img
                src="/landing-2/wp-content/uploads/2025/09/hero-info-item-image-2.jpg"
                alt="Doctor"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />

              {/* Top Right Floating Button */}
              <div className="absolute top-8 right-8 z-10">
                <div className="w-12 h-12 bg-[#316DFF] rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border border-white/20 transition-all duration-500 group-hover:scale-110">
                  <CustomArrowIcon className="h-6 w-6 text-white transition-transform duration-500 group-hover:rotate-[-45deg]" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0" />

              {/* Contact Info Box */}
              <div className="absolute bottom-6 left-5 right-5 z-10">
                <div className="bg-[#161A2D1A]/30 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] space-y-4">
                  <div className="flex items-center space-x-4">
                    <Phone className="h-5 w-5 text-white/70" />
                    <span className="text-white text-[12px]">+91 97732 89990</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-white/70" />
                    <span className="text-white text-[12px] truncate">vaghasiyamayuri262@gmail.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
