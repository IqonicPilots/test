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
import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFrequencyString } from "./encounter-clinical"


const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingBottom: 220, // Buffer for fixed footer
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#edeeef",
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    width: "60%",
  },
  logoBoxContainer: {
    width: 45,
    height: 45,
    backgroundColor: "#00488d",
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 45,
    height: 45,
    borderRadius: 8,
    objectFit: "cover",
  },
  clinicInfoBox: {
    flexDirection: "column",
  },
  clinicTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: "#00488d",
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 8,
    color: "#424752",
    marginTop: 4,
    lineHeight: 1.4,
    maxWidth: 280,
  },
  clinicDoctor: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#191c1d",
  },
  clinicSpec: {
    fontSize: 9,
    color: "#424752",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerRight: {
    width: "40%",
    textAlign: "right",
    flexDirection: "column",
  },
  headerContactLine: {
    fontSize: 9,
    color: "#424752",
    marginBottom: 2,
    lineHeight: 1.4,
  },
  pageTitleContainer: {
    width: "100%",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25, // Increased spacing
  },
  pageTitleText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#00488d",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  patientDataBox: {
    backgroundColor: "#f3f4f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  patientDataRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e1e3e4",
    paddingBottom: 4,
    marginBottom: 6,
  },
  patientLabelStr: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#424752",
    textTransform: "uppercase",
    width: 90,
  },
  patientValStr: {
    fontSize: 10,
    color: "#191c1d",
    flex: 1,
  },
  encounterTimeLine: {
    fontSize: 10,
    color: "#424752",
    marginBottom: 15,
    paddingLeft: 5,
  },
  encounterTimeBold: {
    fontFamily: "Helvetica-Bold",
    color: "#191c1d",
  },
  // TABLES
  tableContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeaderRect: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 10,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111827",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  tableHeaderCellLast: {
    flex: 1,
    padding: 10,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111827",
  },
  tableRowRect: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowRectLast: {
    flexDirection: "row",
  },
  tableCellLine: {
    flex: 1,
    padding: 10,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  tableCellLineLast: {
    flex: 1,
    padding: 10,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },
  // FOOTER (FIXED)
  footerFixedWrapper: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
  },
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
    borderColor: "#c2c6d4",
    backgroundColor: "#f9fafb",
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
})

