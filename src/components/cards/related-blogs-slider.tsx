"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BlogCard } from "@/components/cards/blog-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { BlogPost } from "@/services/blog.service"
import { cn, getBlogKey } from "@/lib/utils"

interface RelatedBlogsSliderProps {
  title?: string
  subtitle?: string
  blogs: BlogPost[]
  isLoading?: boolean
  className?: string
  itemsPerView?: number
}

export function RelatedBlogsSlider({
  title = "Related Articles",
  subtitle,
  blogs,
  isLoading = false,
  className,
  itemsPerView = 3,
}: RelatedBlogsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      return () => container.removeEventListener("scroll", checkScroll)
    }
  }, [checkScroll, blogs])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  if (blogs.length === 0 && !isLoading) {
    return null
  }

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
          {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Left Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-16 hidden lg:block">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left")}
                className="rounded-full"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Slider */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {isLoading ? (
              // Skeleton loaders
              Array.from({ length: itemsPerView }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-full sm:w-96 snap-start"
                >
                  <div className="space-y-3 rounded-lg overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Blog cards
              blogs.map((blog, index) => (
                <div
                  key={getBlogKey(blog, index)}
                  className="flex-shrink-0 w-full sm:w-96 snap-start"
                >
                  <BlogCard blog={blog} variant="default" />
                </div>
              ))
            )}
          </div>

          {/* Right Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-16 hidden lg:block">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right")}
                className="rounded-full"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile scroll indicator */}
        <div className="flex lg:hidden justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(blogs.length / itemsPerView) }).map(
            (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-muted"
                aria-label={`Slide ${i + 1}`}
              />
            )
          )}
        </div>
      </div>
    </section>
  )
}
