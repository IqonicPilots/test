"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BlogPost } from "@/services/blog.service"
import { cn, formatDate, getBlogIdentifier, getBlogKey } from "@/lib/utils"

interface BlogCardProps {
  blog: BlogPost
  variant?: "default" | "compact" | "featured"
  className?: string
}

export function BlogCard({
  blog,
  variant = "default",
  className,
}: BlogCardProps) {
  const blogUrl = `/blogs-list/${getBlogIdentifier(blog)}`

  if (variant === "compact") {
    return (
      <Link href={blogUrl} className={cn("group block", className)}>
        <div className="flex gap-3 rounded-lg border border-transparent hover:border-primary/30 transition-colors p-3">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src={blog.image || "https://ui.shadcn.com/placeholder.svg"}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {blog.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {blog.category}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link href={blogUrl} className={cn("group block", className)}>
        <Card className="overflow-hidden h-full hover:border-primary/50 transition-all">
          <div className="relative overflow-hidden aspect-video bg-muted">
            <Image
              src={blog.image || "https://ui.shadcn.com/placeholder.svg"}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs">
                {blog.category}
              </Badge>
              {blog.publishedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(new Date(blog.publishedAt))}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                {blog.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {blog.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
              Read More
              <ArrowRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={blogUrl} className={cn("group block", className)}>
      <Card className="overflow-hidden py-0 hover:border-primary/50 transition-all h-full">
        <CardContent className="px-0">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={blog.image || "https://ui.shadcn.com/placeholder.svg"}
              alt={blog.title}
              width={400}
              height={225}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div className="space-y-3 p-6">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
              {blog.category}
            </Badge>
            <h3 className="text-lg font-bold hover:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h3>
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {blog.description}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium text-sm">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </div>
              {blog.author && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {blog.author}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

interface BlogCardGridProps {
  blogs: BlogPost[]
  variant?: "default" | "compact" | "featured"
  className?: string
  gridClassName?: string
}

export function BlogCardGrid({
  blogs,
  variant = "default",
  className,
  gridClassName,
}: BlogCardGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No blogs found.</p>
      </div>
    )
  }

  const gridClass = gridClassName || "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={gridClass}>
      {blogs.map((blog, index) => (
        <BlogCard
          key={getBlogKey(blog, index)}
          blog={blog}
          variant={variant}
          className={className}
        />
      ))}
    </div>
  )
}
