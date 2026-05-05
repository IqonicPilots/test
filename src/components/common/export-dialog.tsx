"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2, Upload } from "lucide-react"
import * as XLSX from "xlsx"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// ─── Types ───────────────────────────────────────────────────────────────────

type ExportFormat = "csv" | "xls"

/**
 * A column mapping: key = exported header label, value = accessor function or
 * dot-path string (e.g. "patient.fullName") that resolves against a row item.
 */
export type ExportColumn<T = Record<string, unknown>> =
  | { header: string; accessor: (row: T) => string | number | null | undefined }

export interface ExportDialogProps<T = Record<string, unknown>> {
  /** The currently visible rows to export (already server-filtered / paginated) */
  data: T[]
  /** Column definitions that drive what gets exported */
  columns: ExportColumn<T>[]
  /** Base filename without extension, e.g. "patients" → patients_export.csv */
  filename?: string
  /** Dialog title text. Defaults to "Export" */
  title?: string
  /** Description text below the title. Defaults to generic copy */
  description?: string
  /** Label on the trigger button. Defaults to "Export" */
  buttonLabel?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return "-"
  return String(val).trim() || "-"
}

function buildRows<T>(data: T[], columns: ExportColumn<T>[]) {
  return data.map((row) => {
    const out: Record<string, string> = {}
    for (const col of columns) {
      out[col.header] = safeStr(col.accessor(row))
    }
    return out
  })
}

function downloadCSV(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (val: string) => {
    const str = String(val ?? "")
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const csvLines = [
    headers.map(escape).join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ]
  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  })
  triggerDownload(blob, `${filename}_export.csv`)
}

