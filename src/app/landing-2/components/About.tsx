"use client"

import { useId } from "react"
import { motion } from "framer-motion"
import { ArrowUp, CheckCircle2, Star } from "lucide-react"

function ExperienceSeal() {
  const ringId = useId().replace(/:/g, "")
  const ringText = "9+ YEARS EXCELLENCE • 9+ YEARS EXCELLENCE"
  return (
    <div className="relative h-full w-full animate-[spin_20s_linear_infinite]">
      <svg
        className="h-full w-full "
        viewBox="0 0 100 100"
        aria-hidden
      >
        <defs>
          <path
            id={ringId}
            d="M 50 50 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0"
            fill="none"
          />
        </defs>
        <text className="fill-white text-[7.5px] font-bold uppercase tracking-[0.2em]">
          <textPath href={`#${ringId}`} startOffset="0%">
            {ringText}
          </textPath>
        </text>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <ArrowUp className="h-8 w-8 text-white" strokeWidth={3} />
      </div>
    </div>
  )
}

export function About() {
  return (
    <section id="about-us" className="overflow-x-hidden overflow-y-visible bg-white py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Image-2 — main left, secondary overlapping right; seal top-left on main; rating under secondary */}
          <div className="relative mx-auto w-full max-w-[min(100%,420px)] overflow-visible lg:mx-0 lg:max-w-none">
            <div className="relative flex items-center justify-center gap-0 overflow-visible sm:justify-center">
              {/* Main portrait (secondary overlaps its right edge from the column to the right) */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75 }}
                viewport={{ once: true }}
                className="relative z-10 w-[58%] min-w-0 shrink-0 sm:w-[55%] md:w-[66%]"
              >
                <img
                  src="/landing-2/wp-content/uploads/2025/11/about-us-image-1-left.png"
                  alt="Doctor"
                  className="w-full rounded-[28px] sm:rounded-[36px] md:rounded-[40px]"
                />
                {/* Top-left circular badge (Image-2) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, delay: 0.18 }}
                  viewport={{ once: true }}
                  className="absolute right-[52%] bottom-[30%] z-99 h-[4.25rem] w-[4.25rem] -translate-x-1.5/2 -translate-y-1.8/2 rounded-full border-8 border-white bg-[#316DFF] p-1 sm:right-[48%] sm:h-[5rem] sm:w-[5rem] sm:border-[10px] sm:p-1 md:-right-[20%] md:h-36 md:w-36"
                  aria-label="9+ years excellence"
                >
                  <ExperienceSeal />
                </motion.div>
              </motion.div>

              {/* Secondary + rating (pulled up so clinic photo reads above the rating card; overlaps main) */}
              <motion.div
                initial={{ opacity: 0, y: -24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.12 }}
                viewport={{ once: true }}
                className="relative -ml-[12%] flex flex-col sm:-ml-[14%] md:ml-[5%]"
              >
                <img
                  src="/landing-2/wp-content/uploads/2025/11/about-us-image-2.jpg"
                  alt="Clinic"
                  className="w-full rounded-2xl object-cover sm:rounded-3xl"
                />

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.25 }}
                  viewport={{ once: true }}
                  className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-4 sm:rounded-3xl sm:p-8"
                >
                  <p className="text-2xl font-black text-[#161A2D] sm:text-3xl">
                    4.9<span className="text-lg font-bold text-[#626467] sm:text-xl">/5</span>
                  </p>
                  <div className="mt-2 flex gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#316DFF] text-[#316DFF] sm:h-[18px] sm:w-[18px]"
                      />
                    ))}
                    <Star className="h-4 w-4 fill-slate-200 text-slate-200 sm:h-[18px] sm:w-[18px]" />
                  </div>
                  <p className="mt-2 text-xs leading-snug text-[#626467] sm:text-sm">
                    Average patient satisfaction rating.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-sm font-bold uppercase tracking-widest text-[#316DFF]">
                <span className="mr-1.5 text-[#316DFF]">•</span>
                About Us
              </span>
              <h2 className="text-4xl font-black leading-tight text-[#161A2D] md:text-5xl">
                Your trusted dental partner for every family member
              </h2>
              <p className="text-lg leading-relaxed text-[#626467]">
                We provide comprehensive dental care for patients of all ages, ensuring healthy, confident smiles for every member of your family. Our team is dedicated to providing a comfortable experience.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#316DFF]" />
                <span className="font-bold text-[#161A2D]">
                  Experienced team of dental professionals
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#316DFF]" />
                <span className="font-bold text-[#161A2D]">Gentle and compassionate care</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-8">
              <p className="text-center text-lg font-black text-[#161A2D] sm:text-left sm:text-xl">
                Trusted by over 5,000+ patients worldwide
              </p>
              <div className="flex items-center justify-center -space-x-2 sm:justify-end sm:pl-4">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                    alt=""
                    className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm sm:h-11 sm:w-11"
                  />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#316DFF] text-sm font-black text-white shadow-sm sm:h-11 sm:w-11">
                  +
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <img
                src="/landing-2/wp-content/uploads/2025/11/dr-mayuri-image.jpg"
                alt=""
                className="h-14 w-14 rounded-xl border-2 border-[#316DFF] object-cover sm:rounded-2xl"
              />
              <div>
                <h4 className="text-lg font-black text-[#161A2D]">Dr. Mayuri Ranpariya</h4>
                <p className="text-sm font-bold text-[#626467]">BDS-Dental Surgeon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
