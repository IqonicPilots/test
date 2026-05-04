"use client"

import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import { useDoctorsByClinic } from "@/hooks/api/use-doctors"
import { usePatients } from "@/hooks/api/use-patients"
import type { Encounter } from "@/types/encounter.types"
import { z } from "zod"
import { useMemo } from "react"
import { getReferenceId } from "@/lib/utils"

const encounterEditSchema = z.object({
  patientId: z.string().min(1, { message: "Patient is required." }),
  doctorId: z.string().min(1, { message: "Doctor is required." }),
  encounterDate: z.string().min(1, { message: "Encounter date is required." }),
})

type EncounterEditValues = z.infer<typeof encounterEditSchema>

interface EncounterEditDialogProps {
  encounter: Encounter
  onUpdate: (id: string, data: any) => Promise<void> | void
  trigger?: React.ReactNode
}

export function EncounterEditDialog({
  encounter,
  onUpdate,
  trigger,
}: EncounterEditDialogProps) {
  const clinicId = getReferenceId(encounter.clinic)

  const { data: doctorsResponse } = useDoctorsByClinic(clinicId || "", 1, 100)
  const doctors = useMemo(() => doctorsResponse?.data || [], [doctorsResponse])

  const { data: patientsResponse } = usePatients(1, 100)
  const patients = useMemo(() => patientsResponse?.data || [], [patientsResponse])

  const defaultValues: EncounterEditValues = {
    patientId: getReferenceId(encounter.patient) || "",
    doctorId: getReferenceId(encounter.doctor) || "",
    encounterDate: encounter.encounterDate ? encounter.encounterDate.split("T")[0] : "",
  }

  const fields: FormFieldConfig[] = [
    {
      name: "patientId",
      label: "Patient",
      type: "select",
      required: true,
      disabled: true,
      options: patients.map((p: any) => ({ value: p._id || "", label: p.fullName || `${p.firstName} ${p.lastName}` })),
      gridClass: "col-span-2",
      section: "Personal Information",
    },
    {
      name: "doctorId",
      label: "Doctor",
      type: "select",
      required: true,
      options: doctors.map((d: any) => ({ value: d._id || "", label: d.fullName || `${d.firstName} ${d.lastName}` })),
      gridClass: "col-span-1",
      section: "Personal Information",
    },
    {
      name: "encounterDate",
      label: "Encounter Date",
      type: "date",
      required: true,
      gridClass: "col-span-1",
      section: "Personal Information",
    },
  ]

  const handleSubmit = async (values: EncounterEditValues) => {
    await onUpdate(encounter._id, {
      doctor: values.doctorId,
      encounterDate: values.encounterDate,
    })
  }

  return (
    <GenericFormDialog
      title="Edit Encounter"
      description="Update essential encounter details below."
      trigger={trigger}
      formSchema={encounterEditSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleSubmit}
      dialogSize="md"
      submitButtonText="Update Encounter"
      closeOnSubmit={true}
    />
  )
}
