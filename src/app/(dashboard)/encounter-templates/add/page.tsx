"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, Pill } from "lucide-react"
import {
  ProblemsCard,
  ObservationsCard,
  NotesCard,
  PrescriptionCard,
} from "@/components/encounter-clinical"
import type { PrescriptionItem } from "@/components/encounter-clinical"
import { useCreateListing, useListingData, useUpdateListing } from "@/hooks/api/use-listings"
import {
  useCreateEncounterTemplate,
  useUpdateEncounterTemplate,
  useEncounterTemplate,
} from "@/hooks/api/use-encounter-templates"
import { useModuleConfiguration } from "@/hooks/use-module-configuration"
import { cn } from "@/lib/utils"

function getPrescriptionId(
  name: string | { _id?: string } | null | undefined
): string {
  if (!name) return ""
  if (typeof name === "string") return name
  return name._id ?? ""
}

function isValidObjectId(str: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(str)
}

export default function AddEncounterTemplatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("templateId")
  const isEditMode = !!templateId

  const { data: template, isLoading: isLoadingTemplate } =
    useEncounterTemplate(templateId)

  const [name, setName] = useState("")
  const [problemIds, setProblemIds] = useState<string[]>([])
  const [observationIds, setObservationIds] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [notes, setNotes] = useState<string[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([])

  const { data: problemListings = [] } = useListingData("problem", true)
  const { data: observationListings = [] } = useListingData("observation", true)
  const { data: prescriptionListings = [] } = useListingData("prescription", true)
  const createListingMutation = useCreateListing()
  const updateListingMutation = useUpdateListing()
  const problemOptions = problemListings.map((p) => ({
    value: p._id,
    label: p.label,
  }))
  const observationOptions = observationListings.map((o) => ({
    value: o._id,
    label: o.label,
  }))
  const medicineOptions = prescriptionListings.map((m) => ({
    value: m._id,
    label: m.label,
  }))

  const createMutation = useCreateEncounterTemplate()
  const updateMutation = useUpdateEncounterTemplate()
  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const mod = useModuleConfiguration()

  useEffect(() => {
    if (template) {
      setName(template.name ?? "")
      setProblemIds((template.problems ?? []).map((p) => p._id))
      setObservationIds((template.observations ?? []).map((o) => o._id))
      setNotes((template.notes ?? []).map((n) => n.note ?? ""))
      setPrescriptions(
        (template.prescriptions ?? []).map((p) => ({
          medicine: getPrescriptionId(p.name),
          frequency: p.frequency ?? "",
          duration: p.duration ?? "",
          instruction: p.instruction ?? "",
        }))
      )
    }
  }, [template])

  const handleAddNote = (newNote: string) => {
    if (newNote.trim()) setNotes((prev) => [...prev, newNote.trim()])
  }

  const handleCreateProblem = async (label: string) => {
    const created = await createListingMutation.mutateAsync({
      label,
      type: "problem",
    })
    return created._id
  }

  const handleCreateObservation = async (label: string) => {
    const created = await createListingMutation.mutateAsync({
      label,
      type: "observation",
    })
    return created._id
  }

  const handleUpdateProblem = async (identifier: string, newLabel: string, isId?: boolean) => {
    const id = isId ? identifier : problemListings.find((p) => p.label === identifier)?._id
    if (id) await updateListingMutation.mutateAsync({ id, data: { label: newLabel } })
  }

  const handleUpdateObservation = async (identifier: string, newLabel: string, isId?: boolean) => {
    const id = isId ? identifier : observationListings.find((o) => o.label === identifier)?._id
    if (id) await updateListingMutation.mutateAsync({ id, data: { label: newLabel } })
  }

  const resolveToIds = async (
    items: string[],
    options: { value: string; label: string }[],
    type: "problem" | "observation"
  ): Promise<string[]> => {
    return Promise.all(
      items.map(async (item) => {
        if (isValidObjectId(item)) return item
        const opt = options.find((o) => o.label === item)
        if (opt) return opt.value
        const created = await createListingMutation.mutateAsync({
          label: item,
          type,
        })
        return created._id
      })
    )
  }

  const handleSave = async () => {
    if (!name.trim()) return

    const [resolvedProblemIds, resolvedObservationIds] = await Promise.all([
      resolveToIds(problemIds, problemOptions, "problem"),
      resolveToIds(observationIds, observationOptions, "observation"),
    ])

    const prescriptionsWithIds = await Promise.all(
      prescriptions
        .filter((p) => p.medicine)
        .map(async (p) => {
          let medicineId = String(p.medicine)
          if (!isValidObjectId(medicineId)) {
            const opt = medicineOptions.find((m) => m.label === medicineId)
            if (opt) medicineId = opt.value
            else {
              const created = await createListingMutation.mutateAsync({
                label: medicineId,
                type: "prescription",
              })
              medicineId = created._id
            }
          }
          return {
            name: medicineId,
            dosage: "",
            frequency: p.frequency ?? "",
            duration: p.duration ?? "",
            instruction: p.instruction ?? "",
          }
        })
    )

    const payload = {
      name: name.trim(),
      problems: mod.problem ? resolvedProblemIds : [],
      observations: mod.observations ? resolvedObservationIds : [],
      notes: mod.note ? notes.filter((n) => n.trim()).map((n) => ({ note: n })) : [],
      prescriptions: mod.prescription ? prescriptionsWithIds : [],
    }

    try {
      if (isEditMode && templateId) {
        await updateMutation.mutateAsync({ id: templateId, payload })
      } else {
        const result = await createMutation.mutateAsync({ name: name.trim() })
        const newId = result?.data?._id
        if (newId) {
          await updateMutation.mutateAsync({
            id: newId,
            payload: {
              problems: payload.problems,
              observations: payload.observations,
              notes: payload.notes,
              prescriptions: payload.prescriptions,
            },
          })
        }
      }
      router.push("/encounter-templates")
    } catch {
      // Error handled by mutation
    }
  }

  if (isEditMode && isLoadingTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading template...</p>
      </div>
    )
  }

  if (isEditMode && !template && !isLoadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Template not found.</p>
        <Button variant="outline" onClick={() => router.push("/encounter-templates")} className="cursor-pointer">
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2 max-w-md">
            <Label>Template Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Fever Protocol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-100"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => router.push("/encounter-templates")}
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>
        </div>

        {!mod.problem && !mod.observations && !mod.note && !mod.prescription ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20 px-4">
            All template sections are disabled in Settings → General → Configuration Settings.
          </p>
        ) : (
        <Tabs
          key={`${mod.problem ? 1 : 0}${mod.observations ? 1 : 0}${mod.note ? 1 : 0}${mod.prescription ? 1 : 0}`}
          defaultValue={
            mod.problem || mod.observations || mod.note ? "clinical" : "prescription"
          }
        >
          <TabsList className="h-10 mb-4">
            {(mod.problem || mod.observations || mod.note) && (
              <TabsTrigger value="clinical" className="gap-1.5 px-4 cursor-pointer">
                <ClipboardList className="size-4" />
                Clinical Details
              </TabsTrigger>
            )}
            {mod.prescription && (
              <TabsTrigger value="prescription" className="gap-1.5 px-4 cursor-pointer">
                <Pill className="size-4" />
                Prescription
              </TabsTrigger>
            )}
          </TabsList>

          {(mod.problem || mod.observations || mod.note) && (
          <TabsContent value="clinical">
            <div className="flex flex-col gap-4">
              {(mod.problem || mod.observations) && (
                <div
                  className={cn(
                    "grid gap-4",
                    mod.problem && mod.observations ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {mod.problem && (
                    <ProblemsCard
                      value={problemIds}
                      onChange={setProblemIds}
                      optionsWithIds={problemOptions}
                      onCreateNew={handleCreateProblem}
                      onUpdateListing={handleUpdateProblem}
                    />
                  )}
                  {mod.observations && (
                    <ObservationsCard
                      value={observationIds}
                      onChange={setObservationIds}
                      optionsWithIds={observationOptions}
                      onCreateNew={handleCreateObservation}
                      onUpdateListing={handleUpdateObservation}
                    />
                  )}
                </div>
              )}
              {mod.note && (
                <NotesCard
                  note={note}
                  onNoteChange={setNote}
                  onAdd={handleAddNote}
                  notes={notes}
                  onNotesChange={setNotes}
                />
              )}
            </div>
          </TabsContent>
          )}

          {mod.prescription && (
          <TabsContent value="prescription">
            <PrescriptionCard
              prescriptions={prescriptions}
              onPrescriptionsChange={setPrescriptions}
              medicineOptions={medicineOptions}
            />
          </TabsContent>
          )}
        </Tabs>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSubmitting}
            className="bg-primary hover:bg-primary/90 cursor-pointer"
          >
            {isSubmitting
            ? "Saving..."
            : isEditMode
              ? "Update Template"
              : "Save Template"}
          </Button>
        </div>
      </div>
    </div>
  )
}
