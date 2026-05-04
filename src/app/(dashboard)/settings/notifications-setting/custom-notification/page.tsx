"use client"

import { useState } from "react"
import { useNotificationTemplates, useUpdateNotificationTemplate } from "@/hooks/api/use-notification-templates"
import { NotificationTemplatesTable } from "../components/notification-templates-table"
import { CustomNotificationCreateDialog } from "../components/custom-notification-create-dialog"

export function CustomNotificationContent() {
  const [page] = useState(1)
  const [perPage] = useState(50)
  const { data, isLoading } = useNotificationTemplates({ type: "custom", page, perPage })
  const updateMutation = useUpdateNotificationTemplate()

  const templatesList = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="space-y-4">
      <NotificationTemplatesTable
        templates={templatesList}
        isLoading={isLoading && !templatesList.length}
        onToggleStatus={(id, nextIsActive) => updateMutation.mutate({ id, data: { isActive: nextIsActive } })}
        headerActions={<CustomNotificationCreateDialog />}
        tableMode="custom"
      />
    </div>
  )
}

export default function CustomNotificationPage() {
  return <CustomNotificationContent />
}