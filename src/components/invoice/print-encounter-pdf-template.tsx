"use client"

import React, { useState } from "react"
import { Document, Page, Text, View, Image, pdf, Svg, Path } from "@react-pdf/renderer"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Country } from "country-state-city"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSystemConfig } from "@/hooks/api/use-system-config"
import { appointmentService } from "@/services/appointment.service"
import type { Appointment } from "@/services/appointment.service"

// --- PDF THEME (DYNAMIC) ---
// @react-pdf/renderer cannot read CSS variables itself, but we resolve them
// here in the browser's main thread — before the PDF is generated — and pass
// concrete hex/rgba values as props. Only hex and rgb() formats are accepted
// by the PDF renderer, so oklch / hsl values are converted via Canvas.

// --- PDF SVG ICON COMPONENTS ---
// @react-pdf/renderer supports SVG natively via <Svg>/<Path> etc.
// Helvetica (built-in PDF font) only covers basic ASCII — Unicode icon characters
// are silently dropped. These SVG components are the proper, reliable approach.

const MailIcon = ({ color, size = 9 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

const PhoneIcon = ({ color, size = 9 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

const CalendarIcon = ({ color, size = 9 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

/**
 * Converts any CSS color string to a format @react-pdf/renderer accepts.
 * Hex and rgb() are returned as-is; oklch/hsl etc. are pixel-read via Canvas.
 */
const toPdfColor = (value: string): string => {
  const v = value.trim()
  if (!v) return "#000000"
  // @react-pdf/renderer natively supports hex and rgb/rgba — return directly
  if (v.startsWith("#") || v.startsWith("rgb")) return v

  // For oklch / hsl / other formats: use Canvas to get an rgba pixel value
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return v

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = v
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  // If canvas couldn't parse the color, alpha will be 0
  if (a === 0) return v
  return `rgba(${r},${g},${b},${+(a / 255).toFixed(3)})`
}

/**
 * Reads light-mode CSS variables directly from the `:root` stylesheet rule —
 * without touching the DOM or relying on getComputedStyle cascade.
 *
 * WHY: Removing `.dark` from <html> then calling getComputedStyle() is
 * unreliable — browsers (and Tailwind v4's @custom-variant) can still surface
 * dark-mode values (e.g. --secondary becomes oklch(0.269 0 0), near-black).
 *
 * APPROACH: Iterate document.styleSheets → find every CSSStyleRule whose
 * selectorText is exactly ":root" → extract the raw declared value.
 * This reads the author's source value before any cascade, so dark-mode
 * overrides defined in a separate `.dark { }` rule have zero effect.
 *
 * This also stays fully DYNAMIC: change any value in globals.css and the PDF
 * picks it up automatically on the next print action.
 */
const getPdfTheme = () => {
  // SSR fallback — PDF is never generated server-side
  const SSR_DEFAULTS = {
    primary: "#4569dd", primaryForeground: "#ffffff",
    secondary: "#fb7d77", secondaryForeground: "#ffffff",
    accent: "#849de6", accentForeground: "#ffffff",
    foreground: "#1c1c1c", background: "#ffffff",
    card: "#ffffff", cardForeground: "#1c1c1c",
    muted: "#e5e5e6", mutedForeground: "#737373",
    border: "#ebebeb", input: "#ebebeb",
    ring: "#b5b5b5", destructive: "#dc2626",
  }

  if (typeof window === "undefined") return SSR_DEFAULTS

  // --- Read :root declarations directly from stylesheets ---
  const rootVars: Record<string, string> = {}

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules || [])) {
        const styleRule = rule as CSSStyleRule
        // Match ":root" selector exactly (some sheets may have ":root, *" etc.)
        if (styleRule.selectorText?.trim() === ":root" && styleRule.style) {
          for (const prop of Array.from(styleRule.style)) {
            if (prop.startsWith("--")) {
              rootVars[prop] = styleRule.style.getPropertyValue(prop).trim()
            }
          }
        }
      }
    } catch {
      // cross-origin stylesheets throw SecurityError — skip them
    }
  }

  const get = (name: string): string => {
    const raw = rootVars[name] || ""
    if (!raw) return SSR_DEFAULTS[name.replace("--", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase()) as keyof typeof SSR_DEFAULTS] || "#000000"
    // Resolve any var() references using the same rootVars map
    const resolved = raw.replace(/var\(([^)]+)\)/g, (_, ref) => rootVars[ref.trim()] || "")
    return toPdfColor(resolved)
  }

  return {
    primary: get("--primary"),
    primaryForeground: get("--primary-foreground"),
    secondary: get("--secondary"),
    secondaryForeground: get("--secondary-foreground"),
    accent: get("--accent"),
    accentForeground: get("--accent-foreground"),
    foreground: get("--foreground"),
    background: get("--background"),
    card: get("--card"),
    cardForeground: get("--card-foreground"),
    muted: get("--muted"),
    mutedForeground: get("--muted-foreground"),
    border: get("--border"),
    input: get("--input"),
    ring: get("--ring"),
    destructive: get("--destructive"),
  }
}


// --- PDF COMPONENT ---

export interface EncounterReportData {
  clinic: {
    name: string
    logo?: string
    email: string
    phone: string
    address: string
    doctorName: string
    doctorSignature?: string
  }
  systemName?: string
  patient: {
    name: string
    phone: string
    id?: string
  }
  appointment: {
    date: string
    time: string
    id: string
  }
}

const pickDoctorSignature = (doctor: unknown): string => {
  if (!doctor || typeof doctor !== "object") return ""
  const d = doctor as {
    signature?: string
    signatureImage?: string
    meta?: { signature?: string; signatureImage?: string }
    UserMeta?: { signature?: string; signatureImage?: string }
    userMeta?: { signature?: string; signatureImage?: string }
  }

  return (
    (typeof d.signatureImage === "string" && d.signatureImage.trim()) ||
    (typeof d.meta?.signatureImage === "string" && d.meta.signatureImage.trim()) ||
    (typeof d.UserMeta?.signatureImage === "string" && d.UserMeta.signatureImage.trim()) ||
    (typeof d.userMeta?.signatureImage === "string" && d.userMeta.signatureImage.trim()) ||
    (typeof d.meta?.signature === "string" && d.meta.signature.trim()) ||
    (typeof d.UserMeta?.signature === "string" && d.UserMeta.signature.trim()) ||
    (typeof d.userMeta?.signature === "string" && d.userMeta.signature.trim()) ||
    (typeof d.signature === "string" && d.signature.trim()) ||
    ""
  )
}

const EncounterReportDoc = ({ data, theme }: { data: EncounterReportData; theme: any }) => (
  <Document title={`Clinical-Note-${data.patient.name}`}>
    <Page size="A4" style={{ padding: 25, paddingBottom: 100, fontFamily: "Helvetica", backgroundColor: "#ffffff", color: theme.foreground }}>
      {/* Header Box - Fully Themed with Primary Background */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.accent, // Primary Background
        padding: 15,
        borderRadius: 5,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: theme.primary, // Primary Border
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          {data.clinic.logo ? (
            <Image src={data.clinic.logo} style={{ width: 65, height: 65, borderRadius: 8, objectFit: "contain" }} />
          ) : (
            <View style={{ width: 65, height: 65, borderRadius: 8, backgroundColor: theme.background, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.primary }}>
              <Text style={{ color: theme.primary, fontSize: 32 }}>+</Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: theme.primaryForeground }}>{data.clinic.name}</Text>
          </View>
        </View>

        <View style={{ textAlign: "right" }}>
          {data.clinic.email ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
              <MailIcon color={theme.primaryForeground} />
              <Text style={{ fontSize: 9, color: theme.primaryForeground }}>{data.clinic.email}</Text>
            </View>
          ) : null}
          {data.clinic.phone && data.clinic.phone !== "—" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
              <PhoneIcon color={theme.primaryForeground} />
              <Text style={{ fontSize: 9, color: theme.primaryForeground }}>{data.clinic.phone}</Text>
            </View>
          ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
              <CalendarIcon color={theme.primaryForeground} />
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: theme.primaryForeground }}>{data.appointment.date}</Text>
            </View>
        </View>
      </View>

      {/* Physician Signature + Footer */}
      <View style={{ position: "absolute", bottom: 25, left: 25, right: 25 }} fixed>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end", marginBottom: 15 }}>
          <View style={{ textAlign: "right", width: 160, alignItems: "flex-end" }}>
            {data.clinic.doctorSignature ? (
              <View
                style={{
                  width: 140,
                  height: 45,
                  borderWidth: 1,
                      borderColor: "#cbd5e1",
                  borderRadius: 4,
                      marginBottom: 4,
                  justifyContent: "center",
                  alignItems: "center",
                      padding: 2,
                      backgroundColor: "#f8fafc",
                }}
              >
                <Image src={data.clinic.doctorSignature} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </View>
            ) : null}
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" }}>
              Dr. {data.clinic.doctorName}
            </Text>
            <View style={{ width: "100%", borderTopWidth: 1, borderTopColor: "#cbd5e1", marginVertical: 4 }} />
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#64748b", textTransform: "uppercase" }}>
              Authorized Medical Practitioner
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: "#f1f5f9",
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: "#e2e8f0",
          textAlign: "center",
        }}>
          <Text style={{ fontSize: 8, color: "#64748b", fontStyle: "italic", lineHeight: 1.4, textAlign: "center" }}>
            {data.clinic.address && data.clinic.address !== "—" ? data.clinic.address : "—"}
          </Text>
        </View>
      </View>
    </Page>
  </Document>
)

