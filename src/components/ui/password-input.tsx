"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

import { Input } from "@/components/ui/input"

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={isVisible ? "text" : "password"}
          className={cn("pr-11", className)}
          disabled={disabled}
          placeholder="Enter password"
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          onMouseDown={(event) => event.preventDefault()}
          disabled={disabled}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute top-1/2 right-1 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
        >
          {isVisible ? (
            <EyeOff className="size-4 shrink-0" strokeWidth={2} />
          ) : (
            <Eye className="size-4 shrink-0" strokeWidth={2} />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
