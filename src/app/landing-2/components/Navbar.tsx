"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CustomArrowIcon } from "./CustomIcons"

const navItems = [
  { name: "Home", href: "#", active: true },
  { name: "About us", href: "#about-us" },
  { name: "Services", href: "#services" },
  { name: "Features", href: "#features" },
  { name: "Why Choose us", href: "#why-choose-us" },
  { name: "NRI Services", href: "#nri-services" },
  { name: "Testimonials", href: "#testimonials" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  return (
    <header className="fixed top-2 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6">
      <div
        className={cn(
          "mx-auto px-6 py-7 rounded-[20px] transition-all duration-300 flex items-center justify-between shadow-sm max-xl:px-3 max-xl:py-3",
          scrolled
            ? "bg-white shadow-lg xl:container py-4 rounded-full bg-background/40 backdrop-blur-lg max-xl:rounded-[20px] max-xl:py-3"
            : "bg-white"
        )}
      >
        <Link href="/landing-2" className="flex items-center shrink-0">
          <img
            src="/landing-2/wp-content/uploads/2025/09/site-logo.svg"
            alt="Toothmate Logo"
            className="h-10 w-auto max-xl:h-8"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-6 2xl:gap-10 text-[15px] 2xl:text-base font-semibold">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "transition-colors",
                scrolled
                  ? "text-white hover:text-white/80"
                  : item.active
                    ? "text-gray-900"
                    : "text-[#161A2D] hover:text-[#316DFF]"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant={"default"}
            size={"lg"}
            className="hidden xl:inline-flex bg-[#316DFF] hover:bg-[#2655cc] text-white rounded-full px-5 py-3.5 2xl:px-8 2xl:py-6 text-sm 2xl:text-base font-bold transition-all group"
          >
            Make An Appointment <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1" />
          </Button>
          {/* Mobile Menu Button */}
          <button
            className={cn(
              "xl:hidden rounded-md p-2 transition-colors",
              scrolled ? "text-white bg-background/40 backdrop-blur-lg border border-white/30 shadow-sm" : "text-[#161A2D]"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div
          className={cn(
            "xl:hidden absolute top-full left-4 right-4 mt-4 rounded-[20px] shadow-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300",
            scrolled ? "bg-background/40 backdrop-blur-lg border border-white/30" : "bg-white border border-gray-100"
          )}
        >
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "font-bold py-2 transition-colors",
                  scrolled
                    ? "text-white hover:text-white/80"
                    : item.active
                      ? "text-[#316DFF]"
                      : "text-[#161A2D] hover:text-[#316DFF]"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Button variant={"default"} size={"lg"} className="group rounded-full bg-[#316DFF] px-8 py-6 text-base font-bold text-white transition-all hover:bg-[#2655cc]">
              Make An Appointment <CustomArrowIcon className="ml-2 text-2xl group-hover:translate-x-1" />
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
