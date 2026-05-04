"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Check,
  Search,
  Calendar,
  ClipboardList,
  MessageSquare,
  Bell,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Columns,
  CalendarCheck,
  CalendarX,
  UserPlus,
  Settings,
  Star,
  CreditCard,
  type LucideProps,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/api/use-notifications"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

const NOTIFICATION_TYPES = ["Appointment", "Encounter", "Message", "Review", "Payment", "Authentication", "Others"]

// Full icon map matching backend NOTIFICATION_STYLES key names
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
      className={cn("size-5", className)}
      style={{ color: color || undefined }}
    />
  )
}

export default function NotificationsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [page, setPage] = React.useState(1)
  const [visibleColumns, setVisibleColumns] = React.useState({
    notification: true,
    type: true,
    time: true
  })

  const debouncedSearch = useDebouncedValue(search, 500)

  // Reset page to 1 when filters change
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1) }
  const handleTypeChange = (val: string) => { setTypeFilter(val); setPage(1) }

  const { data: response, isLoading } = useNotifications(page, 10, {
    search: debouncedSearch || undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
    isRead: statusFilter === "all" ? undefined : statusFilter === "read",
  })

  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()

  const notifications = response?.data || []
  const pagination = response?.pagination

  return (
    <div className="flex flex-col gap-6 p-2 md:p-3 max-w-5xl w-full self-center">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Manage and track your clinical updates in one place.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
        >
          <Check className="size-4" />
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {NOTIFICATION_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Columns className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.notification}
                  onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, notification: !!val }))}
                >
                  Notification
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.type}
                  onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, type: !!val }))}
                >
                  Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.time}
                  onCheckedChange={(val) => setVisibleColumns(prev => ({ ...prev, time: !!val }))}
                >
                  Time
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card className="min-h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Recently received updates and alerts.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-muted-foreground text-sm">Fetching updates...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-border/60">
                {notifications.map((n) => {
                  const iconName = n.data?.icon as string | undefined
                  const iconColor = n.data?.color as string | undefined
                  return (
                    <div
                      key={n._id}
                      className={cn(
                        "group flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-6 transition-all cursor-pointer hover:bg-muted/50",
                        !n.isRead && "bg-primary/[0.02]"
                      )}
                      onClick={() => !n.isRead && markAsReadMutation.mutate(n._id)}
                    >
                      <div
                        className="size-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={iconColor ? { borderColor: `${iconColor}30`, background: `${iconColor}15` } : { borderColor: 'var(--border)', background: 'var(--muted)' }}
                      >
                        <NotificationIcon iconName={iconName} color={iconColor} />
                      </div>

                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className={cn(
                            "font-semibold",
                            !n.isRead ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {n.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
                          {n.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:min-w-[180px]">
                        {visibleColumns.type && (
                          <div className="text-sm text-muted-foreground/60 hidden md:block">
                            {n.type}
                          </div>
                        )}
                        {visibleColumns.time && (
                          <div className="text-xs text-muted-foreground/50 whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </div>
                        )}
                        {!n.isRead && (
                          <div className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-24 flex flex-col items-center justify-center text-center space-y-4">
                <Bell className="size-12 text-muted-foreground/20" />
                <div className="max-w-[280px]">
                  <h3 className="text-lg font-semibold">No notifications</h3>
                  <p className="text-sm text-muted-foreground">You're all caught up! Important updates will appear here.</p>
                </div>
              </div>
            )}
          </CardContent>
          {pagination && pagination.totalPages > 1 && (
            <CardFooter className="flex items-center justify-end gap-2 border-t p-4">
              <p className="text-sm text-muted-foreground mr-2">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage(prev => prev - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(prev => prev + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
