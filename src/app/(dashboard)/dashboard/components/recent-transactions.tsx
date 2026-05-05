"use client"

import { Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthRole } from "@/hooks/use-auth-role"
import { useProfile } from "@/hooks/api/use-profile"
import { useBills } from "@/hooks/api/use-bills"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { BillViewDialog } from "@/app/(dashboard)/billing-records/components/bill-view-dialog"
import { generateAndPrintInvoice } from "@/components/invoice/print-invoice-pdf"
import type { Bill, BillDoctor, BillPatient } from "@/types/bill.types"
import { StatusBadge } from "@/components/ui/status-badge"

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "NA"
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

export function RecentTransactions() {
  const { role, isRoleReady } = useAuthRole()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const { formatCurrencyCompact, currencyPrefix, currencyPostfix } = useCurrencyFormatter(true)
  const profileId = profile?._id

  const firstClinic = profile?.meta?.clinics?.[0]
  const clinicId =
    typeof firstClinic === "string" ? firstClinic : firstClinic?._id

  const filters =
    role === "patient"
      ? { patientId: profileId }
      : role === "doctor"
        ? { doctorId: profileId }
        : role === "receptionist"
          ? { receptionist: profileId }
          : role === "clinic_admin"
            ? { clinicAdmin: profileId }
            : undefined

  const { data, isLoading } = useBills(1, 5, filters)

  const bills = data?.data ?? []
  const transactions = bills.map((bill) => {
    const patient = typeof bill.patient === "object" && bill.patient ? (bill.patient as BillPatient) : null
    const doctor = typeof bill.doctor === "object" && bill.doctor ? (bill.doctor as BillDoctor) : null
    const patientName = patient
      ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient"
      : "Patient"
    const doctorName = doctor
      ? `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "Doctor"
      : "Doctor"
    const patientEmail = patient?.email || ""
    const patientImage = patient?.profilePicture || ""
    const doctorImage = doctor?.profilePicture || ""
    const serviceName = Array.isArray(bill.items) && bill.items.length > 0 ? bill.items[0]?.name || "" : ""
    const status = String(bill.paymentStatus || "unpaid")

    return {
      billId: bill._id,
      name: role === "patient" ? doctorName : patientName,
      subLabel: role === "patient" ? serviceName : patientEmail,
      image: role === "patient" ? doctorImage : patientImage,
      billStatus: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      grandTotal: Number(bill.totalAmount || bill.actualAmount || 0),
      billedAt: bill.createdAt || "",
      rawBill: bill as Bill,
    }
  })

  if (!isRoleReady || isProfileLoading || (role !== "admin" && !profileId) || isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest bill transactions</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="cursor-pointer">
            <Link href="/billing-records">
            <Eye className="h-4 w-4" />
            View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-lg border gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <div className="grid shrink-0 grid-cols-[minmax(140px,1fr)_auto_auto] items-center gap-3">
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-3 w-28 ml-auto" />
                  </div>
                  <Skeleton className="h-6 w-[72px] rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-auto md:h-[500px]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest bill transactions</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <Link href="/billing-records">
          <Eye className="h-4 w-4" />
          View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => {
          const name = transaction.name || "Patient"
          const subLabel = transaction.subLabel || ""
          const avatar = transaction.image || ""
          const statusRaw = String(transaction.billStatus || "").trim()
          const status = statusRaw.toLowerCase()
          const statusLabel = statusRaw ? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase() : "Unknown"
          const badgeVariant = status === "paid" ? "default" : status === "unpaid" ? "secondary" : "destructive"

          return (
          <div key={transaction.billId} >
            <div className="flex items-center p-3 rounded-lg border gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{name}</p>
                  {subLabel ? (
                    <p className="text-xs text-muted-foreground truncate">{subLabel}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
                  <div className="sm:text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrencyCompact(transaction.grandTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.billedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={statusLabel} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <BillViewDialog
                          bill={transaction.rawBill}
                          trigger={
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={(event) => event.preventDefault()}
                            >
                              View Details
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => generateAndPrintInvoice(transaction.rawBill, undefined, currencyPrefix, currencyPostfix)}
                        >
                          Download Receipt
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
        {transactions.length === 0 && (
          <div className="flex items-center justify-center h-[380px]">
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
