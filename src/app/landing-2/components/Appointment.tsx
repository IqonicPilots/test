"use client"

import { useRef } from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion"
import { cn } from "@/lib/utils"

export function Appointment() {
  const bannerRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: bannerRef,
    offset: ["start end", "end start"],
  })
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [-400, 400]
  )

  return (
    <section id="book-appoinment" className="relative md:px-4 md:px-6 pt-10 pb-6 overflow-hidden bg-white">
      <div className="relative md:rounded-[40px] overflow-hidden text-white">
        <div
          ref={bannerRef}
          className={cn(
            "relative overflow-hidden md:rounded-[40px]",
            "flex flex-col lg:flex-row lg:items-stretch lg:min-h-[min(1000px,86vh)]"
          )}
        >
          {/* Left: full-bleed clinic photo — vertical parallax on scroll */}
          <div className="relative h-145 shrink-0 overflow-hidden sm:h-auto lg:h-auto lg:min-h-0 lg:flex-1">
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-[135%] w-full -top-[17%] lg:h-[128%] lg:-top-[14%]"
              style={{ y: parallaxY }}
              aria-hidden
            >
              <img
                src="/landing-2/wp-content/uploads/2025/12/book-appointmnet-section-bg.jpg"
                alt="Dental care professional at Kivicare clinic"
                className="h-full w-full object-cover object-[center_28%] lg:object-[18%_center]"
              />
            </motion.div>
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/35 lg:bg-gradient-to-r lg:from-black/25 lg:via-transparent lg:to-white/35"
              aria-hidden
            />
          </div>

          {/* Right: quote card overlapping the image on large screens */}
          <div
            className={cn(
              "absolute z-10 flex items-stretch justify-center",
              "px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-4",
              "lg:absolute lg:inset-y-0 lg:left-[34%] xl:left-[36%] lg:right-0",
              "lg:items-center lg:justify-end lg:px-6 xl:px-10 lg:pb-0 lg:pt-0"
            )}
          >
            <div className="w-full max-w-lg rounded-2xl md:rounded-3xl bg-white p-6 sm:p-8 md:p-10 shadow-xl border border-gray-100/90 lg:shadow-2xl">
              <div className="space-y-0 md:space-y-10">
                <div className="text-gray-900">
                  <p className="text-7xl leading-none font-black text-primary">
                    &ldquo;
                  </p>
                  <p className="-mt-4 px-3 text-lg sm:text-xl md:text-xl leading-relaxed text-gray-700">
                    KiviCare is a clinic & patient management system built primarily for WordPress, designed to handle medical appointments, records, billing, telemedicine, and more. It’s self‑hosted, so clinics control their own data, and it aims to launch a complete digital healthcare workflow quickly and efficiently.
                  </p>
                  <p className="ml-auto w-fit text-7xl leading-none font-black text-primary">
                    &rdquo;
                  </p>
                </div>

                <div className="flex items-end gap-3 sm:gap-4">
                  <img
                    src="/landing-2/wp-content/uploads/2025/09/hero-info-item-image-1.jpg"
                    alt="Quote author"
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover object-center border-2 border-white shadow-md"
                  />
                  <div className="flex min-h-12 md:min-h-14 flex-col justify-between">
                    <p className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                      Dr. Neel Shah
                    </p>
                    <p className="text-sm sm:text-base font-medium text-gray-500">
                      Lead Dental Specialist
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
