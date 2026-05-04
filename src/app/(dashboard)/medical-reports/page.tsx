"use client"

import React, { useEffect, useState } from "react"

import { ReportsTabPanel, type ReportItem } from "@/components/encounter-clinical"
import { Skeleton } from "@/components/ui/skeleton"
import { useProfile } from "@/hooks/api/use-profile"
import {
  useAddEncounterReport,
  useDeleteEncounterReport,
  useEncounterReports,
  useUpdateEncounterReport,
} from "@/hooks/api/use-encounters"

import { usePermissions } from "@/hooks/use-permissions"
import { RoleGuard } from "@/components/role-guard"

function mapReportsPayload(
  rows: Array<{ name?: string; date?: string; file?: string; _id?: string }>
): ReportItem[] {
  return rows.map((r) => ({
    name: r.name,
    date: r.date,
    file: r.file,
    _id: r._id,
  }))
}

export default function MedicalReportsPage() {
  const { can } = usePermissions()
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useProfile()
  const patientId = profile?._id ?? null

  // Never default `data` to `[]` here — a fresh `[]` each render makes `useEffect` deps change forever.
  const { data: reportsData } = useEncounterReports(patientId)

  const addEncounterReportMutation = useAddEncounterReport()
  const updateEncounterReportMutation = useUpdateEncounterReport()
  const deleteEncounterReportMutation = useDeleteEncounterReport()

  const [reports, setReports] = useState<ReportItem[]>([])

  useEffect(() => {
    setReports([])
  }, [patientId])

  useEffect(() => {
    if (reportsData === undefined) return

    if (reportsData.length === 0) {
      setReports((prev) => (prev.length === 0 ? prev : []))
      return
    }

    const next = mapReportsPayload(reportsData)
    setReports((prev) => {
      if (
        prev.length === next.length &&
        prev.every(
          (p, i) =>
            p._id === next[i]._id &&
            p.name === next[i].name &&
            p.date === next[i].date &&
            p.file === next[i].file
        )
      ) {
        return prev
      }
      return next
    })
  }, [reportsData])

  const isSaving =
    addEncounterReportMutation.isPending ||
    updateEncounterReportMutation.isPending ||
    deleteEncounterReportMutation.isPending

  if (isProfileError || (!isProfileLoading && !patientId)) {
    return (
      <div className="flex flex-col gap-2 px-4 md:px-6 py-8 items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight">Profile Error</h1>
        <p className="text-muted-foreground max-w-sm">
          We could not load your profile. Sign in again or contact support if this continues.
        </p>
      </div>
    )
  }

  return (
    <RoleGuard permission="medical_records_access" fallback="forbidden">
      <div className="flex w-full min-w-0 flex-col gap-6 px-4 md:px-6 py-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Medical Reports</h1>
          <p className="text-muted-foreground text-sm">
            View, upload, and download your medical reports.
          </p>
        </div>

        <div className={isSaving ? "pointer-events-none opacity-70 transition-opacity" : ""}>
          <ReportsTabPanel
            listConfig={{
              title: "Your medical reports",
              description:
                "Review documents in your record. Search by name or file, sort columns, and use the actions to preview, edit, or delete a report.",
              showToolbar: true,
              searchPlaceholder: "Search reports by name or file...",
              pageSize: 10,
            }}
            reports={reports}
            setReports={setReports}
            readOnly={!can("medical_report_add")}
            onAddReport={can("medical_report_add") && patientId ? async (data) => {
              await addEncounterReportMutation.mutateAsync({
                patientId,
                data,
              })
            } : undefined}
            onUpdateReport={can("medical_report_edit") && patientId ? async (reportId, data) => {
              await updateEncounterReportMutation.mutateAsync({
                patientId,
                reportId,
                data,
              })
            } : undefined}
            onDeleteReport={can("medical_report_delete") && patientId ? async (_index, reportId) => {
              if (reportId) {
                await deleteEncounterReportMutation.mutateAsync({
                  encounterId: patientId,
                  reportId,
                })
              }
            } : undefined}
          />
        </div>
      </div>
    </RoleGuard>
  )
}
