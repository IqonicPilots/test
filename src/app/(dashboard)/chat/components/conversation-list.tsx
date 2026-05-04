"use client"

import { useState } from "react"
import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns"
import {
  Search,
  Pin,
  VolumeX,
  Users,
  Hash,
  UserPlus,
  MessageSquarePlus,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { ChatRequestItem } from "@/services/chat.service"
import { isMessageSeenByPeer } from "../message-read-utils"
import { directPeerAppearsOnline } from "../chat-presence-utils"
import { ChatUserListMeta } from "./chat-user-list-meta"
import { IncomingChatRequests } from "./incoming-chat-requests"
import { useChat, type Conversation } from "../use-chat"
import { usePermissions } from "@/hooks/use-permissions"

interface ConversationListProps {
  /** Logged-in user id — used to resolve the peer in direct threads. */
  currentUserId: string
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (conversationId: string) => void
  onNewChat?: () => void
  /** Patient: open directory to request a new staff chat (always opens dialog). */
  onRequestNewChat?: () => void
  /** Patient UI: "Request chat" in menu */
  patientChatUi?: boolean
  /** Patient has at least one accepted chat and can start messaging. */
  patientCanStartMessage?: boolean
  /** Patient can still request chats with new staff users. */
  patientCanRequestNewChat?: boolean
  incomingRequests?: ChatRequestItem[]
  onAcceptChatRequest?: (requestId: string) => Promise<void>
  onRejectChatRequest?: (requestId: string) => Promise<void>
}

// Enhanced time formatting function
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'h:mm a') // 3:30 PM
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE') // Day name
  } else if (isThisYear(date)) {
    return format(date, 'MMM d') // Jan 15
  } else {
    return format(date, 'dd/MM/yy') // 15/01/24
  }
}

