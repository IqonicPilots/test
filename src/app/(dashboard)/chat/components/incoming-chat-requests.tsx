"use client"

import { useState } from "react"

import type { ChatRequestItem } from "@/services/chat.service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChatUserListMeta } from "./chat-user-list-meta"

type IncomingChatRequestsProps = {
  requests: ChatRequestItem[]
  onAccept: (requestId: string) => Promise<void>
  onReject: (requestId: string) => Promise<void>
}

export function IncomingChatRequests({
  requests,
  onAccept,
  onReject,
}: IncomingChatRequestsProps) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (!requests.length) {
    return null
  }

  return (
    <div className="border-b bg-muted/30 px-3 py-2 space-y-2 flex-shrink-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Chat requests
      </p>
      {requests.map((req) => {
        const from = req.from
        if (!from) return null
        return (
          <div
            key={req.id}
            className="flex items-center gap-2 rounded-md border bg-background p-2"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={from.avatar} alt={from.name} />
              <AvatarFallback className="text-xs">
                {from.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-medium truncate">{from.name}</p>
              <ChatUserListMeta user={from} />
              <p className="text-xs text-muted-foreground truncate">
                Wants to chat with you
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs cursor-pointer"
                disabled={busyId !== null}
                onClick={() => {
                  setBusyId(req.id)
                  void onReject(req.id).finally(() => setBusyId(null))
                }}
              >
                Decline
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs cursor-pointer"
                disabled={busyId !== null}
                onClick={() => {
                  setBusyId(req.id)
                  void onAccept(req.id).finally(() => setBusyId(null))
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