function downloadXLS(rows: Record<string, string>[], filename: string) {
  if (!rows.length) return
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export")
  XLSX.writeFile(workbook, `${filename}_export.xlsx`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportDialog<T = Record<string, unknown>>({
  data,
  columns,
  filename = "export",
  title = "Export Data",
  description,
  buttonLabel = "Export",
}: ExportDialogProps<T>) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv")
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    if (!data.length) return
    setIsExporting(true)
    try {
      const rows = buildRows(data, columns)
      if (exportFormat === "csv") {
        downloadCSV(rows, filename)
      } else {
        downloadXLS(rows, filename)
      }
      setOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  const defaultDescription =
    data.length > 0
      ? `Export based on the current view and active filters.`
      : "No data available to export."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-8 gap-2 cursor-pointer"
          id="export-dialog-btn"
        >
          <Upload className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-start">
            {description ?? defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="export-format-select" className="text-sm font-medium">
              Export Format
            </Label>
            <Select
              value={exportFormat}
              onValueChange={(val) => setExportFormat(val as ExportFormat)}
            >
              <SelectTrigger
                id="export-format-select"
                className="cursor-pointer w-full"
              >
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      CSV
                      <span className="text-xs text-muted-foreground ml-2">
                        Comma-separated values (.csv)
                      </span>
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="xls" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Excel (XLS)
                      <span className="text-xs text-muted-foreground ml-2">
                        Microsoft Excel format (.xlsx)
                      </span>
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="cursor-pointer gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Converts a 24-hour time string "HH:mm" to 12-hour "h:mm AM/PM".
 * Non-conforming strings are returned as-is.
 */
function to12Hour(timeStr?: string | null): string {
  if (!timeStr) return "-"
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  const hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = hours >= 12 ? "PM" : "AM"
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${minutes} ${period}`
}

/** Humanises snake_case payment mode labels (e.g. "pay_later" → "Pay Later") */
function humanisePaymentMode(mode?: string | null): string {
  if (!mode) return "-"
  return mode
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// internal date formatter
function formatDate(dateStr: string): string {
  try { return format(new Date(dateStr), "MMM dd, yyyy") } catch { return dateStr }
}


// ─── Pre-built column sets ────────────────────────────────────────────────────

/** Ready-made column set for the Patient table */
export const patientExportColumns: ExportColumn<any>[] = [
  { header: "Patient Name",  accessor: (r) => `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() },
  { header: "Email",         accessor: (r) => r.email },
  { header: "Phone Number", accessor: (r) => r.mobile },
  { header: "Gender",        accessor: (r) => r.gender },
  { header: "Date of Birth", accessor: (r) => r.dateOfBirth ? formatDate(r.dateOfBirth) : "-" },
  { header: "Blood Group",   accessor: (r) => r.bloodGroup },
  { header: "Registered On", accessor: (r) => r.registeredOn ? formatDate(r.registeredOn) : "-" },
  { header: "Status",        accessor: (r) => r.status },
]

/** Ready-made column set for the Encounter table */
export const encounterExportColumns: ExportColumn<any>[] = [
  { header: "Patient",        accessor: (r) => r.patient?.fullName ?? `${r.patient?.firstName ?? ""} ${r.patient?.lastName ?? ""}`.trim() },
  { header: "Patient Email",  accessor: (r) => r.patient?.email },
  { header: "Doctor",         accessor: (r) => r.doctor?.fullName ?? `${r.doctor?.firstName ?? ""} ${r.doctor?.lastName ?? ""}`.trim() },
  { header: "Clinic",         accessor: (r) => r.clinic?.name ?? r.clinic?.clinicName },
  { header: "Encounter Date", accessor: (r) => r.encounterDate ? formatDate(r.encounterDate) : "-" },
  { header: "Status",         accessor: (r) => r.encounter_status ?? r.status },
]

/** Ready-made column set for the Doctor table */
export const doctorExportColumns: ExportColumn<any>[] = [
  { header: "Doctor Name",  accessor: (r) => `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() },
  { header: "Email",         accessor: (r) => r.email },
  { header: "Phone Number", accessor: (r) => r.mobile },
  { 
    header: "Specialization",  
    accessor: (r) => 
      Array.isArray(r.specializations) && r.specializations.length
        ? r.specializations.join(", ")
        : "-"
  },
  { 
    header: "Clinic", 
    accessor: (r) => 
      Array.isArray(r.clinic) && r.clinic.length
        ? r.clinic.join(", ")
        : "-"
  },
  { header: "Status",        accessor: (r) => r.status },
]

/** Ready-made column set for the Clinic table */
export const clinicExportColumns: ExportColumn<any>[] = [
  { header: "Clinic Name", accessor: (r) => r.name },
  { header: "Email", accessor: (r) => r.email },
  { header: "Phone Number", accessor: (r) => r.countryCode + " " + r.mobile },
  {
    header: "Specialization",
    accessor: (r) =>
      Array.isArray(r.specialties) && r.specialties.length
        ? r.specialties.map((s: any) => s.label).join(", ")
        : "-"
  },
  { header: "Clinic Admin Name", accessor: (r) => r.clinicAdmin.fullName },
  { header: "Clinic Admin Email", accessor: (r) => r.clinicAdmin.email },
  { header: "Clinic Admin Mobile", accessor: (r) => r.clinicAdmin.countryCode + " " + r.clinicAdmin.mobile },
  { header: "Clinic Address", accessor: (r) => r.address.city + ", " + r.address.state + ", " + r.address.country + ", " + r.address.postalCode },
  { header: "Status", accessor: (r) => r.isActive ? "Active" : "Inactive" },
]

/** Ready-made column set for the Receptionist table */
export const receptionistExportColumns: ExportColumn<any>[] = [
  { header: "Receptionist Name",  accessor: (r) => `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() },
  { header: "Email",         accessor: (r) => {console.log(r); return r.email}},
  { header: "Phone Number", accessor: (r) => r.sourceReceptionist.countryCode + " " + r.sourceReceptionist.mobile },
  { header: "Clinic",         accessor: (r) => r.clinic },
  { header: "Clinic Email", accessor: (r) => r.clinicEmail },
  { header: "Status",        accessor: (r) => r.status },
]

/** Ready-made column set for the Service table */
export function getServiceExportColumns(
  formatCurrency?: (value: number) => string
): ExportColumn<any>[] {
  return [
    { header: "Service Name", accessor: (r) => {console.log(r); return r.name } },
    { header: "Category", accessor: (r) => r.category.label },
    {
      header: "Charges",
      accessor: (r) => {
        const charge = Number(r.charges ?? 0)
        if (formatCurrency) return formatCurrency(charge)
        return charge.toString()
      },
     },
    { header: "Duration", accessor: (r) => r.duration + " mins" },
    { header: "Clinic", accessor: (r) => r.clinic.name },
    { header: "Clinic Email", accessor: (r) => r.clinic.email },
    { header: "Doctor", accessor: (r) => r.doctor.fullName },
    { header: "Doctor Email", accessor: (r) => r.doctor.email },
    { header: "Status", accessor: (r) => r.isActive ? "Active" : "Inactive" },
  ]
}
export const serviceExportColumns = getServiceExportColumns()

/** Ready-made column set for the Billing Records table */
export function getBillingRecordsExportColumns(
  formatCurrency?: (value: number) => string
): ExportColumn<any>[] {
  return [
    { header: "Bill ID", accessor: (r) => r.billId },
    { header: "Service Name", accessor: (r) => r.title },
    { header: "Patient",        accessor: (r) => r.patient?.fullName ?? `${r.patient?.firstName ?? ""} ${r.patient?.lastName ?? ""}`.trim() },
    { header: "Patient Email",  accessor: (r) => r.patient?.email },
    { header: "Doctor",         accessor: (r) => r.doctor?.fullName ?? `${r.doctor?.firstName ?? ""} ${r.doctor?.lastName ?? ""}`.trim() },
    { header: "Doctor Email",  accessor: (r) => r.doctor?.email },
    { header: "Clinic",         accessor: (r) => r.clinic?.name ?? r.clinic?.clinicName },
    {
      header: "Total Amount",
      accessor: (r) => {
        const charge = Number(r.totalAmount ?? 0)
        if (formatCurrency) return formatCurrency(charge)
        return charge.toString()
      },
    },
    { header: "Payment Status", accessor: (r) => humanisePaymentMode(r.paymentStatus) },
    { header: "Billing Date", accessor: (r) => r.createdAt ? formatDate(r.createdAt) : "-" },
  ]
}
export const billingRecordsExportColumns = getBillingRecordsExportColumns()

/** Ready-made column set for the Appointment table */
export function getAppointmentExportColumns(
  formatCurrency?: (value: number) => string
): ExportColumn<any>[] {
  return [
    { header: "Patient",      accessor: (r) => r.patient?.fullName ?? (typeof r.patient === "string" ? r.patient : "-") },
    { header: "Doctor",       accessor: (r) => r.doctor?.fullName ?? (typeof r.doctor === "string" ? r.doctor : "-") },
    { header: "Clinic",       accessor: (r) => r.clinic?.name ?? (typeof r.clinic === "string" ? r.clinic : "-") },
    { header: "Service",      accessor: (r) => r.service?.name ?? (typeof r.service === "string" ? r.service : "-") },
    { header: "Date",         accessor: (r) => r.schedule?.startDate ? formatDate(r.schedule.startDate) : "-" },
    { header: "Start Time",   accessor: (r) => to12Hour(r.schedule?.startTime) },
    {
      header: "Charges",
      accessor: (r) => {
        const charge = Number(r.appointmentCharge ?? 0)
        if (formatCurrency) return formatCurrency(charge)
        return charge.toString()
      },
    },
    { header: "Payment Mode", accessor: (r) => humanisePaymentMode(r.paymentMode) },
    { header: "Status",       accessor: (r) => r.status?.label ?? r.status?.id ?? r.status },
  ]
}
export const appointmentExportColumns = getAppointmentExportColumns()