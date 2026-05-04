"use client"

import * as React from "react"
import { Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_OPTIONS = ["Next.js", "SvelteKit", "Nuxt", "Remix", "Astro"]
const DEFAULT_MODEL_VALUE: string[] = []

export interface TagsInputProps {
  options?: string[]
  modelValue?: string[]
  onUpdateModelValue?: (value: string[]) => void
  /** Called when user adds a value not in options (e.g. types and presses Enter). Return the value to add (e.g. label or id) or void to use the typed value. */
  onCreateNew?: (value: string) => Promise<string | void>
  placeholder?: string
  className?: string
  disabled?: boolean
  singleMode?: boolean
  singleValue?: string
  onUpdateSingleValue?: (value: string) => void
  closeOnSelect?: boolean
  onEditOption?: (option: string) => void
  onDeleteOption?: (option: string) => void
  disableOptionActions?: boolean
}

export function TagsInput({
  options = DEFAULT_OPTIONS,
  modelValue = DEFAULT_MODEL_VALUE,
  onUpdateModelValue,
  onCreateNew,
  placeholder = "Type or select...",
  className,
  disabled = false,
  singleMode = false,
  singleValue = "",
  onUpdateSingleValue,
  closeOnSelect = true,
  onEditOption,
  onDeleteOption,
  disableOptionActions = false,
}: TagsInputProps) {
  const [tags, setTags] = React.useState<string[]>(modelValue)
  const [inputValue, setInputValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [isCreating, setIsCreating] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const justSelectedRef = React.useRef(false)

  React.useEffect(() => {
    if (singleMode) {
      setInputValue(singleValue)
    }
  }, [singleValue, singleMode])

  // Sync with modelValue when it changes externally (controlled mode)
  React.useEffect(() => {
    setTags(modelValue)
  }, [modelValue])

  // Use modelValue for display when provided (ensures selected/added items always show)
  const displayTags = onUpdateModelValue ? modelValue : tags

  // Emit changes
  const updateTags = React.useCallback(
    (newTags: string[]) => {
      setTags(newTags)
      onUpdateModelValue?.(newTags)
    },
    [onUpdateModelValue]
  )

  // Filter options: not already selected, and match input (if any)
  const filteredOptions = React.useMemo(() => {
    const lower = inputValue.toLowerCase().trim()
    const currentTags = onUpdateModelValue ? modelValue : tags
    return options.filter(
      (opt) =>
        (singleMode || !currentTags.includes(opt)) &&
        (lower === "" || opt.toLowerCase().includes(lower))
    )
  }, [options, tags, modelValue, inputValue, onUpdateModelValue, singleMode])

  // Reset highlighted index when options change
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions.length])

  const addTag = React.useCallback(
    (value: string) => {
      const trimmed = value.trim()
      
      if (singleMode) {
        setInputValue(value)
        onUpdateSingleValue?.(value)
        justSelectedRef.current = true
        if (closeOnSelect) setIsOpen(false)
        setHighlightedIndex(-1)
        return
      }

      const currentTags = onUpdateModelValue ? modelValue : tags
      if (!trimmed || currentTags.includes(trimmed)) return
      const newTags = [...currentTags, trimmed]
      updateTags(newTags)
      setInputValue("")
      if (closeOnSelect) setIsOpen(false)
      setHighlightedIndex(-1)
    },
    [tags, modelValue, onUpdateModelValue, updateTags, singleMode, onUpdateSingleValue, closeOnSelect]
  )

  const removeTag = React.useCallback(
    (index: number) => {
      const currentTags = onUpdateModelValue ? modelValue : tags
      const newTags = currentTags.filter((_, i) => i !== index)
      updateTags(newTags)
    },
    [tags, modelValue, onUpdateModelValue, updateTags]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        addTag(filteredOptions[highlightedIndex])
        return
      }
      if (inputValue.trim()) {
        const trimmed = inputValue.trim()
        const isNewValue = !options.some((o) => o.toLowerCase() === trimmed.toLowerCase())
        if (isNewValue && onCreateNew) {
          setIsCreating(true)
          setInputValue("")
          onCreateNew(trimmed)
            .then((result) => {
              addTag(typeof result === "string" ? result : trimmed)
            })
            .catch(() => setInputValue(trimmed))
            .finally(() => setIsCreating(false))
        } else {
          addTag(trimmed)
        }
        return
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      )
      return
    }

    if (e.key === "Escape") {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    setIsOpen(true)
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown item
    blurTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 150)
  }

  const handleOptionClick = (opt: string) => {
    addTag(opt)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          data-allow-enter="true"
          placeholder={isCreating ? "Saving..." : placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (singleMode) {
              onUpdateSingleValue?.(e.target.value)
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled || isCreating}
          className="min-w-[120px] flex-1 shrink-0 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 z-[70] mt-1 w-full min-w-full max-h-56 overflow-y-auto rounded-md border border-input bg-popover py-1 shadow-md"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {inputValue.trim()
                ? "No matches. Press Enter to add custom."
                : "All options selected."}
            </div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div
                key={`${opt}-${i}`}
                role="option"
                aria-selected={i === highlightedIndex}
                onClick={() => handleOptionClick(opt)}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors",
                  i === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <span className="truncate">{opt}</span>
                {(onEditOption || onDeleteOption) && !disableOptionActions ? (
                  <div className="flex items-center gap-1">
                    {onEditOption ? (
                      <button
                        type="button"
                        aria-label={`Edit ${opt}`}
                        className="rounded p-1 text-muted-foreground hover:text-primary"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onEditOption(opt)
                          setIsOpen(false)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    ) : null}
                    {onDeleteOption ? (
                      <button
                        type="button"
                        aria-label={`Delete ${opt}`}
                        className="rounded p-1 text-muted-foreground hover:text-destructive"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onDeleteOption(opt)
                          setIsOpen(false)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
