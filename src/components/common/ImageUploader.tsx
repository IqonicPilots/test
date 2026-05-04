"use client"

import * as React from "react"
import { Camera, Trash2, Upload, Info } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ImageUploaderProps = {
  label: string
  value?: File | string | null
  required?: boolean
  accept?: string
  maxFileSizeKb?: number
  variant?: "avatar" | "banner"
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  exactWidth?: number
  exactHeight?: number
  onChange: (value: File | string) => void
  onError?: (message: string) => void
  clearError?: () => void
}

export function ImageUploader({
  label,
  value,
  required = false,
  accept = "image/jpeg,image/gif,image/png",
  maxFileSizeKb = 800,
  variant = "avatar",
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  exactWidth,
  exactHeight,
  onChange,
  onError,
  clearError,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string>("")

  React.useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }

    if (typeof value === "string" && value.trim() !== "") {
      setPreviewUrl(value)
      return
    }

    setPreviewUrl("")
  }, [value])

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const dims = { width: img.width, height: img.height }
        URL.revokeObjectURL(img.src)
        resolve(dims)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error("Failed to load image for validation."))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Improved Type Validation (Mime Type and Extension)
    const allowedTypes = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
    const fileType = file.type.toLowerCase()
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`

    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) return fileExt === type
      if (type.includes('/')) {
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', ''))
        return fileType === type
      }
      return false
    })

    if (allowedTypes.length > 0 && !isAllowed) {
      const msg = `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
      onError?.(msg)
      toast.error(msg)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    if (file.size > maxFileSizeKb * 1024) {
      const msg = `File size must be ${maxFileSizeKb}KB or less (current: ${Math.round(file.size / 1024)}KB).`
      onError?.(msg)
      toast.error(msg)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    // Dimension Validation
    if (minWidth || minHeight || maxWidth || maxHeight || exactWidth || exactHeight) {
      const loadingToastId = toast.loading("Validating image dimensions...")
      try {
        const dimensions = await getImageDimensions(file)
        toast.dismiss(loadingToastId)

        if (exactWidth && dimensions.width !== exactWidth) {
          throw new Error(`Image width must be exactly ${exactWidth}px (current: ${dimensions.width}px).`)
        }
        if (exactHeight && dimensions.height !== exactHeight) {
          throw new Error(`Image height must be exactly ${exactHeight}px (current: ${dimensions.height}px).`)
        }
        if (minWidth && dimensions.width < minWidth) {
          throw new Error(`Image width must be at least ${minWidth}px (current: ${dimensions.width}px).`)
        }
        if (minHeight && dimensions.height < minHeight) {
          throw new Error(`Image height must be at least ${minHeight}px (current: ${dimensions.height}px).`)
        }
        if (maxWidth && dimensions.width > maxWidth) {
          throw new Error(`Image width must be at most ${maxWidth}px (current: ${dimensions.width}px).`)
        }
        if (maxHeight && dimensions.height > maxHeight) {
          throw new Error(`Image height must be at most ${maxHeight}px (current: ${dimensions.height}px).`)
        }
      } catch (err: any) {
        toast.dismiss(loadingToastId)
        const msg = err.message || "Invalid image dimensions."
        onError?.(msg)
        toast.error(msg)
        if (inputRef.current) inputRef.current.value = ""
        return
      }
    }

    clearError?.()
    onChange(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  if (variant === "banner") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold tracking-tight">
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                className="text-muted-foreground/60 transition-colors hover:text-primary outline-none"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground py-2 px-3 shadow-xl max-w-[220px]">
              <div className="space-y-1 text-xs">
                <p className="font-bold">Recommended</p>
                <p className="opacity-80">Use a landscape image for best blog card preview.</p>
                <p className="opacity-80">Max file size: <span className="font-semibold">{maxFileSizeKb}KB</span></p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="group relative h-[220px] w-full max-w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/30 sm:h-[300px] md:h-[380px]"
        >
          {previewUrl ? (
            <img
              key={previewUrl}
              src={previewUrl}
              alt={label}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Camera className="h-8 w-8 opacity-50" />
              <p className="text-xs">Click to upload featured image</p>
            </div>
          )}

          <div className="absolute inset-0 bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                inputRef.current?.click()
              }}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {previewUrl ? "Change Image" : "Upload Image"}
            </Button>
          </div>

          {previewUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/95 border border-border shadow-md text-muted-foreground transition-all duration-200 hover:bg-destructive hover:text-white hover:border-destructive"
              title={`Remove ${label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start lg:items-center">
      <div className="relative group w-fit shrink-0">
        {/* Subtle Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/20 via-transparent to-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />

        <div className="relative size-fit">
          <Avatar className="h-24 w-24 border border-border shadow-sm ring-2 ring-background transition-all duration-300 group-hover:ring-primary/20 bg-background overflow-hidden">
            {previewUrl ? (
              <img
                key={previewUrl}
                src={previewUrl}
                alt={label}
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary flex items-center justify-center">
                <Camera className="h-7 w-7 opacity-20" />
              </AvatarFallback>
            )}
          </Avatar>

          <div
            onClick={() => inputRef.current?.click()}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-full cursor-pointer transition-all duration-300",
              "bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100"
            )}
          >
            <Upload className="h-6 w-6 text-white" />
          </div>

          {/* Refined Quick Remove Button (Improved for both light/dark mode) */}
          {previewUrl && (
            <button
              onClick={handleRemove}
              className="absolute -top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border shadow-md text-muted-foreground transition-all duration-200 hover:bg-destructive hover:text-white hover:border-destructive hover:scale-105 active:scale-95"
              title={`Remove ${label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-tight">
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </h4>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1}
                  onPointerDown={(e) => e.preventDefault()}
                  className="text-muted-foreground/60 transition-colors hover:text-primary outline-none"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border border-border text-popover-foreground py-2 px-3 shadow-xl max-w-[200px]">
                <div className="space-y-1 text-xs">
                  <p className="font-bold flex items-center gap-1.5">Requirements</p>
                  <p className="opacity-80">• Max file size: <span className="font-semibold">{maxFileSizeKb}KB</span></p>
                  <p className="opacity-80">• Allowed: <span className="font-semibold">{accept.split(",").map(t => t.split("/")[1]?.toUpperCase() || t).join(", ")}</span></p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed font-light">
            Personalize your account with {label.toLowerCase()}. Your profile picture will be displayed across the dashboard.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold px-4 cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
          onClick={() => inputRef.current?.click()}
        >
          Select File
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
