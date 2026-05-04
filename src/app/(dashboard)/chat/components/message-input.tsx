"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
  ClipboardPaste,
  ClipboardCopy,
  Copy,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { uploadChatFile } from "@/services/chat.service"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmojiStyle, Theme } from "emoji-picker-react"

// `emoji-picker-react` relies on `window`, so load it on the client only.
const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  { ssr: false }
)

export type ReplyingToState = {
  id: string
  preview: string
  authorName: string
}

interface MessageInputProps {
  onSendMessage: (content: string, type?: "text" | "image" | "file") => void
  disabled?: boolean
  placeholder?: string
  /** WhatsApp-style quote bar above the composer. */
  replyingTo?: ReplyingToState | null
  onCancelReply?: () => void
  /** Latest message text in the thread (for “Copy last message”). */
  lastMessageContent?: string | null
  conversationTitle?: string | null
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo = null,
  onCancelReply,
  lastMessageContent = null,
  conversationTitle = null,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string
    type: "image" | "file"
    name: string
  } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerWrapperRef = useRef<HTMLDivElement>(null)
  const previewEditorRef = useRef<HTMLDivElement>(null)

  const applyComposerHeight = (editor: HTMLDivElement | null) => {
    if (!editor) return
    editor.style.height = "0px"
    const nextHeight = Math.min(editor.scrollHeight, 120)
    editor.style.height = `${Math.max(nextHeight, 40)}px`
    editor.style.overflowY = editor.scrollHeight > 120 ? "auto" : "hidden"
  }

  useEffect(() => {
    if (!isEmojiPickerOpen) return

    const onDocumentMouseDown = (e: MouseEvent) => {
      const el = emojiPickerWrapperRef.current
      if (!el) return

      const target = e.target as Node | null
      if (target && !el.contains(target)) setIsEmojiPickerOpen(false)
    }

    document.addEventListener("mousedown", onDocumentMouseDown)
    return () =>
      document.removeEventListener("mousedown", onDocumentMouseDown)
  }, [isEmojiPickerOpen])

  const extractEditorText = (targetRef: React.RefObject<HTMLDivElement | null> = editorRef) => {
    const el = targetRef.current
    if (!el) return ""

    const walk = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? ""
      if (node.nodeType !== Node.ELEMENT_NODE) return ""

      const element = node as HTMLElement
      const tagName = element.tagName

      if (tagName === "BR") return "\n"
      if (element.dataset?.emoji) return element.dataset.emoji

      let out = ""
      element.childNodes.forEach((child) => {
        out += walk(child)
      })
      return out
    }

    let out = ""
    el.childNodes.forEach((child) => {
      out += walk(child)
    })
    return out
  }

  const syncFromEditor = () => {
    const text = extractEditorText()
    setMessage(text)
    setIsTyping(!!text.trim())
    applyComposerHeight(editorRef.current)
  }

  const focusEditorAndMoveCaretToEnd = () => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()

    const selection = window.getSelection()
    if (!selection) return

    selection.removeAllRanges()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.addRange(range)
  }

  const insertNodeAtCaret = (node: Node) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(node)

    // Move caret after inserted node
    range.setStartAfter(node)
    range.setEndAfter(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const insertTextAtCaret = (text: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(text))

    // Move caret after inserted text node
    range.setStartAfter(range.endContainer)
    range.setEndAfter(range.endContainer)
    selection.removeAllRanges()
    selection.addRange(range)
    return true
  }

  const insertEmojiToken = (emojiData: {
    emoji: string
    unified?: string
    imageUrl?: string
  }) => {
    if (disabled) return

    const emoji = emojiData.emoji || ""
    const imageUrl = emojiData.imageUrl
    if (!emoji || !imageUrl) return

    const editor = editorRef.current
    if (!editor) return

    // Ensure caret is within the editor
    if (!editor.contains(document.activeElement)) {
      focusEditorAndMoveCaretToEnd()
    }

    const wrapper = document.createElement("span")
    wrapper.contentEditable = "false"
    wrapper.dataset.emoji = emoji
    wrapper.className = "emoji-token inline-flex items-center"

    const img = document.createElement("img")
    img.src = imageUrl
    img.alt = emoji
    img.draggable = false
    img.style.width = "18px"
    img.style.height = "18px"
    img.style.verticalAlign = "text-bottom"
    wrapper.appendChild(img)

    insertNodeAtCaret(wrapper)

    setIsEmojiPickerOpen(false)
    requestAnimationFrame(() => syncFromEditor())
  }

  const handleEmojiClick = (emojiData: {
    emoji: string
    unified?: string
    imageUrl?: string
  }) => {
    insertEmojiToken(emojiData)
  }

  const handleSendMessage = () => {
    // If we have a pending attachment, we might have a caption in previewEditorRef
    const isAttachment = !!pendingAttachment;
    const currentRef = isAttachment ? previewEditorRef : editorRef;
    const trimmedMessage = extractEditorText(currentRef).trim()
    
    if (pendingAttachment) {
      onSendMessage(pendingAttachment.url, pendingAttachment.type)
      
      // If there's also a caption, send it as a follow-up
      if (trimmedMessage) {
        // Short delay to ensure image appears first in some socket environments
        setTimeout(() => {
          onSendMessage(trimmedMessage, "text")
        }, 100)
      }
      
      setPendingAttachment(null)
    } else if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage)
    }

    // Reset editor
    setMessage("")
    setIsTyping(false)
    setIsEmojiPickerOpen(false)

    if (editorRef.current) {
      editorRef.current.innerHTML = ""
      applyComposerHeight(editorRef.current)
    }
    
    if (previewEditorRef.current) {
      previewEditorRef.current.innerHTML = ""
    }

    requestAnimationFrame(() => {
      if (!isAttachment) {
        editorRef.current?.focus()
      }
    })
  }

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileChosen = async (file: File | undefined, kind: string) => {
    if (!file) return

    // 10MB limit check
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" is too large. Max size is 10MB.`)
      return
    }

    const type = kind === "photo/video" ? "image" : "file"
    const uploadToast = toast.loading(`Uploading ${file.name}...`)

    try {
      const url = await uploadChatFile(file)
      if (!url) throw new Error("No URL returned from upload")

      setPendingAttachment({ url, type, name: file.name })
      toast.success(`${file.name} ready to send`, { id: uploadToast })
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(`Failed to upload ${file.name}`, { id: uploadToast })
    }
  }

  async function pasteFromClipboard() {
    if (disabled) return
    try {
      const text = await navigator.clipboard.readText()
      if (!text?.trim()) {
        toast.message("Clipboard is empty or not readable.")
        return
      }
      if (!editorRef.current) return

      editorRef.current.focus()
      const didInsert = insertTextAtCaret(text)
      if (!didInsert) {
        editorRef.current.innerText = `${editorRef.current.innerText || ""}${text}`
      }

      toast.success("Pasted from clipboard")
      requestAnimationFrame(() => syncFromEditor())
    } catch {
      toast.error("Could not read clipboard. Allow paste permission and try again.")
    }
  }

  async function copyToClipboard(label: string, text: string | null | undefined) {
    if (!text?.trim()) {
      toast.message("Nothing to copy.")
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error("Could not copy to clipboard")
    }
  }

  return (
    <div className="border-t">
      {replyingTo ? (
        <div className="mx-4 mt-3 mb-0 flex items-stretch gap-2 rounded-lg border bg-muted/60 pl-3 pr-2 py-2 text-left">
          <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">
              {replyingTo.authorName}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
              {replyingTo.preview}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground"
            onClick={() => onCancelReply?.()}
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="p-4">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          handleFileChosen(e.target.files?.[0], "photo/video")
          e.target.value = ""
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          handleFileChosen(e.target.files?.[0], "document")
          e.target.value = ""
        }}
      />

      <div className="flex items-end gap-2">
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Photo or video
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-4 w-4 mr-2" />
                Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <div className="flex-1 relative">
          <div className="relative">
            {(!message || !message.trim()) && (
              <div
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground"
                aria-hidden
              >
                {placeholder}
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={() => {
                syncFromEditor()
              }}
              onKeyDown={handleEditorKeyDown}
              onPaste={(e) => {
                if (disabled) return;
                
                // Optimization: Check if the clipboard contains a URL that already exists on our server.
                // If it's a Cloudinary URL, we can send it directly without re-uploading.
                const pastedText = e.clipboardData.getData('text/plain');
                if (pastedText && pastedText.match(/https:\/\/res\.cloudinary\.com/i)) {
                  e.preventDefault();
                  const isImage = !!pastedText.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:[?#].*)?$/i);
                  const filename = pastedText.split('/').pop()?.split('?')[0] || "Pasted File";
                  setPendingAttachment({ 
                    url: pastedText, 
                    type: isImage ? "image" : "file",
                    name: filename
                  });
                  return;
                }

                // Check for files (images, etc.) in clipboard
                const files = Array.from(e.clipboardData.files);
                if (files.length > 0) {
                  e.preventDefault();
                  files.forEach((file) => {
                    const kind = file.type.startsWith('image/') || file.type.startsWith('video/') 
                      ? "photo/video" 
                      : "document";
                    void handleFileChosen(file, kind);
                  });
                  return;
                }
              }}
              onClick={() => {
                focusEditorAndMoveCaretToEnd()
              }}
              className={cn(
                "min-h-[40px] max-h-[120px] overflow-y-auto",
                "whitespace-pre-wrap break-words",
                "pr-28 pl-2 py-2",
                "rounded-md border bg-muted/60",
                "outline-none cursor-text",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                disabled && "cursor-not-allowed opacity-60"
              )}
              aria-label="Message input"
              role="textbox"
            />
          </div>

          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            <div ref={emojiPickerWrapperRef} className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      className="h-6 w-6 p-0 cursor-pointer disabled:cursor-not-allowed"
                      onClick={() => setIsEmojiPickerOpen((v) => !v)}
                      aria-expanded={isEmojiPickerOpen}
                      aria-label="Add emoji"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add emoji</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isEmojiPickerOpen ? (
                <div className="absolute right-0 bottom-8 z-50">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) =>
                      handleEmojiClick({
                        emoji: (emojiObject as { emoji?: string }).emoji || "",
                        unified: (emojiObject as { unified?: string }).unified,
                        imageUrl: (emojiObject as { imageUrl?: string }).imageUrl,
                      })
                    }
                    emojiStyle={EmojiStyle.APPLE}
                    theme={Theme.LIGHT}
                    width={320}
                    height={360}
                    searchDisabled
                  />
                </div>
              ) : null}
            </div>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="h-6 w-6 p-0 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuLabel>Clipboard</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => void pasteFromClipboard()}
                >
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Paste from clipboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => void copyToClipboard("Draft", message)}
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copy draft
                </DropdownMenuItem>
                {lastMessageContent?.trim() ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      void copyToClipboard("Last message", lastMessageContent)
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy last message
                  </DropdownMenuItem>
                ) : null}
                {conversationTitle?.trim() ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        void copyToClipboard("Chat name", conversationTitle)
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy chat name
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={disabled || !message.trim()}
                className="cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isTyping ? (
        <div className="text-xs text-muted-foreground mt-2 px-4">
          You are typing...
        </div>
      ) : null}
      
      {/* Attachment Preview Overlay */}
      {pendingAttachment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800 flex flex-col max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 text-white z-10"
              onClick={() => setPendingAttachment(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-h-0 flex items-center justify-center p-8 bg-[#0a0a0a]">
              {pendingAttachment.type === "image" ? (
                <img
                  src={pendingAttachment.url}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                  <div className="h-24 w-24 rounded-2xl bg-zinc-800 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-white max-w-md truncate">
                    {pendingAttachment.name}
                  </p>
                  <p className="text-sm uppercase tracking-wider text-zinc-500">
                    File Attachment
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800">
              <div className="flex items-end gap-3 max-w-3xl mx-auto">
                <div className="flex-1 relative">
                  <div
                    ref={previewEditorRef}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={() => {
                      const text = extractEditorText(previewEditorRef);
                      setMessage(text);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className={cn(
                      "min-h-[48px] max-h-[120px] overflow-y-auto px-4 py-3",
                      "rounded-xl bg-zinc-800/50 border border-zinc-700",
                      "text-sm text-white outline-none placeholder:text-zinc-500"
                    )}
                    role="textbox"
                  />
                  {!message && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">
                      Add a caption...
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
