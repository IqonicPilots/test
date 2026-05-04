"use client"

import { useCallback, useState, useMemo } from "react"
import {
  ClipboardList,
  Archive,
  SquarePen,
  Pill,
  CirclePlus,
  Pencil,
  Trash2,
  Plus,
  X,
  Upload,
  Eye,
  Trash,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TagsInput } from "@/components/common/tags-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DobDatePicker } from "../common/DobDatePicker"
import { format } from "date-fns/format"
import { cn } from "@/lib/utils"
import { ReportCardDataTable } from "./report-card-data-table"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProblemsCardProps {
  value: string[]
  onChange: (value: string[]) => void
  options?: string[]
  optionsWithIds?: { value: string; label: string }[]
  /** Called when user adds a new problem not in options. Return the value to add (label or id). */
  onCreateNew?: (label: string) => Promise<string | void>
  /** Called when user edits an item. identifier is id (if useIdMode) or label; isId=true when identifier is id. */
  onUpdateListing?: (identifier: string, newLabel: string, isId?: boolean) => Promise<void>
  emptyMessage?: string
  className?: string
  /** When true, hides Quick Add, edit, and delete buttons (read-only mode for closed encounters) */
  readOnly?: boolean
}

export interface ObservationsCardProps {
  value: string[]
  onChange: (value: string[]) => void
  options?: string[]
  optionsWithIds?: { value: string; label: string }[]
  /** Called when user adds a new observation not in options. Return the value to add (label or id). */
  onCreateNew?: (label: string) => Promise<string | void>
  /** Called when user edits an item. identifier is id (if useIdMode) or label; isId=true when identifier is id. */
  onUpdateListing?: (identifier: string, newLabel: string, isId?: boolean) => Promise<void>
  emptyMessage?: string
  className?: string
  /** When true, hides Quick Add, edit, and delete buttons (read-only mode for closed encounters) */
  readOnly?: boolean
}

export interface NotesCardProps {
  note: string
  onNoteChange: (value: string) => void
  onAdd: (note: string) => void
  notes?: any[]
  onNotesChange?: (notes: any[]) => void
  onUpdateNote?: (index: number, newNote: string) => Promise<void>
  notesCount?: number
  emptyMessage?: string
  className?: string
  /** When true, hides Add button and delete buttons (read-only mode for closed encounters) */
  readOnly?: boolean
}

export interface PrescriptionItem {
  _id?: string
  id?: string
  medicine?: string
  /** Schedule (e.g. 1-1-1); stored as `frequency` in API. */
  frequency?: string
  duration?: string
  instruction?: string
}

export interface PrescriptionCardProps {
  prescriptions: PrescriptionItem[]
  onPrescriptionsChange: (value: PrescriptionItem[]) => void
  onDeletePrescription?: (index: number, prescriptionId?: string) => Promise<void>
  /**
   * When editing a row that already exists on the server (`_id`), persists changes to the encounter
   * only — never writes to the encounter template.
   */
  onUpdatePrescription?: (args: {
    prescriptionId: string
    data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
  }) => Promise<void>
  medicineOptions?: { value: string; label: string }[]
  emptyMessage?: string
  className?: string
  /** When true, hides Add Prescription form and edit/delete buttons (read-only mode for closed encounters) */
  readOnly?: boolean
  onCreateNewMedicine?: (value: string) => Promise<string | void>
}

export interface ReportItem {
  name?: string
  date?: string
  file?: File | string
  _id?: string
}

/** Optional richer list UI (billing-style toolbar + sortable table + pagination) — Medical Reports page. */
export interface ReportCardListConfig {
  /** List section title (default: "Reports List") */
  title?: string
  /** Subtitle under the title */
  description?: string
  /** Use search + reset + View toolbar, sortable headers, and paginated table (requires pageSize) */
  showToolbar?: boolean
  searchPlaceholder?: string
  /** Page size for client-side pagination (required when showToolbar is true) */
  pageSize?: number
}

