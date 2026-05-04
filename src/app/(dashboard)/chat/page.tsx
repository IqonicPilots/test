"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/api/axios"
import { getChatContext } from "@/services/chat.service"
import { Chat } from "./components/chat"
import { useChat } from "./use-chat"
import { useChatContext } from "@/hooks/api/use-chat-api"

import { usePermissions } from "@/hooks/use-permissions"
import { MessageSquare } from "lucide-react"

import { RoleGuard } from "@/components/role-guard"

export default function ChatPage() {
  const { can, isLoading: isPermissionsLoading } = usePermissions()
  const { data: chatContext, isLoading: isChatLoading } = useChatContext()

  useEffect(() => {
    if (chatContext) {
      const { conversations, users } = chatContext
      const store = useChat.getState()
      store.setConversations(conversations)
      store.setUsers(users)
      
      const sel = store.selectedConversation
      if (!sel || !conversations.some((c) => c.id === sel)) {
        store.setSelectedConversation(conversations[0]?.id ?? null)
      }
    }
  }, [chatContext])

  return (
    <RoleGuard permission="chat_access" fallback="forbidden">
      {isChatLoading || isPermissionsLoading ? (
        <div className="flex h-96 items-center justify-center gap-2">
          <span className="h-4 w-4 rounded-full animate-pulse bg-primary" />
          <span className="text-muted-foreground animate-pulse font-medium">Preparing chat environment...</span>
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)] md:h-[calc(100vh-220px)] overflow-hidden flex flex-col px-4">
          <Chat />
        </div>
      )}
    </RoleGuard>
  )
}