export function ConversationList({
  currentUserId,
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewChat,
  onRequestNewChat,
  patientChatUi = false,
  patientCanStartMessage = false,
  patientCanRequestNewChat = true,
  incomingRequests = [],
  onAcceptChatRequest,
  onRejectChatRequest,
}: ConversationListProps) {
  const [requestsOpen, setRequestsOpen] = useState(false)
  const [patientStartOpen, setPatientStartOpen] = useState(false)
  const { searchQuery, setSearchQuery } = useChat()
  const chatUsers = useChat((s) => s.users)
  const onlineUsers = useChat((s) => s.onlineUsers)

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const { can } = usePermissions()
  const canChat = can("chat_new_message");
  const canRequestChat = can("chat_request");

  const sortedConversations = filteredConversations.sort((a, b) => {
    // Pinned conversations first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Then by last message timestamp
    return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  })

  function directPeerId(conversation: Conversation): string | undefined {
    if (conversation.type !== "direct") return undefined
    const others = conversation.participants.filter((id) => id !== currentUserId)
    return others[0] ?? conversation.participants[0]
  }

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* Header - Hidden on mobile (handled by parent) */}
      <div className="hidden lg:flex flex-col gap-2 px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        {onNewChat || (patientChatUi && onRequestNewChat) ? (
          <div className="flex items-center gap-3">
            {patientChatUi ? (
              <div className="grid w-full gap-2">
                {patientCanStartMessage ? (
                  <Popover open={patientStartOpen} onOpenChange={setPatientStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        className="w-full cursor-pointer"
                      >
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        Start new message
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[320px] p-2">
                      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        Accepted chats
                      </p>
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {sortedConversations.map((conversation) => (
                          <button
                            key={conversation.id}
                            type="button"
                            className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent cursor-pointer"
                            onClick={() => {
                              onSelectConversation(conversation.id)
                              setPatientStartOpen(false)
                            }}
                          >
                            <span className="block truncate font-medium">
                              {conversation.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {(conversation.lastMessage.type === "image" || (conversation.lastMessage.type === "text" && conversation.lastMessage.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$|^https:\/\/res\.cloudinary\.com/i))) ? (
                                "[Image]"
                              ) : conversation.lastMessage.type === "file" ? (
                                "[File]"
                              ) : (
                                conversation.lastMessage.content || "No messages yet"
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : null}

                {patientCanRequestNewChat || !patientCanStartMessage ? (
                  <Button
                    type="button"
                    variant={patientCanStartMessage ? "outline" : "default"}
                    className="w-full cursor-pointer"
                    onClick={() =>
                      (onRequestNewChat ?? onNewChat)?.()
                    }
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Request new chat
                  </Button>
                ) : null}
              </div>
            ) : (
              canChat && (
                <Button
                  type="button"
                  className="flex-1 cursor-pointer"
                  onClick={() => onNewChat?.()}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  New message
                </Button>
              )
            )}
            {!patientChatUi && canRequestChat ? (
              <Popover open={requestsOpen} onOpenChange={setRequestsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
                    aria-label="Open incoming chat requests"
                  >
                    <span>Requests</span>
                    {incomingRequests.length > 0 ? (
                      <span
                        className="h-2 w-2 rounded-full bg-red-500"
                        aria-label={`${incomingRequests.length} pending requests`}
                        title={`${incomingRequests.length} pending requests`}
                      />
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[370px] p-0">
                  {incomingRequests.length > 0 &&
                    onAcceptChatRequest &&
                    onRejectChatRequest ? (
                    <IncomingChatRequests
                      requests={incomingRequests}
                      onAccept={async (requestId) => {
                        await onAcceptChatRequest(requestId)
                        setRequestsOpen(false)
                      }}
                      onReject={onRejectChatRequest}
                    />
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium">Requests</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        No incoming chat requests.
                      </p>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 cursor-text"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        {sortedConversations.length === 0 && searchQuery.trim() ? (
          <div className="min-h-[240px] h-full flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground text-center">
              No data found
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedConversations.map((conversation) => {
            const peerId = directPeerId(conversation)
            const peerUser =
              conversation.type === "direct" && peerId
                ? chatUsers.find((u) => u.id === peerId)
                : undefined
            const peerShowsOnline =
              conversation.type === "direct" &&
              directPeerAppearsOnline(peerUser, onlineUsers)
            const isRowSelected = selectedConversation === conversation.id
            const lastMessageFromMe =
              conversation.lastMessage.senderId === currentUserId
            const lastMessageSeenByPeer =
              lastMessageFromMe &&
              isMessageSeenByPeer(
                conversation.lastMessage.id,
                conversation.peerLastReadMessageId
              )
            return (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer relative overflow-hidden hover:bg-accent/50 transition-colors",
                  selectedConversation === conversation.id
                    ? "bg-accent/70 text-accent-foreground"
                    : ""
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <Avatar className={cn(
                    "h-12 w-12",
                    selectedConversation === conversation.id && "ring-2 ring-background"
                  )}>
                    <AvatarImage
                      src={peerUser?.avatar || conversation.avatar}
                      alt={conversation.name}
                    />
                    <AvatarFallback className="text-sm">
                      {conversation.type === "group" ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        conversation.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online indicator for direct messages */}
                  {peerShowsOnline && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                  )}

                  {/* Group indicator */}
                  {conversation.type === "group" && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 border-2 border-background rounded-full flex items-center justify-center">
                      <Hash className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-1 min-w-0">
                    <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden pr-2">
                      <h3 className="font-medium truncate min-w-0">{conversation.name}</h3>
                      {conversation.isPinned && (
                        <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      {conversation.isMuted && (
                        <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                      {formatMessageTime(conversation.lastMessage.timestamp)}
                    </span>
                  </div>

                  {peerUser ? (
                    <div className="mb-1 min-w-0">
                      <ChatUserListMeta user={peerUser} compact />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate flex-1 min-w-0 pr-2",
                        isRowSelected
                          ? "text-accent-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {(conversation.lastMessage.type === "image" || (conversation.lastMessage.type === "text" && conversation.lastMessage.content.match(/\.(jpg|jpeg|png|gif|webp|svg)$|^https:\/\/res\.cloudinary\.com/i))) ? (
                        <span className="italic">[Image]</span>
                      ) : conversation.lastMessage.type === "file" ? (
                        <span className="italic">[File]</span>
                      ) : (
                        conversation.lastMessage.content
                      )}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {lastMessageFromMe ? (
                        <CheckCheck
                          className={cn(
                            "h-4 w-4 shrink-0 stroke-2",
                            lastMessageSeenByPeer
                              ? "text-primary drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                              : isRowSelected
                                ? "text-accent-foreground/80"
                                : "text-foreground/65 dark:text-zinc-400"
                          )}
                          aria-hidden
                        />
                      ) : null}
                      {conversation.unreadCount > 0 ? (
                        <Badge
                          variant="default"
                          className="min-w-[20px] h-5 text-xs cursor-pointer flex-shrink-0"
                        >
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
