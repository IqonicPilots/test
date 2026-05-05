"use client"

import { motion } from "framer-motion"

const services = [
  {
    title: "Scaling & Gum Treatment",
    desc: "Deep cleaning to remove plaque and maintain healthy gums.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-1.png",
  },
  {
    title: "Root Canal Treatment (RCT)",
    desc: "Save infected teeth with painless root canal therapy.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-2.png",
  },
  {
    title: "Crown & Bridge",
    desc: "Restore damaged or missing teeth with durable, natural-looking restorations.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-3.png",
  },
  {
    title: "Dental Implants",
    desc: "Permanent tooth replacement for natural results.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-4.png",
  },
  {
    title: "Orthodontic Treatments",
    desc: "Modern aligners for perfectly straight teeth.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-5.png",
  },
  {
    title: "Pediatric Dentistry",
    desc: "Gentle and caring dental care for children.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-6.png",
  },
  {
    title: "Cosmetic Dentistry",
    desc: "Smile makeovers for a confident new look.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-7.png",
  },
  {
    title: "Full Mouth Rehab",
    desc: "Comprehensive restoration of oral health.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-8.png",
  },
  {
    title: "Emergency Care",
    desc: "Immediate assistance for urgent dental issues.",
    img: "/landing-2/wp-content/uploads/2025/09/service-item-image-9.png",
  }
]

export function Services() {
  return (
    <section id="services" className="py-24 md:py-32 bg-[#F2F7FF]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-[#316DFF]">
            <span className="mr-1.5 text-[#316DFF]">•</span>
            Our Services
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#161A2D]">
            Complete dental services for a healthy smile
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-6 md:p-7 transition-all duration-300 group"
            >
              <div className="mb-7 h-40 md:h-50 rounded-2xl flex items-center justify-center overflow-hidden">
                <img
                  src={service.img}
                  alt={service.title}
                  className="w-[78%] h-[78%] object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[24px] md:text-[28px] font-bold text-[#161A2D] mb-2">
                {service.title}
              </h3>
              <p className="text-[#626467] text-[15px] leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center flex flex-row items-center justify-center gap-2">
          <span className="text-white font-bold text-sm inline-flex items-center bg-primary px-3 py-1 rounded-full">Free</span>
          <span className="text-[#161A2D] font-bold text-md">Let’s make something great work together.</span>
          <span className="text-primary font-bold text-md cursor-pointer underline hover:text-black">Get Free Quote</span>
        </div>
      </div>
    </section>
  )
}
