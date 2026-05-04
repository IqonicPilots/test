"use client"

import { useEffect, useRef } from "react"
import { Emoji, EmojiStyle } from "emoji-picker-react"
import { format, isToday, isYesterday } from "date-fns"
import { toast } from "sonner"
import { CheckCheck, MoreHorizontal, Reply, Copy, Trash2, Download, File, ExternalLink, Image as ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { isMessageSeenByPeer } from "../message-read-utils"
import { type Message, type User, useChat } from "../use-chat"
import { deleteChatMessage } from "@/services/chat.service"

function isEmojiCodePoint(codePoint: number | null): boolean {
  if (codePoint == null) return false
  // Rough range checks for emoji blocks; good enough for chat usage.
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) || // Misc symbols & pictographs
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) || // Transport & map
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) || // Supplemental symbols
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||   // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf)      // Dingbats
  )
}

function toUnifiedFromChar(char: string): string {
  const codePoints = Array.from(char).map((c) => c.codePointAt(0)!)
  return codePoints.map((cp) => cp.toString(16)).join("-")
}

function normalizeEmojiLineBreaks(text: string): string {
  if (!text.includes("\n")) return text

  // Rich-text editor artifacts can insert hard line breaks around emoji tokens.
  // Collapse those into spaces so sentence + emoji stays inline when width allows.
  const normalized = text
    .replace(/([^\n])\n(?=\s*[\p{Extended_Pictographic}])/gu, "$1 ")
    .replace(/([\p{Extended_Pictographic}\uFE0F\u200D])\n(?=\S)/gu, "$1 ")

  const lines = normalized.split("\n")
  const out: string[] = []
  const emojiOnlyLine = /^[\s\p{Extended_Pictographic}\uFE0F\u200D]+$/u

  for (const line of lines) {
    const trimmed = line.trim()
    const prevIdx = out.length - 1

    if (
      trimmed &&
      emojiOnlyLine.test(trimmed) &&
      prevIdx >= 0 &&
      out[prevIdx].trim().length > 0
    ) {
      out[prevIdx] = `${out[prevIdx]} ${trimmed}`
      continue
    }

    out.push(line)
  }

  return out.join("\n")
}

function renderEmojiRichText(text: string) {
  const normalizedText = normalizeEmojiLineBreaks(text)
  const result: React.ReactNode[] = []
  const NBSP = "\u00A0"

  const SegmenterCtor = typeof Intl !== "undefined" ? (Intl as any).Segmenter : undefined
  const segmenter =
    typeof SegmenterCtor === "function"
      ? new SegmenterCtor(undefined, { granularity: "grapheme" })
      : null

  const segments: string[] = segmenter
    ? Array.from((segmenter as any).segment(normalizedText), (s: any) => s.segment as string)
    : Array.from(normalizedText)

  for (const seg of segments) {
    const chars = Array.from(seg)
    const emojiChar = chars.find((c) =>
      isEmojiCodePoint((c as string).codePointAt(0) ?? null)
    )

    if (emojiChar) {
      // Prevent a wrap right before emoji (e.g. "Good Morning 🙂"),
      // so short text+emoji stays on one line when space is available.
      const lastItem = result[result.length - 1]
      if (typeof lastItem === "string" && lastItem.endsWith(" ")) {
        result[result.length - 1] = `${lastItem.slice(0, -1)}${NBSP}`
      }

      const unified = chars.map((c) => (c.codePointAt(0) ?? 0).toString(16)).join("-")
      result.push(
        <span
          key={`${unified}-${result.length}`}
          className="inline-flex shrink-0 whitespace-nowrap align-[-0.08em]"
        >
          <Emoji unified={unified} emojiStyle={EmojiStyle.APPLE} size={18} />
        </span>
      )
    } else {
      result.push(seg)
    }
  }

  return result
}

