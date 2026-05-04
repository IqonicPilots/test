"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write content...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const hasFocusedRef = useRef(false)
  const selectionRangeRef = useRef<Range | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkValue, setLinkValue] = useState("")

  const decodeHtmlEntities = (input: string) => {
    if (!input) return ""
    const temp = document.createElement("textarea")
    temp.innerHTML = input
    return temp.value
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (!hasFocusedRef.current) {
      editor.innerHTML = decodeHtmlEntities(value || "")
    }
  }, [value])

  const saveSelection = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    const anchorNode = selection.anchorNode
    if (!anchorNode || !editor.contains(anchorNode)) return
    selectionRangeRef.current = range.cloneRange()
  }, [])

  const restoreSelection = () => {
    const selection = window.getSelection()
    if (!selection || !selectionRangeRef.current) return false
    selection.removeAllRanges()
    selection.addRange(selectionRangeRef.current)
    return true
  }

  const hasSelectionInEditor = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return false
    const anchorNode = selection.anchorNode
    return Boolean(anchorNode && editor.contains(anchorNode))
  }

  const findClosestAnchor = (node: Node | null): HTMLAnchorElement | null => {
    let current: Node | null = node
    while (current) {
      if (current instanceof HTMLAnchorElement) return current
      current = current.parentNode
    }
    return null
  }

  const apply = (command: string, commandValue?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    if (!hasSelectionInEditor()) {
      restoreSelection()
    }

    // If there is still no selection in editor, place caret at the end.
    if (!hasSelectionInEditor()) {
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    document.execCommand(command, false, commandValue)
    saveSelection()
    onChange(editor.innerHTML)
  }

  const handleLink = () => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    const anchorNode = selection.anchorNode
    if (!anchorNode || !editor.contains(anchorNode) || range.collapsed) return

    saveSelection()
    setLinkValue("")
    setLinkDialogOpen(true)
  }

  const handleSaveLink = () => {
    const editor = editorRef.current
    const url = linkValue.trim()
    if (!editor || !url) return

    editor.focus()
    if (!restoreSelection()) {
      return
    }

    // Avoid nested anchors by unlinking current selection first.
    document.execCommand("unlink")
    document.execCommand("createLink", false, url)
    saveSelection()
    onChange(editor.innerHTML)
    setLinkDialogOpen(false)
    setLinkValue("")
  }

  const handleUnlink = () => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const selection = window.getSelection()
    if (!selection) return

    if (selection.rangeCount === 0 && !restoreSelection()) return

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const anchorNode = selection.anchorNode
      if (range.collapsed && anchorNode) {
        const parentAnchor = findClosestAnchor(anchorNode)
        if (parentAnchor && editor.contains(parentAnchor)) {
          const anchorRange = document.createRange()
          anchorRange.selectNodeContents(parentAnchor)
          selection.removeAllRanges()
          selection.addRange(anchorRange)
        }
      }
    }

    document.execCommand("unlink")
    saveSelection()
    onChange(editor.innerHTML)
  }

  return (
    <div className={cn("rounded-md border bg-background", className)} data-allow-enter="true">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply("bold")}
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply("italic")}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply("underline")}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Underline</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => {
                event.preventDefault()
                saveSelection()
              }}
              onClick={() => apply("insertUnorderedList")}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => {
                event.preventDefault()
                saveSelection()
              }}
              onClick={() => apply("insertOrderedList")}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleLink}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert Link</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleUnlink}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove Link</TooltipContent>
        </Tooltip>
      </div>
      <div
        ref={editorRef}
        className="min-h-[280px] p-3 text-sm outline-none prose prose-sm dark:prose-invert max-w-none blog-editor-content"
        contentEditable
        data-allow-enter="true"
        data-placeholder={placeholder}
        onFocus={() => {
          hasFocusedRef.current = true
        }}
        onInput={(e) => {
          onChange((e.currentTarget as HTMLDivElement).innerHTML)
          saveSelection()
        }}
        onMouseUp={saveSelection}
        onClick={saveSelection}
        onKeyUp={saveSelection}
        onBlur={() => {
          hasFocusedRef.current = false
        }}
        suppressContentEditableWarning
      />
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <Input
            value={linkValue}
            placeholder="Enter URL"
            onChange={(event) => setLinkValue(event.target.value)}
            data-allow-enter="true"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleSaveLink()
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveLink}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
