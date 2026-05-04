"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, Search, AlertCircle, Sparkles } from "lucide-react"
import { useBlogCategories, useBlogs } from "@/hooks/api/use-blogs"
import { PostCard } from "@/components/cards/post-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { LandingNavbar } from "@/app/landing/components/navbar"
import { LandingFooter } from "@/app/landing/components/footer"
import { LandingContentProvider } from "@/contexts/landing-content-context"
import { getBlogIdentifier, getBlogKey } from "@/lib/utils"

const BLOGS_PER_PAGE = 10
const CATEGORY_FETCH_LIMIT = 100

type SortOption = "newest" | "oldest" | "popular"

export default function BlogsPage() {
  return (
    <LandingContentProvider>
      <BlogsPageInner />
    </LandingContentProvider>
  )
}

function BlogsPageInner() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  const { data: response, isLoading } = useBlogs(page, BLOGS_PER_PAGE, {
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: "published",
    sort: sortBy,
  })

  const { data: allBlogsResponse } = useBlogs(1, CATEGORY_FETCH_LIMIT, {
    status: "published",
  })

  const { data: popularBlogsResponse } = useBlogs(1, 3, {
    status: "published",
    sort: "popular",
  })

  const blogs = response?.data || []
  const pagination = response?.pagination
  const allBlogs = allBlogsResponse?.data || []
  const popularBlogs = popularBlogsResponse?.data || []

  const { data: blogCategories = [] } = useBlogCategories()
  const categories = useMemo(
    () =>
      blogCategories
        .map((category) => category.name?.trim())
        .filter((category): category is string => Boolean(category))
        .sort((a, b) => a.localeCompare(b)),
    [blogCategories]
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }

  const handleSortChange = (value: SortOption) => {
    setSortBy(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setSortBy("newest")
    setPage(1)
  }

  return (
    <>
      <LandingNavbar />
      <main className="min-h-screen bg-background">
        <section
          className="relative overflow-hidden bg-background"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--background) 0%, color-mix(in srgb, var(--primary) 8%, var(--background)) 45%, color-mix(in srgb, var(--accent) 12%, var(--background)) 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 28%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 24%)",
            }}
          />
          <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  Fresh healthcare insights for modern clinics
                </div>

                <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Smarter articles for teams building better patient experiences.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Explore product updates, clinic growth ideas, workflow improvements, and practical healthcare guidance in one clean reading hub.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="rounded-full border bg-background/80 px-4 py-2 shadow-sm">
                    {(allBlogsResponse?.pagination?.total || allBlogs.length || 0)}+ curated articles
                  </div>
                  <div className="rounded-full border bg-background/80 px-4 py-2 shadow-sm">
                    Search by topic or category
                  </div>
                  <div className="rounded-full border bg-background/80 px-4 py-2 shadow-sm">
                    Sorted newest by default
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-xl shadow-primary/5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Popular posts</p>
                    <p className="text-xl font-semibold text-foreground">What readers explore most</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {popularBlogs.map((blog, index) => (
                    <Link
                      key={getBlogKey(blog, index)}
                      href={`/blogs-list/${getBlogIdentifier(blog)}`}
                      className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 transition-colors hover:bg-muted"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={blog.image || "https://ui.shadcn.com/placeholder.svg"}
                          alt={blog.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
                          {blog.category || "Article"}
                        </p>
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                          {blog.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[color-mix(in_srgb,var(--background)_82%,var(--primary)_6%,var(--accent)_12%)]">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-border/70 bg-[color-mix(in_srgb,var(--card)_90%,var(--accent)_10%)] p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Find the right article in seconds
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use keyword search, pick a category, or change the sort order.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      <span>
                        {pagination?.total || 0} article{pagination?.total !== 1 ? "s" : ""} found
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
                  <div className="relative xl:mr-auto xl:max-w-[640px] xl:flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by title, category, author, or keyword..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="h-12 rounded-2xl border-border/70 bg-background pl-11"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:flex-none">
                    <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-12 w-full rounded-2xl border-border/70 bg-background sm:w-[160px] lg:w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                      <SelectTrigger className="h-12 w-full rounded-2xl border-border/70 bg-background sm:w-[140px] lg:w-[160px]">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl border-border/70 bg-background px-6 py-0 sm:min-w-[96px]"
                      onClick={clearFilters}
                      disabled={searchQuery.length === 0 && categoryFilter === "all" && sortBy === "newest"}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: BLOGS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : blogs.length > 0 ? (
              <>
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">Latest articles</h3>
                    <p className="text-sm text-muted-foreground">
                      {sortBy === "newest" && "Recently published content, sorted from latest to earliest."}
                      {sortBy === "oldest" && "Start from the earliest published content and work forward."}
                      {sortBy === "popular" && "Popular articles are ranked using available engagement signals and recency."}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {blogs.length} of {pagination?.total || blogs.length} articles
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {blogs.map((blog, index) => (
                    <PostCard key={getBlogKey(blog, index)} post={blog} />
                  ))}
                </div>

                {(pagination?.pages || 0) > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {page > 1 && (
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(page - 1)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                            />
                          </PaginationItem>
                        )}

                        {Array.from({ length: pagination?.pages || 0 }).map((_, i) => {
                          const pageNum = i + 1
                          const shouldShow =
                            pageNum === 1 ||
                            pageNum === (pagination?.pages || 1) ||
                            Math.abs(pageNum - page) <= 1

                          if (!shouldShow) {
                            if (i === 1 && page > 2) {
                              return (
                                <PaginationItem key="ellipsis">
                                  <span className="px-3 text-muted-foreground">
                                    ...
                                  </span>
                                </PaginationItem>
                              )
                            }
                            return null
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === page}
                                onClick={(e) => {
                                  e.preventDefault()
                                  setPage(pageNum)
                                  window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}

                        {page < (pagination?.pages || 1) && (
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(page + 1)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No blogs found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? `No articles match your search for "${searchQuery}"`
                    : "Check back soon for new content!"}
                </p>
                {(searchQuery || categoryFilter !== "all" || sortBy !== "newest") && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  )
}