async function copyMessageTextToClipboard(text: string): Promise<boolean> {
  const value = text ?? ""
  if (!value) return false
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* use fallback */
  }
  try {
    const ta = document.createElement("textarea")
    ta.value = value
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.left = "-9999px"
    ta.style.top = "0"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/**
 * Unescapes HTML entities in a string (e.g. &#x2F; -> /)
 */
function unescapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/** 
 * Proxies a Cloudinary URL through our local Next.js rewrite 
 * to bypass CORS for fetch() calls. 
 */
function getProxiedUrl(url: string): string {
  const cleanUrl = unescapeHtml(url);
  if (cleanUrl.startsWith("https://res.cloudinary.com/")) {
    return `/api/v1/chat/proxy?url=${encodeURIComponent(cleanUrl)}`;
  }
  return cleanUrl;
}

/**
 * Fetches the image from the given URL and copies it as an actual image
 * (PNG blob) to the clipboard. Also adds the URL to the clipboard to 
 * avoid redundant uploads during internal pasting.
 */
async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  const proxiedUrl = getProxiedUrl(imageUrl);
  try {
    // Attempt 1: Fetch the blob
    let response;
    try {
      response = await fetch(proxiedUrl);
    } catch {
      throw new Error("Fetch failed");
    }
    
    if (!response?.ok) throw new Error("Network response was not ok");
    const originalBlob = await response.blob();

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = URL.createObjectURL(originalBlob);
    });

    const urlBlob = new Blob([imageUrl], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({ 
        "image/png": pngBlob,
        "text/plain": urlBlob
      }),
    ]);
    return true;
  } catch (err) {
    console.warn("copyImageToClipboard fetch failed, trying direct Image fallback:", err);
    
    // Attempt 2: Direct Image load into canvas
    try {
      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context unavailable"));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
          }, "image/png");
        };
        img.onerror = () => reject(new Error("Image element load failed"));
        img.src = proxiedUrl;
      });

      const urlBlob = new Blob([imageUrl], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ 
          "image/png": pngBlob,
          "text/plain": urlBlob
        }),
      ]);
      return true;
    } catch (finalErr) {
      console.error("Both image copy methods failed:", finalErr);
      await navigator.clipboard.writeText(imageUrl);
      return false;
    }
  }
}

/**
 * Handles copying a file to clipboard or downloading it.
 * If fetching data fails (CORS), it falls back to link copy or direct download.
 */
