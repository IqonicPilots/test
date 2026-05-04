"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { isViewValuePresent } from "@/lib/view-dialog-utils"

export interface ViewFieldConfig {
  label: string
  value: React.ReactNode
  className?: string
  rawValue?: unknown
  isVisible?: boolean
}

export interface ViewSectionItemConfig {
  avatar?: {
    src?: string
    fallback: string
  }
  title: string
  subtitle?: React.ReactNode
  info?: React.ReactNode
  id?: string
  rawTitle?: unknown
  rawSubtitle?: unknown
  rawInfo?: unknown
  isVisible?: boolean
}

export interface ViewSectionConfig {
  title: string
  items: ViewSectionItemConfig[]
  isVisible?: boolean
}

interface GenericViewDialogProps {
  title: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  headerFields?: ViewFieldConfig[]
  sections?: ViewSectionConfig[]
  dialogSize?: "sm" | "md" | "lg" | "xl" | "full"
  footer?: React.ReactNode
  headerAccessory?: React.ReactNode
}

const sizeClasses = {
  sm: "sm:max-w-[500px]",
  md: "sm:max-w-[700px]",
  lg: "sm:max-w-[900px]",
  xl: "sm:max-w-[1200px]",
  full: "sm:max-w-[95vw]",
}

export function GenericViewDialog({
  title,
  isOpen,
  onOpenChange,
  trigger,
  headerFields = [],
  sections = [],
  dialogSize = "lg",
  footer,
  headerAccessory,
}: GenericViewDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = isOpen !== undefined ? isOpen : internalOpen
  const visibleHeaderFields = React.useMemo(
    () =>
      headerFields.filter((field) => {
        if (field.isVisible === false) return false
        return isViewValuePresent(field.rawValue ?? field.value)
      }),
    [headerFields]
  )

  const visibleSections = React.useMemo(
    () =>
      sections
        .filter((section) => section.isVisible !== false)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => {
            if (item.isVisible === false) return false
            const hasRenderableText =
              isViewValuePresent(item.rawTitle ?? item.title) ||
              isViewValuePresent(item.rawSubtitle ?? item.subtitle) ||
              isViewValuePresent(item.rawInfo ?? item.info)
            return hasRenderableText
          }),
        }))
        .filter((section) => section.items.length > 0),
    [sections]
  )

  const handleOpenChange = (open: boolean) => {
    setInternalOpen(open)
    onOpenChange?.(open)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <span
          onClick={() => handleOpenChange(true)}
          style={{ display: "contents" }}
        >
          {trigger}
        </span>
      )}
      <DialogContent className={cn("overflow-y-auto max-h-[90vh]", sizeClasses[dialogSize], "border-white/40")}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            View details in a read-only dialog.
          </DialogDescription>
          {headerAccessory ? (
            <div className="flex justify-end pt-1">
              {headerAccessory}
            </div>
          ) : null}
        </DialogHeader>

        <div className="space-y-8 py-4 px-2">
          {/* Sections */}
          {visibleSections.length > 0 && (
            <div
              className={cn(
                "grid gap-6 rounded-xl transition-all",
                visibleSections.length <= 1 && "grid-cols-1",
                visibleSections.length === 2 && "grid-cols-1 sm:grid-cols-2",
                visibleSections.length === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                visibleSections.length >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              )}
            >              
              {visibleSections.map((section, idx) => (
                <div key={idx} className="h-full">
                  <div className="h-full flex flex-col space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <div 
                        key={item.id ?? `${idx}-${itemIdx}`} 
                        className="flex-1 flex flex-col items-start gap-4 p-4 rounded-xl bg-background border border-border/40 shadow-sm transition-all border-foreground/20 group cursor-default"
                      >
                        {section.title ? (
                          <h3 className="text-sm font-bold text-foreground/80 flex gap-2">
                            {section.title}
                          </h3>
                        ) : null}
                        <div className="flex min-w-0 w-full gap-4 items-start">
                          {item.avatar && (
                            <Avatar className="h-10 w-10 shrink-0 border border-border/50 ring-2 ring-background transition-transform ">
                              {item.avatar.src && <AvatarImage src={item.avatar.src} alt={item.title} />}
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                {item.avatar.fallback}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col min-w-0 flex-1 gap-1">
                            {item.title ? (
                              <span className="font-bold text-sm text-foreground mb-1 min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                                {item.title}
                              </span>
                            ) : null}
                            {item.subtitle ? (
                              <div className="text-xs text-muted-foreground font-medium min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                                {item.subtitle}
                              </div>
                            ) : null}
                            {item.info ? (
                              <div className="text-xs text-muted-foreground font-medium min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                                {item.info}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Header Fields */}
          {visibleHeaderFields.length > 0 && (
            <div
              className={cn(
                "grid gap-6 p-6 rounded-xl bg-accent/20 border border-border/50 shadow-sm transition-all",
                visibleHeaderFields.length <= 1 && "grid-cols-1 ",
                visibleHeaderFields.length === 2 ? "flex justify-between" : "grid",
                visibleHeaderFields.length === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                visibleHeaderFields.length >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {visibleHeaderFields.map((field, idx) => (
                <div key={`${field.label}-${idx}`} className={cn("space-y-1.5 h-full lg:text-center")}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</p>
                  <div className="text-sm font-semibold text-foreground leading-tight min-w-0 break-words whitespace-normal [overflow-wrap:anywhere]">
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          )}
          {footer ? <div>{footer}</div> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
