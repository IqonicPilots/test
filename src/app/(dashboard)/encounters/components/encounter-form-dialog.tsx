"use client"

import { GenericFormDialog, type FormStep } from "@/components/generic-form-dialog"
import { usePatients } from "@/hooks/api/use-patients"
import type { EncounterReportPayload } from "@/types/encounter.types"
import { z } from "zod"

const encounterFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient." }),
  name: z.string().min(2, { message: "Report name must be at least 2 characters." }),
  date: z.string().min(1, { message: "Please select a date." }),
  file: z.string().min(1, { message: "Please enter a file name." }),
})

export type EncounterReportFormValues = z.infer<typeof encounterFormSchema>

interface EncounterFormDialogProps {
  onAddEncounter: (patientId: string, data: EncounterReportPayload) => void | Promise<void>
  isSubmitting?: boolean
  trigger?: React.ReactNode
}

export function EncounterFormDialog({
  onAddEncounter,
  isSubmitting = false,
  trigger,
}: EncounterFormDialogProps) {
  const { data: response } = usePatients(1, 100)
  const patients = response?.data || []

  const defaultValues: EncounterReportFormValues = {
    patientId: "",
    name: "",
    date: "",
    file: "",
  }

  const steps: FormStep[] = [
    {
      title: "Encounter Report Details",
      description: "Fill in the encounter report details below. All fields marked with * are required.",
      schema: encounterFormSchema,
      fields: [
        {
          name: "patientId",
          label: "Patient",
          type: "select",
          required: true,
          options: patients.map((p) => ({ value: p._id || "", label: `${p.firstName} ${p.lastName}` })),
          gridClass: "col-span-2",
          section: "Personal Information",
        },
        { name: "name", label: "Report Name", type: "text", required: true, gridClass: "col-span-1", section: "Personal Information" },
        { name: "date", label: "Date", type: "date", required: true, gridClass: "col-span-1", section: "Personal Information" },
        { name: "file", label: "File Name", type: "text", required: true, gridClass: "col-span-2", section: "Personal Information" },
      ]
    }
  ]

  const handleSubmit = (data: EncounterReportFormValues) => {
    const { patientId, ...reportData } = data
    return onAddEncounter(patientId, reportData)
  }

  return (
    <GenericFormDialog
      title="Add Encounter Report"
      description="Fill in the encounter report details below."
      triggerLabel="Add Report"
      triggerDisabled={isSubmitting}
      trigger={trigger}
      formSchema={encounterFormSchema}
      steps={steps}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      dialogSize="md"
      showImageUpload={false}
      submitButtonText="Upload Report"
      closeOnSubmit={true}
      enableSteps={false}
      triggerClassName="cursor-pointer bg-primary hover:bg-primary/90"
    />
  )
}
