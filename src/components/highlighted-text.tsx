"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface HighlightedTextProps {
  text: string
  className?: string
  highlightClassName?: string
  highlightColor?: string
}

/**
 * Parses text and highlights parts wrapped in curly braces {like this}.
 * Use case: "Run Your {Clinic} Smarter" -> "Clinic" will be highlighted.
 */
export function HighlightedText({ text, className, highlightClassName, highlightColor }: HighlightedTextProps) {
  if (!text) return null

  // Regex to find text between curly braces
  const parts = text.split(/(\{.*?\})/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          const content = part.slice(1, -1)
          return (
            <span 
              key={index} 
              className={cn(!highlightColor && "text-primary", highlightClassName)}
              style={{ color: highlightColor || undefined }}
            >
              {content}
            </span>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}
