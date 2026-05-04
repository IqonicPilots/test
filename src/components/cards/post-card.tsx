"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { BlogPost } from "@/services/blog.service"
import { cn, getBlogIdentifier } from "@/lib/utils"

interface PostCardProps {
  post: BlogPost
  className?: string
}

/**
 * A simple shadcn-based blog post card component
 * Displays post image, category, title, and description with a link to the full post
 */
export function PostCard({ post, className }: PostCardProps) {
  const postUrl = `/blogs-list/${getBlogIdentifier(post)}`

  return (
    <Link href={postUrl} className={cn("group block h-full", className)}>
      <Card className="h-full overflow-hidden py-0 transition-all group-hover:border-primary/50">
        <CardContent className="px-0">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.image || "https://ui.shadcn.com/placeholder.svg"}
              alt={post.title}
              width={400}
              height={225}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          <div className="space-y-3 p-6">
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {post.category}
            </Badge>

            <h3 className="line-clamp-2 text-xl font-bold transition-colors group-hover:text-primary">
              {post.title}
            </h3>

            <p className="line-clamp-3 text-sm text-muted-foreground">
              {post.description}
            </p>

            <div className="inline-flex items-center gap-2 pt-1 text-sm font-medium text-primary transition-all group-hover:gap-3">
              Learn More
              <ArrowRight className="size-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
