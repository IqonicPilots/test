"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { format } from "date-fns"
import { Loader2, Pencil, Plus, Upload, X, Trash, Trash2 } from "lucide-react"
import { ReportCardDataTable, type ReportItemRow } from "@/components/encounter-clinical/report-card-data-table"
import { DobDatePicker } from "@/components/common/DobDatePicker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useEncounterReports,
  useAddEncounterReport,
  useUpdateEncounterReport,
  useDeleteEncounterReport,
} from "@/hooks/api/use-encounters"
import type { Patient } from "@/types/user.types"
import { Skeleton } from "@/components/ui/skeleton"

interface PatientReportsDialogProps {
  patient: Patient
  trigger?: React.ReactNode
}

export function PatientReportsDialog({ patient, trigger }: PatientReportsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportFormOpen, setReportFormOpen] = useState(false)
  const reportFileInputRef = useRef<HTMLInputElement | null>(null)
  const { data: reports, isLoading } = useEncounterReports(patient._id, isOpen)

  const [name, setName] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [existingFileName, setExistingFileName] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState<string | null>(null)

  const reportsList = useMemo((): ReportItemRow[] => {
    if (!Array.isArray(reports)) return []
    return reports as ReportItemRow[]
  }, [reports])

  const addReportMutation = useAddEncounterReport()
  const updateReportMutation = useUpdateEncounterReport()
  const deleteReportMutation = useDeleteEncounterReport()

  const clearForm = useCallback(() => {
    setName("")
    setDate(null)
    setFile(null)
    setExistingFileName("")
    setEditingIndex(null)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      clearForm()
      setReportFormOpen(false)
    }
  }, [isOpen, clearForm])

  const handleSubmitAddReport = useCallback(async () => {
    if (!name.trim() || !date || (!file && !existingFileName)) return
    const dateStr = format(date, "yyyy-MM-dd")
    if (editingIndex !== null) {
      const r = reportsList[editingIndex]
      if (!r?._id) return
      await updateReportMutation.mutateAsync({
        patientId: patient._id,
        reportId: r._id,
        data: {
          name: name.trim(),
          date: dateStr,
          file: file ?? undefined,
        },
      })
    } else {
      if (!file) return
      await addReportMutation.mutateAsync({
        patientId: patient._id,
        data: {
          name: name.trim(),
          date: dateStr,
          file,
        },
      })
    }
    clearForm()
    setReportFormOpen(false)
  }, [
    addReportMutation,
    clearForm,
    date,
    editingIndex,
    existingFileName,
    file,
    name,
    patient._id,
    reportsList,
    updateReportMutation,
  ])

  const handleEditRow = useCallback(
    (index: number) => {
      const r = reportsList[index]
      if (!r) return
      setName(r.name ?? "")
      setDate(r.date ? new Date(r.date) : null)
      setFile(null)
      setExistingFileName(typeof r.file === "string" ? r.file : (r.file as File | undefined)?.name ?? "")
      setEditingIndex(index)
      setReportFormOpen(true)
    },
    [reportsList]
  )

  const handleRemoveRow = useCallback(
    async (index: number, reportId?: string) => {
      const id = reportId ?? reportsList[index]?._id
      if (!id) return
      await deleteReportMutation.mutateAsync({
        encounterId: patient._id,
        reportId: id,
      })
      if (editingIndex === index) {
        clearForm()
        setReportFormOpen(false)
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex((e) => (e != null ? e - 1 : e))
      }
    },
    [clearForm, deleteReportMutation, editingIndex, patient._id, reportsList]
  )

  const openRowPreview = useCallback((r: ReportItemRow) => {
    if (!r.file) return
    let fileUrl: string
    if (r.file instanceof File) {
      fileUrl = URL.createObjectURL(r.file)
    } else {
      fileUrl = r.file
    }
    setPreviewFile(fileUrl)
    if (r.file instanceof File ? r.file.type.match(/^image\//) : r.file.match(/\.(jpg|jpeg|png|gif)$/i)) {
      setPreviewType("image")
    } else if (r.file instanceof File ? r.file.type === "application/pdf" : r.file.match(/\.pdf$/i)) {
      setPreviewType("pdf")
    } else {
      setPreviewType("other")
    }
    setPreviewOpen(true)
  }, [])

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <span
        onClick={() => setIsOpen(true)}
        style={{ display: "contents" }}
      >
        {trigger}
      </span>
      <DialogContent className="flex w-[100vw] max-w-[1000px] min-h-[600px] max-h-[90vh] gap-2 flex-col overflow-hidden sm:max-w-4xl p-0">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="text-xl font-bold">Patient Reports</DialogTitle>
        </DialogHeader>

        <div className="bg-accent/20 p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Patient Name</p>
              <p className="text-sm font-bold text-foreground text-center">{patient.firstName} {patient.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Contact</p>
              <p className="text-sm font-bold text-foreground text-center">{patient.countryCode} {patient.mobile || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Email</p>
              <p className="text-sm font-bold text-foreground truncate text-center">{patient.email || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px]  font-bold uppercase tracking-wider text-muted-foreground text-center">Gender</p>
              <p className="text-sm font-bold text-foreground text-center">{patient.meta?.gender || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center space-y-4 p-6 text-muted-foreground">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <div className="overflow-y-auto">
              <Card className="w-full min-w-0 rounded-none border-none bg-accent/20">
                <CardContent>
                  <ReportCardDataTable
                    reports={reportsList}
                    readOnly={false}
                    pageSize={10}
                    searchPlaceholder="Search reports by name or file..."
                    emptyMessage="No medical records"
                    filterEmptyMessage="No reports match your search."
                    onPreviewRow={openRowPreview}
                    onEditRow={handleEditRow}
                    onRemoveRow={handleRemoveRow}
                    onAddReport={() => {
                      clearForm()
                      setReportFormOpen(true)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <Dialog
      open={reportFormOpen}
      onOpenChange={(open) => {
        setReportFormOpen(open)
        if (!open) clearForm()
      }}
    >
      <DialogContent
        className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Upload className="size-4 text-primary" />
            {editingIndex !== null ? "Update Report" : "Add Report"}
          </DialogTitle>
          <DialogDescription>
            {editingIndex !== null
              ? "Update the report details or replace the file."
              : "Enter report name, date, and upload a file to add to the medical records."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              Report Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Annual Health Checkup"
              className="text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              Date <span className="text-destructive">*</span>
            </Label>
            <DobDatePicker
              value={date}
              placeholder="Select date"
              className="text-sm"
              onChange={setDate}
              role="doctor"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              File Upload <span className="text-destructive">*</span>
            </Label>
            <div className="flex w-full min-w-0 items-center gap-2">
              {file ? (
                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                  <span
                    className="block flex-1 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive"
                    onClick={() => {
                      setFile(null)
                      if (reportFileInputRef.current) reportFileInputRef.current.value = ""
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : existingFileName ? (
                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm">
                  <span
                    className="block flex-1 truncate overflow-hidden text-ellipsis whitespace-nowrap"
                    title={existingFileName.split("/").pop() || existingFileName}
                  >
                    {existingFileName.split("/").pop() || existingFileName}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 cursor-pointer gap-1.5"
                    onClick={() => {
                      setFile(null)
                      setExistingFileName("")
                    }}
                  >
                    <Upload className="size-4" />
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="relative cursor-pointer overflow-hidden"
                    asChild
                  >
                    <label className="flex cursor-pointer items-center gap-1">
                      <Upload className="h-4 w-4" />
                      <span>Upload File</span>
                      <input
                        ref={reportFileInputRef}
                        name="patient-report-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] || null
                          setFile(selected)
                        }}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer gap-1.5"
            onClick={() => {
              clearForm()
              setReportFormOpen(false)
            }}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="cursor-pointer gap-1.5"
            disabled={!name.trim() || !date || (!file && !existingFileName) || addReportMutation.isPending}
            onClick={handleSubmitAddReport}
          >
            {editingIndex !== null ? (
              <>
                <Pencil className="size-3.5" />
                Update Report
              </>
            ) : (
              <>
                {addReportMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Add Report</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    <span>Add Report</span>
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
        </DialogHeader>
        {previewFile && (
          <>
            {previewType === "image" ? (
              <img
                src={previewFile}
                alt="Report preview"
                className="w-full rounded-lg"
              />
            ) : previewType === "pdf" ? (
              <iframe src={previewFile} className="h-[500px] w-full" title="Report PDF" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Preview not available. Open the file in a new tab if linked.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
