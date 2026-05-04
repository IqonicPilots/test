"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DataTable } from "./components/data-table"
import type { ServerSideFilterState } from "./components/data-table-toolbar"
import {
  getHolidayColumns,
  holidayToTableRow,
  type HolidayTableRow,
} from "./components/holiday-columns"
import { HolidayFormDialog } from "./components/holiday-form-dialog"
import AppointmentSettingPage from "@/app/(dashboard)/settings/schedule-setting/appointment-setting/page"
import { useClinics } from "@/hooks/api/use-clinics"
import { useDeleteHoliday, useHolidays } from "@/hooks/api/use-holidays"
import { useDoctors } from "@/hooks/api/use-doctors"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { GetHolidaysParams, Holiday } from "@/services/holiday.service"
import { useAuthRole } from "@/hooks/use-auth-role"
import { getSettingsSubKeysForRole } from "@/config/roleConfig"

const initialFilterState: ServerSideFilterState = {
  search: "",
  dateRange: undefined,
  category: "all",
  targetId: "",
}

export default function HolidaysPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [filterState, setFilterState] = useState<ServerSideFilterState>(initialFilterState)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { role, isRoleReady } = useAuthRole()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")

  const debouncedSearch = useDebouncedValue(filterState.search, 300)

  const { data: clinicsResponse } = useClinics(1, 500, filterState.category === "clinic")
  const { data: doctorsResponse } = useDoctors(1, 500, filterState.category === "doctor", { status: "active" })

  const clinics = useMemo(() => {
    const d = clinicsResponse?.data
    return Array.isArray(d) ? d : []
  }, [clinicsResponse])

  const doctors = useMemo(() => {
    const d = doctorsResponse?.data
    return Array.isArray(d) ? d : []
  }, [doctorsResponse])

  const targetOptions = useMemo(() => {
    if (filterState.category === "clinic") {
      return clinics.map((c: { _id: string; name?: string }) => ({
        label: c.name || c._id,
        value: c._id,
      }))
    }
    if (filterState.category === "doctor") {
      return doctors.map((d: { _id: string; firstName?: string; lastName?: string }) => ({
        label: [d.firstName, d.lastName].filter(Boolean).join(" ") || d._id,
        value: d._id,
      }))
    }
    return []
  }, [filterState.category, clinics, doctors])

  const queryParams = useMemo((): GetHolidaysParams => {
    const params: GetHolidaysParams = {
      page,
      perPage,
      includeInactive: true,
    }
    if (debouncedSearch?.trim()) params.search = debouncedSearch.trim()
    if (filterState.dateRange?.from)
      params.dateFrom = format(filterState.dateRange.from, "yyyy-MM-dd")
    if (filterState.dateRange?.to)
      params.dateTo = format(filterState.dateRange.to, "yyyy-MM-dd")
    if (filterState.category && filterState.category !== "all")
      params.category = filterState.category
    if (filterState.targetId?.trim()) params.targetId = filterState.targetId.trim()
    return params
  }, [page, perPage, debouncedSearch, filterState.dateRange, filterState.category, filterState.targetId])

  const { data: response, isLoading, error } = useHolidays(queryParams)
  const deleteMutation = useDeleteHoliday()

  const rawData = useMemo(() => {
    if (!response?.data) return []
    return Array.isArray(response.data) ? response.data : []
  }, [response])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination ?? null
  }, [response])

  const holidays: HolidayTableRow[] = useMemo(
    () => rawData.map((h: Holiday) => holidayToTableRow(h)),
    [rawData]
  )

  const handleAddHoliday = useCallback(() => {
    setEditingHoliday(null)
    setDialogOpen(true)
  }, [])

  const handleEditHoliday = useCallback((holiday: Holiday) => {
    setEditingHoliday(holiday)
    setDialogOpen(true)
  }, [])

  const handleDeleteHoliday = useCallback(
    (holiday: Holiday) => {
      setDeleteConfirmId(holiday._id)
    },
    []
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

  const handleFilterChange = useCallback((filters: ServerSideFilterState) => {
    setFilterState(filters)
    setPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilterState(initialFilterState)
    setPage(1)
  }, [])

  const columns = useMemo(
    () =>
      getHolidayColumns({
        onEdit: handleEditHoliday,
        onDelete: handleDeleteHoliday,
      }),
    [handleEditHoliday, handleDeleteHoliday]
  )

  const toolbarConfig = useMemo(
    () => ({
      searchPlaceholder: "Search holidays...",
      addButton: { label: "Add Holiday", onClick: handleAddHoliday },
      dateRangeFilter: { columnId: "dates" },
      categoryFilter: { allLabel: "All Category" },
      toolbarLayout: "twoRow" as const,
      targetFilter: {
        options: targetOptions,
        placeholder:
          filterState.category === "clinic"
            ? "Select Clinic"
            : filterState.category === "doctor"
              ? "Select Doctor"
              : "Select category first",
        allLabel:
          filterState.category === "clinic"
            ? "All Clinics"
            : filterState.category === "doctor"
              ? "All Doctors"
              : "Select Category First",
        disabled: filterState.category === "all" || !filterState.category,
      },
      showViewOptions: true,
      serverSideFilters: true,
      filterState,
      onFilterChange: handleFilterChange,
      onResetFilters: handleResetFilters,
    }),
    [
      handleAddHoliday,
      filterState,
      targetOptions,
      handleFilterChange,
      handleResetFilters,
    ]
  )

  const allAccordionItems = useMemo(
    () => [
      {
        value: "appointment-setting",
        title: "Appointment Settings",
        content: <AppointmentSettingPage />,
      },
      {
        value: "holidays",
        title: "Holidays",
        content:
          error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              Error loading holidays
            </div>
          ) : (
            <>
              <DataTable<HolidayTableRow, unknown>
                columns={columns}
                data={holidays}
                toolbarConfig={toolbarConfig}
                isLoading={isLoading && !holidays.length}
                pageCount={pagination?.totalPages ?? 0}
                pageIndex={page - 1}
                pageSize={perPage}
                onPaginationChange={(p, s) => {
                  setPage(p + 1)
                  setPerPage(s)
                }}
                maxHeight="calc(100vh - 380px)"
                serverSideFiltering
              />

              <ConfirmDialog
                open={!!deleteConfirmId}
                onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                onConfirm={onConfirmDelete}
                title="Delete Holiday?"
                description="This will permanently delete this holiday record. This action cannot be undone."
                isLoading={deleteMutation.isPending}
                confirmText="Delete Holiday"
              />

              <HolidayFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                holiday={editingHoliday}
                onSuccess={() => {
                  setEditingHoliday(null)
                }}
              />
            </>
          ),
      },
    ],
    [
      error,
      columns,
      holidays,
      toolbarConfig,
      isLoading,
      pagination?.totalPages,
      page,
      perPage,
      dialogOpen,
      editingHoliday,
      deleteConfirmId,
      deleteMutation.isPending,
      onConfirmDelete,
    ]
  )

  const accordionItems = useMemo(() => {
    if (!isRoleReady || !role) return allAccordionItems
    const allowed = getSettingsSubKeysForRole(role)
    return allAccordionItems.filter((item) => allowed.has(item.value))
  }, [isRoleReady, role, allAccordionItems])

  const [activeTab, setActiveTab] = useState("appointment-setting")

  const isValidRequestedTab = useMemo(
    () => Boolean(requestedTab && accordionItems.some((item) => item.value === requestedTab)),
    [requestedTab, accordionItems]
  )

  useEffect(() => {
    if (isValidRequestedTab && requestedTab) {
      setActiveTab(requestedTab)
    }
  }, [requestedTab, accordionItems, isValidRequestedTab])

  useEffect(() => {
    if (!accordionItems.length) return
    // Radix `collapsible` uses "" when all sections are closed; do not force the first item open.
    if (activeTab === "") return
    const inList = activeTab && accordionItems.some((i) => i.value === activeTab)
    if (!inList) {
      setActiveTab(accordionItems[0].value)
    }
  }, [accordionItems, activeTab])

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-2 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">Schedule Settings</h2>
      </div>
      {accordionItems.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No schedule settings are available for your role.</p>
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="min-w-0 w-full max-w-full space-y-4"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="rounded-md !border"
            >
              <AccordionTrigger className="cursor-pointer px-4 hover:no-underline">
                <div className="flex min-w-0 items-start text-left">
                  <span className="break-words">{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="min-w-0 px-3 text-muted-foreground sm:px-4">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
