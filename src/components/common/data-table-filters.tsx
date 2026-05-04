"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { RefreshCcw, Search, Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface DataTableSearchProps<TData> {
  table: Table<TData>
  placeholder?: string
  className?: string
  isGlobal?: boolean
  columnId?: string
  onSearchChange?: (value: string) => void
  onValueChange?: (value: string) => void
  value?: string
}

export function DataTableSearch<TData>({
  table,
  placeholder = "Search...",
  className = "w-full sm:w-[200px] lg:w-[300px]",
  isGlobal = true,
  columnId,
  onSearchChange,
  onValueChange,
  value: manualValue,
}: DataTableSearchProps<TData>) {
  const value = manualValue !== undefined
    ? manualValue
    : isGlobal
      ? (table.getState().globalFilter as string) ?? ""
      : (table.getColumn(columnId!)?.getFilterValue() as string) ?? ""

  const onChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val)
      return
    }
    if (onSearchChange) {
      onSearchChange(val)
      return
    }
    if (isGlobal) {
      table.setGlobalFilter(val)
    } else if (columnId) {
      table.getColumn(columnId)?.setFilterValue(val)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9 cursor-text"
      />
    </div>
  )
}

export interface FilterOption {
  label: string
  value: string
}

interface DataTableSelectFilterProps<TData> {
  table: Table<TData>
  columnId: string
  placeholder: string
  options: FilterOption[]
  allLabel?: string
  className?: string
}

