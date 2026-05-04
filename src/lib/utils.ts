import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BlogPost } from "@/services/blog.service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getReferenceId(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === "string") return value
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    if (typeof record._id === "string") return record._id
    if (typeof record.id === "string") return record.id
  }
  return undefined
}

export function isObject<T>(value: T | string | null | undefined): value is T {
  return typeof value === "object" && value !== null
}

export function getPaymentModeLabel(mode: string | null | undefined): string {
  if (!mode) return "N/A"
  const paymentModes: Record<string, string> = {
    stripe: "Stripe",
    pay_later: "Pay Later",
    cash: "Cash",
    card: "Card",
    bank_transfer: "Bank Transfer",
    razorpay: "Razorpay",
    paypal: "PayPal",
  }
  return (
    paymentModes[mode.toLowerCase()] ||
    mode
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateBlogSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}

export function getBlogIdentifier(blog: Pick<BlogPost, "_id" | "id" | "slug" | "title">): string {
  if (blog.slug) return blog.slug
  if (blog._id) return blog._id
  if (blog.id !== undefined && blog.id !== null) return String(blog.id)
  return generateBlogSlug(blog.title)
}

export function getBlogKey(blog: Pick<BlogPost, "_id" | "id" | "slug" | "title">, fallbackIndex?: number): string {
  const identifier = getBlogIdentifier(blog)
  return fallbackIndex === undefined ? identifier : `${identifier}-${fallbackIndex}`
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  })
}

/**
 * Calculate estimated read time for blog content (in minutes)
 */
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute) || 1
}

export function decodeHtmlEntities(content?: string): string {
  if (!content) return ""
  if (typeof document === "undefined") return content

  const textarea = document.createElement("textarea")
  textarea.innerHTML = content
  return textarea.value
}
