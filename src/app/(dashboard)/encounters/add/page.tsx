"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  ClipboardList,
  Pill,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Stethoscope,
  ArrowLeft,
  Phone,
  User,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useCreateListing, useListingData, useUpdateListing } from "@/hooks/api/use-listings"
import {
  useEncounterTemplate,
  useEncounterTemplates,
} from "@/hooks/api/use-encounter-templates"
import { useUser } from "@/hooks/api/use-profile"
import { useClinic } from "@/hooks/api/use-clinics"
import {
  useEncounter,
  useEncounterReports,
  useCreateEncounter,
  useUpdateEncounter,
  useAddEncounterNote,
  useUpdateEncounterNote,
  useDeleteEncounterNote,
  useAddEncounterPrescription,
  useAddEncounterProblem,
  useDeleteEncounterProblem,
  useAddEncounterObservation,
  useDeleteEncounterObservation,
  useAddEncounterReport,
  useUpdateEncounterReport,
  useDeleteEncounterReport,
  useDeleteEncounterPrescription,
  useUpdateEncounterPrescription,
} from "@/hooks/api/use-encounters"
import { useQueryClient } from "@tanstack/react-query"
import { useAppointment } from "@/hooks/use-appointments"
import {
  ProblemsCard,
  ObservationsCard,
  NotesCard,
  PrescriptionCard,
  BillDialog,
  ReportItem,
  ReportsTabPanel,
  PrintEncounterPDFButton,
} from "@/components/encounter-clinical"
import { PrintInvoicePDFButton } from "@/components/invoice/print-invoice-pdf"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, getReferenceId, isObject } from "@/lib/utils"
import { useModuleConfiguration } from "@/hooks/use-module-configuration"
import { toast } from "sonner"
import type { EncounterTemplate } from "@/types/encounter-template.types"
import { useAuthRole } from "@/hooks/use-auth-role"
import { generateAndPrintInvoice } from "@/components/invoice/print-invoice-pdf"

