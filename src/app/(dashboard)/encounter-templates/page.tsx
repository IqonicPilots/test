"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, LayoutList } from "lucide-react"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import {
  useEncounterTemplates,
  useDeleteEncounterTemplate,
  useUpdateEncounterTemplate,
} from "@/hooks/api/use-encounter-templates"
import type { EncounterTemplate } from "@/types/encounter-template.types"
import { usePermissions } from "@/hooks/use-permissions"
import { RoleGuard } from "@/components/role-guard"
import { ConfirmDialog } from "@/components/confirm-dialog"

export default function EncounterTemplatesPage() {
  const { can, isLoading: isPermissionsLoading } = usePermissions()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: response, isLoading, error } = useEncounterTemplates(page, limit)
  const deleteMutation = useDeleteEncounterTemplate()
  const updateMutation = useUpdateEncounterTemplate()

  const templates = useMemo(() => {
    if (!response?.data) return []
    return Array.isArray(response.data) ? response.data : []
  }, [response])

  const pagination = useMemo(() => {
    return response?.pagination ?? null
  }, [response])

  const handleAddTemplate = useCallback(() => {
    router.push("/encounter-templates/add")
  }, [router])

  const handleEditTemplate = useCallback(
    (template: EncounterTemplate) => {
      router.push(`/encounter-templates/add?templateId=${template._id}`)
    },
    [router]
  )

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      setDeleteConfirmId(id)
    },
    []
  )

  const handleToggleActive = useCallback(
    (template: EncounterTemplate, isActive: boolean) => {
      const wasActive = template.isActive !== false
      if (wasActive === isActive) return
      updateMutation.mutate({ id: template._id, payload: { isActive } })
    },
    [updateMutation]
  )

  const onConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteMutation.mutateAsync(deleteConfirmId)
      setDeleteConfirmId(null)
    } catch (error) {
      setDeleteConfirmId(null)
    }
  }

  const columns = useMemo(
    () =>
      getColumns({
        onEditTemplate: handleEditTemplate,
        onDeleteTemplate: handleDeleteTemplate,
        onToggleActive: handleToggleActive,
        togglingTemplateId:
          updateMutation.isPending && updateMutation.variables
            ? updateMutation.variables.id
            : null,
        can,
      }),
    [
      handleEditTemplate,
      handleDeleteTemplate,
      handleToggleActive,
      updateMutation.isPending,
      updateMutation.variables,
      can,
    ]
  )

  const templateStats = useMemo(() => {
    const total = pagination?.total ?? 0
    const active = templates.filter((t) => t.isActive !== false).length
    const getPct = (count: number) =>
      total > 0 ? Math.round((count / total) * 100) : 0
    return {
      total,
      active,
      activePct: getPct(active),
    }
  }, [pagination, templates])

  return (
    <RoleGuard permission="encounter_template_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Encounter Templates</h1>
        <p className="text-muted-foreground">
          Create and manage reusable encounter templates.
        </p>
      </div>
      <div className="h-full flex-1 flex-col space-y-6 px-4 md:px-6 flex">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Total Templates
                  </p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {templateStats.total}
                      </span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        100%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <LayoutList className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Encounter Templates</CardTitle>
            <CardDescription>
              View, filter, and manage all your encounter templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={templates}
              onAddTemplate={can("encounter_template_add") ? handleAddTemplate : undefined}
              isLoading={isLoading && !templates.length}
              pageCount={pagination?.totalPages ?? 0}
              pageIndex={page - 1}
              pageSize={limit}
              onPaginationChange={(p, s) => {
                setPage(p + 1)
                setLimit(s)
              }}
            />
          </CardContent>
        </Card>

        <ConfirmDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          onConfirm={onConfirmDelete}
          title="Delete Encounter Template?"
          description="Are you sure you want to delete this template? This action cannot be undone."
          isLoading={deleteMutation.isPending}
          confirmText="Delete"
        />
      </div>
    </RoleGuard>
  )
}