export interface ReportCardProps {
  reports: ReportItem[]
  onReportsChange: (value: ReportItem[]) => void
  emptyMessage?: string
  className?: string
  onDeleteReport?: (index: number, reportId?: string) => Promise<void>
  /**
   * When editing a row that already exists on the server, persists to the patient report record
   * (add/update report APIs) — does not change encounter templates.
   */
  onUpdateReport?: (reportId: string, data: { name: string; date: string; file: string | File }) => Promise<void>
  /** When true, hides Add Report form and delete buttons (read-only mode for closed encounters) */
  readOnly?: boolean
  listConfig?: ReportCardListConfig
}


export function formatFrequencyString(f?: string): string {
  if (!f) return "—"
  if (f === "As needed" || f.toLowerCase() === "sos") return f

  // Compatibility for legacy named frequencies
  if (f === "once") return "1-0-0"
  if (f === "twice") return "1-0-1"
  if (f === "thrice") return "1-1-1"

  // If it's a numeric dash-separated string or a single number (0 or 1)
  if (f.includes("-") || f === "1" || f === "0") {
    const parts = f.split("-")
    // Map M-A-E-N to M-A-N
    if (parts.length === 4) {
      return `${parts[0] === "1" ? "1" : "0"}-${parts[1] === "1" ? "1" : "0"}-${parts[3] === "1" ? "1" : "0"}`
    }
    const full = [0, 1, 2].map((i) => (parts[i] === "1" ? "1" : "0"))
    return full.join("-")
  }

  return f
}