// ─── Encounter Add Page Skeleton ──────────────────────────────────────────────
function EncounterAddSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumbs + Back */}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          <Skeleton className="h-4 w-16 shrink-0" />
          <Skeleton className="h-4 w-3 shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-4 w-3 shrink-0" />
          <Skeleton className="h-4 w-28 shrink-0" />
          <Skeleton className="h-4 w-3 shrink-0" />
          <Skeleton className="h-4 w-36 shrink-0" />
        </div>
        <Skeleton className="h-9 w-20 shrink-0 self-start rounded-md sm:self-auto" />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 md:px-6 py-6 items-stretch lg:flex-row lg:items-start lg:gap-6">
        {/* Left panel skeleton */}
        <aside className="flex h-[80vh] w-full min-w-0 flex-col gap-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:w-[500px] lg:max-w-[500px] lg:shrink-0">
          <div className="bg-muted/40 px-5 pt-5 pb-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-px w-full mx-4" />
          <div className="px-5 py-4 flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-px w-full mx-4" />
          <div className="px-5 py-4 flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
          <Skeleton className="h-px w-full mx-4" />
          <div className="px-5 py-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-3 w-64" />
          </div>
        </aside>

        {/* Right tabs skeleton */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-1 overflow-x-auto pb-0.5">
              <Skeleton className="h-10 w-32 shrink-0 rounded-md" />
              <Skeleton className="h-10 w-36 shrink-0 rounded-md" />
              <Skeleton className="h-10 w-28 shrink-0 rounded-md" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-[42vh] w-full rounded-lg" />
            <Skeleton className="h-[42vh] w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name?: string) => {
  if (!name) return "U"
  const parts = name.trim().split(" ").filter(Boolean)
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const formatDate = (d?: string) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const formatDateShort = (d?: string) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getPrescriptionMedicineLabel(
  name: string | { _id?: string; label?: string } | null | undefined
): string {
  if (!name) return ""
  if (typeof name === "string") return name
  return name.label ?? name._id ?? ""
}

function formatPhone(countryCode?: string, mobile?: string): string {
  const code = (countryCode ?? "").toString().trim()
  const num = (mobile ?? "").toString().trim()
  if (!num) return "—"
  return code ? `${code} ${num}` : num
}

function formatAddress(addr?: { street?: string; city?: string; state?: string; country?: string; postalCode?: string } | null): string {
  if (!addr) return "—"
  const parts = [
    addr.street,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.country,
    addr.postalCode,
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : "—"
}

function getAgeFromDob(dob?: string | Date | null): string {
  if (!dob) return "—"
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return "—"
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? `${age}Y` : "—"
}

// ─── LEFT PANEL — Encounter Details panel ─────────────────────────────────────
function EncounterRightPanel({
  encounter,
  templates,
  selectedTemplateId,
  onTemplateSelect,
  readOnly = false,
  templateFootnote,
  isPatient = false,
}: {
  encounter: any
  templates: EncounterTemplate[]
  selectedTemplateId: string
  onTemplateSelect: (id: string) => void
  readOnly?: boolean
  templateFootnote?: string
  isPatient?: boolean
}) {
  const patient = encounter?.patient
  const doctor = encounter?.doctor
  const clinic = encounter?.clinic
  const service = encounter?.service

  const patientImg =
    patient?.meta?.profilePicture ||
    patient?.meta?.avatar ||
    patient?.profilePicture ||
    patient?.avatar
  const doctorImg =
    doctor?.meta?.profilePicture ||
    doctor?.meta?.avatar ||
    doctor?.profilePicture ||
    doctor?.avatar
  const clinicImg = clinic?.cliniclogo || clinic?.logo
  const serviceImg = service?.serviceImage

  return (
    <aside className="flex w-full min-w-0 flex-col gap-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:w-[450px] lg:max-w-[450px] lg:shrink-0">
      {/* ── Patient block ── */}
      <div className="px-5 pt-4 pb-3 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <Avatar className="h-14 w-14 border-2 border-primary/20 shadow shrink-0">
            <AvatarImage src={patientImg} />
            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">
              {getInitials(patient?.fullName || patient?.firstName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 min-w-0 flex-col gap-1.5">
            <span className="font-bold text-[22px] leading-tight truncate">
              {patient?.fullName ||
                `${patient?.firstName ?? ""} ${patient?.lastName ?? ""}`.trim() ||
                "Unknown Patient"}
            </span>
            {patient?.email && patient.email !== "—" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{patient.email}</span>
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
            Patient Details
          </p>
          <div className="space-y-1.5">
            {formatPhone(patient?.countryCode, patient?.mobile) && formatPhone(patient?.countryCode, patient?.mobile) !== "—" && (
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">Phone</span>
                <span className="font-medium text-right break-all">{formatPhone(patient?.countryCode, patient?.mobile)}</span>
              </div>
            )}
            {formatAddress(patient?.meta?.address) && formatAddress(patient?.meta?.address) !== "—" && (
              <div className="flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">Address</span>
                <span className="font-medium text-right break-words">{formatAddress(patient?.meta?.address)}</span>
              </div>
            )}
            {((getAgeFromDob(patient?.meta?.dob) && getAgeFromDob(patient?.meta?.dob) !== "—") || (patient?.meta?.gender || patient?.gender)) && (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">Age / Gender</span>
                <span className="font-medium">
                  {getAgeFromDob(patient?.meta?.dob) && getAgeFromDob(patient?.meta?.dob) !== "—" ? getAgeFromDob(patient?.meta?.dob) : "—"} / {patient?.meta?.gender || patient?.gender || "—"}
                </span>
              </div>
            )}
            {patient?.meta?.bloodGroup && patient?.meta?.bloodGroup !== "—" && (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">Blood Group</span>
                <span className="font-medium">{patient.meta.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Encounter Details ── */}
      <div className="px-5 py-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Encounter Details
          </p>
          <Badge
            className={cn(
              "text-xs h-5 px-2",
              readOnly
                ? "bg-primary/10 text-primary border-muted-foreground/30"
                : "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30"
            )}
            variant="outline"
          >
            {readOnly ? "Closed" : "In Progress"}
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <Calendar className="size-4 mt-0.5 text-primary shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {formatDate(encounter?.encounterDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                Encounter Date
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="opacity-40 mx-4" />

      {/* ── Services ── */}
      {service && (
        <>
          <Separator className="opacity-40 mx-4" />
          <div className="px-5 py-3.5 flex flex-col gap-2.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Service
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={serviceImg} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {getInitials(service?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold truncate">{service.name || "—"}</span>
            </div>
          </div>
        </>
      )}

      <Separator className="opacity-40 mx-4" />

      {/* ── Care Team ── */}
      <div className="px-5 py-3.5 flex flex-col gap-2.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          Care Team
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {/* Doctor */}
          <div className="flex min-w-0 items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={doctorImg} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {getInitials(doctor?.fullName || doctor?.firstName)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-[2px]">
                <Stethoscope className="size-3 text-primary-foreground" />
              </span>
            </div>
            <div className="flex min-w-0 flex-col flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  {doctor?.fullName ||
                    `${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim() ||
                    "Unknown Doctor"}
                </span>
                <Badge variant="secondary" className="h-5 shrink-0 px-2 text-[10px] uppercase tracking-wide sm:ml-auto">
                  Doctor
                </Badge>
              </div>
              {doctor?.email && doctor.email !== "—" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 my-1 min-w-0">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{doctor.email}</span>
                </span>
              )}
              {formatPhone(doctor?.countryCode, doctor?.mobile) && formatPhone(doctor?.countryCode, doctor?.mobile) !== "—" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <Phone className="size-3 shrink-0" />
                  <span className="truncate">{formatPhone(doctor?.countryCode, doctor?.mobile)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Clinic */}
          {clinic && (
            <div className="flex min-w-0 items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2">
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={clinicImg} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {getInitials(clinic?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-[2px]">
                  <Building2 className="size-3 text-primary-foreground" />
                </span>
              </div>
              <div className="flex min-w-0 flex-col flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold truncate">{clinic.name}</span>
                  <Badge variant="secondary" className="h-5 shrink-0 px-2 text-[10px] uppercase tracking-wide sm:ml-auto">
                    Clinic
                  </Badge>
                </div>
                  {clinic.email && clinic.email !== "—" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 my-1 min-w-0">
                      <Mail className="size-3 shrink-0" />
                      <span className="truncate">{clinic.email}</span>
                    </span>
                  )}
                  {formatPhone(clinic?.countryCode, clinic?.mobile) && formatPhone(clinic?.countryCode, clinic?.mobile) !== "—" && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                      <Phone className="size-3 shrink-0" />
                      <span className="truncate">{formatPhone(clinic?.countryCode, clinic?.mobile)}</span>
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="opacity-40 mx-4" />

      {/* ── Smart Templates ── */}
      {!isPatient && (
        <div className="px-5 py-3.5 flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Smart Templates
          </p>
          <Select
            value={selectedTemplateId}
            onValueChange={(v) => {
              onTemplateSelect(v)
            }}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full text-sm h-10">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-500 dark:text-amber-500">
            <span className="font-semibold">Note:</span>{templateFootnote ?? "Selecting a template will populate problems, observations, notes, and prescriptions."}
          </p>
        </div>
      )}
    </aside>
  )
}

// ─── Clinical Details Tab ─────────────────────────────────────────────────────
function ClinicalDetailsTab({
  encounter,
  encounterId,
  problems,
  setProblems,
  observations,
  setObservations,
  notes,
  setNotes,
  note,
  setNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddProblem,
  onDeleteProblem,
  onAddObservation,
  onDeleteObservation,
  readOnly = false,
  modules,
}: {
  encounter: any
  encounterId: string
  problems: string[]
  setProblems: React.Dispatch<React.SetStateAction<string[]>>
  observations: string[]
  setObservations: React.Dispatch<React.SetStateAction<string[]>>
  notes: any[]
  setNotes: React.Dispatch<React.SetStateAction<any[]>>
  note: string
  setNote: (v: string) => void
  onAddNote?: (note: string) => Promise<void>
  onUpdateNote?: (index: number, newNote: string) => Promise<void>
  onDeleteNote?: (index: number) => Promise<void>
  onAddProblem?: (dataId: string) => Promise<void>
  onDeleteProblem?: (dataId: string) => Promise<void>
  onAddObservation?: (dataId: string) => Promise<void>
  onDeleteObservation?: (dataId: string) => Promise<void>
  readOnly?: boolean
  modules: { problem: boolean; observations: boolean; note: boolean }
}) {
  const { data: problemListings = [] } = useListingData("problem", true)
  const { data: observationListings = [] } = useListingData("observation", true)
  const createListingMutation = useCreateListing()
  const updateListingMutation = useUpdateListing()
  const problemOptions = problemListings.map((p) => p.label)
  const observationOptions = observationListings.map((o) => o.label)
  const problemOptionsWithIds = problemListings.map((p) => ({ value: p._id, label: p.label }))
  const observationOptionsWithIds = observationListings.map((o) => ({
    value: o._id,
    label: o.label,
  }))

  const handleCreateProblem = async (label: string) => {
    const created = await createListingMutation.mutateAsync({ label, type: "problem" })
    return created?._id ? created._id : label
  }

  const handleCreateObservation = async (label: string) => {
    const created = await createListingMutation.mutateAsync({ label, type: "observation" })
    return created?._id ? created._id : label
  }

  const handleUpdateProblem = async (identifier: string, newLabel: string, isId?: boolean) => {
    const id = isId ? identifier : problemListings.find((p) => p.label === identifier)?._id
    if (id) await updateListingMutation.mutateAsync({ id, data: { label: newLabel } })
  }

  const handleUpdateObservation = async (identifier: string, newLabel: string, isId?: boolean) => {
    const id = isId ? identifier : observationListings.find((o) => o.label === identifier)?._id
    if (id) await updateListingMutation.mutateAsync({ id, data: { label: newLabel } })
  }

  const handleAddNote = (newNote: string) => {
    const trimmed = newNote.trim()
    if (!trimmed) return
    setNotes((prev: string[]) => [...prev, trimmed])
    onAddNote?.(trimmed)
  }

  const handleProblemsChange = (newVal: string[]) => {
    const added = newVal.filter((id) => !problems.includes(id))
    const removed = problems.filter((id) => !newVal.includes(id))
    setProblems(newVal)
    if (encounterId) {
      if (onAddProblem) added.forEach((id) => onAddProblem?.(id))
      if (onDeleteProblem) removed.forEach((id) => onDeleteProblem?.(id))
    }
  }

  const handleObservationsChange = (newVal: string[]) => {
    const added = newVal.filter((id) => !observations.includes(id))
    const removed = observations.filter((id) => !newVal.includes(id))
    setObservations(newVal)
    if (encounterId) {
      if (onAddObservation) added.forEach((id) => onAddObservation?.(id))
      if (onDeleteObservation) removed.forEach((id) => onDeleteObservation?.(id))
    }
  }

  const showProblem = modules.problem
  const showObservations = modules.observations
  const showNote = modules.note
  const clinicalGridClass =
    showProblem && showObservations ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"

  if (!showProblem && !showObservations && !showNote) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20 px-4">
        Problems, observations, and notes are disabled in Settings → General → Configuration Settings.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {(showProblem || showObservations) && (
        <div className={cn("grid gap-4", clinicalGridClass)}>
          {showProblem && (
            <ProblemsCard
              value={problems}
              onChange={handleProblemsChange}
              optionsWithIds={problemOptionsWithIds}
              onCreateNew={handleCreateProblem}
              onUpdateListing={handleUpdateProblem}
              readOnly={readOnly}
            />
          )}
          {showObservations && (
            <ObservationsCard
              value={observations}
              onChange={handleObservationsChange}
              optionsWithIds={observationOptionsWithIds}
              onCreateNew={handleCreateObservation}
              onUpdateListing={handleUpdateObservation}
              readOnly={readOnly}
            />
          )}
        </div>
      )}
      {showNote && (
        <NotesCard
          note={note}
          onNoteChange={setNote}
          onAdd={handleAddNote}
          notes={notes}
          onNotesChange={async (newNotes) => {
            if (onDeleteNote && newNotes.length < notes.length) {
              // Find removed index
              const removedIndex = notes.findIndex((n, idx) => {
                const currentNote = typeof n === "string" ? n : n?.note
                const nextNote = typeof newNotes[idx] === "string" ? newNotes[idx] : newNotes[idx]?.note
                return currentNote !== nextNote
              })
              if (removedIndex !== -1) {
                await onDeleteNote(removedIndex)
              }
            }
            setNotes(newNotes)
          }}
          onUpdateNote={onUpdateNote}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}

// ─── Prescription Tab ─────────────────────────────────────────────────────────
function PrescriptionTab({
  prescriptions,
  setPrescriptions,
  medicineOptions,
  onAddPrescription,
  onUpdatePrescription,
  onDeletePrescription,
  readOnly = false,
}: {
  prescriptions: PrescriptionItem[]
  setPrescriptions: (v: PrescriptionItem[]) => void
  onDeletePrescription?: (id: string) => Promise<void>
  medicineOptions?: { value: string; label: string }[]
  onAddPrescription?: (data: {
    name: string
    frequency: string
    duration: string
    instruction?: string
    dosage?: string
  }) => Promise<void>
  onUpdatePrescription?: (args: {
    prescriptionId: string
    data: { name: string; frequency: string; duration: string; instruction?: string; dosage?: string }
  }) => Promise<void>
  readOnly?: boolean
}) {
  const createListingMutation = useCreateListing()
  
  const handleCreateMedicine = async (label: string) => {
    const created = await createListingMutation.mutateAsync({
      label,
      type: 'prescription',
    })
    return created?._id ? created._id : label
  }

  const handlePrescriptionsChange = (
    newVal: typeof prescriptions
  ) => {
    const prevLen = prescriptions.length
    setPrescriptions(newVal)
    if (onAddPrescription && newVal.length > prevLen) {
      const added = newVal[newVal.length - 1]
      const name =
        medicineOptions?.find((m) => m.label === added.medicine || m.value === added.medicine)?.value ?? added.medicine ?? ""
      if (name) {
        onAddPrescription({
          name,
          frequency: added.frequency ?? "",
          duration: added.duration ?? "",
          instruction: added.instruction,
          dosage: "",
        })
      }
    }
  }
  return (
    <PrescriptionCard
      prescriptions={prescriptions}
      onPrescriptionsChange={handlePrescriptionsChange}
      onUpdatePrescription={onUpdatePrescription}
      onDeletePrescription={async (index, id) => {
        if (id) {
          await onDeletePrescription?.(id)
        }
        handlePrescriptionsChange(prescriptions.filter((_, i) => i !== index))
      }}
      medicineOptions={medicineOptions ?? []}
      onCreateNewMedicine={handleCreateMedicine}
      readOnly={readOnly}
    />
  )
}

export type PrescriptionItem = {
  _id?: string
  id?: string
  medicine?: string
  frequency?: string
  duration?: string
  instruction?: string
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddEncounterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role } = useAuthRole()
  const isPatientRole = role === "patient"

  const encounterId = searchParams.get("encounterId") || ""
  const appointmentId = searchParams.get("appointmentId") || ""

  const { data: encounterData, isLoading: isLoadingEncounter } = useEncounter(encounterId || null)
  const { data: appointmentData, isLoading: isLoadingAppointment } = useAppointment(
    appointmentId || null
  )

  const patientId = getReferenceId(encounterData?.patient) || getReferenceId(appointmentData?.patient ?? (appointmentData as any)?.patientId) || ""
  const doctorId = getReferenceId(encounterData?.doctor) || getReferenceId(appointmentData?.doctor ?? (appointmentData as any)?.doctorId) || ""
  const clinicId = getReferenceId(encounterData?.clinic) || getReferenceId(appointmentData?.clinic ?? (appointmentData as any)?.clinicId) || ""

  const { data: reportsData = [] } = useEncounterReports(patientId || null)

  const { data: patientData } = useUser(patientId ? patientId : undefined)
  const { data: doctorData } = useUser(doctorId ? doctorId : undefined)
  const { data: clinicData } = useClinic(clinicId || "")

  const encounter = React.useMemo(() => {
    if (encounterData) {
      const appt = encounterData.appointment as any
      const svc = appt?.service
      const base = {
        ...encounterData,
        service: (encounterData as any).service ?? (svc && typeof svc === "object" ? svc : undefined),
        patient: encounterData.patient
          ? {
            ...encounterData.patient,
            ...(patientData && {
              fullName: patientData.firstName && patientData.lastName
                ? `${patientData.firstName} ${patientData.lastName}`.trim()
                : encounterData.patient?.fullName,
              email: patientData.email || encounterData.patient?.email,
              mobile: patientData.mobile,
              countryCode: patientData.countryCode,
              meta: patientData.meta,
              profilePicture: patientData.meta?.profilePicture,
              avatar: patientData.meta?.avatar,
            }),
          }
          : undefined,
        doctor: encounterData.doctor
          ? {
            ...encounterData.doctor,
            ...(doctorData && {
              fullName: doctorData.firstName && doctorData.lastName
                ? `${doctorData.firstName} ${doctorData.lastName}`.trim()
                : encounterData.doctor?.fullName,
              email: doctorData.email || encounterData.doctor?.email,
              mobile: doctorData.mobile,
              countryCode: doctorData.countryCode,
              meta: doctorData.meta,
              profilePicture: doctorData.meta?.profilePicture,
              avatar: doctorData.meta?.avatar,
            }),
          }
          : undefined,
        clinic: encounterData.clinic
          ? {
            ...encounterData.clinic,
            ...(clinicData && {
              name: clinicData.name || encounterData.clinic?.name,
              email: clinicData.email || encounterData.clinic?.email,
              mobile: clinicData.mobile,
              countryCode: clinicData.countryCode,
              address: clinicData.address,
              cliniclogo: clinicData.cliniclogo,
              logo: (clinicData as { logo?: string }).logo,
            }),
          }
          : undefined,
      } as any
      return base
    }

    if (appointmentData) {
      const appt = appointmentData as any
      const patient = appt.patient
      const doctor = appt.doctor
      const clinic = appt.clinic
      const date = appt.schedule?.startDate || new Date().toISOString()
      const base = {
        _id: "",
        encounterDate: date,
        encounter_status: "Active",
        appointment: { _id: appt._id, service: appt.service },
        patient: {
          _id: patient?._id ?? "",
          fullName: patient?.fullName || "Unknown Patient",
          email: patient?.email || "",
          mobile: patientData?.mobile,
          countryCode: patientData?.countryCode,
          meta: patientData?.meta,
          profilePicture: patientData?.meta?.profilePicture,
          avatar: patientData?.meta?.avatar,
          ...(patientData && {
            fullName: patientData.firstName && patientData.lastName
              ? `${patientData.firstName} ${patientData.lastName}`.trim()
              : patient?.fullName || "Unknown Patient",
            email: patientData.email || patient?.email || "",
          }),
        },
        doctor: {
          _id: doctor?._id ?? "",
          fullName: doctor?.fullName || "Unknown Doctor",
          firstName: doctor?.firstName ?? "",
          lastName: doctor?.lastName ?? "",
          email: (doctor as any)?.email || "",
          mobile: doctorData?.mobile,
          countryCode: doctorData?.countryCode,
          meta: doctorData?.meta,
          profilePicture: doctorData?.meta?.profilePicture,
          avatar: doctorData?.meta?.avatar,
          ...(doctorData && {
            fullName: doctorData.firstName && doctorData.lastName
              ? `${doctorData.firstName} ${doctorData.lastName}`.trim()
              : doctor?.fullName || "Unknown Doctor",
            email: doctorData.email || (doctor as any)?.email || "",
          }),
        },
        clinic: {
          _id: clinic?._id ?? "",
          name: clinic?.name || "Unknown Clinic",
          email: (clinic as any)?.email || "",
          mobile: clinicData?.mobile,
          countryCode: clinicData?.countryCode,
          address: clinicData?.address,
          cliniclogo: clinicData?.cliniclogo,
          logo: (clinicData as { logo?: string })?.logo,
          ...(clinicData && {
            name: clinicData.name || clinic?.name || "Unknown Clinic",
            email: clinicData.email || (clinic as any)?.email || "",
          }),
        },
        service: appt.service,
        problems: [],
        observations: [],
        notes: [],
        prescriptions: [],
        reports: [],
      } as any
      return base
    }

    return null
  }, [encounterData, appointmentData, patientData, doctorData, clinicData])

  const enrichedBill = useMemo(() => {
    if (!encounter?.bill) return null
    return {
      ...encounter.bill,
      patient: encounter.patient,
      doctor: encounter.doctor,
      clinic: encounter.clinic,
    }
  }, [encounter?.bill, encounter?.patient, encounter?.doctor, encounter?.clinic])

  const enrichedAppointment = useMemo(() => {
    if (!encounter?.appointment) return null
    return {
      ...encounter.appointment,
      patient: encounter.patient,
      doctor: encounter.doctor,
      clinic: encounter.clinic,
    }
  }, [encounter?.appointment, encounter?.patient, encounter?.doctor, encounter?.clinic])

  const isLoading = (encounterId && isLoadingEncounter) || (appointmentId && isLoadingAppointment)
  const hasNoIds = !encounterId && !appointmentId

  useEffect(() => {
    if (hasNoIds) {
      router.replace("/encounters")
    }
  }, [hasNoIds, router])

  const { data: templatesResponse } = useEncounterTemplates(1, 100)
  const templates = (templatesResponse?.data ?? []).filter(
    (t) => t.isActive !== false
  )

  const [selectedTemplateId, setSelectedTemplateId] = useState("__none__")
  const { data: selectedTemplate } = useEncounterTemplate(
    selectedTemplateId && selectedTemplateId !== "__none__" ? selectedTemplateId : null
  )

  const updateEncounterMutation = useUpdateEncounter()
  const addEncounterNoteMutation = useAddEncounterNote()
  const updateEncounterNoteMutation = useUpdateEncounterNote()
  const deleteEncounterNoteMutation = useDeleteEncounterNote()

  const addEncounterReportMutation = useAddEncounterReport()
  const updateEncounterReportMutation = useUpdateEncounterReport()
  const deleteEncounterReportMutation = useDeleteEncounterReport()

  const addEncounterProblemMutation = useAddEncounterProblem()
  const deleteEncounterProblemMutation = useDeleteEncounterProblem()

  const addEncounterObservationMutation = useAddEncounterObservation()
  const deleteEncounterObservationMutation = useDeleteEncounterObservation()

  const addEncounterPrescriptionMutation = useAddEncounterPrescription()
  const updateEncounterPrescriptionMutation = useUpdateEncounterPrescription()
  const deleteEncounterPrescriptionMutation = useDeleteEncounterPrescription()

  const [note, setNote] = useState("")
  const [problems, setProblems] = useState<string[]>([])
  const [observations, setObservations] = useState<string[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [hasStartedClose, setHasStartedClose] = useState(false)
  const queryClient = useQueryClient()
  const [billDialogOpen, setBillDialogOpen] = useState(false)
  const [encounterForBill, setEncounterForBill] = useState<any>(null)
  const createEncounterMutation = useCreateEncounter()
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(
    (encounter?.prescriptions || []).map((p: any) => ({
      _id: p?._id,
      medicine: typeof p === "string" ? p : (p?.name?.label ?? p?.medicine ?? p?.name),
      frequency: typeof p === "string" ? undefined : p.frequency,
      duration: typeof p === "string" ? undefined : p.duration,
      instruction: typeof p === "string" ? undefined : p.instruction,
    }))
  )

  const [reports, setReports] = useState<ReportItem[]>([])

  // Update reports when reportsData changes
  useEffect(() => {
    if (reportsData) {
      const newReports = reportsData.map((r: any) => ({
        name: r.name,
        date: r.date,
        file: r.file,
        _id: r._id,
      }))
      setReports(newReports)
    }
  }, [JSON.stringify(reportsData)])

  const { data: prescriptionListings = [] } = useListingData("prescription", true)
  const medicineOptions = prescriptionListings.map((m) => ({
    value: m._id,
    label: m.label,
  }))

  const { data: problemListings = [] } = useListingData("problem", true)
  const { data: observationListings = [] } = useListingData("observation", true)

  // Sync state from encounter when data loads (e.g. navigating back from list)
  useEffect(() => {
    if (!encounter) return
    const enc = encounter as any
    setProblems(
      (enc.problems || []).map((p: any) =>
        typeof p === "string" ? p : p?._id ?? p?.label ?? ""
      ).filter(Boolean)
    )
    setObservations(
      (enc.observations || []).map((o: any) =>
        typeof o === "string" ? o : o?._id ?? o?.label ?? ""
      ).filter(Boolean)
    )
    setNotes(enc.notes || [])
    setPrescriptions(
      (enc.prescriptions || []).map((p: any) => ({
        _id: p?._id,
        medicine: typeof p === "string" ? p : (p?.name?.label ?? p?.medicine ?? p?.name),
        frequency: typeof p === "string" ? undefined : p.frequency,
        duration: typeof p === "string" ? undefined : p.duration,
        instruction: typeof p === "string" ? undefined : p.instruction,
      }))
    )
    if (enc.templateId) setSelectedTemplateId(enc.templateId)
  }, [encounter])

  // When template selected but no encounterId (e.g. from appointment), populate locally from template
  useEffect(() => {
    if (encounterId || !selectedTemplate) return
    if (selectedTemplateId === "__none__") return
    const tpl = selectedTemplate
    setProblems((tpl.problems ?? []).map((p) => p._id ?? p.label).filter(Boolean))
    setObservations((tpl.observations ?? []).map((o) => o._id ?? o.label).filter(Boolean))
    setNotes(tpl.notes || [])
    setPrescriptions(
      (tpl.prescriptions ?? []).map((p) => ({
        medicine: getPrescriptionMedicineLabel(p.name),
        frequency: p.frequency ?? "",
        duration: p.duration ?? "",
        instruction: p.instruction ?? "",
      }))
    )
  }, [selectedTemplate, selectedTemplateId, encounterId])

  const mod = useModuleConfiguration()

  const templateFootnote = useMemo(() => {
    const parts: string[] = []
    if (mod.problem) parts.push("problems")
    if (mod.observations) parts.push("observations")
    if (mod.note) parts.push("notes")
    if (mod.prescription) parts.push("prescriptions")
    if (parts.length === 0) {
      return "No clinical fields are enabled for templates in Configuration settings."
    }
    if (parts.length === 1) return `Selecting a template will populate ${parts[0]}.`
    const last = parts[parts.length - 1]!
    const rest = parts.slice(0, -1)
    return `Selecting a template will populate ${rest.join(", ")} and ${last}.`
  }, [mod.problem, mod.observations, mod.note, mod.prescription])

  const hasClinicalTab = mod.problem || mod.observations || mod.note
  const defaultEncounterTab = hasClinicalTab
    ? "clinical"
    : mod.prescription
      ? "prescription"
      : "reports"
  const encounterTabsKey = `${mod.problem ? 1 : 0}${mod.observations ? 1 : 0}${mod.note ? 1 : 0}${mod.prescription ? 1 : 0}`

  const handleCloseEncounterWithoutBill = useCallback(async () => {
    if (!encounter) return
    try {
      let id = encounter._id as string
      if (!id) {
        const newEnc = await createEncounterMutation.mutateAsync({
          appointment: appointmentId || undefined,
          clinic: encounter.clinic?._id ?? "",
          doctor: encounter.doctor?._id ?? "",
          patient: encounter.patient?._id ?? "",
          encounterDate: encounter.encounterDate,
        })
        id = newEnc._id
      }
      await updateEncounterMutation.mutateAsync({
        id,
        data: { encounter_status: "Closed" },
      })
      toast.success("Encounter closed successfully")
      router.push("/encounters")
    } catch {
      // Errors are surfaced by mutations
    }
  }, [
    encounter,
    appointmentId,
    createEncounterMutation,
    updateEncounterMutation,
    router,
  ])

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId || templateId === "__none__") {
      setNote("")
      setProblems([])
      setObservations([])
      setNotes([])
      setPrescriptions([])
      return
    }
    if (encounterId) {
      try {
        const updated = await updateEncounterMutation.mutateAsync({
          id: encounterId,
          data: { templateId },
        })
        const enc = updated as any
        setProblems(
          (enc.problems || []).map((p: any) =>
            typeof p === "string" ? p : p?._id ?? p?.label ?? ""
          ).filter(Boolean)
        )
        setObservations(
          (enc.observations || []).map((o: any) =>
            typeof o === "string" ? o : o?._id ?? o?.label ?? ""
          ).filter(Boolean)
        )
        setNotes((enc.notes || []).map((n: any) => (typeof n === "string" ? n : n?.note ?? "")))
        setPrescriptions(
          (enc.prescriptions || []).map((p: any) => ({
            _id: p?._id,
            medicine: typeof p === "string" ? p : (p?.name?.label ?? p?.medicine ?? p?.name),
            frequency: typeof p === "string" ? undefined : p.frequency,
            duration: typeof p === "string" ? undefined : p.duration,
            instruction: typeof p === "string" ? undefined : p.instruction,
          }))
        )
      } catch {
        // Error already toasted in mutation
      }
    }
  }

  if (hasNoIds) return null
  if (isLoading) return <EncounterAddSkeleton />
  if (!encounter) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 px-4 md:px-6">
        <p className="text-sm text-muted-foreground">Unable to load encounter. Please try again.</p>
        <Button variant="outline" onClick={() => router.push("/encounters")} className="cursor-pointer">
          Back
        </Button>
      </div>
    )
  }

  const isEncounterClosed =
    (encounter?.encounter_status || encounter?.status)?.toLowerCase() === "closed"

  const isReadOnly = isEncounterClosed || isPatientRole

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Breadcrumbs + Back ── */}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-2 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap overflow-x-auto text-sm sm:text-[14px]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/encounters">Encounter List</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Encounter Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 self-start sm:self-auto cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      {/* ── Body: LEFT content + RIGHT panel ── */}
      <div className="flex flex-1 flex-col gap-4 px-4 py-6 items-stretch md:px-6 lg:flex-row lg:items-start lg:gap-6">

        {/* LEFT – Encounter Details panel */}
        <EncounterRightPanel
          encounter={encounter}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={handleTemplateSelect}
          readOnly={isReadOnly}
          templateFootnote={templateFootnote}
          isPatient={isPatientRole}
        />

        {/* RIGHT – Tabs section */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Tabs key={encounterTabsKey} defaultValue={defaultEncounterTab} className="min-w-0 w-full max-w-full gap-3">
            <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="min-w-0 flex-1">
                <TabsList className="grid h-auto w-full md:w-max max-w-full min-w-0 grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 md:flex md:h-12 md:min-h-12 md:justify-start md:overflow-x-auto md:p-1 md:[scrollbar-width:thin]">
                  {hasClinicalTab && (
                    <TabsTrigger value="clinical" className="gap-1 px-2 sm:px-3 cursor-pointer">
                      <ClipboardList className="size-4" />
                      Clinical Details
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="reports" className="gap-1 px-2 sm:px-3 cursor-pointer">
                    <Upload className="size-4" />
                    Upload Reports
                  </TabsTrigger>
                  {mod.prescription && (
                    <TabsTrigger value="prescription" className="gap-1 px-2 sm:px-3 cursor-pointer">
                      <Pill className="size-4" />
                      Prescription
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex w-full shrink-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 2xl:w-auto 2xl:justify-end">
                <PrintEncounterPDFButton
                  data={{
                    clinic: {
                      name: encounter?.clinic?.name || "Clinic",
                      doctor: `${encounter?.doctor?.first_name || ""} ${encounter?.doctor?.last_name || ""}`.trim() || encounter?.doctor?.fullName || "",
                      email: encounter?.clinic?.email || "",
                      phone: `${encounter?.clinic?.countryCode || ""} ${encounter?.clinic?.app_contact_number || encounter?.clinic?.mobile || ""}`.trim(),
                      address: typeof encounter?.clinic?.address === "object" ? formatAddress(encounter?.clinic?.address) : (encounter?.clinic?.address || ""),
                      logo: encounter?.clinic?.cliniclogo || encounter?.clinic?.logo || "",
                      signature:
                        encounter?.doctor?.meta?.signature ||
                        (encounter?.doctor as { signatureImage?: string } | undefined)?.signatureImage ||
                        "",
                    },
                    patient: {
                      name: encounter?.patient?.fullName || `${encounter?.patient?.firstName || ""} ${encounter?.patient?.lastName || ""}`.trim(),
                      email: encounter?.patient?.email || "",
                      phone: encounter?.patient?.mobile || encounter?.patient?.phone || "",
                      address: formatAddress(encounter?.patient?.meta?.address || encounter?.patient?.address),
                      age: encounter?.patient?.meta?.dob ? String(new Date().getFullYear() - new Date(encounter.patient.meta.dob).getFullYear()) : "—",
                      gender: encounter?.patient?.meta?.gender || encounter?.patient?.gender || "—",
                      bloodGroup: encounter?.patient?.meta?.bloodGroup || "—",
                    },
                    encounter: {
                      dateTime: encounter?.encounterDate || new Date().toISOString(),
                      status: encounter?.status || encounter?.encounter_status || "Completed",
                    },
                    clinicalDetails: {
                      problems: problems.map(id => problemListings.find(p => p._id === id || p.label === id)?.label || id),
                      observations: observations.map(id => observationListings.find(o => o._id === id || o.label === id)?.label || id),
                      notes: notes.map((n: any) => (typeof n === "string" ? n : n?.note || "")),
                      prescriptions: prescriptions.map(p => ({
                        name: typeof p.medicine === "object" ? (p.medicine as any).label || (p.medicine as any).value : (p.medicine || ""),
                        frequency: p.frequency || "",
                        duration: p.duration || "",
                        instruction: p.instruction || "",
                      })),
                    },
                  }}
                />
                {encounter?.encounter_status === "Closed" && encounter?.bill?.paymentStatus === "paid" && (
                  <PrintInvoicePDFButton
                    bill={enrichedBill}
                    appointment={enrichedAppointment}
                    variant="button"
                  />
                )}
                {!isReadOnly && mod.billing && (
                  <Button
                    size="sm"
                    className="shrink-0 whitespace-nowrap gap-1.5 cursor-pointer"
                    disabled={createEncounterMutation.isPending}
                    onClick={async () => {
                      if (encounter._id) {
                        setBillDialogOpen(true)
                      } else {
                        try {
                          const newEnc = await createEncounterMutation.mutateAsync({
                            appointment: appointmentId || undefined,
                            clinic: encounter.clinic?._id ?? "",
                            doctor: encounter.doctor?._id ?? "",
                            patient: encounter.patient?._id ?? "",
                            encounterDate: encounter.encounterDate,
                          })
                          setEncounterForBill({ ...encounter, _id: newEnc._id })
                          setBillDialogOpen(true)
                        } catch {
                          // Error already toasted in mutation
                        }
                      }
                    }}
                  >
                    {createEncounterMutation.isPending ? "Creating..." : "Close Encounter"}
                  </Button>
                )}
                {!isReadOnly && !mod.billing && (
                  <Button
                    size="sm"
                    className="shrink-0 whitespace-nowrap gap-1.5 cursor-pointer"
                    disabled={
                      createEncounterMutation.isPending || updateEncounterMutation.isPending
                    }
                    onClick={handleCloseEncounterWithoutBill}
                  >
                    {createEncounterMutation.isPending || updateEncounterMutation.isPending
                      ? "Closing..."
                      : "Close Encounter"}
                  </Button>
                )}
              </div>
            </div>

            {hasClinicalTab && (
              <TabsContent value="clinical">
                <ClinicalDetailsTab
                  encounter={encounter}
                  encounterId={encounterId}
                  problems={problems}
                  setProblems={setProblems}
                  observations={observations}
                  setObservations={setObservations}
                  notes={notes}
                  setNotes={setNotes}
                  note={note}
                  setNote={setNote}
                  readOnly={isReadOnly}
                  modules={{
                    problem: mod.problem,
                    observations: mod.observations,
                    note: mod.note,
                  }}
                  onUpdateNote={async (index, newNote) => {
                    const noteObj = notes[index]
                    const noteId = typeof noteObj === "object" ? noteObj?._id : null

                    // Update local state
                    const nextNotes = [...notes]
                    if (typeof noteObj === "object") {
                      nextNotes[index] = { ...noteObj, note: newNote }
                    } else {
                      nextNotes[index] = newNote
                    }
                    setNotes(nextNotes)

                    if (encounterId && noteId) {
                      await updateEncounterNoteMutation.mutateAsync({
                        encounterId,
                        noteId,
                        note: newNote,
                      })
                    }
                  }}
                  onDeleteNote={
                    encounterId
                      ? async (index) => {
                        const noteObj = notes[index]
                        const noteId = typeof noteObj === "object" ? noteObj?._id : null
                        if (noteId) {
                          await deleteEncounterNoteMutation.mutateAsync({
                            encounterId,
                            noteId,
                          })
                        }
                      }
                      : undefined
                  }
                  onAddNote={
                    encounterId
                      ? async (noteText) => {
                        await addEncounterNoteMutation.mutateAsync({
                          encounterId,
                          note: noteText,
                        })
                      }
                      : undefined
                  }
                  onAddProblem={
                    encounterId
                      ? async (dataId) => {
                        await addEncounterProblemMutation.mutateAsync({
                          encounterId,
                          dataId,
                        })
                      }
                      : undefined
                  }
                  onDeleteProblem={
                    encounterId
                      ? async (dataId) => {
                        await deleteEncounterProblemMutation.mutateAsync({
                          encounterId,
                          dataId,
                        })
                      }
                      : undefined
                  }
                  onAddObservation={
                    encounterId
                      ? async (dataId) => {
                        await addEncounterObservationMutation.mutateAsync({
                          encounterId,
                          dataId,
                        })
                      }
                      : undefined
                  }
                  onDeleteObservation={
                    encounterId
                      ? async (dataId) => {
                        await deleteEncounterObservationMutation.mutateAsync({
                          encounterId,
                          dataId,
                        })
                      }
                      : undefined
                  }
                />
              </TabsContent>
            )}

            <TabsContent value="reports">
              <ReportsTabPanel
                reports={reports}
                setReports={setReports}
                readOnly={isReadOnly}
                onAddReport={
                  encounterId
                    ? async (data) => {
                      await addEncounterReportMutation.mutateAsync({
                        patientId: encounter?.patient?._id || patientId,
                        data,
                      })
                    }
                    : undefined
                }
                onUpdateReport={
                  encounterId
                    ? async (reportId, data) => {
                      await updateEncounterReportMutation.mutateAsync({
                        patientId: encounter?.patient?._id || patientId,
                        reportId,
                        data,
                      })
                    }
                    : undefined
                }
                onDeleteReport={
                  encounterId
                    ? async (_index, reportId) => {
                      if (reportId) {
                        const pid = encounter?.patient?._id || patientId
                        await deleteEncounterReportMutation.mutateAsync({
                          encounterId: pid,
                          reportId,
                        })
                      }
                    }
                    : undefined
                }
              />
            </TabsContent>

            {mod.prescription && (
              <TabsContent value="prescription">
                <PrescriptionTab
                  prescriptions={prescriptions}
                  setPrescriptions={setPrescriptions}
                  medicineOptions={medicineOptions}
                  readOnly={isReadOnly}
                  onAddPrescription={
                    encounterId
                      ? async (data) => {
                        await addEncounterPrescriptionMutation.mutateAsync({
                          encounterId,
                          data,
                        })
                      }
                      : undefined
                  }
                  onUpdatePrescription={
                    encounterId
                      ? async ({ prescriptionId, data }) => {
                        await updateEncounterPrescriptionMutation.mutateAsync({
                          encounterId,
                          prescriptionId,
                          data,
                        })
                      }
                      : undefined
                  }
                  onDeletePrescription={
                    encounterId
                      ? async (prescriptionId) => {
                        await deleteEncounterPrescriptionMutation.mutateAsync({
                          encounterId,
                          prescriptionId,
                        })
                      }
                      : undefined
                  }
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {mod.billing && (
        <BillDialog
          open={billDialogOpen}
          onOpenChange={(open) => {
            setBillDialogOpen(open)
            if (!open) setEncounterForBill(null)
          }}
          encounter={encounterForBill ?? encounter}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["bills"] })
            queryClient.invalidateQueries({ queryKey: ["bills", "by-encounter"] })
            queryClient.invalidateQueries({ queryKey: ["bills", "summary-stats"] })
            queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] })
            queryClient.invalidateQueries({ queryKey: ["encounters"] })
            queryClient.invalidateQueries({ queryKey: ["appointments"] })
            queryClient.invalidateQueries({ queryKey: ["infinite-appointments"] })
            toast.success("Encounter closed successfully")
          }}
        />
      )}
    </div>
  )
}
