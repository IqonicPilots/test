"use client"

import { useCallback, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

import { getStoredAuthSession } from "@/lib/auth-session"
import { resolveChatSocketUrl } from "@/lib/chat-socket-url"
import { markConversationRead } from "@/services/chat.service"
import { useChat, type Message } from "./use-chat"

type ReceivePayload = {
  conversationId: string
  message: Message
}

export function useChatSocket(selectedConversationId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const selectedRef = useRef(selectedConversationId)
  const joinedRoomRef = useRef<string | null>(null)

  selectedRef.current = selectedConversationId

  const emitSend = useCallback(
    (
      conversationId: string,
      text: string,
      replyToMessageId?: string | null,
      type: "text" | "image" | "file" = "text"
    ): boolean => {
      const socket = socketRef.current
      const trimmed = text.trim()
      if (!socket?.connected || !conversationId || !trimmed) return false
      const payload: {
        conversationId: string
        content: string
        type: string
        replyToMessageId?: string
      } = {
        conversationId,
        content: trimmed,
        type,
      }
      if (replyToMessageId?.trim()) {
        payload.replyToMessageId = replyToMessageId.trim()
      }
      socket.emit("send_message", payload)
      return true
    },
    []
  )

  useEffect(() => {
    const token = getStoredAuthSession()?.accessToken
    if (!token) return

    const socket = io(resolveChatSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    })

    socketRef.current = socket

    const syncRoomOnConnect = () => {
      const id = selectedRef.current
      if (id) {
        socket.emit("join_room", id)
        joinedRoomRef.current = id
      } else {
        joinedRoomRef.current = null
      }
    }

    const onReceive = (data: ReceivePayload) => {
      if (!data?.conversationId || !data?.message) return
      const state = useChat.getState()
      state.addMessage(data.conversationId, data.message)
      if (data.conversationId === state.selectedConversation) {
        void markConversationRead(data.conversationId).then(() => {
          useChat.getState().markAsRead(data.conversationId)
        })
      }
    }

    const onNotification = (data: {
      type?: string
      conversationId?: string
      conversation?: any // Full object from backend
      messageId?: string
      content?: string
      senderId?: string
      timestamp?: string
    }) => {
      if (data?.type !== "chat_message" || !data.conversationId) return
      const state = useChat.getState()

      // Upsert the conversation (especially important for first messages)
      if (data.conversation) {
        state.upsertConversation(data.conversation)
        return // Full object includes latest unread count/snippet, no need to bump manually
      }

      if (data.conversationId === state.selectedConversation) return
      if (!data.content || !data.senderId || !data.timestamp) return

      state.bumpConversationFromSocket({
        conversationId: data.conversationId,
        content: data.content,
        type: (data as any).type,
        senderId: data.senderId,
        timestamp: data.timestamp,
        messageId: data.messageId,
      })
    }

    const onChatError = (payload: { message?: string }) => {
      toast.error(payload?.message || "Chat error")
    }

    const onUserPresence = (data: { userId?: string; online?: boolean }) => {
      if (data?.userId == null) return
      useChat.getState().applyUserPresence(data.userId, Boolean(data.online))
    }

    const onPresenceSnapshot = (data: { onlineUserIds?: string[] }) => {
      if (!Array.isArray(data?.onlineUserIds)) return
      useChat.getState().setOnlineUsersSnapshot(data.onlineUserIds)
    }

    const onConversationRead = (data: {
      conversationId?: string
      readerId?: string
      lastReadMessageId?: string
    }) => {
      if (
        !data.conversationId ||
        !data.readerId ||
        !data.lastReadMessageId
      ) {
        return
      }
      const conv = useChat
        .getState()
        .conversations.find((c) => c.id === data.conversationId)
      if (!conv || conv.type !== "direct") return
      const peerId = conv.participants[0]
      if (!peerId || data.readerId !== peerId) return
      useChat.getState().patchConversation(data.conversationId, {
        peerLastReadMessageId: data.lastReadMessageId,
      })
    }

    const onMessageDeleted = (data: {
      conversationId?: string
      messageId?: string
    }) => {
      if (!data?.conversationId || !data?.messageId) return
      useChat.getState().removeMessage(data.conversationId, data.messageId)
    }

    socket.on("connect", syncRoomOnConnect)
    socket.on("receive_message", onReceive)
    socket.on("chat_notification", onNotification)
    socket.on("chat_error", onChatError)
    socket.on("user_presence", onUserPresence)
    socket.on("presence_snapshot", onPresenceSnapshot)
    socket.on("conversation_read", onConversationRead)
    socket.on("message_deleted", onMessageDeleted)

    return () => {
      socket.off("connect", syncRoomOnConnect)
      socket.off("receive_message", onReceive)
      socket.off("chat_notification", onNotification)
      socket.off("chat_error", onChatError)
      socket.off("user_presence", onUserPresence)
      socket.off("presence_snapshot", onPresenceSnapshot)
      socket.off("conversation_read", onConversationRead)
      socket.off("message_deleted", onMessageDeleted)
      socket.disconnect()
      socketRef.current = null
      joinedRoomRef.current = null
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket?.connected) return
    const prev = joinedRoomRef.current
    const next = selectedConversationId
    if (prev === next) return
    if (prev) socket.emit("leave_room", prev)
    if (next) socket.emit("join_room", next)
    joinedRoomRef.current = next ?? null
  }, [selectedConversationId])

  return { emitSend }
}