export function DataTableSelectFilter<TData>({
  table,
  columnId,
  placeholder,
  options,
  allLabel = "All",
  className = "w-full",
}: DataTableSelectFilterProps<TData>) {
  const column = table.getColumn(columnId)
  const filterValue = column?.getFilterValue() as string | undefined

  return (
    <Select
      value={filterValue || "all"}
      onValueChange={(value) =>
        column?.setFilterValue(value === "all" ? undefined : value)
      }
    >
      <SelectTrigger className={`${className} cursor-pointer`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="cursor-pointer">
          {allLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface DataTableFilterSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: FilterOption[]
  className?: string
  disabled?: boolean
  allLabel?: string
}

export function DataTableFilterSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className = "w-full cursor-pointer",
  disabled = false,
  allLabel = "All",
}: DataTableFilterSelectProps) {
  return (
    <Select value={value || "all"} onValueChange={(val) => onValueChange(val === "all" ? "" : val)} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="cursor-pointer">
          {allLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

interface DataTableDateRangeFilterProps<TData> {
  table: Table<TData>
  columnId: string
  placeholder?: string
}

interface DataTableDateRangeFilterControlledProps {
  date?: DateRange
  onDateChange: (date: DateRange | undefined) => void
  className?: string
}

export function DataTableDateRangeFilter<TData>({
  table,
  columnId,
}: DataTableDateRangeFilterProps<TData>) {
  const column = table.getColumn(columnId)
  const dateRange = column?.getFilterValue() as DateRange | undefined

  return (
    <DatePickerWithRange
      date={dateRange}
      onDateChange={(date) => column?.setFilterValue(date)}
    />
  )
}

export function DataTableDateRangeFilterControlled({
  date,
  onDateChange,
  className,
}: DataTableDateRangeFilterControlledProps) {
  return (
    <DatePickerWithRange date={date} onDateChange={onDateChange} className={className} />
  )
}

interface DataTableResetButtonProps<TData> {
  table: Table<TData>
  onReset?: () => void
  disabled?: boolean
  className?: string
}

export function DataTableResetButton<TData>({
  table,
  onReset,
  disabled,
  className = "h-9 px-3 cursor-pointer",
}: DataTableResetButtonProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  const handleReset = () => {
    table.resetColumnFilters()
    table.setGlobalFilter("")
    if (onReset) onReset()
  }

  return (
    <Button
      variant="outline"
      onClick={handleReset}
      className={className}
      disabled={disabled !== undefined ? disabled : !isFiltered}
    >
      <RefreshCcw className="h-4 w-4" />
      <span className="">Reset Filters</span>
    </Button>
  )
}

interface DataTableInfiniteFilterSelectProps {
  value: string | string[]
  onValueChange: (value: any) => void
  onSearchChange?: (value: string) => void
  placeholder: string
  options: FilterOption[]
  allLabel?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  multiple?: boolean
  selectedOptions?: FilterOption[]
}

export function DataTableInfiniteFilterSelect({
  value,
  onValueChange,
  onSearchChange,
  placeholder,
  options,
  allLabel = "All",
  className = "pt-1.5",
  disabled = false,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  multiple = false,
  selectedOptions = [],
}: DataTableInfiniteFilterSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [knownOptions, setKnownOptions] = React.useState<Map<string, string>>(new Map())
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (onSearchChange) onSearchChange(val)
  }

  // Sync known options from initial selections and incoming search results
  React.useEffect(() => {
    setKnownOptions(prev => {
      const next = new Map(prev)
      let changed = false

      options.forEach(opt => {
        if (next.get(opt.value) !== opt.label) {
          next.set(opt.value, opt.label)
          changed = true
        }
      })

      selectedOptions.forEach(opt => {
        if (next.get(opt.value) !== opt.label) {
          next.set(opt.value, opt.label)
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [options, selectedOptions])

  const isSelected = (val: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(val)
    }
    return value === val
  }

  const toggleValue = (val: string) => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(val)
        ? value.filter((v) => v !== val)
        : [...value, val]
      onValueChange(newValue)
    } else {
      onValueChange(val)
      setOpen(false)
    }
  }

  const getLabel = () => {
    const selectedOption = options.find((option) => option.value === value)
    return value && value !== "all" && value !== "" ? selectedOption?.label || value : allLabel
  }

  const removeValue = (val: string, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (multiple && Array.isArray(value)) {
      onValueChange(value.filter((v) => v !== val))
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage || !onLoadMore) return

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      onLoadMore()
    }
  }

  const shouldRenderAllOption =
    !multiple &&
    !searchQuery &&
    Boolean(allLabel?.trim()) &&
    !/^select\b/i.test(allLabel.trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "min-h-9 h-auto w-full justify-between px-3 py-2 text-sm font-normal",
            multiple && Array.isArray(value) && value.length > 0 ? "pt-1.5 pb-1.5" : "",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 overflow-hidden items-center text-left text-[14px]">
            {multiple && Array.isArray(value) && value.length > 0 ? (
              value.map((id) => {
                const label = knownOptions.get(id) || id
                return (
                  <Badge
                    key={`badge-${id}`}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-medium max-w-[150px]"
                  >
                    <span className="truncate">{label}</span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="ml-1 rounded-sm outline-none hover:bg-muted"
                      onClick={(e) => removeValue(id, e)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                    </span>
                  </Badge>
                )
              })
            ) : (
              <span className="truncate">{multiple ? allLabel : getLabel()}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false} className="border-none">
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            onValueChange={handleSearchChange}
          />
          <CommandList
            className="max-h-[300px] overflow-y-auto"
            onScroll={handleScroll}
          >
            {/* Manually handled empty state is now inside the groups below */}
            <>
              {/* Render an explicit "all" row for filter-style usages, but not for form-style "Select ..." labels */}
              {shouldRenderAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onValueChange("")
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "all" || !value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allLabel}
                </CommandItem>
              )}
            </>

            {/* Only show "Current Selection" if there are items */}
            {multiple && Array.isArray(value) && value.length > 0 && (
              <CommandGroup
                heading="Current Selection"
                className="p-1"
              >
                {value.map((id) => {
                  const label = knownOptions.get(id) || id
                  return (
                    <CommandItem
                      key={`selected-${id}`}
                      value={id}
                      onSelect={() => toggleValue(id)}
                      className="cursor-pointer font-semibold bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <Check className="mr-2 h-4 w-4 opacity-100 text-primary" />
                      <span className="truncate flex-1">{label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Render available options without heading text */}
            <CommandGroup
              className="p-1"
            >
              {options.filter(opt => multiple && Array.isArray(value) ? !value.includes(opt.value) : true).length > 0 ? (
                options
                  .filter(opt => multiple && Array.isArray(value) ? !value.includes(opt.value) : true)
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))
              ) : !isLoading && searchQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground select-none pointer-events-none">
                  No results found.
                </div>
              ) : null}
            </CommandGroup>
            {hasNextPage && (
              <div className="flex h-10 items-center justify-center p-2 border-t border-dashed bg-muted/30">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Loader2 className={cn("h-4 w-4 animate-spin text-primary", !isFetchingNextPage && "opacity-50")} />
                  <span>Loading more...</span>
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
