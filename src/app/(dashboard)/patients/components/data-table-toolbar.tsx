"use client"

import type { Table } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import type { ReactNode } from "react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import {
  DataTableSearch,
  DataTableSelectFilter,
  DataTableResetButton,
  DataTableDateRangeFilter,
  DataTableDateRangeFilterControlled,
  DataTableFilterSelect,
} from "@/components/common/data-table-filters"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

export interface SelectFilterConfig {
  columnId: string
  placeholder: string
  options: { label: string; value: string }[]
  allLabel?: string
}

export interface ServerSideFilterState {
  search: string
  dateRange?: DateRange
  status?: string
  category?: string
  targetId?: string
}

export interface CategoryFilterConfig {
  options?: { label: string; value: string }[]
  placeholder?: string
  allLabel?: string
}

export interface TargetFilterConfig {
  options: { label: string; value: string }[]
  placeholder: string
  allLabel?: string
  disabled: boolean
}

export interface DataTableToolbarConfig {
  searchPlaceholder?: string
  addButton?: { label: string; onClick: () => void }
  dateRangeFilter?: { columnId: string }
  selectFilter?: SelectFilterConfig
  categoryFilter?: CategoryFilterConfig
  targetFilter?: TargetFilterConfig
  showViewOptions?: boolean
  /** When true, filters are controlled by parent and trigger API refetch */
  serverSideFilters?: boolean
  filterState?: ServerSideFilterState
  onFilterChange?: (filters: ServerSideFilterState) => void
  onResetFilters?: () => void
  onSearchChange?: (value: string) => void
  /** "twoRow": Row1=[Category,Target,Date] Row2=[Search,Reset,View,Add]. Default: single row */
  toolbarLayout?: "single" | "twoRow"
  /** Optional node rendered beside the View / Add buttons (e.g. an Export button) */
  extraActions?: ReactNode
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  config: DataTableToolbarConfig
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  onSearchChange?: (value: string) => void
}

export function DataTableToolbar<TData>({
  table,
  config,
  globalFilter,
  onGlobalFilterChange,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const {
    searchPlaceholder = "Search...",
    addButton,
    dateRangeFilter,
    selectFilter,
    categoryFilter,
    targetFilter,
    showViewOptions = true,
    serverSideFilters = false,
    filterState,
    onFilterChange,
    onResetFilters,
    toolbarLayout = "single",
    extraActions,
  } = config

  const { can } = usePermissions()

  const useTwoRow =
    toolbarLayout === "twoRow" &&
    serverSideFilters &&
    categoryFilter &&
    targetFilter &&
    dateRangeFilter &&
    filterState &&
    onFilterChange

  const isFiltered = serverSideFilters
    ? !!(
      filterState?.search ||
      filterState?.dateRange?.from ||
      filterState?.dateRange?.to ||
      (filterState?.status && filterState.status !== "all") ||
      (filterState?.category && filterState.category !== "all") ||
      (filterState?.targetId && filterState.targetId !== "")
    )
    : table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  const handleReset = () => {
    if (serverSideFilters && onResetFilters) {
      onResetFilters()
    } else {
      table.resetColumnFilters()
      onGlobalFilterChange("")
    }
  }

  const categorySelect =
    categoryFilter &&
    serverSideFilters &&
    filterState &&
    onFilterChange && (
      <DataTableFilterSelect
        value={filterState.category || "all"}
        onValueChange={(value: string) =>
          onFilterChange({
            ...filterState,
            category: value,
            targetId: "",
          })
        }
        placeholder={categoryFilter.placeholder ?? "Select Category"}
        options={categoryFilter.options ?? [
          { value: "clinic", label: "Clinic" },
          { value: "doctor", label: "Doctor" },
        ]}
        allLabel={categoryFilter.allLabel ?? "All"}
        className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none`}
      />
    )

  const targetSelect =
    targetFilter &&
    serverSideFilters &&
    filterState &&
    onFilterChange && (
      <DataTableFilterSelect
        value={filterState.targetId || "all"}
        onValueChange={(value: string) =>
          onFilterChange({
            ...filterState,
            targetId: value === "all" ? "" : value,
          })
        }
        placeholder={targetFilter.placeholder}
        options={targetFilter.options}
        allLabel={targetFilter.allLabel ?? "All"}
        className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none`}
        disabled={targetFilter.disabled}
      />
    )

  const searchInput =
    serverSideFilters && filterState && onFilterChange ? (
      <DataTableSearch
        table={table}
        value={filterState.search}
        onValueChange={(val) => onFilterChange({ ...filterState, search: val })}
        placeholder={searchPlaceholder}
        className="w-full min-w-0 sm:w-[200px] lg:w-[250px]"
      />
    ) : (
      <DataTableSearch
        table={table}
        placeholder={searchPlaceholder}
        className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[250px]"
        isGlobal={true}
        onSearchChange={onSearchChange}
      />
    )

  const dateFilter = dateRangeFilter &&
    (serverSideFilters && filterState && onFilterChange ? (
      <div className="w-full min-w-0 sm:[&_button]:w-auto">
        <DataTableDateRangeFilterControlled
          date={filterState.dateRange}
          onDateChange={(date: DateRange | undefined) =>
            onFilterChange({ ...filterState, dateRange: date })
          }
        />
      </div>
    ) : (
      <DataTableDateRangeFilter
        table={table}
        columnId={dateRangeFilter.columnId}
      />
    ))

  const selectFilterEl =
    selectFilter &&
    (serverSideFilters && filterState && onFilterChange ? (
      <DataTableFilterSelect
        value={filterState.status || "all"}
        onValueChange={(value: string) =>
          onFilterChange({ ...filterState, status: value })
        }
        placeholder={selectFilter.placeholder}
        options={selectFilter.options}
        allLabel={selectFilter.allLabel ?? "All Status"}
        className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none`}
      />
    ) : (
      <DataTableSelectFilter
        table={table}
        columnId={selectFilter.columnId}
        placeholder={selectFilter.placeholder}
        options={selectFilter.options}
        allLabel={selectFilter.allLabel ?? "All Status"}
        className={`h-9 ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none`}
      />
    ))

  const resetButton = (
    <DataTableResetButton
      table={table}
      onReset={handleReset}
      disabled={!isFiltered}
    />
  )

  const viewAndAddButtons = (
    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
      {can("patient_import_export") && (
        extraActions
      )}
      {showViewOptions && <DataTableViewOptions table={table} />}
      {addButton && (
        <Button
          className="cursor-pointer bg-primary hover:bg-primary/90"
          onClick={addButton.onClick}
        >
          <Plus className="h-4 w-4" />
          {addButton.label}
        </Button>
      )}
    </div>
  )

  if (useTwoRow) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className={DATA_TABLE_FILTER_GRID}>
          {categorySelect}
          {targetSelect}
        </div>
        {dateFilter ? (
          <div className="w-full min-w-0 [&_button]:h-9 [&_button]:w-full [&_button]:max-w-md sm:[&_button]:w-auto">
            {dateFilter}
          </div>
        ) : null}
        <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
          {searchInput}
          {resetButton}
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
            {viewAndAddButtons}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {dateFilter ? (
          <div className="min-w-0 [&_button]:h-9">{dateFilter}</div>
        ) : null}
        {selectFilterEl}
        {categorySelect}
        {targetSelect}
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        {searchInput}
        {resetButton}
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          {viewAndAddButtons}
        </div>
      </div>
    </div>
  )
}
