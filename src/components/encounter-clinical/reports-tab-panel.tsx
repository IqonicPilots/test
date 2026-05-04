"use client"

import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ReportCard, type ReportCardListConfig, type ReportItem } from "./encounter-clinical"

export type ReportPersistPayload = {
  name: string
  date: string
  file: string | File
}

function isPersistableFile(file: unknown): file is string | File {
  if (typeof file === "string" && file.length > 0) return true
  return typeof File !== "undefined" && file instanceof File
}

/**
 * Same layout as the encounter "Upload Reports" tab: {@link ReportCard} plus optional Send Email.
 * New rows use `onAddReport`; edits to existing rows are persisted via `onUpdateReport` inside {@link ReportCard}.
 */
export function ReportsTabPanel({
  reports,
  setReports,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  onEmailReport,
  readOnly = false,
  listConfig,
}: {
  reports: ReportItem[]
  setReports: (v: ReportItem[]) => void
  onAddReport?: (data: ReportPersistPayload) => Promise<void>
  onUpdateReport?: (reportId: string, data: ReportPersistPayload) => Promise<void>
  onDeleteReport?: (index: number, reportId?: string) => Promise<void>
  onEmailReport?: () => void | Promise<void>
  readOnly?: boolean
  listConfig?: ReportCardListConfig
}) {
  const handleReportsChange = (newVal: ReportItem[]) => {
    const prevLen = reports.length
    setReports(newVal)

    if (onAddReport && newVal.length > prevLen) {
      const added = newVal[newVal.length - 1]
      const f = added.file
      if (added.name && added.date && isPersistableFile(f)) {
        void onAddReport({
          name: added.name,
          date: added.date,
          file: f,
        })
      }
    }
  }

  const handleDeleteReport = async (index: number, reportId?: string) => {
    if (onDeleteReport) {
      await onDeleteReport(index, reportId)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ReportCard
        reports={reports}
        onReportsChange={handleReportsChange}
        onDeleteReport={handleDeleteReport}
        onUpdateReport={onUpdateReport}
        readOnly={readOnly}
        listConfig={listConfig}
      />
      {!readOnly && onEmailReport ? (
        <Button
          type="button"
          onClick={() => void onEmailReport()}
          className="self-end px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium gap-1.5 flex items-center cursor-pointer"
        >
          <Send className="size-3.5" />
          Send Email
        </Button>
      ) : null}
    </div>
  )
}