async function handleFileAction(
  fileUrl: string, 
  action: 'copy' | 'download' = 'copy'
): Promise<{ success: boolean; type: 'file' | 'link' | 'download' }> {
  const processedUrl = unescapeHtml(fileUrl);
  const proxiedUrlBase = getProxiedUrl(processedUrl);
  const proxiedUrl = action === 'download' 
    ? `${proxiedUrlBase}${proxiedUrlBase.includes('?') ? '&' : '?'}download=1`
    : proxiedUrlBase;
  
  try {
    const isImage = !!processedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:[?#].*)?$/i);
    const fullProxiedUrl = proxiedUrl.startsWith("/") ? window.location.origin + proxiedUrl : proxiedUrl;

    if (action === 'copy') {
      try {
        if (isImage) {
          const response = await fetch(proxiedUrl);
          if (response.ok) {
            const blob = await response.blob();
            // Try to copy as a rich ClipboardItem (image + text link)
            try {
              const urlBlob = new Blob([fullProxiedUrl], { type: "text/plain" });
              await navigator.clipboard.write([
                new ClipboardItem({ 
                  [blob.type.includes('image') ? blob.type : 'image/png']: blob,
                  "text/plain": urlBlob
                })
              ]);
              return { success: true, type: 'file' };
            } catch (clipboardErr) {
              // Fallback to just text if rich copy fails
              await navigator.clipboard.writeText(fullProxiedUrl);
              return { success: true, type: 'link' };
            }
          }
        }
        
        // Default for non-images or failed image fetch: copy the secure link
        await navigator.clipboard.writeText(fullProxiedUrl);
        return { success: true, type: 'link' };
      } catch (err) {
        console.error("Copy failed:", err);
        await navigator.clipboard.writeText(fullProxiedUrl);
        return { success: true, type: 'link' };
      }
    }

    // Download Logic
    const response = await fetch(proxiedUrl);
    if (!response.ok) throw new Error("CORS or Network error");
    const blob = await response.blob();
    
    const urlFilename = fileUrl.split("/").pop()?.split("?")[0] || "download";
    const friendlyName = urlFilename.includes("-") ? urlFilename.split("-").slice(1).join("-") : urlFilename;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = friendlyName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    return { success: true, type: 'download' };
  } catch (err) {
    console.error("handleFileAction failed:", err);
    const fallbackUrl = proxiedUrl.startsWith("/") ? window.location.origin + proxiedUrl : proxiedUrl;
    if (action === 'copy') {
      await navigator.clipboard.writeText(fallbackUrl);
      return { success: true, type: 'link' };
    } else {
      window.open(fallbackUrl, '_blank');
      return { success: true, type: 'download' };
    }
  }
}

interface MessageListProps {
  messages: Message[]
  users: User[]
  currentUserId?: string
  peerLastReadMessageId?: string | null
  onReply?: (message: Message) => void
}

export function MessageList({
  messages,
  users,
  currentUserId = "current-user",
  peerLastReadMessageId = null,
  onReply,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const selectedConversationId = useChat((state) => state.selectedConversation)
  const previousConversationRef = useRef<string | null>(null)

  // Reset scroll behavior when switching conversations
  useEffect(() => {
    const currentConversationId = messages.length > 0 ? messages[0]?.id?.split('-')[0] : null
    if (currentConversationId !== previousConversationRef.current) {
      isInitialLoadRef.current = true
      previousConversationRef.current = currentConversationId
    }
  }, [messages])

  // Auto-scroll to bottom only when new messages are added (not on initial load)
  // Auto-scroll to bottom when messages change or on initial load
  useEffect(() => {
    if (bottomRef.current) {
      if (isInitialLoadRef.current) {
        // Initial load: instant scroll
        bottomRef.current.scrollIntoView({ behavior: "auto" })
        isInitialLoadRef.current = false
      } else if (messages.length > previousMessageCountRef.current) {
        // New messages: smooth scroll
        bottomRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }
    previousMessageCountRef.current = messages.length
  }, [messages])

  const getUserById = (userId: string) => {
    if (userId === currentUserId) {
      return {
        id: currentUserId,
        name: "You",
        avatar: "https://notion-avatars.netlify.app/api/avatar/?preset=male-7",
        status: "online" as const,
        email: "you@example.com",
        lastSeen: null,
        role: "Developer",
        department: "Engineering"
      }
    }
    return users.find(user => user.id === userId)
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, "HH:mm")
  }

  const groupMessagesByDay = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []

    messages.forEach((message) => {
      const messageDate = format(new Date(message.timestamp), "yyyy-MM-dd")
      const lastGroup = groups[groups.length - 1]

      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        })
      }
    })

    return groups
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return "Today"
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "EEEE, MMMM d")
    }
  }

  const messageGroups = groupMessagesByDay(messages)

  return (
    <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto px-4">
      <div className="space-y-4 py-4">
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-2">
              <div className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border">
                {formatDateHeader(group.date)}
              </div>
            </div>

            {/* Messages for this day */}
            <div className="space-y-1">
              {group.messages.map((message, messageIndex) => {
                const user = getUserById(message.senderId)
                const isOwnMessage = message.senderId === currentUserId
                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null
                const nextMessage =
                  messageIndex < group.messages.length - 1
                    ? group.messages[messageIndex + 1]
                    : null

                const isSameSenderAsPrev = !!prevMessage && prevMessage.senderId === message.senderId
                const isSameSenderAsNext = !!nextMessage && nextMessage.senderId === message.senderId
                
                // Ensure URL is unescaped before checking or using it
                const unescapedUrl = unescapeHtml(message.content)
                const isImageMessage = message.type === "image" || (message.type === "text" && !!unescapedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:[?#].*)?$/i))
                
                const isFirstInGroup = !isSameSenderAsPrev
                const isLastInGroup = !isSameSenderAsNext
                const isMiddleInGroup = isSameSenderAsPrev && isSameSenderAsNext

                const showAvatar = !isOwnMessage && isLastInGroup
                const showName = !isOwnMessage && isFirstInGroup
                const quotedMessage = message.replyTo
                  ? messages.find((m) => m.id === message.replyTo)
                  : undefined
                const quotedAuthor = quotedMessage
                  ? getUserById(quotedMessage.senderId)?.name ?? "User"
                  : ""

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "group/msg flex w-full",
                      isOwnMessage ? "justify-end items-end" : "justify-start items-end",
                      isLastInGroup ? "mb-3" : "mb-1"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-end gap-2",
                        isOwnMessage && "flex-row-reverse"
                      )}
                    >
                      {!isOwnMessage ? (
                        <div className="w-8 shrink-0">
                          {showAvatar && user ? (
                            <Avatar className="h-8 w-8 cursor-pointer">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-xs">
                                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8" />
                          )}
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          "flex min-w-0 flex-col",
                          isOwnMessage ? "items-end" : "items-start"
                        )}
                      >
                        {showName && user ? (
                          <div className="mb-1 text-sm font-medium text-foreground">
                            {user.name}
                          </div>
                        ) : null}

                        <div
                          className={cn(
                            "flex w-max max-w-[min(95vw,42rem)] sm:max-w-[min(90vw,48rem)] lg:max-w-[min(82vw,52rem)] items-start gap-1",
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                        <div
                          className={cn(
                            "w-fit min-w-0 max-w-full px-3 py-2 text-sm leading-tight break-normal [overflow-wrap:break-word] [word-break:normal]",
                            isOwnMessage
                              ? "rounded-lg bg-primary text-primary-foreground"
                              : "bg-muted text-foreground",
                            !isOwnMessage && isFirstInGroup && "rounded-t-lg rounded-br-lg rounded-bl-sm",
                            !isOwnMessage && isMiddleInGroup && "rounded-sm rounded-r-lg",
                            !isOwnMessage && isLastInGroup && "rounded-b-lg rounded-tr-lg rounded-tl-sm"
                          )}
                        >
                          {quotedMessage ? (
                            <div
                              className={cn(
                                "mb-2 border-l-[3px] pl-2 py-0.5 rounded-sm text-left",
                                isOwnMessage
                                  ? "border-primary-foreground/80 bg-black/10"
                                  : "border-primary bg-background/40"
                              )}
                            >
                              <p
                                className={cn(
                                  "text-[11px] font-semibold truncate",
                                  isOwnMessage
                                    ? "text-primary-foreground/95"
                                    : "text-primary"
                                )}
                              >
                                {quotedAuthor}
                              </p>
                              <p
                                className={cn(
                                  "text-[11px] line-clamp-3 break-words mt-0.5",
                                  isOwnMessage
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                {quotedMessage.type === "image" ? (
                                  <span className="italic">[Image]</span>
                                ) : quotedMessage.type === "file" ? (
                                  <span className="italic">[File]</span>
                                ) : (
                                  renderEmojiRichText(quotedMessage.content)
                                )}
                              </p>
                            </div>
                          ) : null}

                          <div
                            className="inline-flex min-w-0 max-w-full flex-wrap items-end gap-x-1.5 gap-y-0.5"
                          >
                            <div className="min-w-0 max-w-full">
                                {isImageMessage ? (
                                  <div className="relative group/image max-w-sm overflow-hidden rounded-md border bg-background">
                                    <img 
                                      src={unescapedUrl} 
                                      alt="Sent image" 
                                      className="h-auto w-full object-cover cursor-pointer hover:scale-[1.02] transition-transform" 
                                      onClick={() => window.open(unescapedUrl, '_blank')}
                                    />
                                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-md">
                                      <span>{formatMessageTime(message.timestamp)}</span>
                                      {isOwnMessage && (
                                        <CheckCheck
                                          className={cn(
                                            "h-3 w-3 shrink-0 stroke-[2.5px]",
                                            isMessageSeenByPeer(
                                              message.id,
                                              peerLastReadMessageId
                                            )
                                              ? "text-white"
                                              : "text-white/60"
                                          )}
                                          aria-hidden
                                        />
                                      )}
                                    </div>
                                  </div>
                                ) : message.type === "file" ? (
                                  <div className="flex items-center gap-2 p-2 rounded-md border bg-background/50 text-foreground group/file">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                      <File className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate max-w-[180px]">
                                        {unescapedUrl.split('/').pop()?.split('-').slice(1).join('-') || "Document"}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground uppercase">File</p>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                      onClick={() => void handleFileAction(unescapedUrl, 'download')}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                <p className="min-w-0 max-w-full whitespace-pre-wrap break-normal text-left leading-snug [overflow-wrap:break-word] [word-break:normal]">
                                  {renderEmojiRichText(message.content)}
                                </p>
                              )}
                            </div>
                            {!isImageMessage && (
                            <div
                              className={cn(
                                "inline-flex shrink-0 items-baseline gap-1 self-end text-[11px] tabular-nums leading-none",
                                isOwnMessage
                                  ? "text-primary-foreground/75"
                                  : "text-muted-foreground"
                              )}
                            >
                              {message.isEdited ? (
                                <span className="italic opacity-90">edited</span>
                              ) : null}
                              <span>{formatMessageTime(message.timestamp)}</span>
                              {isOwnMessage ? (
                                <CheckCheck
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 translate-y-px stroke-2",
                                    isMessageSeenByPeer(
                                      message.id,
                                      peerLastReadMessageId
                                    )
                                      ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                                      : "text-primary-foreground/60"
                                  )}
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                            )}
                          </div>

                          {message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border cursor-pointer",
                                    "bg-background/90 backdrop-blur-sm shadow-sm"
                                  )}
                                >
                                  <span className="inline-flex items-center">
                                    {renderEmojiRichText(reaction.emoji)}
                                  </span>
                                  <span className="text-muted-foreground">{reaction.count}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 opacity-0 group-hover/msg:opacity-100 transition-opacity self-center pt-0.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                                aria-label="Message actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onSelect={() => {
                                  onReply?.(message)
                                }}
                              >
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              {!(isImageMessage || message.type === "file") && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onSelect={() => {
                                    void copyMessageTextToClipboard(
                                      message.content
                                    ).then((ok) => {
                                      if (ok) toast.success("Copied to clipboard")
                                      else toast.error("Could not copy")
                                    })
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                              )}
                              {isOwnMessage && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive"
                                    onSelect={() => {
                                      if (!selectedConversationId) return
                                      toast.promise(
                                        deleteChatMessage(selectedConversationId, message.id),
                                        {
                                          loading: "Deleting message…",
                                          success: () => {
                                            useChat.getState().removeMessage(selectedConversationId, message.id)
                                            return "Message deleted"
                                          },
                                          error: "Failed to delete message",
                                        }
                                      )
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
