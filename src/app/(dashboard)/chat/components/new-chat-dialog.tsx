"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MoreVertical } from "lucide-react"

import { useChat, type Conversation, type Message, type User } from "../use-chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ChatUserListMeta } from "./chat-user-list-meta"
import { getApiErrorMessage } from "@/lib/api/axios"
import { toast } from "sonner"
import { getCurrentUserIdFromSession } from "@/lib/auth-session"
import {
  createChatRequest,
  getChatDirectory,
  getChatDirectoryFilters,
  startChatWithFirstMessage,
  type ChatDirectoryFiltersResponse,
} from "@/services/chat.service"

type NewChatDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Patient: send request. Staff: first message opens 1:1 chat. */
  mode: "patient" | "staff"
  onStaffChatStarted: (
    conversation: Conversation,
    peer: User,
    message: Message
  ) => void
}

export function NewChatDialog({
  open,
  onOpenChange,
  mode,
  onStaffChatStarted,
}: NewChatDialogProps) {
  const conversations = useChat((s) => s.conversations)
  const currentUserId = getCurrentUserIdFromSession()
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeer, setSelectedPeer] = useState<User | null>(null)
  const [firstMessage, setFirstMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null)

  const existingDirectPeerIds = useMemo(() => {
    const peerIds = new Set<string>()
    for (const conversation of conversations) {
      if (conversation.type !== "direct") continue
      if (currentUserId) {
        const peerId = conversation.participants.find((id) => id !== currentUserId)
        if (peerId) peerIds.add(peerId)
      } else {
        // Fallback: if session id is unavailable, suppress any known direct participants.
        for (const participantId of conversation.participants) {
          if (participantId) peerIds.add(participantId)
        }
      }
    }
    return peerIds
  }, [conversations, currentUserId])

  const [filterRoles, setFilterRoles] = useState<string[]>([])
  const [filterClinicId, setFilterClinicId] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] =
    useState<ChatDirectoryFiltersResponse | null>(null)

  const filtersActive =
    filterRoles.length > 0 || Boolean(filterClinicId?.trim())

  const loadDirectory = useCallback(
    async (q: string) => {
      setLoading(true)
      setError(null)
      try {
        const list = await getChatDirectory({
          q: q.trim() || undefined,
          limit: 100,
          roles: filterRoles.length ? filterRoles : undefined,
          clinicId: filterClinicId?.trim() || undefined,
        })
        setUsers(
          mode === "patient"
            ? list.filter((user) => !existingDirectPeerIds.has(user.id))
            : list
        )
      } catch (e) {
        setError(getApiErrorMessage(e))
        setUsers([])
      } finally {
        setLoading(false)
      }
    },
    [filterRoles, filterClinicId, mode, existingDirectPeerIds]
  )

  useEffect(() => {
    if (!open) {
      setQuery("")
      setUsers([])
      setError(null)
      setSelectedPeer(null)
      setFirstMessage("")
      setFilterRoles([])
      setFilterClinicId(null)
      setFilterOptions(null)
      setSubmittingUserId(null)
      return
    }
    void (async () => {
      try {
        const opts = await getChatDirectoryFilters()
        setFilterOptions(opts)
      } catch {
        setFilterOptions({ roles: [], clinics: [] })
      }
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      void loadDirectory(query)
    }, 300)
    return () => window.clearTimeout(t)
  }, [open, query, loadDirectory])

  async function handlePatientRequest(peer: User) {
    setSubmitting(true)
    setSubmittingUserId(peer.id)
    setError(null)
    try {
      await createChatRequest(peer.id)
      toast.success("Chat request sent")
      onOpenChange(false)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setSubmitting(false)
      setSubmittingUserId(null)
    }
  }

  async function handleStaffSend() {
    if (!selectedPeer || !firstMessage.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { conversation, message } = await startChatWithFirstMessage({
        recipientId: selectedPeer.id,
        content: firstMessage.trim(),
        type: "text",
      })
      onStaffChatStarted(conversation, selectedPeer, message)
      onOpenChange(false)
    } catch (e) {
      setError(getApiErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  function toggleRole(roleValue: string, checked: boolean) {
    setFilterRoles((prev) =>
      checked
        ? [...prev, roleValue]
        : prev.filter((r) => r !== roleValue)
    )
  }

  function clearFilters() {
    setFilterRoles([])
    setFilterClinicId(null)
  }

  const title = mode === "patient" ? "Request chat" : "New message"
  const description =
    mode === "patient"
      ? "Choose a staff member to send a chat request. You can message them after they accept."
      : "Choose someone eligible to message, then send your first message to open the conversation."

  const showClinicFilter =
    (filterOptions?.clinics?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            {description}
          </p>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="cursor-text pr-11"
              disabled={Boolean(selectedPeer && mode === "staff")}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2 cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
                  disabled={Boolean(selectedPeer && mode === "staff")}
                  aria-label="Filter by role and clinic"
                >
                  <span className="relative inline-flex">
                    <MoreVertical className="h-4 w-4" />
                    {filtersActive ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Role</DropdownMenuLabel>
                {filterOptions?.roles?.length ? (
                  filterOptions.roles.map((r) => (
                    <DropdownMenuCheckboxItem
                      key={r.value}
                      checked={filterRoles.includes(r.value)}
                      onCheckedChange={(checked) =>
                        toggleRole(r.value, Boolean(checked))
                      }
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer"
                    >
                      {r.label}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    No role filters
                  </p>
                )}

                {showClinicFilter ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Clinic</DropdownMenuLabel>
                    <div className="max-h-48 overflow-y-auto">
                      <DropdownMenuRadioGroup
                        value={filterClinicId ?? "all"}
                        onValueChange={(v) =>
                          setFilterClinicId(v === "all" ? null : v)
                        }
                      >
                        <DropdownMenuRadioItem
                          value="all"
                          className="cursor-pointer"
                        >
                          All clinics
                        </DropdownMenuRadioItem>
                        {filterOptions!.clinics.map((c) => (
                          <DropdownMenuRadioItem
                            key={c.id}
                            value={c.id}
                            className="cursor-pointer"
                          >
                            {c.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </div>
                  </>
                ) : null}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={clearFilters}
                  disabled={!filtersActive}
                >
                  Clear filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {mode === "staff" && selectedPeer ? (
            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={selectedPeer.avatar}
                    alt={selectedPeer.name}
                  />
                  <AvatarFallback>
                    {selectedPeer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium block truncate">
                    {selectedPeer.name}
                  </span>
                  <ChatUserListMeta user={selectedPeer} compact />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs cursor-pointer"
                  onClick={() => {
                    setSelectedPeer(null)
                    setFirstMessage("")
                  }}
                >
                  Change
                </Button>
              </div>
              <Textarea
                placeholder="First message…"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={3}
                className="resize-none cursor-text"
              />
              <Button
                type="button"
                className="w-full cursor-pointer"
                disabled={submitting || !firstMessage.trim()}
                onClick={() => void handleStaffSend()}
              >
                Send & open chat
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[280px] rounded-md border">
              <div className="p-2 space-y-1">
                {loading && users.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">Loading…</p>
                ) : null}
                {!loading && users.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">
                    No users found.
                  </p>
                ) : null}
                {users.map((u) => (
                  <Button
                    key={u.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 cursor-pointer"
                    disabled={submitting}
                    onClick={() => {
                      if (mode === "patient") {
                        void handlePatientRequest(u)
                      } else {
                        setSelectedPeer(u)
                        setFirstMessage("")
                      }
                    }}
                  >
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex flex-col items-start text-left min-w-0 flex-1 gap-0.5">
                      <span className="font-medium truncate w-full">
                        {u.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {u.email}
                      </span>
                      <ChatUserListMeta user={u} />
                    </span>
                    {mode === "patient" && submittingUserId === u.id ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Sending…
                      </span>
                    ) : null}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
