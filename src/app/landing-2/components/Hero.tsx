"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Clock } from "lucide-react"
import { CustomArrowIcon } from "./CustomIcons"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white md:px-4 pb-6 pt-20 sm:pt-24 md:px-6 md:pt-32">
      <div className="relative overflow-hidden md:rounded-[28px] pt-20 pb-10 text-white md:rounded-[40px] md:pt-36 md:pb-32">
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
          className="absolute opacity-50 md:opacity-100 left-2 md:left-50 top-[18%] md:top-[40%] -translate-y-1/2 w-24 md:w-48 h-auto md:z-20 lg:block lg:block -rotate-6"
          animate={{ rotate: [-10, -5, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src="/landing-2/wp-content/uploads/2025/09/hero-character-img-2.png"
          alt="Doctor Character Right"
          className="absolute opacity-50 md:opacity-100 right-2 md:right-40 top-16 md:top-32 w-24 md:w-48 h-auto md:z-20 lg:block rotate-6"
          animate={{ rotate: [5, 10, 5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-4 md:px-12 relative z-10">
          {/* Top Content */}
          <div className="mx-auto mb-10 max-w-6xl space-y-5 text-center md:mb-24 md:space-y-8">
            {/* Satisfied Clients Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                    alt={`Patient ${i}`}
                    className="h-6 w-6 rounded-full border border-white/20 object-cover"
                  />
                ))}
              </div>
              <span className="text-xs font-black text-white/80">
                15k+ Satisfied Patients
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[28px] font-black leading-[1.1] tracking-tight md:text-[65px] md:leading-[1.2] md:tracking-wide"
            >
              Transforming{" "}
              <span className="relative inline-flex items-center bg-white/10 rounded-full border border-white/20 mx-2 overflow-hidden align-middle">
                <img
                  src="/landing-2/wp-content/uploads/2025/09/hero-title-image.jpg"
                  alt="Smile accent"
                  className="h-10 md:h-14 w-auto object-cover rounded-full"
                />
              </span>
              <span className="block md:inline">smiles with expert care</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mx-auto max-w-xl text-[16px] leading-relaxed md:text-base"
            >
              Experience personalized dental treatment designed to restore, protect, and enhance your smile with comfort and confidence
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button variant={"default"} size={"lg"} className="group rounded-full bg-[#316DFF] px-8 py-6 text-base font-bold text-white transition-all hover:bg-[#2655cc]">
                Start Your Smile Journey <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>

          {/* Bottom Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Comprehensive Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-[30px] bg-[#FFFFFF1A] p-7 group md:min-h-[340px] md:rounded-[40px] md:p-10"
            >
              <div className="absolute right-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#316DFF] shadow-lg transition-all duration-500 group-hover:scale-110 md:right-8 md:top-8">
                <CustomArrowIcon className="h-6 w-6 text-white transition-transform duration-500 group-hover:rotate-[-45deg]" />
              </div>
              <h3 className="mb-9 w-full pr-14 text-[16px] md:text-[18px] font-black leading-[1.05] md:mb-12 md:w-[50%] md:pr-0 md:leading-tight">Comprehensive Dental Care</h3>
              <div className="space-y-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                      alt="User"
                      className="h-10 w-10 rounded-full border-4 border-[#316DFF] object-cover"
                    />
                  ))}
                </div>
                <p className="text-[16px] md:text-[18px] font-black leading-[1.08] md:font-normal md:leading-relaxed">More than 4,000 satisfied customers trust our services.</p>
              </div>
            </motion.div>

            {/* Card 2: Image Card with Tags */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative h-full min-h-[200px] overflow-hidden rounded-[30px] group md:min-h-[340px] md:rounded-[40px]"
            >
              <img
                src="/landing-2/wp-content/uploads/2025/09/hero-info-item-image-1.jpg"
                alt="Treatment"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161A2D] via-[#161A2D]/40 to-transparent z-0" />
              <div className="absolute bottom-6 left-5 right-5 space-y-4">
                <h3 className="text-[16px] md:text-[18px] font-black leading-[1] md:leading-tight">Comprehensive Dental Care</h3>
                <div className="flex flex-wrap gap-2">
                  {["Smiles", "Dentistry", "Cavity"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/40 bg-transparent px-2 py-1 md:px-3 md:py-2 text-sm font-bold text-white transition-colors hover:border-[#316DFF] hover:bg-[#316DFF]"
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
              className="flex h-full min-h-[200px] flex-col justify-between rounded-[30px] bg-[#3D548C]/90 p-7 shadow-xl backdrop-blur-sm md:min-h-[340px] md:rounded-[40px] md:p-10"
            >
              <div className="space-y-4 md:space-y-8">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-[16px] md:text-[18px]">Opening Hours</span>
                </div>

                <div className="space-y-4 md:space-y-6">
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

              <Button variant={"default"} size={"lg"} className="group mt-4 md:mt-8 w-full rounded-full bg-[#316DFF] px-8 py-6 text-base font-bold text-white transition-all hover:bg-[#2655cc]">
                Make An Appointment <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Card 4: Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative h-full min-h-[200px] overflow-hidden rounded-[30px] group md:min-h-[340px] md:rounded-[40px]"
            >
              <img
                src="/landing-2/wp-content/uploads/2025/09/hero-info-item-image-2.jpg"
                alt="Doctor"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />

              {/* Top Right Floating Button */}
              <div className="absolute right-6 top-6 z-10 md:right-8 md:top-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#316DFF] shadow-lg shadow-blue-500/40 transition-all duration-500 group-hover:scale-110">
                  <CustomArrowIcon className="h-6 w-6 text-white transition-transform duration-500 group-hover:rotate-[-45deg]" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0" />

              {/* Contact Info Box */}
              <div className="absolute bottom-3 md:bottom-6 left-5 right-5 z-10">
                <div className="space-y-4 rounded-[32px] border border-white/10 bg-[#161A2D1A]/30 p-6 backdrop-blur-xl">
                  <div className="flex items-center space-x-4">
                    <Phone className="h-5 w-5 text-white/70" />
                    <span className="text-[12px] text-white md:text-[12px]">+91 97732 89990</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="h-5 w-5 text-white/70" />
                    <span className="truncate text-[12px] text-white md:text-[12px]">vaghasiyamayuri262@gmail.com</span>
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
