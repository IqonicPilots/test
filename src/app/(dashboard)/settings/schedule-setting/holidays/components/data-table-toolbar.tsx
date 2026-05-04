"use client"

import type { Table } from "@tanstack/react-table"
import { Plus, Search } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  /** "twoRow": Row1=[Category,Target,Date] Row2=[Search,Reset,View,Add]. Default: single row */
  toolbarLayout?: "single" | "twoRow"
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  config: DataTableToolbarConfig
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
}

export function DataTableToolbar<TData>({
  table,
  config,
  globalFilter,
  onGlobalFilterChange,
}: DataTableToolbarProps<TData>) {
  const {
    searchPlaceholder = "Search...",
    addButton,
    dateRangeFilter,
    categoryFilter,
    targetFilter,
    showViewOptions = true,
    serverSideFilters = false,
    filterState,
    onFilterChange,
    onResetFilters,
    toolbarLayout = "single",
  } = config

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
        placeholder="Select Category"
        allLabel={categoryFilter.allLabel ?? "All Category"}
        options={[
          { value: "clinic", label: "Clinic" },
          { value: "doctor", label: "Doctor" },
        ]}
        className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none text-foreground`}
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
        allLabel={targetFilter.allLabel ?? "All"}
        options={[
          ...targetFilter.options,
        ]}
        className={`h-9 cursor-pointer ${DATA_TABLE_FILTER_CELL} [&_[data-slot=select-value]]:line-clamp-none text-foreground`}
        disabled={targetFilter.disabled}
      />
    )

  const searchInput =
    serverSideFilters && filterState && onFilterChange ? (
      <div className="relative h-9 w-full sm:w-[200px] lg:w-[250px] shrink-0">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={filterState.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFilterChange({ ...filterState, search: e.target.value })
          }
          className="h-9 pl-9 cursor-text w-full text-foreground"
        />
      </div>
    ) : (
      <DataTableSearch
        table={table}
        placeholder={searchPlaceholder}
        className="h-9 w-full sm:w-[200px] lg:w-[250px] text-foreground"
        isGlobal={true}
      />
    )

  const dateFilter = dateRangeFilter &&
    (serverSideFilters && filterState && onFilterChange ? (
      <DataTableDateRangeFilterControlled
        date={filterState.dateRange}
        onDateChange={(date: DateRange | undefined) =>
          onFilterChange({ ...filterState, dateRange: date })
        }
        className="[&_button]:h-9 [&_button]:min-w-[180px] text-foreground"
      />
    ) : (
      <DataTableDateRangeFilter
        table={table}
        columnId={dateRangeFilter.columnId}
      />
    ))

  const resetButton = (
    <DataTableResetButton
      table={table}
      onReset={handleReset}
      disabled={!isFiltered}
      className="text-foreground"
    />
  )

  const viewAndAddButtons = (
    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
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
          {dateFilter ? (
            <div className="min-w-0 sm:col-span-2 [&_button]:h-9 text-foreground">{dateFilter}</div>
          ) : null}
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

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        {categorySelect}
        {targetSelect}
        {dateFilter ? (
          <div className="min-w-0 sm:col-span-2 [&_button]:h-9 text-foreground">{dateFilter}</div>
        ) : null}
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
