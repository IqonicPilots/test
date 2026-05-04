import { api } from "@/lib/api/axios"
import type { Conversation, Message, User } from "@/app/(dashboard)/chat/use-chat"

type ApiEnvelope<T> = {
  data?: T
  message?: string
  statusCode?: number
  success?: boolean
}

export type ChatRequestItem = {
  id: string
  status: string
  createdAt: string
  conversationId: string | null
  from: User | null
  to: User | null
}

export async function getChatContext(): Promise<{
  conversations: Conversation[]
  users: User[]
}> {
  const response = await api.get<
    ApiEnvelope<{ conversations: Conversation[]; users: User[] }>
  >("/chat/conversations")
  const payload = response.data.data
  if (!payload?.conversations || !payload.users) {
    return { conversations: [], users: [] }
  }
  return {
    conversations: payload.conversations,
    users: payload.users,
  }
}

export type ChatDirectoryRoleOption = {
  value: string
  label: string
}

export type ChatDirectoryFiltersResponse = {
  roles: ChatDirectoryRoleOption[]
  clinics: { id: string; name: string }[]
}

export async function getChatDirectoryFilters(): Promise<ChatDirectoryFiltersResponse> {
  const response = await api.get<ApiEnvelope<ChatDirectoryFiltersResponse>>(
    "/chat/directory/filters"
  )
  return (
    response.data.data ?? {
      roles: [],
      clinics: [],
    }
  )
}

export async function getChatDirectory(params?: {
  q?: string
  limit?: number
  roles?: string[]
  clinicId?: string
}) {
  const search = new URLSearchParams()
  if (params?.q) search.set("q", params.q)
  if (params?.limit) search.set("limit", String(params.limit))
  if (params?.roles?.length) search.set("roles", params.roles.join(","))
  if (params?.clinicId) search.set("clinicId", params.clinicId)
  const qs = search.toString()
  const response = await api.get<ApiEnvelope<{ users: User[] }>>(
    `/chat/directory${qs ? `?${qs}` : ""}`
  )
  return response.data.data?.users ?? []
}

export async function createChatRequest(toUserId: string) {
  const response = await api.post<ApiEnvelope<{ request: ChatRequestItem }>>(
    "/chat/requests",
    { toUserId }
  )
  return response.data.data?.request
}

export async function listIncomingChatRequests() {
  const response = await api.get<ApiEnvelope<{ requests: ChatRequestItem[] }>>(
    "/chat/requests/incoming"
  )
  return response.data.data?.requests ?? []
}

export async function listOutgoingChatRequests() {
  const response = await api.get<ApiEnvelope<{ requests: ChatRequestItem[] }>>(
    "/chat/requests/outgoing"
  )
  return response.data.data?.requests ?? []
}

export async function acceptChatRequest(requestId: string) {
  const response = await api.patch<
    ApiEnvelope<{ conversation: Conversation; request: ChatRequestItem }>
  >(`/chat/requests/${requestId}/accept`)
  const data = response.data.data
  if (!data?.conversation) {
    throw new Error("Failed to accept request")
  }
  return data
}

export async function rejectChatRequest(requestId: string) {
  await api.patch(`/chat/requests/${requestId}/reject`)
}

export async function startChatWithFirstMessage(body: {
  recipientId: string
  content: string
  type?: "text" | "image" | "file"
}) {
  const response = await api.post<
    ApiEnvelope<{ conversation: Conversation; message: Message }>
  >("/chat/start", body)
  const data = response.data.data
  if (!data?.conversation || !data.message) {
    throw new Error("Failed to start chat")
  }
  return data
}

export async function getConversationMessages(
  conversationId: string,
  params?: { limit?: number }
) {
  const search = new URLSearchParams()
  if (params?.limit) search.set("limit", String(params.limit))
  const qs = search.toString()
  const response = await api.get<ApiEnvelope<{ messages: Message[] }>>(
    `/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`
  )
  return response.data.data?.messages ?? []
}

export async function sendChatMessage(
  conversationId: string,
  body: {
    content: string
    type?: "text" | "image" | "file"
    replyTo?: string | null
  }
) {
  const response = await api.post<ApiEnvelope<{ message: Message }>>(
    `/chat/conversations/${conversationId}/messages`,
    body
  )
  const message = response.data.data?.message
  if (!message) {
    throw new Error("Failed to send message")
  }
  return message
}

export async function markConversationRead(conversationId: string) {
  await api.patch(`/chat/conversations/${conversationId}/read`)
}

export async function toggleConversationMute(conversationId: string) {
  const response = await api.patch<ApiEnvelope<{ isMuted: boolean }>>(
    `/chat/conversations/${conversationId}/mute`
  )
  return response.data.data?.isMuted
}

export async function toggleConversationPin(conversationId: string) {
  const response = await api.patch<ApiEnvelope<{ isPinned: boolean }>>(
    `/chat/conversations/${conversationId}/pin`
  )
  return response.data.data?.isPinned
}

export async function deleteConversation(conversationId: string) {
  await api.delete(`/chat/conversations/${conversationId}`)
}

export async function deleteChatMessage(
  conversationId: string,
  messageId: string
) {
  await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`)
}

export async function uploadChatFile(file: File) {
  const formData = new FormData()
  formData.append("chatFile", file)
  const response = await api.post<ApiEnvelope<{ url: string }>>(
    "/chat/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  return response.data.data?.url
}
