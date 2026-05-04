"use client"

import React, { useState } from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
  Svg,
  Path,
} from "@react-pdf/renderer"
import { Printer, Download, FileText } from "lucide-react"
import type { Bill } from "@/types/bill.types"
import type { Appointment } from "@/types/appointment.types"
import { Button } from "@/components/ui/button"
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter"
import { billApi } from "@/services/bill.service"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    fontSize: 10,
    color: "#374151",
    paddingBottom: 100,
  },
  // HEADER
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 10,
    minWidth: 0,
  },
  logoBoxContainer: {
    width: 50,
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoImage: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  logoPlaceholder: {
    fontSize: 24,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
  },
  clinicHeaderInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
  },
  clinicNameTitle: {
    fontSize: 16,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  clinicContactLine: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  clinicAddressLine: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
    lineHeight: 1.35,
  },
  headerRight: {
    textAlign: "right",
    width: "32%",
    flexShrink: 0,
  },
  invoiceTitleText: {
    fontSize: 22,
    color: "#0f172a",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  invoiceMetaHighlight: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaHighlightText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right",
    textTransform: "uppercase",
  },

  // ROW WRAPPER FOR APPT INFO & STATUS
  apptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  appointmentBox: {
    marginVertical: 12,
  },
  statusContainer: {
    width: "30%",
    marginBottom: 5, // Small offset
  },

  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
  },
  apptGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
  },
  apptCol: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  apptColLast: {
    flex: 1,
    padding: 8,
  },
  apptLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  apptVal: {
    fontSize: 8,
    color: "#1e293b",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    borderWidth: 1,
    textAlign: "center",
  },

  // DETAILS COLUMNS
  detailsRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  detailsCol: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  detailsHeading: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
  },
  detailsLine: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailsLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    width: "35%",
  },
  detailsText: {
    fontSize: 8,
    color: "#334155",
    flex: 1,
  },

  // TABLE
  tableContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tdDescription: { width: "50%" },
  tdPrice: { width: "25%", textAlign: "right" },
  tdAmount: { width: "25%", textAlign: "right", fontFamily: "Helvetica-Bold" },

  rowMain: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  rowSub: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 2,
  },

  // SUMMARY
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  totalsBox: {
    width: "40%",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taxlabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginLeft: 5,
    textTransform: "uppercase",
  },
  totalLineFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  grandTotalText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    flex: 1,
    textAlign: "right",
  },

  // SIGNATURE
  signatureSectionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  sigBox: {
    width: 140,
    height: 45,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  sigImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  sigNameBlock: {
    textAlign: "right",
    width: 160,
    alignItems: "flex-end",
  },
  sigName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#0f172a",
  },
  sigUnderline: {
    width: "100%",
    height: 1,
    backgroundColor: "#cbd5e1",
    marginVertical: 4,
  },
  sigAuth: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },

  // FOOTER
  footerFixedWrapper: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
  },
  footerContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
    fontStyle: "italic",
    lineHeight: 1.4,
    textAlign: "center",
  },
});

