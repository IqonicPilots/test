"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react"
import { CustomArrowIcon } from "./CustomIcons"

export function Footer() {
  const socials = [
    {
      name: "Facebook",
      href: "#",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
      )
    },
    {
      name: "Instagram",
      href: "#",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
      )
    },
    {
      name: "Twitter",
      href: "#",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
      )
    }
  ]

  return (
    <footer className="bg-[#161A2D] text-white pt-24 pb-12 overflow-hidden relative">
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#316DFF] rounded-full blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Column */}
          <div className="space-y-8">
            <Link href="/landing-2" className="inline-block">
              <img
                src="/landing-2/wp-content/uploads/2025/09/site-logo.svg"
                alt="Toothmate Logo"
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Providing top-quality dental care with modern technology and a compassionate approach. Your smile is our priority.
            </p>
            <div className="flex space-x-3">
              {socials.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#316DFF] hover:border-[#316DFF] transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-black mb-10 relative inline-block">
              Quick Links
              <div className="absolute -bottom-2 left-0 w-10 h-1 bg-[#316DFF] rounded-full" />
            </h4>
            <ul className="space-y-5">
              {[
                { name: "About Us", href: "#about-us" },
                { name: "Our Services", href: "#services" },
                { name: "Clinical Case", href: "#" },
                { name: "Testimonials", href: "#testimonials" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/40 hover:text-[#316DFF] transition-colors flex items-center group">
                    <CustomArrowIcon className="w-0 h-4 group-hover:w-4 opacity-0 group-hover:opacity-100 transition-all mr-0 group-hover:mr-2" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-xl font-black mb-10 relative inline-block">
              Our Services
              <div className="absolute -bottom-2 left-0 w-10 h-1 bg-[#316DFF] rounded-full" />
            </h4>
            <ul className="space-y-5">
              {[
                "Dental Implants",
                "Root Canal Therapy",
                "Teeth Whitening",
                "Smile Makeover"
              ].map((service) => (
                <li key={service}>
                  <Link href="#services" className="text-white/40 hover:text-[#316DFF] transition-colors flex items-center group">
                    <ArrowRight className="w-0 h-4 group-hover:w-4 opacity-0 group-hover:opacity-100 transition-all mr-0 group-hover:mr-2" />
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-black mb-10 relative inline-block">
              Contact Info
              <div className="absolute -bottom-2 left-0 w-10 h-1 bg-[#316DFF] rounded-full" />
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#316DFF] group-hover:bg-[#316DFF] group-hover:text-white transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Call Us</p>
                  <p className="text-sm font-bold">+91 81414 75777</p>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#316DFF] group-hover:bg-[#316DFF] group-hover:text-white transition-all">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Email Us</p>
                  <p className="text-sm font-bold">hello@kivicare.com</p>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#316DFF] group-hover:bg-[#316DFF] group-hover:text-white transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Our Clinic</p>
                  <p className="text-sm font-bold">Surat, Gujarat, India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/20 text-xs font-medium">
            Copyright © 2025 Toothmate Clinic. All Rights Reserved.
          </p>
          <div className="flex space-x-8 text-white/20 text-xs font-medium">
            <Link href="#" className="hover:text-[#316DFF] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#316DFF] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
