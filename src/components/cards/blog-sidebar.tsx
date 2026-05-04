"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { BlogCard } from "@/components/cards/blog-card"
import type { BlogPost } from "@/services/blog.service"
import { cn, getBlogKey } from "@/lib/utils"

interface BlogSidebarProps {
  title?: string
  blogs: BlogPost[]
  isLoading?: boolean
  className?: string
}

export function BlogSidebar({
  title = "Other Blog Posts",
  blogs,
  isLoading = false,
  className,
}: BlogSidebarProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4 sticky top-20", className)}>
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("sticky top-20 space-y-4", className)}>
      <div className="bg-muted/50 rounded-lg p-4 backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        <div className="space-y-3">
          {blogs.length > 0 ? (
            blogs.slice(0, 5).map((blog, index) => (
              <BlogCard
                key={getBlogKey(blog, index)}
                blog={blog}
                variant="compact"
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              No other blog posts available.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
