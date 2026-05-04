"use client"

import { GenericFormDialog } from "@/components/generic-form-dialog"
import { useCreateListing, useUpdateListing } from "@/hooks/api/use-listings"
import { z } from "zod"

const listingFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  type: z.string().min(1, "Type is required"),
  isActive: z.string().optional(),
})

type FormListingData = z.infer<typeof listingFormSchema>

const formFields = [
  {
    name: "label",
    label: "Label",
    type: "text" as const,
    placeholder: "Enter label",
    required: true,
    section: "Add listing data",
  },
  {
    name: "type",
    label: "Type",
    type: "select" as const,
    placeholder: "Select type",
    required: true,
    options: [
      { value: "specialties", label: "Speciality" },
      { value: "service_type", label: "Service Type" },
      { value: "problem", label: "Problem" },
      { value: "observation", label: "Observation" },
      { value: "prescription", label: "Prescription" },
    ],
    section: "Add listing data",
  },
  {
    name: "isActive",
    label: "Status",
    type: "select" as const,
    placeholder: "Select status",
    required: false,
    options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
    section: "Add listing data",
    defaultValue: "true",
  },
]

interface ListingFormDialogProps {
  listingToEdit?: any | null
  trigger?: React.ReactNode
  onUpdate?: () => void
}

export function ListingFormDialog({ listingToEdit, trigger }: ListingFormDialogProps) {
  const isEditing = !!listingToEdit
  const createListingMutation = useCreateListing()
  const updateListingMutation = useUpdateListing()

  const handleSubmit = async (data: FormListingData) => {
    const payload = {
      label: data.label,
      type: data.type,
      isActive: data.isActive === "true",
    }

    if (isEditing && listingToEdit?._id) {
      await updateListingMutation.mutateAsync({ id: listingToEdit._id, data: payload })
    } else {
      await createListingMutation.mutateAsync(payload)
    }
  }

  return (
    <GenericFormDialog
      key={listingToEdit?._id || "new"}
      title={isEditing ? "Edit Listing" : "Add New Listing"}
      description={isEditing ? "Update existing listing details." : "Create a new listing item."}
      triggerLabel={isEditing ? "Edit" : "Add List"}
      trigger={trigger}
      formSchema={listingFormSchema}
      defaultValues={{
        label: listingToEdit?.label || "",
        type: listingToEdit?.type || "",
        isActive: listingToEdit?.isActive === false ? "false" : "true",
      }}
      fields={formFields}
      onSubmit={handleSubmit}
      dialogSize="lg"
      submitButtonText={isEditing ? "Update" : "Save"}
      cancelButtonText="Back"
    />
  )
}