// ─── ProblemsCard ─────────────────────────────────────────────────────────────
export function ProblemsCard({
  value,
  onChange,
  options = [],
  optionsWithIds,
  onCreateNew,
  onUpdateListing,
  emptyMessage = "No record found",
  className,
  readOnly = false,
}: ProblemsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const useIdMode = !!optionsWithIds && optionsWithIds.length > 0
  const displayLabels = useIdMode
    ? value.map((id) => optionsWithIds!.find((o) => o.value === id)?.label ?? id)
    : value
  const tagsOptions = useIdMode ? optionsWithIds!.map((o) => o.label) : options

  const handleTagsChange = (newTags: string[]) => {
    if (useIdMode && optionsWithIds) {
      const ids = newTags.map((tag) => {
        const opt = optionsWithIds.find((o) => o.label === tag)
        return opt ? opt.value : tag
      })
      onChange(ids)
    } else {
      onChange(newTags)
    }
  }

  return (
    <>
      <Card className={`flex h-[42vh] min-w-0 w-full flex-col ${className ?? ""}`}>
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              Problems
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-1 text-xs cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                <CirclePlus className="size-3.5" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden gap-2 pt-0">
          <div className="flex-1 overflow-y-auto">
            {value.length === 0 ? (
              <p className="text-xs text-center text-destructive py-4">
                {emptyMessage}
              </p>
            ) : (
              (useIdMode ? displayLabels : value).map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {i + 1}.{" "}
                    {!readOnly && editingIndex === i ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={async () => {
                          const val = editingValue.trim()
                          if (val) {
                            if (useIdMode) {
                              await onUpdateListing?.(value[i], val, true)
                            } else {
                              const next = [...value]
                              next[i] = val
                              onChange(next)
                              await onUpdateListing?.(p, val, false)
                            }
                          }
                          setEditingIndex(null)
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const val = editingValue.trim()
                            if (val) {
                              if (useIdMode) {
                                await onUpdateListing?.(value[i], val, true)
                              } else {
                                const next = [...value]
                                next[i] = val
                                onChange(next)
                                await onUpdateListing?.(p, val, false)
                              }
                            }
                            setEditingIndex(null)
                          }
                          if (e.key === "Escape") setEditingIndex(null)
                        }}
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium truncate">{p}</span>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                    {editingIndex !== i && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingIndex(i)
                              setEditingValue(p)
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onChange(value.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-3.5" />
                      </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>  
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Problems</DialogTitle>
              <DialogDescription className="sr-only">
                Add or create problem tags for this encounter.
              </DialogDescription>
            </DialogHeader>
            <>
              <p className="text-[11px] text-blue-500 dark:text-amber-500 italic">
                Note: Type and press enter to add new problem
              </p>
              <TagsInput
                options={tagsOptions}
                modelValue={useIdMode ? displayLabels : value}
                onUpdateModelValue={handleTagsChange}
                onCreateNew={onCreateNew}
                placeholder="Type or select problem..."
                closeOnSelect={false}
              />
            </>
            {/* )} */}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ─── ObservationsCard ────────────────────────────────────────────────────────

export function ObservationsCard({
  value,
  onChange,
  options = [],
  optionsWithIds,
  onCreateNew,
  onUpdateListing,
  emptyMessage = "No record found",
  className,
  readOnly = false,
}: ObservationsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const useIdMode = !!optionsWithIds && optionsWithIds.length > 0
  const displayLabels = useIdMode
    ? value.map((id) => optionsWithIds!.find((o) => o.value === id)?.label ?? id)
    : value
  const tagsOptions = useIdMode ? optionsWithIds!.map((o) => o.label) : options

  const handleTagsChange = (newTags: string[]) => {
    if (useIdMode && optionsWithIds) {
      const ids = newTags.map((tag) => {
        const opt = optionsWithIds.find((o) => o.label === tag)
        return opt ? opt.value : tag
      })
      onChange(ids)
    } else {
      onChange(newTags)
    }
  }

  return (
    <>
      <Card className={`flex h-[42vh] min-w-0 w-full flex-col ${className ?? ""}`}>
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Archive className="size-4 text-primary" />
              Observations
            </CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-1 text-xs cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                <CirclePlus className="size-3.5" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 overflow-hidden gap-2 pt-0">
          <div className="flex-1 overflow-y-auto">
            {value.length === 0 ? (
              <p className="text-xs text-center text-destructive py-4">
                {emptyMessage}
              </p>
            ) : (
              (useIdMode ? displayLabels : value).map((o, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {i + 1}.{" "}
                    {!readOnly && editingIndex === i ? (
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={async () => {
                          const val = editingValue.trim()
                          if (val) {
                            if (useIdMode) {
                              await onUpdateListing?.(value[i], val, true)
                            } else {
                              const next = [...value]
                              next[i] = val
                              onChange(next)
                              await onUpdateListing?.(o, val, false)
                            }
                          }
                          setEditingIndex(null)
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            const val = editingValue.trim()
                            if (val) {
                              if (useIdMode) {
                                await onUpdateListing?.(value[i], val, true)
                              } else {
                                const next = [...value]
                                next[i] = val
                                onChange(next)
                                await onUpdateListing?.(o, val, false)
                              }
                            }
                            setEditingIndex(null)
                          }
                          if (e.key === "Escape") setEditingIndex(null)
                        }}
                        className="h-8 text-sm flex-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium truncate">{o}</span>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      {editingIndex !== i && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingIndex(i)
                                setEditingValue(o)
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onChange(value.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="size-3.5" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Observations</DialogTitle>
            <DialogDescription className="sr-only">
              Add or create observation tags for this encounter.
            </DialogDescription>
          </DialogHeader>
            <>
              <p className="text-[11px] text-blue-500 dark:text-amber-500 italic">
                Note: Type and press enter to add new observation
              </p>
              <TagsInput
                options={tagsOptions}
                modelValue={useIdMode ? displayLabels : value}
                onUpdateModelValue={handleTagsChange}
                onCreateNew={onCreateNew}
                placeholder="Type or select observation..."
                closeOnSelect={false}
              />
            </>
            {/* )} */}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ─── NotesCard ───────────────────────────────────────────────────────────────
export function NotesCard({
  note,
  onNoteChange,
  onAdd,
  notes = [],
  notesCount,
  emptyMessage = "No record found",
  className,
  readOnly = false,
  onNotesChange,
  onUpdateNote,
}: NotesCardProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const displayNotes = (notes || []).map((n) => (typeof n === "string" ? n : n?.note ?? ""))
  const count = notesCount ?? displayNotes.length

  return (
    <Card className={`min-w-0 w-full ${className ?? ""}`}>
      <CardHeader className="">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <SquarePen className="size-4 text-primary" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-2">
        {!readOnly && (
          <>
            <Textarea
              placeholder="Enter note"
              className="min-h-[100px] min-w-0 w-full text-sm resize-none"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
            <Button
              size="sm"
              className="self-end cursor-pointer"
              disabled={!note.trim()}
              onClick={() => {
                onAdd(note.trim())
                onNoteChange("")
              }}
            >
              Add
            </Button>
          </>
        )}
        {displayNotes.length === 0 ? (
          <p className="text-xs text-center text-destructive py-1">
            {emptyMessage}
          </p>
        ) : (
          <div className="flex flex-col gap-2 ">
            {displayNotes.map((n, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 py-3 border-b last:border-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium break-words">
                      {i + 1}.{" "}
                      {!readOnly && editingIndex === i ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <Textarea
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="min-h-[80px] min-w-0 w-full text-sm resize-none"
                            autoFocus
                          />
                          <div className="flex items-center gap-2 self-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingIndex(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={async () => {
                                const val = editingValue.trim()
                                if (val && val !== n) {
                                  await onUpdateNote?.(i, val)
                                }
                                setEditingIndex(null)
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        n
                      )}
                    </span>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      {editingIndex !== i && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingIndex(i)
                                setEditingValue(n)
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onNotesChange?.(notes!.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── PrescriptionCard ────────────────────────────────────────────────────────
export function PrescriptionCard({
  prescriptions,
  onPrescriptionsChange,
  onDeletePrescription,
  onUpdatePrescription,
  medicineOptions = [],
  emptyMessage = "No prescriptions added",
  className,
  readOnly = false,
  onCreateNewMedicine,
}: PrescriptionCardProps) {
  const [medicine, setMedicine] = useState("")
  const [freqM, setFreqM] = useState(false)
  const [freqN, setFreqN] = useState(false)
  const [freqNight, setFreqNight] = useState(false)
  const [isSOS, setIsSOS] = useState(false)
  const [frequency, setFrequency] = useState("")
  const [durationValue, setDurationValue] = useState("")
  const [durationUnit, setDurationUnit] = useState("days")
  const [instructions, setInstructions] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const medicineLabel = useMemo(() => {
    const opt = medicineOptions.find((m) => m.value === medicine)
    return opt ? opt.label : medicine
  }, [medicine, medicineOptions])

  const handleMedicineChange = (val: string) => {
    const opt = medicineOptions.find((m) => m.label === val)
    setMedicine(opt ? opt.value : val)
  }

  const clearForm = () => {
    setMedicine("")
    setFrequency("")
    setFreqM(false)
    setFreqN(false)
    setFreqNight(false)
    setIsSOS(false)
    setDurationValue("")
    setDurationUnit("days")
    setInstructions("")
    setEditingIndex(null)
  }

  const resolveMedicineId = () => {
    const t = medicine.trim()
    if (!t) return ""
    return medicineOptions.find((m) => m.label === t || m.value === t)?.value ?? t
  }

  const handleAdd = async () => {
    const isFrequencyValid = isSOS || [freqM, freqN, freqNight].some(Boolean)
    if (!medicine.trim() || (!isSOS && !durationValue.trim()) || !isFrequencyValid) return

    // Compute frequency string (API field name)
    let finalFreq = frequency
    if (isSOS) {
      finalFreq = "As needed"
    } else {
      const slots = [freqM, freqN, freqNight]
      if (slots.some((s) => s)) {
        finalFreq = slots
          .map((s) => (s ? "1" : "0"))
          .join("-")
      }
    }

    let unit = durationUnit
    if (durationValue === "1") {
      unit = durationUnit.endsWith("s") ? durationUnit.slice(0, -1) : durationUnit
    }
    // Capitalize unit
    const capitalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1)
    
    const durationStr = durationValue ? `${durationValue} ${capitalizedUnit}` : ""
    const medicineId = resolveMedicineId()

    const newItem: PrescriptionItem = {
      medicine: medicineId,
      frequency: finalFreq || undefined,
      duration: durationStr || undefined,
      instruction: instructions || undefined,
    }

    if (editingIndex !== null) {
      const originalItem = prescriptions[editingIndex]
      const serverPrescriptionId = originalItem?._id || originalItem?.id
      if (serverPrescriptionId && onUpdatePrescription) {
        setSaving(true)
        try {
          await onUpdatePrescription({
            prescriptionId: serverPrescriptionId,
            data: {
              name: medicineId,
              frequency: newItem.frequency ?? "",
              duration: newItem.duration ?? "",
              instruction: newItem.instruction ?? "",
              dosage: "",
            },
          })
        } catch {
          return
        } finally {
          setSaving(false)
        }
      }
      if (originalItem?._id) newItem._id = originalItem._id
      if (originalItem?.id) newItem.id = originalItem.id

      const next = [...prescriptions]
      next[editingIndex] = newItem
      onPrescriptionsChange(next)
      clearForm()
    } else {
      onPrescriptionsChange([...prescriptions, newItem])
      clearForm()
    }
  }

  const getMedicineDisplayValue = (p: PrescriptionItem) => {
    if (!p.medicine) return ""
    const opt = medicineOptions.find((m) => m.value === p.medicine)
    return opt?.label ?? p.medicine ?? ""
  }

  const handleEdit = (index: number) => {
    const p = prescriptions[index]
    setMedicine(p.medicine ?? "")

    const fStr = p.frequency ?? ""
    setFrequency(fStr)
    setFreqM(false)
    setFreqN(false)
    setFreqNight(false)
    setIsSOS(false)

    if (fStr === "As needed" || fStr === "sos") {
      setIsSOS(true)
    } else if (fStr.includes("-") || fStr === "1" || fStr === "0") {
      const parts = fStr.split("-")
      if (parts[0] === "1") setFreqM(true)
      if (parts[1] === "1") setFreqN(true)
      if (parts.length === 3) {
        if (parts[2] === "1") setFreqNight(true)
      } else if (parts.length === 4) {
        if (parts[3] === "1") setFreqNight(true)
      }
    } else {
      // Compatibility for "once", "twice", "thrice"
      if (fStr === "once") setFreqM(true)
      if (fStr === "twice") {
        setFreqM(true)
        setFreqNight(true)
      }
      if (fStr === "thrice") {
        setFreqM(true)
        setFreqN(true)
        setFreqNight(true)
      }
    }

    // Parse duration (save path uses "5 Days" / "1 Month" with capitalized units; API may use other casing)
    const dStr = p.duration ?? ""
    if (dStr) {
      const parts = dStr.trim().split(/\s+/)
      const unitLower = parts[1]?.toLowerCase() ?? ""
      if (parts.length >= 2 && (unitLower === "days" || unitLower === "day" || unitLower === "months" || unitLower === "month")) {
        setDurationValue(parts[0])
        setDurationUnit(unitLower === "month" || unitLower === "months" ? "months" : "days")
      } else if (/month/i.test(dStr)) {
        setDurationValue(dStr.replace(/months?/gi, "").trim())
        setDurationUnit("months")
      } else if (/day/i.test(dStr)) {
        setDurationValue(dStr.replace(/days?/gi, "").trim())
        setDurationUnit("days")
      } else {
        const n = dStr.replace(/\D.*/g, "").trim() || dStr.replace(/[^\d.]/g, "")
        setDurationValue(n)
        setDurationUnit("days")
      }
    } else {
      setDurationValue("")
      setDurationUnit("days")
    }

    setInstructions(p.instruction ?? "")
    setEditingIndex(index)
  }

  const handleRemove = async (index: number) => {
    const item = prescriptions[index]
    const prescriptionId = item?._id || item?.id

    if (onDeletePrescription && prescriptionId) {
      await onDeletePrescription(index, prescriptionId)
    } else {
      onPrescriptionsChange(prescriptions.filter((_, i) => i !== index))
    }

    if (editingIndex === index) clearForm()
    else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }

  const getMedicineLabel = (p: PrescriptionItem) => {
    if (!p.medicine) return "—"
    if (
      typeof p.medicine === "object" &&
      p.medicine !== null &&
      "label" in (p.medicine as object)
    ) {
      return (p.medicine as { label?: string }).label ?? "—"
    }
    const opt = medicineOptions.find((m) => m.value === p.medicine)
    return opt?.label ?? p.medicine ?? "—"
  }

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      {!readOnly && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
              <Pill className="size-4 text-primary" />
              Add Prescription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Medicine Name <span className="text-destructive">*</span>
                </Label>
                <TagsInput
                  options={medicineOptions.map(m => m.label)}
                  placeholder="e.g. Amoxicillin, Paracetamol"
                  singleMode
                  singleValue={medicineLabel}
                  onUpdateSingleValue={handleMedicineChange}
                  onCreateNew={onCreateNewMedicine}
                />
                <p className="text-xs text-blue-500 dark:text-amber-500">
                  Note: Type and press enter to add new medicine
                </p>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <Label className="text-xs">
                  Dosage <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 text-xs font-normal"
                    >
                      <span className="truncate">
                        {isSOS
                          ? "As needed"
                          : [freqM, freqN, freqNight].some(Boolean)
                            ? [
                                freqM && "Morning",
                                freqN && "Afternoon",
                                freqNight && "Night",
                              ]
                                .filter(Boolean)
                                .join("-")
                            : "Select Dosage"}
                      </span>
                      <ChevronDown className="size-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Morning", state: freqM, setter: setFreqM },
                            { label: "Afternoon", state: freqN, setter: setFreqN },
                            { label: "Night", state: freqNight, setter: setFreqNight },
                            { label: "As needed", state: isSOS, setter: (val: boolean) => {
                              setIsSOS(val)
                              if (val) {
                                setFreqM(false)
                                setFreqN(false)
                                setFreqNight(false)
                              }
                            }},
                          ].map((slot, i) => (
                            <Button
                              key={i}
                              type="button"
                              variant={slot.state ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-8 px-2 text-[11px] font-medium justify-start",
                                slot.state ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                              )}
                              onClick={() => {
                                slot.setter(!slot.state)
                                if (slot.label !== "As needed") setIsSOS(false)
                              }}
                            >
                              <div className={cn(
                                "size-1.5 rounded-full mr-2",
                                slot.state ? "bg-primary-foreground" : "bg-muted-foreground/30"
                              )} />
                              {slot.label === "As needed" ? (
                                <span className="flex items-center">
                                  {slot.label}
                                </span>
                              ) : slot.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">
                  Duration {!isSOS && <span className="text-destructive">*</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 7"
                    className="text-sm flex-1 w-[100px]"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                  />
                  <Select value={durationUnit} onValueChange={setDurationUnit}>
                    <SelectTrigger className="w-[100px] text-sm shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">{durationValue === "1" ? "Day" : "Days"}</SelectItem>
                      <SelectItem value="months">{durationValue === "1" ? "Month" : "Months"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="col-span-3 flex flex-col gap-1.5">  
                <Label className="text-xs">Instructions</Label>
                <Textarea
                  placeholder="e.g. Take after food"
                  className="text-sm"
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              {editingIndex !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={clearForm}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                disabled={
                  saving ||
                  !medicine.trim() ||
                  (!isSOS && !durationValue.trim()) ||
                  !(isSOS || [freqM, freqN, freqNight].some(Boolean))
                }
                onClick={() => {
                  void handleAdd()
                }}
              >
                {editingIndex !== null ? (
                  <>
                    <Pencil className="size-3.5" />
                    {saving ? "Saving…" : "Update Prescription"}
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Add Prescription
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Prescriptions List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-4 py-3 font-medium">Medicine</TableHead>
                  <TableHead className="text-left px-4 py-3 font-medium">Dosage</TableHead>
                  <TableHead className="text-left px-4 py-3 font-medium">Duration</TableHead>
                  <TableHead className="text-left px-4 py-3 font-medium min-w-[140px]">Instructions</TableHead>
                  {!readOnly && (
                    <TableHead className="text-left px-4 py-3 font-medium">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={readOnly ? 4 : 5}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {prescriptions.map((p, i) => (
                      <TableRow
                        key={i}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="px-4 py-3">{getMedicineLabel(p)}</TableCell>
                        <TableCell className="px-4 py-3">{formatFrequencyString(p.frequency)}</TableCell>
                        <TableCell className="px-4 py-3 capitalize">{p.duration ?? "—"}</TableCell>
                        <TableCell className="px-4 py-3 text-sm max-w-[240px] min-w-0 overflow-hidden">
                          <span
                            className="block min-w-0 truncate"
                            title={p.instruction?.trim() ? p.instruction : undefined}
                          >
                            {p.instruction?.trim() ? p.instruction : "—"}
                          </span>
                        </TableCell>
                        {!readOnly && (
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEdit(i)}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleRemove(i)}
                                  >
                                  <Trash2 className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── ReportCard ──────────────────────────────────────────────────────────────
function reportFileLabel(r: ReportItem): string {
  if (r.file instanceof File) return r.file.name
  return r.file ? r.file.split("/").pop()?.replace(/^\d+-/, "") || r.file : ""
}

function isPersistableReportFile(file: unknown): file is string | File {
  if (typeof file === "string" && file.length > 0) return true
  return typeof File !== "undefined" && file instanceof File
}

export function ReportCard({
  reports,
  onReportsChange,
  emptyMessage = "No reports added",
  className,
  onDeleteReport,
  onUpdateReport,
  readOnly = false,
  listConfig,
}: ReportCardProps) {
  const [name, setName] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [existingFileName, setExistingFileName] = useState<string>("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const clearForm = () => {
    setName("")
    setDate(null)
    setFile(null)
    setExistingFileName("")
    setEditingIndex(null)
  }

  const handleAdd = async () => {
    if (!name.trim() || !date || (!file && !existingFileName)) return
    const newItem: ReportItem = {
      name: name.trim(),
      date: format(date, "yyyy-MM-dd"),
      file: file || existingFileName, // Pass File object or existing URL
    }
    if (editingIndex !== null) {
      const original = reports[editingIndex]
      const filePayload = newItem.file
      const serverId = original?._id

      if (serverId && onUpdateReport && isPersistableReportFile(filePayload)) {
        setSaving(true)
        try {
          await onUpdateReport(serverId, {
            name: newItem.name!,
            date: newItem.date!,
            file: filePayload,
          })
        } catch {
          return
        } finally {
          setSaving(false)
        }
      }

      const next = [...reports]
      next[editingIndex] = {
        ...original,
        ...newItem,
        _id: serverId ?? original?._id,
      }
      onReportsChange(next)
      clearForm()
    } else {
      onReportsChange([...reports, newItem])
      clearForm()
    }
  }

  const handleEdit = (index: number) => {
    const r = reports[index]
    setName(r.name ?? "")
    setDate(r.date ? new Date(r.date) : null)
    setFile(null) // Reset file when editing
    setExistingFileName(typeof r.file === 'string' ? r.file : r.file?.name ?? "") // Store existing file name
    setEditingIndex(index)
  }

  const handleRemove = async (index: number, reportId?: string) => {
    if (onDeleteReport) {
      try {
        await onDeleteReport(index, reportId)
      } catch (error) {
        // Propagate so confirm UI can stay open; hook may also toast
        throw error
      }
    }
    onReportsChange(reports.filter((_, i) => i !== index))
    if (editingIndex === index) clearForm()
    else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewType, setPreviewType] = useState<string | null>(null)

  const openRowPreview = useCallback((r: ReportItem) => {
    if (!r.file) return
    let fileUrl: string
    if (r.file instanceof File) {
      fileUrl = URL.createObjectURL(r.file)
    } else {
      fileUrl = r.file
    }
    setPreviewFile(fileUrl)
    if (
      r.file instanceof File
        ? r.file.type.match(/^image\//)
        : r.file.match(/\.(jpg|jpeg|png|gif)$/i)
    ) {
      setPreviewType("image")
    } else if (
      r.file instanceof File
        ? r.file.type === "application/pdf"
        : r.file.match(/\.pdf$/i)
    ) {
      setPreviewType("pdf")
    } else {
      setPreviewType("other")
    }
    setPreviewOpen(true)
  }, [])

  const formatDate = (dateStr?: string) => {
    const parsedDate = new Date(String(dateStr))
    if (Number.isNaN(parsedDate.getTime())) return ""
    return parsedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const listTitle = listConfig?.title ?? "Reports List"
  const listDescription = listConfig?.description
  const billingList =
    Boolean(listConfig?.showToolbar) &&
    typeof listConfig?.pageSize === "number" &&
    listConfig.pageSize > 0

  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      {!readOnly && (
        <Card>
          <CardHeader className="px-4 pb-2 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="size-4 shrink-0 text-primary" />
              Add Report
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-1.5">
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
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label className="text-xs">
                  Date <span className="text-destructive">*</span>
                </Label>
                <DobDatePicker
                  value={date}
                  placeholder="Select date"
                  className="text-sm"
                  onChange={(selectedDate) => setDate(selectedDate)}
                  role="doctor"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2 xl:col-span-1">
                <Label className="text-xs">
                  File Upload <span className="text-destructive">*</span>
                </Label>
                <div className="flex w-full min-w-0 items-center gap-2">
                  {file ? (
                    <div className="flex items-center gap-2 flex-1 border rounded-md px-3 text-sm bg-muted/40 min-w-0 h-9">
                      <span className="flex-1 truncate block overflow-hidden text-ellipsis whitespace-nowrap" title={file.name}>
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive shrink-0"
                        onClick={() => {
                          setFile(null)
                          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                          if (fileInput) fileInput.value = ''
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  ) : existingFileName ? (
                    <div className="flex items-center gap-2 flex-1 border rounded-md px-3 text-sm bg-muted/40 min-w-0 h-9">
                      <span
                        className="flex-1 truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={existingFileName.split('/').pop() || existingFileName}
                      >
                        {existingFileName.split('/').pop() || existingFileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 cursor-pointer shrink-0"
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
                        className="cursor-pointer relative overflow-hidden"
                      >
                        <label className="flex items-center gap-1 cursor-pointer">
                          <Upload className="h-4 w-4" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const selectedFile = e.target.files?.[0] || null
                              setFile(selectedFile)
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
            <div className="flex justify-end gap-2 mt-4">
              {editingIndex !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 cursor-pointer"
                  onClick={clearForm}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                disabled={
                  saving ||
                  !name.trim() ||
                  !date ||
                  (!file && !existingFileName)
                }
                onClick={() => {
                  void handleAdd()
                }}
              >
                {editingIndex !== null ? (
                  <>
                    <Pencil className="size-3.5" />
                    {saving ? "Saving…" : "Update Report"}
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    Add Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full min-w-0">
        <CardHeader className="space-y-1 px-4 pb-2 sm:px-6">
          <CardTitle className="text-base font-semibold tracking-tight">
            {listTitle}
          </CardTitle>
          {listDescription ? (
            <CardDescription className="text-sm break-words text-pretty text-muted-foreground">
              {listDescription}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          {billingList ? (
            <ReportCardDataTable
              reports={reports}
              readOnly={readOnly}
              pageSize={listConfig!.pageSize!}
              searchPlaceholder={
                listConfig?.searchPlaceholder ?? "Search reports by name or file..."
              }
              emptyMessage={emptyMessage}
              filterEmptyMessage="No reports match your search."
              onPreviewRow={openRowPreview}
              onEditRow={handleEdit}
              onRemoveRow={handleRemove}
            />
          ) : (
            <>
              <div className="rounded-md border overflow-hidden w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left px-4 py-3 font-medium">Name</TableHead>
                      <TableHead className="text-left px-4 py-3 font-medium">Date</TableHead>
                      <TableHead className="text-left px-4 py-3 font-medium">File</TableHead>
                      <TableHead className="text-left px-4 py-3 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground text-sm"
                        >
                          {emptyMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map((r, i) => (
                        <TableRow
                          key={r._id ?? `${i}-${reportFileLabel(r)}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="px-4 py-3 text-sm max-w-[200px] min-w-0 overflow-hidden">
                            <span
                              className="block min-w-0 truncate"
                              title={r.name || undefined}
                            >
                              {r.name ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 whitespace-nowrap">
                            {r.date ? formatDate(r.date) : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm max-w-[200px] min-w-0 overflow-hidden">
                            <span
                              className="block min-w-0 truncate"
                              title={(() => {
                                const t = reportFileLabel(r)
                                return t ? t : undefined
                              })()}
                            >
                              {reportFileLabel(r) || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {r.file && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      type="button"
                                      onClick={() => openRowPreview(r)}
                                    >
                                      <Eye className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preview</p>
                                </TooltipContent>
                              </Tooltip>
                              )}
                              {!readOnly && (
                                <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEdit(i)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => handleRemove(i, r._id)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>

          {previewFile && (
            <>
              {/* Image */}
              {previewType === "image" ? (
                <img
                  src={previewFile}
                  alt="preview"
                  className="w-full rounded-lg"
                />
              ) : previewType === "pdf" ? (
                <iframe
                  src={previewFile}
                  className="w-full h-[500px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preview not available
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