const PdfMailIcon = ({ color = "#64748b", size = 9 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

const PdfPhoneIcon = ({ color = "#64748b", size = 9 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

const PdfCalendarIcon = ({ color = "#64748b", size = 9 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={color} strokeWidth={3} fill="none" />
  </Svg>
)

function InvoicePDFDoc({ 
  bill, 
  appointment,
  currencyPrefix = "$",
  currencyPostfix = ""
}: { 
  bill: Bill; 
  appointment?: Appointment;
  currencyPrefix?: string;
  currencyPostfix?: string;
}) {
  const targetAppt = (appointment || bill.appointment) as Appointment | null | undefined
  const patient = (targetAppt?.patient || bill.patient) as any
  // Merge: appointment often has a populated doctor without UserMeta `signature`;
  // the bill API attaches `signature` / `meta.signature` to `bill.doctor` — that must not be lost.
  const apptDoc = targetAppt?.doctor
  const billDoc = bill.doctor
  const doctor =
    apptDoc && typeof apptDoc === "object" && billDoc && typeof billDoc === "object"
      ? ({ ...apptDoc, ...billDoc } as any)
      : ((apptDoc || billDoc) as any)

  const formatCurrency = (amount: number) => {
    return `${currencyPrefix}${Number(amount || 0).toFixed(2)}${currencyPostfix}`
  }

  // Prefer stored fields; if API omitted them, infer from (subtotal + tax) − total (e.g. older saves)
  const discountExplicit =
    Number(
      bill.discount ?? bill.discount_value ?? (bill as Bill & { discount_amount?: number }).discount_amount ?? 0
    ) || 0
  const preTotal = Number(bill.serviceTotal ?? 0) + Number(bill.taxTotal ?? 0)
  const discountInferred = Math.max(0, preTotal - Number(bill.totalAmount ?? 0))
  const discountLineAmount = discountExplicit > 0.001 ? discountExplicit : discountInferred > 0.01 ? discountInferred : 0

  const clinicApp = (typeof targetAppt?.clinic === "object" ? targetAppt?.clinic : {}) as any
  const clinicBill = (typeof bill.clinic === "object" ? bill.clinic : {}) as any
  const clinic = { ...clinicBill, ...clinicApp }

  const clinicName = clinic?.name || "Clinic Name"
  const doctorName = doctor?.fullName || `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "-"
  const patientName = patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "-"
  const clinicEmail = clinic?.email || "No email provided"

  const d = doctor as { signature?: string; meta?: { signature?: string }; signatureImage?: string } | null | undefined
  const doctorSignatureUrl =
    (typeof d?.signatureImage === "string" && d.signatureImage.trim()) ||
    d?.meta?.signature ||
    d?.signature ||
    ""

  const formatAddress = (addr: any) => {
    if (!addr) return ""
    if (typeof addr === "string") return addr
    const parts = [
      addr.street || addr.street1 || addr.addressLine1,
      addr.city,
      addr.state,
      addr.country,
      addr.postalCode
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(", ") : ""
  }

  const formatPhone = (data: any) => {
    if (!data) return "–"
    // Extracting countryCode and phone robustly
    const code = data.countryCode || data.country_code || ""
    const phone = data.mobile || data.phoneNumber || data.phone || data.mobile_number || ""

    if (!phone) return "–"
    if (!code) return phone

    // Check if code already includes +
    const prefix = code.startsWith("+") ? code : `+${code}`
    return `${prefix} ${phone}`.trim()
  }

  const clinicAddressFooter = formatAddress(clinic?.address)
  const clinicPhoneDisplay = formatPhone(clinic)

  return (
    <Document title={`Invoice-${bill.billId || bill._id}`}>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBoxContainer}>
              {clinic?.cliniclogo || clinic?.logo ? (
                <Image src={clinic.cliniclogo || clinic?.logo} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoPlaceholder}>+</Text>
              )}
            </View>
            <View style={styles.clinicHeaderInfo}>
              <Text style={styles.clinicNameTitle}>{clinicName}</Text>
              {clinicEmail && clinicEmail !== "No email provided" ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <PdfMailIcon color="#64748b" size={9} />
                  <Text style={{ fontSize: 8, color: "#334155" }}>{clinicEmail}</Text>
                </View>
              ) : null}
              {clinicPhoneDisplay && clinicPhoneDisplay !== "–" && clinicPhoneDisplay !== "—" ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <PdfPhoneIcon color="#64748b" size={9} />
                  <Text style={{ fontSize: 8, color: "#334155" }}>{clinicPhoneDisplay}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <View style={styles.invoiceMetaHighlight}>
              <Text style={styles.metaHighlightText}>INV ID: {bill.billId || bill._id}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 4 }}>
                <PdfCalendarIcon color="#000000" size={9}  />
                <Text style={{ ...styles.metaHighlightText, textAlign: "right" }}>
                  {new Date(bill.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* STATUS (Right Aligned Row) */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 }}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: bill.paymentStatus === "paid" ? "#f0fdf4" : "#fef2f2",
              color: bill.paymentStatus === "paid" ? "#166534" : "#991b1b",
              borderColor: bill.paymentStatus === "paid" ? "#bbf7d0" : "#fecaca",
              borderRadius: 20, // Pill shaped
              paddingHorizontal: 15,
              paddingVertical: 5
            }
          ]}>
            <Text>STATUS: {bill.paymentStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* APPOINTMENT INFO */}
        {targetAppt?.schedule?.startDate && (
          <View style={styles.appointmentBox}>
            <Text style={styles.sectionTitle}>Appointment Information:</Text>
            <View style={styles.apptGrid}>
              <View style={styles.apptCol}>
                <Text style={styles.apptLabel}>Date:</Text>
                <Text style={styles.apptVal}>{new Date(targetAppt.schedule.startDate).toLocaleDateString()}</Text>
              </View>
              <View style={styles.apptColLast}>
                <Text style={styles.apptLabel}>Time:</Text>
                <Text style={styles.apptVal}>{new Date(targetAppt.schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          </View>
        )}

        {/* DETAILS SECTION */}
        <View style={styles.detailsRow}>
          {/* Patient Detail */}
          <View style={styles.detailsCol}>
            <Text style={styles.detailsHeading}>Patient Detail:</Text>
            {patientName && patientName !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Name:</Text>
                <Text style={styles.detailsText}>{patientName}</Text>
              </View>
            )}
            {formatPhone(patient) && formatPhone(patient) !== "–" && formatPhone(patient) !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Mobile:</Text>
                <Text style={styles.detailsText}>{formatPhone(patient)}</Text>
              </View>
            )}
            {patient?.email && patient.email !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Email:</Text>
                <Text style={styles.detailsText}>{patient.email}</Text>
              </View>
            )}
          </View>

          {/* Doctor Detail */}
          <View style={styles.detailsCol}>
            <Text style={styles.detailsHeading}>Doctor Detail:</Text>
            {doctorName && doctorName !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Name:</Text>
                <Text style={styles.detailsText}>Dr. {doctorName}</Text>
              </View>
            )}
            {(doctor?.specialization || doctor?.speciality) && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Spec.:</Text>
                <Text style={styles.detailsText}>{doctor?.specialization || doctor?.speciality || "General Practitioner"}</Text>
              </View>
            )}
            {formatPhone(doctor) && formatPhone(doctor) !== "–" && formatPhone(doctor) !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Mobile:</Text>
                <Text style={styles.detailsText}>{formatPhone(doctor)}</Text>
              </View>
            )}
            {doctor?.email && doctor.email !== "—" && (
              <View style={styles.detailsLine}>
                <Text style={styles.detailsLabel}>Email:</Text>
                <Text style={styles.detailsText}>{doctor.email}</Text>
              </View>
            )}
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.tdDescription]}>Services</Text>
            <Text style={[styles.th, styles.tdPrice]}>Price</Text>
            <Text style={[styles.th, styles.tdAmount]}>Amount</Text>
          </View>
          {bill.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={styles.tdDescription}>
                <Text style={styles.rowMain}>{item.name}</Text>
              </View>
              <Text style={[styles.detailsText, styles.tdPrice, { textAlign: "right" }]}>{item.qty > 1 ? `${item.qty} x ` : ""}{formatCurrency(item.price)}</Text>
              <Text style={[styles.rowMain, styles.tdAmount, { textAlign: "right" }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* SUMMARY */}
        <View style={styles.summarySection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.detailsLabel}>Sub Total:</Text>
              <Text style={[styles.detailsText, { textAlign: "right" }]}>{formatCurrency(bill.serviceTotal)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.detailsLabel}>Taxes:</Text>
            </View>
            {bill.taxes && bill.taxes.length > 0
              ? bill.taxes.map((t, i) => (
                  <View key={`${t.name}-${i}`} style={styles.totalLine} wrap={false}>
                    <Text style={styles.detailsLabel}>
                      {t.name}:
                    </Text>
                    <Text style={[styles.detailsText, { textAlign: "right" }]}>{formatCurrency(t.taxAmount)}</Text>
                  </View>
                ))
              : bill.taxTotal > 0
                ? (
                    <View style={styles.totalLine}>
                      <Text style={styles.detailsLabel}>Tax Total:</Text>
                      <Text style={[styles.detailsText, { textAlign: "right" }]}>{formatCurrency(bill.taxTotal)}</Text>
                    </View>
                  )
                : null}
            {discountLineAmount > 0.001 ? (
              <View style={styles.totalLine}>
                <Text style={styles.detailsLabel}>Discount:</Text>
                <Text style={[styles.detailsText, { color: "#166534", textAlign: "right" }]}>-{formatCurrency(discountLineAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.totalLineFinal}>
              <Text style={[styles.detailsLabel, { color: "#0f172a", width: "auto" }]}>GRAND TOTAL:</Text>
              <Text style={styles.grandTotalText}>{formatCurrency(bill.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER & SIGNATURE */}
        <View style={styles.footerFixedWrapper} fixed>
          <View style={styles.signatureSectionRow}>
            <View />
            <View style={styles.sigNameBlock}>
              {!!doctorSignatureUrl && (
                <View style={styles.sigBox}>
                  <Image src={doctorSignatureUrl} style={styles.sigImage} />
                </View>
              )}
              <Text style={styles.sigName}>Dr. {doctorName}</Text>
              <View style={styles.sigUnderline} />
              <Text style={styles.sigAuth}>Authorized Medical Practitioner</Text>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>{clinicAddressFooter || "—"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export function PrintInvoicePDFButton({
  bill,
  appointment,
  variant = "icon"
}: {
  bill: Bill;
  appointment?: Appointment;
  variant?: "icon" | "button"
}) {
  const { currencyPrefix, currencyPostfix } = useCurrencyFormatter()
  const [loading, setLoading] = useState(false)

  const handlePrint = async () => {
    try {
      setLoading(true)
      await generateAndPrintInvoice(bill, appointment, currencyPrefix, currencyPostfix);
    } finally {
      setLoading(false)
    }
  }

  if (variant === "button") {
    return (
      <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap gap-1.5" disabled={loading} onClick={handlePrint}>
        <Printer className="size-3.5" />
        {loading ? "Generating..." : "Print Invoice"}
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" title="Print Invoice" disabled={loading} onClick={handlePrint}>
      {loading ? (
        <div className="size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      ) : (
        <Printer className="size-3.5" />
      )}
    </Button>
  )
}

// Export for standalone use
export { InvoicePDFDoc };

export const generateAndPrintInvoice = async (
  bill: Bill, 
  appointment?: Appointment,
  currencyPrefix?: string,
  currencyPostfix?: string
) => {
  // Always load the latest bill from the API so discount, totals, and line items match what was saved
  // (encounter-embedded or table-cached `bill` can be stale right after save).
  let billForDoc = bill
  if (bill._id) {
    try {
      billForDoc = await billApi.getBillById(bill._id)
    } catch {
      // use passed-in bill
    }
  }
  const appointmentForDoc =
    appointment ?? (typeof billForDoc.appointment === "object" && billForDoc.appointment
      ? (billForDoc.appointment as Appointment)
      : undefined)

  const blob = await pdf(
    <InvoicePDFDoc 
      bill={billForDoc} 
      appointment={appointmentForDoc} 
      currencyPrefix={currencyPrefix} 
      currencyPostfix={currencyPostfix} 
    />
  ).toBlob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `invoice-${billForDoc.billId || billForDoc._id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
