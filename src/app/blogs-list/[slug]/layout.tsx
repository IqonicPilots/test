import { Metadata } from "next"
import type { ReactNode } from "react"
import { generateBlogMetadata } from "@/lib/blog-metadata"
import { blogApi } from "@/services/blog.service"
import { generateBlogSlug } from "@/lib/utils"

export default function BlogSlugLayout({ children }: { children: ReactNode }) {
  return children
}

/**
 * Generate static metadata for blog detail pages
 * This is called by Next.js before the page renders
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    // Try to fetch the blog by slug first
    try {
      const blog = await blogApi.getBlogBySlug(slug)
      return generateBlogMetadata(blog)
    } catch {
      // If not found by slug, try by ID
      try {
        const blog = await blogApi.getBlogById(slug)
        return generateBlogMetadata(blog)
      } catch {
        // If still not found, return a default metadata
        return {
          title: "Blog Post | KiviCare",
          description: "Blog post on KiviCare",
        }
      }
    }
  } catch (error) {
    console.warn("Failed to generate blog metadata for slug:", slug, error)
    return {
      title: "Blog Post | KiviCare",
      description: "Blog post on KiviCare",
    }
  }
}

/**
 * Generate static params for dynamic routes
 * This helps with static generation and SEO
 */
export async function generateStaticParams() {
  try {
    const response = await blogApi.getAllBlogs(1, 100, { status: "published" })
    return response.data
      .map((blog) => blog.slug?.trim() || generateBlogSlug(blog.title) || blog._id || blog.id?.toString() || "")
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => ({ slug }))
  } catch (error) {
    console.warn("Failed to generate static params for blogs:", error)
    return []
  }
}