const PdfMailIconEnc = ({ color = "#424752", size = 9 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

const PdfPhoneIconEnc = ({ color = "#424752", size = 9 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth={2} fill="none" />
  </Svg>
)

export interface PrintEncounterData {
  clinic: {
    name: string
    doctor: string
    email: string
    phone: string
    address: string
    logo?: string
    signature?: string
  }
  patient: {
    name: string
    email: string
    phone: string
    address: string
    age: string
    gender: string
    bloodGroup: string
  }
  encounter: {
    dateTime: string
    status: string
  }
  clinicalDetails: {
    problems: string[]
    observations: string[]
    notes: string[]
    prescriptions?: {
      name: string
      frequency: string
      duration: string
      instruction: string
    }[]
  }
}

const PageHeader = ({ clinic }: { clinic: PrintEncounterData["clinic"] }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerLeft}>
      <View style={styles.logoBoxContainer}>
        {clinic.logo?.startsWith("http") ? (
          <Image src={clinic.logo} style={styles.logoImage} />
        ) : (
          <Text style={{ color: "#ffffff", fontSize: 16 }}>+</Text>
        )}
      </View>
      <View style={styles.clinicInfoBox}>
        <Text style={styles.clinicTitle}>{clinic.name || "Clinic Name"}</Text>
      </View>
    </View>
    <View style={[styles.headerRight, { alignItems: "flex-end" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <PdfMailIconEnc />
        <Text style={[styles.headerContactLine, { marginBottom: 0 }]}>{clinic.email || "—"}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <PdfPhoneIconEnc />
        <Text style={[styles.headerContactLine, { marginBottom: 0 }]}>{clinic.phone || "—"}</Text>
      </View>
    </View>
  </View>
)

const PageFooter = ({ clinic }: { clinic: PrintEncounterData["clinic"] }) => (
  <View style={styles.footerFixedWrapper} fixed>
    <View style={styles.signatureSectionRow}>
      <View style={styles.sigNameBlock}>
        {clinic.signature && (
          <View style={styles.sigBox}>
            <Image src={clinic.signature} style={styles.sigImage} />
          </View>
        )}
        <Text style={styles.sigName}>Dr. {clinic.doctor}</Text>
        <View style={styles.sigUnderline} />
        <Text style={styles.sigAuth}>Authorized Medical Practitioner</Text>
      </View>
    </View>
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>
        {clinic.address && clinic.address !== "—" ? clinic.address : "—"}
      </Text>
    </View>
  </View>
)

function EncounterDoc({ data }: { data: PrintEncounterData }) {
  const { clinic, patient, encounter, clinicalDetails } = data

  const clinicalRows = Array.from({
    length: Math.max(
      clinicalDetails.problems.length,
      clinicalDetails.observations.length,
      clinicalDetails.notes.length
    ),
  }).map((_, i) => ({
    problem: clinicalDetails.problems[i] || "-",
    observation: clinicalDetails.observations[i] || "-",
    note: clinicalDetails.notes[i] || "-",
  }))

  const hasPrescriptions = Boolean(clinicalDetails.prescriptions?.length)

  return (
    <Document title={`Report-${patient.name}`}>
      <Page size="A4" style={styles.page}>
        <PageHeader clinic={clinic} />

        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitleText}>Clinical Encounter Summary</Text>
        </View>

        <View style={styles.patientDataBox}>
          {patient.name && patient.name !== "—" && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Patient Name :</Text>
              <Text style={styles.patientValStr}>{String(patient.name)}</Text>
            </View>
          )}
          {((patient.age && patient.age !== "—") || (patient.gender && patient.gender !== "—")) && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Age / Gender :</Text>
              <Text style={styles.patientValStr}>
                {patient.age && patient.age !== "—" ? patient.age : "—"} / {patient.gender && patient.gender !== "—" ? patient.gender : "—"}
              </Text>
            </View>
          )}
          {patient.email && patient.email !== "—" && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Email Address :</Text>
              <Text style={styles.patientValStr}>{patient.email}</Text>
            </View>
          )}
          {patient.bloodGroup && patient.bloodGroup !== "—" && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Blood Group :</Text>
              <Text style={styles.patientValStr}>{patient.bloodGroup}</Text>
            </View>
          )}
          {patient.address && patient.address !== "—" && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Address :</Text>
              <Text style={styles.patientValStr}>{patient.address}</Text>
            </View>
          )}
          {patient.phone && patient.phone !== "—" && (
            <View style={styles.patientDataRow}>
              <Text style={styles.patientLabelStr}>Phone Number :</Text>
              <Text style={styles.patientValStr}>{patient.phone}</Text>
            </View>
          )}
        </View>

        {encounter.dateTime && encounter.dateTime !== "—" && (
          <Text style={styles.encounterTimeLine}>
            Encounter Time: <Text style={styles.encounterTimeBold}>{new Date(encounter.dateTime).toLocaleString()}</Text>
          </Text>
        )}

        {/* PROPER 3-COLUMN TABLE FOR CLINICAL DETAILS */}
        {clinicalRows.length > 0 && (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRect}>
              <Text style={styles.tableHeaderCell}>Problems</Text>
              <Text style={styles.tableHeaderCell}>Observations</Text>
              <Text style={styles.tableHeaderCellLast}>Notes</Text>
            </View>
            {clinicalRows.map((row, i) => (
              <View key={i} style={i === clinicalRows.length - 1 ? styles.tableRowRectLast : styles.tableRowRect} wrap={false}>
                <Text style={styles.tableCellLine}>{String(row.problem)}</Text>
                <Text style={styles.tableCellLine}>{String(row.observation)}</Text>
                <Text style={styles.tableCellLineLast}>{String(row.note)}</Text>
              </View>
            ))}
          </View>
        )}

        <PageFooter clinic={clinic} />
      </Page>

      {hasPrescriptions && (
        <Page size="A4" style={styles.page}>
          <PageHeader clinic={clinic} />
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitleText}>Prescription Details</Text>
          </View>

          {/* PRESCRIPTION TABLE */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRect}>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Medication</Text>
              <Text style={styles.tableHeaderCell}>Dosage</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Duration</Text>
              <Text style={[styles.tableHeaderCellLast, { flex: 2 }]}>Instructions</Text>
            </View>
            {clinicalDetails.prescriptions?.map((p, i) => (
              <View key={i} style={i === clinicalDetails.prescriptions!.length - 1 ? styles.tableRowRectLast : styles.tableRowRect} wrap={false}>
                <Text style={[styles.tableCellLine, { flex: 1.2 }]}>{String(p.name)}</Text>
                <Text style={styles.tableCellLine}>{formatFrequencyString(p.frequency)}</Text>
                <Text style={[styles.tableCellLine, { flex: 0.8 }]}>{String(p.duration)}</Text>
                <Text style={[styles.tableCellLineLast, { flex: 2 }]}>{String(p.instruction)}</Text>
              </View>
            ))}
          </View>

          <PageFooter clinic={clinic} />
        </Page>
      )}
    </Document>
  )
}

export function PrintEncounterPDFButton({ data }: { data: PrintEncounterData }) {
  const [loading, setLoading] = useState(false)
  const handlePrint = async () => {
    try {
      setLoading(true)
      const blob = await pdf(<EncounterDoc data={data} />).toBlob()
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, "_blank")
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `encounter-${(data.patient?.name || "Patient").replace(/\s+/g, "-")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally { setLoading(false) }
  }
  return (
    <Button variant="outline" size="sm" className="shrink-0 whitespace-nowrap gap-1.5" disabled={loading} onClick={handlePrint}>
      <Activity className="size-3.5" />
      {loading ? "Generating..." : "Print Encounter"}
    </Button>
  )
}
