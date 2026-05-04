"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LucideIcon, ArrowLeft, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ErrorLayoutProps {
  code: string
  title: string
  description?: string
  icon: LucideIcon
  isDashboard?: boolean
}

const COMMON_ERROR_MESSAGE = "The system encountered an unexpected condition. Please return to the dashboard or go back to continue your workflow."

export function ProfessionalErrorLayout({
  code,
  title,
  description = COMMON_ERROR_MESSAGE,
  icon: Icon,
  isDashboard = true,
}: ErrorLayoutProps) {
  const router = useRouter()

  return (
    <div className={cn(
      'flex flex-col items-center justify-center w-full px-4',
      !isDashboard ? 'min-h-dvh bg-background py-16' : 'flex-1 py-6 md:py-12'
    )}>
      {/* Decorative Orbs for full screen layout */}
      {!isDashboard && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
        </div>
      )}

      <Card className={cn(
        "relative max-w-lg w-full overflow-hidden border-border/50",
        isDashboard ? "shadow-xs bg-card/60 backdrop-blur-xs" : "shadow-xl bg-card"
      )}>
        <CardContent className="flex flex-col items-center text-center p-8 md:p-12">
          {/* Dashboard-style Icon Pattern */}
          <div className='relative mb-8'>
            <div className='absolute -inset-4 rounded-full bg-primary/10 blur-xl animate-pulse' />
            <div className='relative h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20 transition-all duration-300 hover:scale-105 active:rotate-3'>
              <Icon className="h-9 w-9 md:h-10 md:w-10 text-secondary-foreground" />
            </div>
          </div>

          {/* Content Zone */}
          <div className='space-y-4'>
            <Badge variant="outline" className="h-9 px-6 rounded-full border-primary/20 bg-primary/5 text-primary text-lg font-bold tracking-tight shadow-sm">
              {code}
            </Badge>
            <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight text-foreground'>
              {title}
            </h1>
            <p className='text-base text-muted-foreground leading-relaxed max-w-xs md:max-w-sm'>
              {description}
            </p>
          </div>

          {/* Navigation Actions - Only Home and Back */}
          <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full'>
            <Button
              size="lg"
              className='group w-full sm:flex-1 h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200'
              onClick={() => router.push("/dashboard")}
            >
              <Home className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
              Home
            </Button>

            <Button
              variant='outline'
              size="lg"
              className='group w-full sm:flex-1 h-12 px-8 font-bold bg-background/50 hover:bg-muted/50 border-border/50 active:scale-95 transition-all duration-200 uppercase text-xs tracking-widest'
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>
          </div>

          <div className='mt-12 pt-8 border-t border-border/50 w-full'>
            <p className='text-sm md:text-base font-normal text-muted-foreground/90 leading-relaxed tracking-normal'>
              If you need immediate help, please reach out to your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
