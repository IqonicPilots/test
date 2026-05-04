"use client"

import { Calendar, User } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { GenericViewDialog } from "@/components/generic-view-dialog"
import { decodeHtmlEntities, formatDate } from "@/lib/utils"
import type { BlogPost } from "@/services/blog.service"

interface BlogViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blog: BlogPost | null
  isLoading?: boolean
}

export function BlogViewDialog({
  open,
  onOpenChange,
  blog,
  isLoading = false,
}: BlogViewDialogProps) {
  const decodedContent = decodeHtmlEntities(blog?.content)
  const publishedDate = blog?.publishedAt || blog?.createdAt
  const hasContent = decodedContent.trim().length > 0

  const content = (
    <div className="px-2">
      {isLoading && !blog ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ) : blog ? (
        <article className="space-y-6 text-foreground">
          {blog.image ? (
            <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-xl bg-muted">
              <Image
                src={blog.image}
                alt={blog.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1024px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{blog.category || "General"}</Badge>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{blog.title}</h2>

            {blog.description ? (
              <p className="text-sm md:text-base text-muted-foreground">{blog.description}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-5 pt-3 border-t">
              {blog.author ? (
                <span className="text-sm inline-flex items-center gap-1.5">
                  <User className="size-4 text-muted-foreground" />
                  {blog.author}
                </span>
              ) : null}

              {publishedDate ? (
                <span className="text-sm inline-flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  {formatDate(String(publishedDate))}
                </span>
              ) : null}
            </div>
          </div>

          {hasContent ? (
            <div className="blog-content prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: decodedContent }} />
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-muted-foreground text-sm md:text-base">
                {blog.description || "No content available for this blog yet."}
              </p>
            </div>
          )}
        </article>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Unable to load blog preview.</p>
        </div>
      )}
    </div>
  )

  return (
    <GenericViewDialog
      title="Blog Preview"
      isOpen={open}
      onOpenChange={onOpenChange}
      dialogSize="xl"
      footer={content}
    />
  )
}
