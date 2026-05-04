"use client"

import { useMemo, useState } from "react"
import {
  Search,
  MoreVertical,
  Users,
  Bell,
  BellOff,
  Info,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  directPeerAppearsOnline,
  formatLastSeenLabel,
} from "../chat-presence-utils"
import { ChatUserListMeta } from "./chat-user-list-meta"
import { useChat, type Conversation, type Message, type User } from "../use-chat"

interface ChatHeaderProps {
  conversation: Conversation | null
  users: User[]
  /** Messages in the active thread (for in-conversation search). */
  conversationMessages?: Message[]
  onToggleMute?: () => void
  onToggleInfo?: () => void
  onDeleteConversation?: () => void
}

export function ChatHeader({
  conversation,
  users,
  conversationMessages = [],
  onToggleMute,
  onToggleInfo,
  onDeleteConversation,
}: ChatHeaderProps) {
  const onlineUsers = useChat((s) => s.onlineUsers)
  const [searchOpen, setSearchOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || !conversationMessages.length) return []
    return conversationMessages.filter((m) =>
      m.content.toLowerCase().includes(q)
    )
  }, [conversationMessages, searchQuery])

  async function copyMessageText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Message copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  const handleOpenConversationInfo = () => {
    setInfoOpen(true)
    onToggleInfo?.()
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a conversation to start chatting
        </p>
      </div>
    )
  }

  const getConversationUsers = () => {
    return users.filter((user) =>
      conversation.participants.includes(user.id)
    )
  }

  const conversationUsers = getConversationUsers()
  const primaryUser = conversationUsers[0]

  const peerOnline =
    conversation.type === "direct" && primaryUser
      ? directPeerAppearsOnline(primaryUser, onlineUsers)
      : false

  const getStatusText = () => {
    if (conversation.type === "group") {
      const onlineCount = conversationUsers.filter((user) =>
        directPeerAppearsOnline(user, onlineUsers)
      ).length
      return `${conversation.participants.length} members, ${onlineCount} online`
    }
    if (primaryUser) {
      if (peerOnline || primaryUser.status === "online") {
        return "Active now"
      }
      if (primaryUser.status === "away") {
        return "Away"
      }
      const seen = formatLastSeenLabel(primaryUser.lastSeen)
      return seen ? `Last seen ${seen}` : "Offline"
    }
    return ""
  }

  const getStatusColor = () => {
    if (conversation.type === "group") return "text-muted-foreground"

    if (peerOnline || primaryUser?.status === "online") {
      return "text-green-600 dark:text-green-400"
    }
    if (primaryUser?.status === "away") {
      return "text-yellow-600 dark:text-yellow-500"
    }
    return "text-muted-foreground"
  }

  return (
    <div className="flex items-center justify-between h-full">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="h-10 w-10 cursor-pointer" onClick={handleOpenConversationInfo}>
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>
              {conversation.type === "group" ? (
                <Users className="h-5 w-5" />
              ) : (
                conversation.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              )}
            </AvatarFallback>
          </Avatar>
          {conversation.type === "direct" && peerOnline ? (
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{conversation.name}</h2>
            {conversation.isMuted && (
              <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {conversation.type === "group" && (
              <Badge variant="secondary" className="text-xs cursor-pointer shrink-0">
                Group
              </Badge>
            )}
          </div>
          {conversation.type === "direct" && primaryUser ? (
            <>
              <ChatUserListMeta user={primaryUser} compact />
              <p className={`text-xs mt-0.5 ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </>
          ) : (
            <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TooltipProvider>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <Search className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search in conversation</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-3" align="end">
              <p className="text-sm font-medium mb-2">Search in conversation</p>
              <Input
                placeholder="Search message text…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cursor-text"
              />
              <ScrollArea className="h-48 mt-2 rounded-md border">
                <div className="p-1">
                  {!searchQuery.trim() ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Type to find messages in this chat.
                    </p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      No matching messages.
                    </p>
                  ) : (
                    searchResults.map((m) => (
                      <div
                        key={m.id}
                        className="flex gap-2 items-start p-2 text-xs border-b last:border-b-0"
                      >
                        <p className="flex-1 line-clamp-3 break-words">
                          {m.content}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 cursor-pointer"
                          onClick={() => void copyMessageText(m.content)}
                          aria-label="Copy message"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenConversationInfo}
                className="cursor-pointer"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Conversation info</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onToggleMute} className="cursor-pointer">
              {conversation.isMuted ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Unmute conversation
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Mute conversation
                </>
              )}
            </DropdownMenuItem>
            {conversation.type === "group" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Manage members
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteConversation}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Conversation Info</DialogTitle>
            <DialogDescription>
              Details about your chat partner
            </DialogDescription>
          </DialogHeader>
          {primaryUser && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24 border-2 border-primary/10">
                <AvatarImage src={primaryUser.avatar} alt={primaryUser.name} />
                <AvatarFallback className="text-2xl">
                  {primaryUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold">{primaryUser.name}</h3>
                <p className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                  {primaryUser.roleLabel || primaryUser.role}
                </p>
                <p className="text-xs text-muted-foreground">{primaryUser.email}</p>
                {primaryUser.department && (
                  <p className="text-xs font-medium text-muted-foreground mt-2">
                    Department: <span className="text-foreground">{primaryUser.department}</span>
                  </p>
                )}
                {primaryUser.clinicNames && primaryUser.clinicNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {primaryUser.clinicNames.map(name => (
                      <Badge key={name} variant="outline" className="text-[10px] py-0">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full h-px bg-border my-2" />
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={cn("font-medium", getStatusColor())}>{getStatusText()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Muted</span>
                  <span className="font-medium">{conversation.isMuted ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pinned</span>
                  <span className="font-medium">{conversation.isPinned ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
