"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, Clock, Share2, ArrowLeft, Twitter, Linkedin, Facebook } from "lucide-react"
import { useBlogBySlug, useBlogs, useRelatedBlogs } from "@/hooks/api/use-blogs"
import { BlogSidebar } from "@/components/cards/blog-sidebar"
import { RelatedBlogsSlider } from "@/components/cards/related-blogs-slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, calculateReadTime, decodeHtmlEntities } from "@/lib/utils"
import { LandingContentProvider } from "@/contexts/landing-content-context"
import { LandingNavbar } from "@/app/landing/components/navbar"
import { LandingFooter } from "@/app/landing/components/footer"
import React from "react"

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  return (
    <LandingContentProvider>
      <BlogDetailPageInner params={params} />
    </LandingContentProvider>
  )
}

function BlogDetailPageInner({ params }: BlogDetailPageProps) {
  const { slug } = React.use(params)
  const { data: blog, isLoading: isLoadingBlog, isError } = useBlogBySlug(slug)
  const { data: relatedBlogs = [], isLoading: isLoadingRelated } = useRelatedBlogs(blog?._id || "", 6, Boolean(blog?._id))
  const { data: sidebarResponse, isLoading: isLoadingSidebar } = useBlogs(
    1,
    6,
    { status: "published", sort: "popular" },
    true
  )

  if (isError) {
    notFound()
  }

  const sidebarBlogs = (sidebarResponse?.data || [])
    .filter((item) => item._id !== blog?._id && item.slug !== blog?.slug)
    .slice(0, 5)

  if (isLoadingBlog || !blog) {
    return <BlogDetailLoadingSkeleton />
  }

  const readTime = blog.content ? calculateReadTime(blog.content) : 5
  const publishedDate = blog.publishedAt || blog.createdAt
  const renderedContent = decodeHtmlEntities(blog.content)

  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-background">
      {/* Hero Image */}
      {blog.image && (
        <div className="relative w-full h-96 md:h-[500px] overflow-hidden bg-muted">
          <Image
            src={blog.image}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <article className="py-8 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Back Button */}
              <Link href="/blogs-list" className="inline-flex">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to all blogs
                </Button>
              </Link>

              {/* Article Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{blog.category}</Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {readTime} min read
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {blog.title}
                </h1>

                <p className="text-lg text-muted-foreground">
                  {blog.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  {blog.author && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{blog.author}</span>
                    </div>
                  )}

                  {publishedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(new Date(publishedDate))}
                      </span>
                    </div>
                  )}

                  {/* Share Button */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: blog.title,
                          text: blog.description,
                          url: window.location.href,
                        })
                      } else {
                        navigator.clipboard.writeText(window.location.href)
                      }
                    }}
                    className="flex items-center gap-2 ml-auto text-primary hover:text-primary/80 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>

              {/* Article Content */}
              {blog.content ? (
                <div className="blog-content prose prose-lg dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                </div>
              ) : (
                <div className="space-y-4 leading-relaxed text-lg bg-muted/30 p-8 rounded-lg">
                  <p className="text-muted-foreground">
                    {blog.description || "This article is not yet published."}
                  </p>
                </div>
              )}

              {/* Article Footer */}
              <div className="border-t pt-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Share this article
                  </p>
                  <div className="flex gap-3">
                    {[
                      { name: "Twitter", icon: Twitter },
                      { name: "LinkedIn", icon: Linkedin },
                      { name: "Facebook", icon: Facebook },
                    ].map(({ name, icon: Icon }) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0"
                        title={`Share on ${name}`}
                        onClick={() => {
                          const url = window.location.href
                          const text = `${blog.title} - ${blog.description}`

                          let shareUrl = ""
                          if (name === "Twitter") {
                            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                              url
                            )}&text=${encodeURIComponent(text)}`
                          } else if (name === "LinkedIn") {
                            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                              url
                            )}`
                          } else if (name === "Facebook") {
                            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                              url
                            )}`
                          }

                          if (shareUrl) {
                            window.open(shareUrl, "_blank", "width=600,height=400")
                          }
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <Link href="/blogs-list">
                  <Button variant="outline">View all articles</Button>
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <BlogSidebar
                title="Other Articles"
                blogs={sidebarBlogs}
                isLoading={isLoadingSidebar}
              />
            </div>
          </div>
        </div>
      </article>

      {/* Related Blogs Slider */}
      {relatedBlogs.length > 0 && (
        <RelatedBlogsSlider
          title="Read More Articles"
          subtitle="Explore similar topics and insights"
          blogs={relatedBlogs}
          isLoading={isLoadingRelated}
        />
      )}
    </main>
      <LandingFooter />
    </>
  )
}

function BlogDetailLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative w-full h-96 md:h-[500px] bg-muted">
        <Skeleton className="w-full h-full" />
      </div>

      <article className="py-8 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-10 w-32" />

              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
