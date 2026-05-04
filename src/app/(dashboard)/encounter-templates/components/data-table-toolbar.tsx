"use client"

import type { Table } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import {
  DataTableSearch,
  DataTableResetButton,
} from "@/components/common/data-table-filters"
import type { EncounterTemplateTableRow } from "./columns"

interface DataTableToolbarProps {
  table: Table<EncounterTemplateTableRow>
  onAddTemplate?: () => void
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
}

export function DataTableToolbar({
  table,
  onAddTemplate,
  globalFilter,
  onGlobalFilterChange,
}: DataTableToolbarProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <DataTableSearch
          table={table}
          placeholder="Search templates..."
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[300px]"
          isGlobal={true}
        />
        <DataTableResetButton
          table={table}
          onReset={() => onGlobalFilterChange("")}
        />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          <DataTableViewOptions table={table} />
          {onAddTemplate && (
            <Button
              className="cursor-pointer bg-primary hover:bg-primary/90"
              onClick={onAddTemplate}
            >
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
