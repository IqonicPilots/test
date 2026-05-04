"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, LayoutDashboard, ChevronDown, X, User, LockKeyhole, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getStoredAuthSession, type StoredAuthSession } from '@/lib/auth-session'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Logo } from '@/components/logo'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout } from "@/hooks/api/use-auth"

const navigationItems = [
  { name: 'Home', href: '#hero' },
  { name: 'Clinics', href: '#about' },
  { name: 'About', href: '#features' },
  { name: 'Doctors', href: '#team' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Contact', href: '#contact' },
]

// Smooth scroll function
const smoothScrollTo = (targetId: string, pathname: string) => {
  if (targetId.startsWith('#')) {
    if (pathname !== '/' && pathname !== '') {
      window.location.href = `/${targetId}`
      return
    }
    const element = document.querySelector(targetId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }
}

import { useLandingContent } from '@/contexts/landing-content-context'

export function LandingNavbar() {
  const router = useRouter()
  const { settings, hydrated } = useLandingContent()
  const { header } = settings
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<StoredAuthSession | null>(null)
  const logout = useLogout()

  useEffect(() => {
    setSession(getStoredAuthSession())
  }, [])

  const isLoggedIn = !!session?.accessToken
  const userName = session?.user?.name || ''
  const userAvatar = session?.user?.avatar || ''
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleLogout = () => {
    const refreshToken = getStoredAuthSession()?.refreshToken
    logout.mutate(refreshToken ? { refreshToken } : undefined)
  }

  const menuItems = header.menuLinks && header.menuLinks.length > 0 ? header.menuLinks : [
    { label: 'Home', link: '#hero' },
    { label: 'Clinics', link: '#about' },
    { label: 'About', link: '#features' },
    { label: 'Doctors', link: '#team' },
    { label: 'FAQ', link: '#faq' },
    { label: 'Contact', link: '#contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <Logo 
              size={40} 
              srcOverride={header.siteLogo} 
              useConfiguredSize
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden xl:flex">
          <NavigationMenuList>
            {!hydrated ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <NavigationMenuItem key={i}>
                    <div className="px-4 py-2">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </NavigationMenuItem>
                ))
              ) : (
                menuItems.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuLink
                      className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        const pathname = window.location.pathname
                        if (item.link.startsWith('#')) {
                          smoothScrollTo(item.link, pathname)
                        } else {
                          window.location.href = item.link
                        }
                      }}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))
              )}
            </NavigationMenuList>
          </NavigationMenu>

        {/* Desktop CTA */}
        <div className="hidden xl:flex items-center space-x-2">
          {!hydrated ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          ) : isLoggedIn ? (
            <>
              {header.showButton !== false && (
                // <Link
                //   href={header.buttonLink || "/book-appointment"}
                //   className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                // >
                //   {header.buttonText || "Book Appointment"}
                // </Link>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('bookingClinicId')
                    sessionStorage.removeItem('bookingDoctorId')
                    setIsOpen(false)
                    router.push('/book-appointment')
                  }}
                  className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {header.buttonText || "Book Appointment"}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full cursor-pointer focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{userName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {header.dashboardText || "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/account">
                      <User className="h-4 w-4 mr-2" />
                      {header.profileText || "Profile"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/account?tab=password">
                      <LockKeyhole className="h-4 w-4 mr-2" />
                      {header.passwordText || "Change Password"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={logout.isPending}
                    onSelect={(e) => {
                      e.preventDefault()
                      handleLogout()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {logout.isPending ? "Logging out..." : (header.logoutText || "Log out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {header.showButton !== false && (
                // <Link
                //   href={header.buttonLink || "/book-appointment"}
                //   className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                // >
                //   {header.buttonText || "Book Appointment"}
                // </Link>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('bookingClinicId')
                    sessionStorage.removeItem('bookingDoctorId')
                    setIsOpen(false)
                    router.push('/book-appointment')
                  }}
                  className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {header.buttonText || "Book Appointment"}
                </button>
              )}
              {header.showButton2 !== false && (
                <Link
                  href={header.button2Link || "/sign-in"}
                  className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {header.button2Text || "Sign In"}
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {!hydrated ? (
          <div className="xl:hidden">
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        ) : (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0 gap-0 [&>button]:hidden overflow-hidden flex flex-col">
              <div className="flex flex-col h-full">
                {/* Header */}
                <SheetHeader className="space-y-0 p-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Logo size={40} />
                    <SheetTitle className="sr-only">Kivicare Navigation Menu</SheetTitle>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="cursor-pointer h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetHeader>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto">
                  <nav className="p-6 space-y-1">
                    {!hydrated ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-4 py-3">
                          <Skeleton className="h-5 w-3/4" />
                        </div>
                      ))
                    ) : (
                      menuItems.map((item) => (
                        <div key={item.label}>
                          <a
                            href={item.link}
                            className="flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            onClick={(e) => {
                              setIsOpen(false)
                              const pathname = window.location.pathname
                              if (item.link.startsWith('#')) {
                                e.preventDefault()
                                if (pathname !== '/' && pathname !== '') {
                                  window.location.href = `/${item.link}`
                                } else {
                                  setTimeout(() => smoothScrollTo(item.link, pathname), 100)
                                }
                              }
                            }}
                          >
                            {item.label}
                          </a>
                        </div>
                      ))
                    )}
                  </nav>
                </div>

                {/* Footer Actions */}
                <div className="border-t p-6 space-y-4">
                  {!hydrated ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isLoggedIn ? (
                        <>
                          <div className="flex items-center gap-3 px-2 pb-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={userAvatar} alt={userName} />
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{userInitials}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{userName}</span>
                          </div>
                          {header.showButton !== false && (
                            <button
                              onClick={() => {
                                sessionStorage.removeItem('bookingClinicId')
                                sessionStorage.removeItem('bookingDoctorId')
                                setIsOpen(false)
                                router.push('/book-appointment')
                              }}
                              className="group relative inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary focus:outline-none cursor-pointer after:absolute after:bottom-1 after:left-4 after:h-[2px] after:w-[calc(100%-2rem)] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100"
                            >
                              {header.buttonText || "Book Appointment"}
                            </button>
                          )}
                          <Button variant="outline" size="lg" asChild className="w-full cursor-pointer" onClick={() => setIsOpen(false)}>
                            <Link href="/dashboard">
                              <LayoutDashboard className="size-4" />
                              {header.dashboardText || "Dashboard"}
                            </Link>
                          </Button>
                          <Button variant="outline" size="lg" asChild className="w-full cursor-pointer" onClick={() => setIsOpen(false)}>
                            <Link href="/account">
                              <User className="size-4" />
                              {header.profileText || "Profile"}
                            </Link>
                          </Button>
                          <Button variant="outline" size="lg" asChild className="w-full cursor-pointer" onClick={() => setIsOpen(false)}>
                            <Link href="/account?tab=password">
                              <LockKeyhole className="size-4" />
                              {header.passwordText || "Change Password"}
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="w-full cursor-pointer"
                            disabled={logout.isPending}
                            onClick={() => {
                              setIsOpen(false)
                              handleLogout()
                            }}
                          >
                            <LogOut className="size-4" />
                            {logout.isPending ? "Logging out..." : (header.logoutText || "Log out")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3">
                            {header.showButton !== false && (
                              <Link
                                href={header.buttonLink || "/book-appointment"}
                                className="flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => setIsOpen(false)}
                              >
                                {header.buttonText || "Book Appointment"}
                              </Link>
                            )}
                            {header.showButton2 !== false && (
                              <Button variant="outline" size="lg" asChild className="w-full cursor-pointer" onClick={() => setIsOpen(false)}>
                                <Link href={header.button2Link || "/sign-in"}>
                                  {header.button2Text || "Sign In"}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  )
}
