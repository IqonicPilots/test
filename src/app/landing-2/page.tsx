"use client"

import { Sora } from "next/font/google"
import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"
import { About } from "./components/About"
import { Services } from "./components/Services"
import { Features } from "./components/Features"
import { WhyChooseUs } from "./components/WhyChooseUs"
import { NRIServices } from "./components/NRIServices"
import { Appointment } from "./components/Appointment"
import { Testimonials } from "./components/Testimonials"
import { Footer } from "./components/Footer"
import { Toaster } from "sonner"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
})

export default function LandingPage2() {
  return (
    <div className={`${sora.variable} font-sora selection:bg-blue-100 selection:text-[#316DFF]`}>
      <Toaster position="top-right" richColors />
      
      <Navbar />
      
      <main>
        <Hero />
        <About />
        <Services />
        <Features />
        <WhyChooseUs />
        <NRIServices />
        <Appointment />
        <Testimonials />
      </main>

      <Footer />
    </div>
  )
}
