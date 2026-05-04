"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShieldAlert, MailCheck, Loader2 } from "lucide-react"

interface ResendCredentialsDialogProps {
  user: {
    name: string
    email: string
    role?: string
    avatar?: string
  }
  onConfirm: () => Promise<void>
  trigger: React.ReactNode
}

export function ResendCredentialsDialog({
  user,
  onConfirm,
  trigger
}: ResendCredentialsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isBusy, setIsBusy] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setIsBusy(true)
      await onConfirm()
      setIsOpen(false)
    } catch {
      // Error toast is handled by the mutation hook; keep dialog open for retry.
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <span
        onClick={() => setIsOpen(true)}
        style={{ display: "contents" }}
      >
        {trigger}
      </span>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden [&>button]:hidden">
        <div className="bg-primary/5 p-6 border-b flex flex-col items-center text-center gap-2">
          <div className="size-16 rounded-full bg-white dark:bg-slate-900 shadow-sm border p-3 mb-2">
            <div className="size-full rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert className="size-8" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">Resend Login Credentials</DialogTitle>
          <DialogDescription className="text-muted-foreground max-w-[320px]">
            Send a secure email to <strong>{user.email}</strong> allowing them to safely reset their account password.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-accent/20 border border-border/50 sm:gap-4">
            <Avatar className="size-12 shrink-0 border-2 border-background">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="font-bold text-lg bg-primary/5 text-primary">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Target Account</p>
              <h4 className="font-bold text-foreground break-words">{user.name}</h4>
              <p className="text-sm text-foreground/80 break-all">{user.email}</p>
            </div>
            {user.role && (
              <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-primary">
                {user.role}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="w-full flex-col-reverse gap-3 p-4 pt-0 px-6 pb-6 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
            className="h-11 w-full min-w-0 rounded-xl font-bold sm:flex-1"
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="group relative h-11 w-full min-w-0 overflow-hidden rounded-xl font-bold shadow-lg sm:flex-1"
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="inline-flex items-center justify-center gap-2 whitespace-normal text-center">
                <MailCheck className="size-4 shrink-0" />
                Confirm & Resend
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
