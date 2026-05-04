import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const presetColors = {
  default: "text-muted-foreground dark:text-white hover:text-foreground hover:bg-muted",
  red: "text-red-500 dark:text-red-400 hover:bg-red-500/10",
  blue: "text-blue-500 dark:text-blue-400 hover:bg-blue-500/10",
  orange: "text-orange-500 dark:text-orange-400 hover:bg-orange-500/10",
  yellow: "text-yellow-500 dark:text-yellow-400 hover:bg-yellow-500/10",
  green: "text-green-500 dark:text-green-400 hover:bg-green-500/10",
  purple: "text-purple-500 dark:text-purple-400 hover:bg-purple-500/10",
} as const

type ActionColor = keyof typeof presetColors

interface ActionIconButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {
  color?: ActionColor
}

export function ActionIconButton({
  color = "default",
  className,
  children,
  ...props
}: ActionIconButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 cursor-pointer [&_svg]:size-4",
        presetColors[color],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
