"use client"

import { create } from "zustand"

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  status: "online" | "away" | "offline"
  /** ISO string when known; null until presence/activity is tracked */
  lastSeen: string | null
  role: string
  /** Human-readable role from API (e.g. "Clinic admin") */
  roleLabel?: string
  department: string
  /** Populated for receptionist / clinic_admin when clinics are assigned */
  clinicNames?: string[]
}

export interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  type: "text" | "image" | "file"
  isEdited: boolean
  reactions: Array<{
    emoji: string
    users: string[]
    count: number
  }>
  replyTo: string | null
}

export interface Conversation {
  id: string
  type: "direct" | "group"
  participants: string[]
  name: string
  avatar: string
  lastMessage: {
    id: string
    content: string
    type: "text" | "image" | "file"
    timestamp: string
    senderId: string
  }
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
  /** Direct thread: other participant's last read message id (for ticks). From API + `conversation_read` socket. */
  peerLastReadMessageId?: string | null
}

interface ChatState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  users: User[]
  selectedConversation: string | null
  searchQuery: string
  isTyping: Record<string, boolean>
  onlineUsers: string[]
}

interface ChatActions {
  setConversations: (conversations: Conversation[]) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  setUsers: (users: User[]) => void
  upsertConversation: (conversation: Conversation) => void
  mergeUsers: (users: User[]) => void
  patchConversation: (conversationId: string, patch: Partial<Conversation>) => void
  setSelectedConversation: (conversationId: string | null) => void
  setSearchQuery: (query: string) => void
  addMessage: (conversationId: string, message: Message) => void
  markAsRead: (conversationId: string) => void
  togglePin: (conversationId: string) => void
  toggleMute: (conversationId: string) => void
  setTyping: (conversationId: string, isTyping: boolean) => void
  setOnlineUsers: (userIds: string[]) => void
  /** Full replace from socket `presence_snapshot` (users already online before you connected). */
  setOnlineUsersSnapshot: (userIds: string[]) => void
  applyUserPresence: (userId: string, online: boolean) => void
  removeConversation: (conversationId: string) => void
  /** Sidebar + unread when a message arrives on another thread (socket `chat_notification`). */
  bumpConversationFromSocket: (payload: {
    conversationId: string
    content: string
    senderId: string
    timestamp: string
    type?: "text" | "image" | "file"
    messageId?: string
  }) => void
  removeMessage: (conversationId: string, messageId: string) => void
}

export const useChat = create<ChatState & ChatActions>((set, get) => ({
  // State
  conversations: [],
  messages: {},
  users: [],
  selectedConversation: null,
  searchQuery: "",
  isTyping: {},
  onlineUsers: [],

  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setMessages: (conversationId, messages) => 
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages }
    })),
  
  setUsers: (users) => set({ users }),

  upsertConversation: (conversation) =>
    set((state) => {
      const filtered = state.conversations.filter((c) => c.id !== conversation.id)
      return { conversations: [conversation, ...filtered] }
    }),

  mergeUsers: (incoming) =>
    set((state) => {
      const byId = new Map(state.users.map((u) => [u.id, u]))
      incoming.forEach((u) => byId.set(u.id, u))
      return { users: [...byId.values()] }
    }),

  patchConversation: (conversationId, patch) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ...patch } : c
      )
    })),

  setSelectedConversation: (conversationId) => {
    set({ selectedConversation: conversationId })
    if (conversationId) {
      get().markAsRead(conversationId)
    }
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || []
      if (existing.some((m) => m.id === message.id)) return state
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message]
        },
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  type: message.type,
                  timestamp: message.timestamp,
                  senderId: message.senderId
                }
              }
            : conv
        )
      }
    }),

  bumpConversationFromSocket: (payload) =>
    set((state) => {
      if (!state.conversations.some((c) => c.id === payload.conversationId)) {
        return state
      }
      return {
        conversations: state.conversations.map((c) => {
          if (c.id !== payload.conversationId) return c
          return {
            ...c,
            lastMessage: {
              id: payload.messageId || `notif-${payload.timestamp}`,
              content: payload.content,
              type: payload.type || "text",
              timestamp: payload.timestamp,
              senderId: payload.senderId
            },
            unreadCount: c.unreadCount + 1
          }
        })
      }
    }),
  
  markAsRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    })),
  
  togglePin: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      )
    })),
  
  toggleMute: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: !conv.isMuted } : conv
      )
    })),
  
  setTyping: (conversationId, isTyping) =>
    set((state) => ({
      isTyping: { ...state.isTyping, [conversationId]: isTyping }
    })),
  
  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  setOnlineUsersSnapshot: (userIds) =>
    set({ onlineUsers: [...new Set(userIds)] }),

  applyUserPresence: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      if (online) next.add(userId)
      else next.delete(userId)
      return { onlineUsers: [...next] }
    }),

  removeConversation: (conversationId) =>
    set((state) => {
      const { [conversationId]: _, ...remainingMessages } = state.messages
      return {
        conversations: state.conversations.filter((c) => c.id !== conversationId),
        messages: remainingMessages,
        selectedConversation:
          state.selectedConversation === conversationId
            ? null
            : state.selectedConversation,
      }
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => {
      const existing = state.messages[conversationId] || []
      const filtered = existing.filter((m) => m.id !== messageId)

      let nextConversations = state.conversations
      const conv = state.conversations.find((c) => c.id === conversationId)

      if (conv && conv.lastMessage?.id === messageId) {
        const newLast = filtered[filtered.length - 1]
        nextConversations = state.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: newLast
                  ? {
                      id: newLast.id,
                      content: newLast.content,
                      type: newLast.type,
                      timestamp: newLast.timestamp,
                      senderId: newLast.senderId,
                    }
                  : {
                      id: "none",
                      content: "No messages yet",
                      type: "text",
                      timestamp: new Date().toISOString(),
                      senderId: "",
                    },
              }
            : c
        )
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: filtered,
        },
        conversations: nextConversations,
      }
    }),
}))
