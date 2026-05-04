"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MultiSelectOption = {
  label: string
  value: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select options",
  emptyText = "No results found.",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) => value?.includes(option.value))

  function toggleSelection(optionValue: string) {
    if (value?.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue))
      return
    }

    onChange([...value, optionValue])
  }

  function removeSelection(optionValue: string, event: React.MouseEvent | React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    onChange(value.filter((item) => item !== optionValue))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "min-h-10 w-full justify-between px-3 py-2 font-normal",
            selectedOptions.length > 0 ? "h-auto" : "",
            className
          )}
        >
          <div className="flex min-h-5 flex-1 flex-wrap gap-1 text-left">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge key={option.value} variant="secondary" className="gap-1">
                  {option.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    className="rounded-sm outline-hidden hover:bg-muted"
                    onClick={(event) => removeSelection(option.value, event)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }}
                  >
                    <X className="size-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command className="border-none" shouldFilter={true}>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandGroup className="p-1">
              {options.length > 0 ? (
                options.map((option) => {
                  const isSelected = value?.includes(option.value)

                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      onSelect={() => toggleSelection(option.value)}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Check
                        className={cn(
                          "ml-2 size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground select-none pointer-events-none">
                  {emptyText}
                </div>
              )}
              <CommandEmpty className="hidden" />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
