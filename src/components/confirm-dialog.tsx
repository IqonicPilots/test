"use client"

import * as React from "react"
import { AlertCircle, Trash2, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  isLoading?: boolean
  trigger?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
  trigger,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden [&>button]:hidden">
        {/* Exact parity with ResendCredentialsDialog Header */}
        <div className="bg-primary/5 p-6 border-b flex flex-col items-center text-center gap-2">
          <div className="size-16 rounded-full bg-white dark:bg-slate-900 shadow-sm border p-3 mb-2">
            <div className="size-full rounded-full bg-primary/10 flex items-center justify-center text-primary transition-all">
              {variant === "destructive" ? (
                <Trash2 className="size-8" />
              ) : (
                <AlertCircle className="size-8" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground max-w-[320px]">
            {description}
          </DialogDescription>
        </div>

        {/* Exact parity with ResendCredentialsDialog Footer & Buttons */}
        <DialogFooter className="p-4 pt-0 gap-3 sm:gap-3 flex-row px-6 pb-6 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-bold h-11 rounded-xl bg-transparent border-secondary"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={async (e) => {
              e.preventDefault()
              await onConfirm()
            }}
            className="flex-1 font-bold h-11 rounded-xl shadow-lg relative overflow-hidden group"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="inline-flex items-center justify-center gap-2 whitespace-normal text-center">
                {variant === "destructive" ? (
                  <Trash2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                {confirmText}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
