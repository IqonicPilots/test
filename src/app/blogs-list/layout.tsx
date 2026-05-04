import { Metadata } from "next"
import { blogListingMetadata } from "@/lib/blog-metadata"

export const metadata: Metadata = blogListingMetadata

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