// --- GENERATION ACTION ---

export async function generateAndPrintEncounterReport(data: EncounterReportData) {
  const theme = getPdfTheme()
  const blob = await pdf(<EncounterReportDoc data={data} theme={theme} />).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}

// --- PRINT BUTTON ---

export function PrintAppointment({ appointment, variant = "list" }: { appointment: Appointment; variant?: "list" | "dialog" }) {
  const [loading, setLoading] = useState(false)
  const { data: systemConfig } = useSystemConfig()

  const handlePrint = async () => {
    try {
      setLoading(true)
      let sourceAppointment = appointment
      if (appointment?._id) {
        try {
          sourceAppointment = await appointmentService.getAppointmentById(appointment._id)
        } catch {
          // Fallback to already available appointment row payload.
        }
      }

      const doc = typeof sourceAppointment.doctor === "object" ? sourceAppointment.doctor : null
      const patient = typeof sourceAppointment.patient === "object" ? sourceAppointment.patient : null
      const clinic = typeof sourceAppointment.clinic === "object" ? sourceAppointment.clinic : null

      const formatPhone = (isoCode?: string, num?: string) => {
        if (!num) return "—"
        if (!isoCode) return num
        // Resolve numeric dial code from ISO code (e.g., 'IN' -> '91')
        const country = Country.getCountryByCode(isoCode)
        const dialCode = (country as any)?.phonecode || isoCode
        const cleanCode = dialCode.startsWith("+") ? dialCode : `+${dialCode}`
        return num.startsWith(cleanCode) ? num : `${cleanCode} ${num}`
      }

      const formatClinicAddressFooter = (addr: unknown) => {
        if (!addr) return "—"
        if (typeof addr === "string") return addr
        const a = addr as Record<string, string | undefined>
        const parts = [
          a.street || a.street1 || a.addressLine1,
          a.city,
          a.state,
          a.country,
          a.postalCode,
        ].filter(Boolean)
        return parts.length > 0 ? parts.join(", ") : "—"
      }

      const reportData: EncounterReportData = {
        clinic: {
          name: clinic?.name || "Clinic",
          logo: clinic?.cliniclogo || "",
          email: clinic?.email || "",
          phone: formatPhone(clinic?.countryCode || (clinic as any)?.country_code, clinic?.mobile || (clinic as any)?.phoneNumber || (clinic as any)?.phone),
          address: formatClinicAddressFooter(clinic?.address),
          doctorName: doc?.fullName || "Physician",
          doctorSignature: pickDoctorSignature(doc),
        },
        systemName: systemConfig?.copyright_text,
        patient: {
          name: patient?.fullName || "Patient",
          phone: formatPhone(patient?.countryCode || (patient as any)?.country_code, patient?.mobile || (patient as any)?.phoneNumber),
          id: patient?._id
        },
        appointment: {
          date: sourceAppointment.schedule?.startDate ? format(new Date(sourceAppointment.schedule.startDate), "PPP") : "—",
          time: sourceAppointment.schedule?.startTime || "—",
          id: sourceAppointment._id
        }
      }

      await generateAndPrintEncounterReport(reportData)
    } catch (error) {
      toast.error("Generation failed.")
    } finally {
      setLoading(false)
    }
  }

  const Loader = () => <div className="size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />

  if (variant === "dialog") {
    return (
      <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary/40 shadow-sm" disabled={loading} onClick={handlePrint}>
        {loading ? <Loader /> : <Printer className="size-3.5" />}
        Print Appointment
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ActionIconButton disabled={loading} onClick={handlePrint}>
          {loading ? <Loader /> : <Printer className="size-3.5" />}
        </ActionIconButton>
      </TooltipTrigger>
      <TooltipContent>
        <p>Print Appointment</p>
      </TooltipContent>
    </Tooltip>
  )
}
