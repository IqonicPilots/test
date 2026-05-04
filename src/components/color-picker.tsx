"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RotateCcw } from "lucide-react"

interface ColorPickerProps {
  label: string
  cssVar: string
  value: string
  onChange: (cssVar: string, value: string) => void
}

export function ColorPicker({ label, cssVar, value, onChange }: ColorPickerProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleColorInput = React.useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const newColor = e.currentTarget.value
    setLocalValue(newColor)
    onChange(cssVar, newColor)
  }, [cssVar, onChange])

  const handleTextChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(cssVar, newValue)
  }, [cssVar, onChange])

  // Get current computed color for display
  const displayColor = React.useMemo(() => {
    if (typeof window === 'undefined') return '#000000'

    // 1. If it's already a valid hex, use it
    if (localValue && /^#([A-Fa-f0-9]{3}){1,2}$/.test(localValue)) {
      return localValue
    }

    // 2. Try to resolve via a temporary canvas
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return '#000000'

      const colorToResolve = localValue || getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || 'transparent'
      ctx.fillStyle = colorToResolve
      return ctx.fillStyle
    } catch (e) {
      console.error("Failed to resolve color:", e)
    }

    return '#000000'
  }, [localValue, cssVar])

  const handleReset = React.useCallback(() => {
    setLocalValue("")
    onChange(cssVar, "")
  }, [cssVar, onChange])

  return (
    <div className="space-y-1.5 w-full group/picker">
      <div className="flex items-center justify-between px-0.5">
        <label htmlFor={`color-${cssVar}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 group-hover/picker:text-primary/80 transition-colors">
          {label}
        </label>
        {(localValue || getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
            onClick={handleReset}
            title="Reset to default"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex items-stretch gap-0 relative rounded-lg border border-border bg-background/50 overflow-hidden hover:border-primary/40 focus-within:border-primary transition-all shadow-sm">
        <div className="relative w-10 shrink-0 border-r border-border bg-muted/30 flex items-center justify-center group-hover/picker:bg-muted/50 transition-colors">
          <input
            type="color"
            id={`color-${cssVar}`}
            value={displayColor}
            onInput={handleColorInput}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
          />
          <div
            className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
            style={{ backgroundColor: displayColor }}
          />
        </div>
        <Input
          type="text"
          placeholder={`${cssVar}`}
          value={localValue}
          onChange={handleTextChange}
          className="h-9 border-none bg-transparent text-[11px] flex-1 font-mono focus-visible:ring-0 rounded-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  )
}
