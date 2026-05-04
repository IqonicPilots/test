"use client"

import type { Table } from "@tanstack/react-table"
import { DataTableViewOptions } from "./data-table-view-options"
import { AddTaskModal } from "./add-task-modal"
import { categories, priorities, statuses } from "../data/data"
import type { Task } from "../data/schema"
import { 
  DataTableSearch, 
  DataTableSelectFilter, 
  DataTableResetButton 
} from "@/components/common/data-table-filters"
import {
  DATA_TABLE_FILTER_CELL,
  DATA_TABLE_FILTER_GRID,
} from "@/components/data-table/data-table-toolbar-layout"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddTask?: (task: Task) => void
}

export function DataTableToolbar<TData>({
  table,
  onAddTask,
}: DataTableToolbarProps<TData>) {

  const statusOptions = statuses.map((s) => ({ label: s.label, value: s.value }))
  const categoryOptions = categories.map((c) => ({ label: c.label, value: c.value }))
  const priorityOptions = priorities.map((p) => ({ label: p.label, value: p.value }))

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className={DATA_TABLE_FILTER_GRID}>
        <DataTableSelectFilter
          table={table}
          columnId="status"
          placeholder="Status"
          options={statusOptions}
          allLabel="All Status"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />

        <DataTableSelectFilter
          table={table}
          columnId="category"
          placeholder="Category"
          options={categoryOptions}
          allLabel="All Categories"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />

        <DataTableSelectFilter
          table={table}
          columnId="priority"
          placeholder="Priority"
          options={priorityOptions}
          allLabel="All Priorities"
          className={`h-9 ${DATA_TABLE_FILTER_CELL}`}
        />
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
        <DataTableSearch
          table={table}
          columnId="title"
          isGlobal={false}
          placeholder="Search Task"
          className="h-9 w-full min-w-0 sm:w-[200px] lg:w-[300px]"
        />
        <DataTableResetButton table={table} />
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ms-auto sm:w-auto sm:gap-3">
          <DataTableViewOptions table={table} />
          <AddTaskModal onAddTask={onAddTask} />
        </div>
      </div>
    </div>
  )
}
