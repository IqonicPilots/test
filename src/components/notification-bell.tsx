"use client"

import * as React from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Calendar,
  ClipboardList,
  MessageSquare,
  BellRing,
  CalendarCheck,
  CalendarX,
  UserPlus,
  Settings,
  Star,
  CreditCard,
  LucideProps,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications, useMarkAsRead } from "@/hooks/api/use-notifications"
import { cn } from "@/lib/utils"

// Map icon name strings (from backend NOTIFICATION_STYLES) to Lucide components
const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  CalendarCheck,
  CalendarX,
  Calendar,
  UserPlus,
  Settings,
  MessageSquare,
  ClipboardList,
  Star,
  CreditCard,
  Bell,
}

function NotificationIcon({
  iconName,
  color,
  className,
}: {
  iconName?: string
  color?: string
  className?: string
}) {
  const IconComponent = (iconName && ICON_MAP[iconName]) || Bell
  return (
    <IconComponent
      className={cn("size-4", className)}
      style={{ color: color || undefined }}
    />
  )
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const { data: response, isLoading } = useNotifications(1, 10)
  const markAsReadMutation = useMarkAsRead()

  const notifications = response?.data || []
  const unreadCount = response?.stats?.unreadCount ?? response?.unreadCount ?? 0
  const totalUnreads = response?.stats?.totalUnreads ?? response?.totalUnreads ?? unreadCount

  const handleRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    markAsReadMutation.mutate(id)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer hover:bg-accent hover:text-accent-foreground">
          <div className="relative">
            <Bell className="size-5" />
            {totalUnreads > 0 && (
              <span className="absolute top-0 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] p-0 overflow-hidden rounded-xl border border-border shadow-2xl bg-popover/95 backdrop-blur-sm" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
          <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
          <Link
            href="/notifications"
            className="text-xs font-semibold text-primary hover:underline transition-all"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        <ScrollArea className={cn(notifications.length === 1 ? "h-auto max-h-[420px]" : "h-[420px]")}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 p-8">
              <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse">Loading updates...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => {
                const iconName = n.data?.icon as string | undefined
                const iconColor = n.data?.color as string | undefined

                return (
                  <div
                    key={n._id}
                    className={cn(
                      "relative group flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-accent/50",
                      !n.isRead && "bg-primary/[0.03]"
                    )}
                    onClick={(e) => !n.isRead && handleRead(n._id, e as any)}
                  >
                    {/* Square icon box — same style as notifications list page */}
                    <div
                      className="size-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5"
                      style={iconColor
                        ? { borderColor: `${iconColor}30`, background: `${iconColor}15` }
                        : { borderColor: 'var(--border)', background: 'var(--muted)' }
                      }
                    >
                      <NotificationIcon iconName={iconName} color={iconColor} />
                    </div>

                    <div className="flex-1 space-y-1 pr-2">
                      <p className={cn(
                        "text-sm leading-none font-medium",
                        !n.isRead ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {n.content}
                      </p>
                      <div className="flex items-center gap-2 pt-1.5 opacity-80">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <div className="size-1 rounded-full bg-muted-foreground/30" />
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {!n.isRead && (
                      <div className="shrink-0 pt-0.5">
                        <span className="block size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/5">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 transition-transform hover:rotate-12">
                <BellRing className="size-6 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-medium mb-1">Stay Tuned!</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                We'll notify you when something important happens.
              </p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/20">
          <Button variant="ghost" size="sm" className="w-full text-xs font-medium hover:bg-accent" asChild onClick={() => setOpen(false)}>
            <Link href="/notifications">Manage all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
