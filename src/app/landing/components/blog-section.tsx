"use client"

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_SETTINGS, useLandingContent } from '../../../contexts/landing-content-context'
import { HighlightedText } from '@/components/highlighted-text'
import { getBlogIdentifier } from '@/lib/utils'
import { useBlogs } from '@/hooks/api/use-blogs'


export function BlogSection() {
  const { settings, hydrated } = useLandingContent()
  const { blog: blogSettings } = settings
  const blogLimit = Math.max(
    1,
    Number(blogSettings.blogLimit ?? DEFAULT_SETTINGS.blog.blogLimit ?? 1)
  )

  const { data: blogResponse } = useBlogs(
    1,
    blogLimit,
    {
      status: "published",
      sort: "newest",
    },
    hydrated && blogSettings.show
  )

  if (!blogSettings.show) return null

  if (!hydrated) {
    return (
      <section className="py-24 sm:py-32 relative z-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Skeleton className="h-6 w-24 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden py-0">
                <CardContent className="px-0">
                  <Skeleton className="aspect-video w-full" />
                  <div className="space-y-3 p-6">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-7 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-20 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const displayPosts = blogResponse?.data || []
  const totalBlogs =
    blogResponse?.stats?.totalCount ??
    blogResponse?.pagination?.total ??
    displayPosts.length
  const shouldShowViewAll = totalBlogs > displayPosts.length

  return (
    <section id="blog" className="py-24 sm:py-32 relative z-0" style={{ color: blogSettings.sectionTextColor || undefined }}>
      {/* Background Base */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: blogSettings.sectionBgColor || undefined }}
      />
      {!blogSettings.sectionBgColor && (
        <div className="absolute inset-0 -z-10 bg-muted/50" />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge
            variant="outline"
            className="mb-4"
            style={{
              backgroundColor: blogSettings.sectionHighlightColor ? `${blogSettings.sectionHighlightColor}15` : undefined,
              color: blogSettings.sectionHighlightColor || undefined,
              borderColor: blogSettings.sectionHighlightColor ? `${blogSettings.sectionHighlightColor}40` : undefined
            }}
          >
            {blogSettings.badge || "Latest Insights"}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            <HighlightedText
              text={blogSettings.title || "Latest From Our Blog"}
              highlightColor={blogSettings.sectionHighlightColor}
            />
          </h2>
          <p className="text-lg text-muted-foreground" style={{ color: blogSettings.sectionTextColor ? `${blogSettings.sectionTextColor}cc` : undefined }}>
            <HighlightedText
              text={blogSettings.description || "Stay updated with the latest trends, best practices, and insights from our team of experts."}
              highlightColor={blogSettings.sectionHighlightColor}
            />
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {displayPosts.map((blog, index) => {
            const blogIdentifier = getBlogIdentifier(blog)
            const blogLink = `/blogs-list/${encodeURIComponent(blogIdentifier)}`
            
            return (
              <Card key={index} className="overflow-hidden py-0 group hover:border-primary/50 transition-all">
                <CardContent className="px-0">
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={blog.image || 'https://ui.shadcn.com/placeholder.svg'}
                      alt={blog.title}
                      width={400}
                      height={225}
                      className="size-full object-cover dark:invert dark:brightness-[0.95] group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-3 p-6">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                      {blog.category}
                    </Badge>
                    <a
                      href={blogLink}
                      className="cursor-pointer block"
                    >
                      <h3 className="text-xl font-bold hover:text-primary transition-colors line-clamp-2">{blog.title}</h3>
                    </a>
                    <p className="text-muted-foreground line-clamp-3 text-sm">{blog.description}</p>
                    <a
                      href={blogLink}
                      className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all cursor-pointer font-medium text-sm"
                    >
                      Learn More
                      <ArrowRight className="size-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {shouldShowViewAll && (
          <div className="mt-12 flex justify-center">
            <Button
              size="lg"
              className="group px-10 transition-all shadow-md hover:shadow-lg font-bold"
              asChild
            >
              <Link href="/blogs-list">
                View all articles
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
