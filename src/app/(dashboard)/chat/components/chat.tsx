"use client"

import { useCallback, useEffect, useState } from "react"
import { Menu, MessageSquarePlus, X } from "lucide-react"
import { toast } from "sonner"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useAuthRole } from "@/hooks/use-auth-role"
import { usePermissions } from "@/hooks/use-permissions"
import { getCurrentUserIdFromSession } from "@/lib/auth-session"
import { getApiErrorMessage } from "@/lib/api/axios"
import {
  acceptChatRequest,
  getChatDirectory,
  getConversationMessages,
  listIncomingChatRequests,
  markConversationRead,
  rejectChatRequest,
  sendChatMessage,
  toggleConversationMute,
  deleteConversation,
} from "@/services/chat.service"
import type { ChatRequestItem } from "@/services/chat.service"
import { ConversationList } from "./conversation-list"
import { ChatHeader } from "./chat-header"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { NewChatDialog } from "./new-chat-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useChat, type Message } from "../use-chat"
import { useChatSocket } from "../use-chat-socket"

export function Chat() {
  const { role, isRoleReady } = useAuthRole()
  const { can } = usePermissions()
  const isPatient = isRoleReady && role === "patient"

  const selectedConversation = useChat((s) => s.selectedConversation)
  const setSelectedConversation = useChat((s) => s.setSelectedConversation)
  const conversations = useChat((s) => s.conversations)
  const messages = useChat((s) => s.messages)
  const users = useChat((s) => s.users)
  const setMessages = useChat((s) => s.setMessages)
  const addMessage = useChat((s) => s.addMessage)
  const markAsRead = useChat((s) => s.markAsRead)
  const patchConversation = useChat((s) => s.patchConversation)
  const upsertConversation = useChat((s) => s.upsertConversation)
  const mergeUsers = useChat((s) => s.mergeUsers)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [incomingRequests, setIncomingRequests] = useState<ChatRequestItem[]>(
    []
  )
  const [patientCanRequestNewChat, setPatientCanRequestNewChat] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const currentUserId = getCurrentUserIdFromSession() ?? "current-user"

  const { emitSend } = useChatSocket(selectedConversation)
  const closeSidebarOnMobile = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [])

  const refreshIncoming = useCallback(async () => {
    if (!isRoleReady || isPatient || !role) {
      setIncomingRequests([])
      return
    }
    try {
      const list = await listIncomingChatRequests()
      setIncomingRequests(list)
    } catch {
      setIncomingRequests([])
    }
  }, [isRoleReady, isPatient, role])

  useEffect(() => {
    void refreshIncoming()
  }, [refreshIncoming])

  useEffect(() => {
    if (!isRoleReady || !isPatient) {
      setPatientCanRequestNewChat(true)
      return
    }

    let cancelled = false
      ; (async () => {
        try {
          const users = await getChatDirectory({ limit: 200 })
          if (cancelled) return

          const existingPeerIds = new Set(
            conversations
              .filter((c) => c.type === "direct")
              .map((c) => c.participants.find((id) => id !== currentUserId))
              .filter((id): id is string => Boolean(id))
          )

          const requestableUsers = users.filter((u) => !existingPeerIds.has(u.id))
          setPatientCanRequestNewChat(requestableUsers.length > 0)
        } catch {
          if (!cancelled) setPatientCanRequestNewChat(true)
        }
      })()

    return () => {
      cancelled = true
    }
  }, [isRoleReady, isPatient, conversations, currentUserId])

  useEffect(() => {
    if (!isRoleReady || isPatient || !role) return

    const id = window.setInterval(() => {
      void refreshIncoming()
    }, 8000)

    const onFocus = () => {
      void refreshIncoming()
    }

    window.addEventListener("focus", onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
  }, [isRoleReady, isPatient, role, refreshIncoming])

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].id)
    }
  }, [conversations, selectedConversation, setSelectedConversation])

  useEffect(() => {
    setReplyingTo(null)
  }, [selectedConversation])

  useEffect(() => {
    if (!selectedConversation) return
    let cancelled = false
      ; (async () => {
        try {
          await markConversationRead(selectedConversation)
          if (cancelled) return
          markAsRead(selectedConversation)
          const msgs = await getConversationMessages(selectedConversation)
          if (cancelled) return
          setMessages(selectedConversation, msgs)
        } catch (e) {
          if (!cancelled) {
            toast.error(getApiErrorMessage(e))
          }
        }
      })()
    return () => {
      cancelled = true
    }
  }, [selectedConversation, setMessages, markAsRead])

  const currentConversation = conversations.find(
    (conv) => conv.id === selectedConversation
  )
  const currentMessages = selectedConversation
    ? messages[selectedConversation] || []
    : []
  const patientCanStartMessage = isPatient && conversations.length > 0

  const handlePrimaryNewAction = () => {
    if (patientCanStartMessage) {
      const target = selectedConversation ?? conversations[0]?.id
      if (target) {
        setSelectedConversation(target)
      }
      closeSidebarOnMobile()
      return
    }
    setNewChatOpen(true)
  }

  const handleSendMessage = async (
    content: string,
    type: "text" | "image" | "file" = "text"
  ) => {
    if (!selectedConversation) return
    const replyId = replyingTo?.id?.trim() || null
    if (emitSend(selectedConversation, content, replyId, type)) {
      setReplyingTo(null)
      return
    }
    try {
      const message = await sendChatMessage(selectedConversation, {
        content,
        type,
        replyTo: replyId,
      })
      addMessage(selectedConversation, message)
      setReplyingTo(null)
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  const handleToggleMute = async () => {
    if (!selectedConversation) return
    try {
      const isMuted = await toggleConversationMute(selectedConversation)
      if (typeof isMuted === "boolean") {
        patchConversation(selectedConversation, { isMuted })
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { conversation } = await acceptChatRequest(requestId)
      const req = incomingRequests.find((r) => r.id === requestId)
      if (req?.from) {
        mergeUsers([req.from])
      }
      upsertConversation(conversation)
      setSelectedConversation(conversation.id)
      closeSidebarOnMobile()
      await refreshIncoming()
      toast.success("Chat request accepted")
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedConversation) return
    setIsDeleting(true)
    try {
      await deleteConversation(selectedConversation)
      const idToDelete = selectedConversation
      useChat.getState().removeConversation(idToDelete)
      toast.success("Conversation deleted")
      setShowDeleteConfirm(false)
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectChatRequest(requestId)
      await refreshIncoming()
      toast.success("Request declined")
    } catch (e) {
      toast.error(getApiErrorMessage(e))
    }
  }

  const canHandleIncomingRequests = isRoleReady && !isPatient && can("chat_request")

  return (
    <TooltipProvider delayDuration={0}>
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        mode={isPatient ? "patient" : "staff"}
        onStaffChatStarted={(conversation, peer, message) => {
          mergeUsers([peer])
          upsertConversation(conversation)
          setMessages(conversation.id, [message])
          setSelectedConversation(conversation.id)
          closeSidebarOnMobile()
        }}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Conversation?"
        description="This will permanently delete all messages and the conversation record. If you are a patient, you will need to send a new chat request to talk with this person again."
      />
      <div className="flex-1 min-h-0 flex rounded-none md:rounded-lg border overflow-hidden bg-background">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`
          w-full max-w-[24rem] lg:w-[24rem] lg:max-w-none border-r bg-background flex-shrink-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          lg:relative lg:block
          fixed inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          flex flex-col min-h-0
        `}
        >
          <div className="lg:hidden p-4 border-b flex items-center justify-between gap-2 bg-background flex-shrink-0">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center gap-1 shrink-0">
              {((isPatient && can("chat_request")) || (!isPatient && can("chat_add"))) && (
                <Button
                  type="button"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    handlePrimaryNewAction()
                  }}
                >
                  <MessageSquarePlus className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline text-xs">
                    {isPatient
                      ? patientCanStartMessage
                        ? "Start"
                        : "Request"
                      : "New"}
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
                className="cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ConversationList
            currentUserId={currentUserId}
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={(id) => {
              setSelectedConversation(id)
              closeSidebarOnMobile()
            }}
            onNewChat={handlePrimaryNewAction}
            onRequestNewChat={
              isPatient ? () => setNewChatOpen(true) : undefined
            }
            patientChatUi={isPatient}
            patientCanStartMessage={patientCanStartMessage}
            patientCanRequestNewChat={isPatient ? patientCanRequestNewChat : true}
            incomingRequests={canHandleIncomingRequests ? incomingRequests : []}
            onAcceptChatRequest={
              canHandleIncomingRequests ? handleAcceptRequest : undefined
            }
            onRejectChatRequest={
              canHandleIncomingRequests ? handleRejectRequest : undefined
            }
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
          <div className="flex items-center h-16 px-4 border-b bg-background flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="cursor-pointer lg:hidden mr-2"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                users={users}
                conversationMessages={currentMessages}
                onToggleMute={handleToggleMute}
                onDeleteConversation={() => setShowDeleteConfirm(true)}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {selectedConversation ? (
              <>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <MessageList
                    messages={currentMessages}
                    users={users}
                    currentUserId={currentUserId}
                    peerLastReadMessageId={
                      currentConversation?.peerLastReadMessageId ?? null
                    }
                    onReply={setReplyingTo}
                  />
                </div>

                <div className="flex-shrink-0 bg-background">
                  <MessageInput
                    onSendMessage={(text, type) => void handleSendMessage(text, type)}
                    placeholder={`Message ${currentConversation?.name || ""}...`}
                    replyingTo={
                      replyingTo
                        ? {
                          id: replyingTo.id,
                          preview: replyingTo.content,
                          authorName:
                            replyingTo.senderId === currentUserId
                              ? "You"
                              : users.find((u) => u.id === replyingTo.senderId)
                                ?.name ?? "User",
                        }
                        : null
                    }
                    onCancelReply={() => setReplyingTo(null)}
                    lastMessageContent={
                      currentMessages.length > 0
                        ? currentMessages[currentMessages.length - 1]?.content ??
                        null
                        : null
                    }
                    conversationTitle={currentConversation?.name ?? null}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-sm space-y-4">
                  <h3 className="text-lg font-semibold">Welcome to Chat</h3>
                  <p className="text-muted-foreground text-sm">
                    {isPatient
                      ? "When a staff member messages you, or accepts your chat request, the conversation will appear here."
                      : "Open an existing thread from the list, or start a new message."}
                  </p>
                  {((isPatient && can("chat_request")) || (!isPatient && can("chat_new_message"))) && (
                    <Button
                      type="button"
                      className="cursor-pointer"
                      onClick={handlePrimaryNewAction}
                    >
                      <MessageSquarePlus className="h-4 w-4 mr-2" />
                      {isPatient
                        ? patientCanStartMessage
                          ? "Start new message"
                          : "Request chat"
                        : "New message"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
