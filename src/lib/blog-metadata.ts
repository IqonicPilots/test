import { Metadata } from "next"
import type { BlogPost } from "@/services/blog.service"

/**
 * Generate metadata for blog detail pages (SEO)
 */
export function generateBlogMetadata(blog: BlogPost): Metadata {
  const title = `${blog.title} | KiviCare Blog`
  const description = blog.description || "Read this article on the KiviCare Blog"
  const keywords = [
    "healthcare",
    "clinic management",
    blog.category,
    blog.title,
  ].filter(Boolean)

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "article",
      url: `/blogs-list/${blog.slug}`,
      images: blog.image ? [{ url: blog.image, alt: blog.title }] : [],
      authors: blog.author ? [blog.author] : [],
      publishedTime: blog.publishedAt?.toString(),
      modifiedTime: blog.updatedAt?.toString(),
      tags: [blog.category],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: blog.image ? [blog.image] : [],
      creator: blog.author ? `@${blog.author}` : undefined,
    },
  }
}

/**
 * Generate metadata for the blogs listing page
 */
export const blogListingMetadata: Metadata = {
  title: "Blog | KiviCare - Healthcare Insights & Tips",
  description:
    "Read the latest articles about clinic management, healthcare technology, telemedicine, and patient care. Stay updated with healthcare insights from KiviCare.",
  keywords: [
    "healthcare blog",
    "clinic management",
    "telemedicine",
    "patient care",
    "healthcare tips",
    "medical insights",
  ].join(", "),
  openGraph: {
    title: "Blog | KiviCare",
    description:
      "Discover healthcare insights and clinic management tips on the KiviCare Blog",
    type: "website",
    url: "/blogs-list",
  },
}
