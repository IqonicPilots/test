"use client"

import { format } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ActionIconButton } from "@/components/ui/action-icon-button"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { BlogPost } from "@/services/blog.service"
import { BlogFormDialog } from "./blog-form-dialog"

export type BlogTableRow = {
  id: string
  title: string
  category: string
  author: string
  createdAt: string
  status: "published" | "draft"
  sourceBlog: BlogPost
}

interface BlogColumnHandlers {
  onDeleteBlog: (blog: BlogPost) => void | Promise<void>
  onViewBlog: (blog: BlogPost) => void | Promise<void>
  isDeleting?: boolean
  isViewing?: boolean
}

function formatDate(value?: string) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return format(parsed, "dd MMM yyyy")
}

function getStatusBadgeClass(status: BlogTableRow["status"]) {
  if (status === "published") {
    return "border border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400"
  }

  return "border border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400"
}

export function getColumns({
  onDeleteBlog,
  onViewBlog,
  isDeleting = false,
  isViewing = false,
}: BlogColumnHandlers): ColumnDef<BlogTableRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <span className="font-medium">{row.original.title || "-"}</span>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => <span>{row.original.category || "-"}</span>,
    },
    {
      accessorKey: "author",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Author" />,
      cell: ({ row }) => <span>{row.original.author || "-"}</span>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created Date" />,
      cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant="outline" className={getStatusBadgeClass(row.original.status)}>
          {row.original.status === "published" ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <BlogActionsCell
          blog={row.original.sourceBlog}
          onDeleteBlog={onDeleteBlog}
          onViewBlog={onViewBlog}
          isDeleting={isDeleting}
          isViewing={isViewing}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}

function BlogActionsCell({
  blog,
  onDeleteBlog,
  onViewBlog,
  isDeleting,
  isViewing,
}: {
  blog: BlogPost
  onDeleteBlog: (blog: BlogPost) => void | Promise<void>
  onViewBlog: (blog: BlogPost) => void | Promise<void>
  isDeleting: boolean
  isViewing: boolean
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    await onDeleteBlog(blog)
    setShowDeleteDialog(false)
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <ActionIconButton
            onClick={() => onViewBlog(blog)}
            disabled={!blog.slug?.trim() || isViewing}
          >
            <Eye className="size-3.5" />
          </ActionIconButton>
        </TooltipTrigger>
        <TooltipContent>
          <p>View</p>
        </TooltipContent>
      </Tooltip>

      <BlogFormDialog
        blogToEdit={blog}
        trigger={
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton>
                <Pencil className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        }
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Blog?"
        description={`Are you sure you want to permanently delete "${blog.title}"?`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Delete"
        isLoading={isDeleting}
        trigger={
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionIconButton
                color="red"
                title="Delete"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </ActionIconButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        }
      />
    </div>
  )
}
