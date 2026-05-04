"use client"

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  blogApi,
  type BlogCategory,
  type BlogCategoryPayload,
  type BlogListResponse,
  type BlogPost,
} from "@/services/blog.service"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"

export const blogsQueryKey = ["blogs"] as const
export const blogCategoriesQueryKey = ["blog-categories"] as const

const getBlogId = (blog?: Partial<BlogPost> | null): string =>
  String(blog?._id || blog?.id || "")

const upsertBlogInList = (items: BlogPost[], blog: BlogPost, prepend = false): BlogPost[] => {
  const targetId = getBlogId(blog)
  if (!targetId) return items

  const existingIndex = items.findIndex((item) => getBlogId(item) === targetId)
  if (existingIndex >= 0) {
    const updated = [...items]
    updated[existingIndex] = { ...updated[existingIndex], ...blog }
    return updated
  }

  return prepend ? [blog, ...items] : items
}

const removeBlogFromList = (items: BlogPost[], blogId: string): BlogPost[] =>
  items.filter((item) => getBlogId(item) !== blogId)

const updateBlogListCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
  blog: BlogPost,
  options?: { prepend?: boolean }
) => {
  queryClient.setQueriesData<BlogListResponse>({ queryKey: blogsQueryKey }, (previous) => {
    if (!previous) return previous
    return {
      ...previous,
      data: upsertBlogInList(previous.data || [], blog, Boolean(options?.prepend)),
    }
  })
}

const removeBlogListCaches = (queryClient: ReturnType<typeof useQueryClient>, blogId: string) => {
  queryClient.setQueriesData<BlogListResponse>({ queryKey: blogsQueryKey }, (previous) => {
    if (!previous) return previous
    return {
      ...previous,
      data: removeBlogFromList(previous.data || [], blogId),
    }
  })
}

const updateBlogDetailCaches = (queryClient: ReturnType<typeof useQueryClient>, blog: BlogPost) => {
  const blogId = getBlogId(blog)
  if (blogId) {
    queryClient.setQueryData<BlogPost>(["blog", blogId], blog)
  }
  if (blog.slug?.trim()) {
    queryClient.setQueryData<BlogPost>(["blog", "slug", blog.slug.trim()], blog)
  }
}

const removeBlogDetailCaches = (queryClient: ReturnType<typeof useQueryClient>, blogId: string) => {
  queryClient.removeQueries({ queryKey: ["blog", blogId], exact: true })

  const slugQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["blog", "slug"] })

  slugQueries.forEach((query) => {
    const cachedBlog = query.state.data as BlogPost | undefined
    if (getBlogId(cachedBlog) === blogId) {
      queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
    }
  })
}

type UseBlogsFilters = {
  search?: string
  category?: string
  status?: "published" | "draft"
  sort?: "newest" | "oldest" | "popular"
}

/**
 * Fetch paginated blogs with filters
 */
export function useBlogs(
  page = 1,
  limit = 10,
  filters?: UseBlogsFilters,
  enabled = true
) {
  const queryKey = useMemo(
    () => [...blogsQueryKey, { page, limit, ...(filters || {}) }],
    [page, limit, filters]
  )

  return useQuery<BlogListResponse>({
    queryKey,
    queryFn: () => blogApi.getAllBlogs(page, limit, filters),
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Fetch paginated blogs for admin dashboard.
 * Unlike public blogs, this does not force status=published.
 */
export function useAdminBlogs(
  page = 1,
  limit = 10,
  filters?: UseBlogsFilters,
  enabled = true
) {
  const queryKey = useMemo(
    () => [...blogsQueryKey, "admin", { page, limit, ...(filters || {}) }],
    [page, limit, filters]
  )

  return useQuery<BlogListResponse>({
    queryKey,
    queryFn: () => blogApi.getAdminBlogs(page, limit, filters),
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Fetch blogs with infinite scroll/pagination
 */
export function useInfiniteBlogs(
  limit = 10,
  filters?: UseBlogsFilters,
  enabled = true
) {
  const queryKey = useMemo(
    () => [...blogsQueryKey, "infinite", { limit, ...(filters || {}) }],
    [limit, filters]
  )

  return useInfiniteQuery<BlogListResponse>({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      blogApi.getAllBlogs(pageParam as number, limit, filters),
    getNextPageParam: (lastPage: BlogListResponse) => {
      const pagination = lastPage.pagination
      if (!pagination) return undefined
      const { page, pages } = pagination
      return page < pages ? page + 1 : undefined
    },
    initialPageParam: 1,
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Fetch a single blog by ID
 */
export function useBlog(id: string, enabled = true) {
  return useQuery<BlogPost>({
    queryKey: ["blog", id],
    queryFn: () => blogApi.getBlogById(id),
    enabled: Boolean(enabled && id),
  })
}

/**
 * Fetch a blog by slug
 */
export function useBlogBySlug(slug: string, enabled = true) {
  return useQuery<BlogPost>({
    queryKey: ["blog", "slug", slug],
    queryFn: () => blogApi.getBlogBySlug(slug),
    enabled: Boolean(enabled && slug),
  })
}

/**
 * Fetch related blogs
 */
export function useRelatedBlogs(blogId: string, limit = 5, enabled = true) {
  return useQuery<BlogPost[]>({
    queryKey: ["blog", blogId, "related"],
    queryFn: () => blogApi.getRelatedBlogs(blogId, limit),
    enabled: Boolean(enabled && blogId),
    placeholderData: [],
  })
}

/**
 * Fetch blogs by category
 */
export function useBlogsByCategory(
  category: string,
  limit = 10,
  page = 1,
  enabled = true
) {
  return useQuery<BlogListResponse>({
    queryKey: ["blogs", "category", category, { page, limit }],
    queryFn: () => blogApi.getBlogsByCategory(category, limit, page),
    enabled: Boolean(enabled && category),
  })
}

/**
 * Search blogs
 */
export function useSearchBlogs(query: string, limit = 10, enabled = true) {
  return useQuery<BlogPost[]>({
    queryKey: ["blogs", "search", query],
    queryFn: () => blogApi.searchBlogs(query, limit),
    enabled: Boolean(enabled && query && query.trim().length > 0),
    placeholderData: [],
  })
}

/**
 * Subscribe to newsletter (stub for future implementation)
 */
export function useNewsletterSubscribe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (email: string) => {
      // This will be implemented when the backend provides the endpoint
      console.warn("Newsletter subscription not yet implemented")
      return { success: true, message: "Thank you for subscribing" }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter"] })
    },
  })
}

export function useCreateBlog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FormData) => blogApi.createBlog(payload),
    onSuccess: async (createdBlog) => {
      updateBlogListCaches(queryClient, createdBlog, { prepend: true })
      updateBlogDetailCaches(queryClient, createdBlog)
      queryClient.invalidateQueries({ queryKey: blogsQueryKey })
      await queryClient.refetchQueries({ queryKey: blogsQueryKey, type: "active" })
      toast.success("Blog created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create blog: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateBlog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
      blogApi.updateBlog(id, payload),
    onSuccess: async (updatedBlog, variables) => {
      updateBlogListCaches(queryClient, updatedBlog)
      updateBlogDetailCaches(queryClient, updatedBlog)
      queryClient.invalidateQueries({ queryKey: blogsQueryKey })
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] })
      await queryClient.refetchQueries({ queryKey: blogsQueryKey, type: "active" })
      toast.success("Blog updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update blog: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => blogApi.deleteBlog(id),
    onSuccess: async (_, deletedId) => {
      removeBlogListCaches(queryClient, deletedId)
      removeBlogDetailCaches(queryClient, deletedId)
      queryClient.invalidateQueries({ queryKey: blogsQueryKey })
      await queryClient.refetchQueries({ queryKey: blogsQueryKey, type: "active" })
      toast.success("Blog deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete blog: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useBlogCategories(enabled = true) {
  return useQuery<BlogCategory[]>({
    queryKey: blogCategoriesQueryKey,
    queryFn: () => blogApi.getBlogCategories(),
    enabled,
    placeholderData: [],
  })
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BlogCategoryPayload) => blogApi.createBlogCategory(payload),
    onSuccess: (createdCategory) => {
      queryClient.setQueryData<BlogCategory[]>(blogCategoriesQueryKey, (previous = []) => {
        const exists = previous.some(
          (category) => category.name.toLowerCase() === createdCategory.name.toLowerCase()
        )
        if (exists) {
          return previous.map((category) =>
            category.name.toLowerCase() === createdCategory.name.toLowerCase()
              ? createdCategory
              : category
          )
        }
        return [...previous, createdCategory].sort((a, b) => a.name.localeCompare(b.name))
      })
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKey })
      toast.success("Category created successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BlogCategoryPayload }) =>
      blogApi.updateBlogCategory(id, payload),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData<BlogCategory[]>(blogCategoriesQueryKey, (previous = []) =>
        previous
          .map((category) => (category._id === updatedCategory._id ? updatedCategory : category))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKey })
      queryClient.invalidateQueries({ queryKey: blogsQueryKey })
      toast.success("Category updated successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${getApiErrorMessage(error)}`)
    },
  })
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => blogApi.deleteBlogCategory(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<BlogCategory[]>(blogCategoriesQueryKey, (previous = []) =>
        previous.filter((category) => category._id !== deletedId)
      )
      queryClient.invalidateQueries({ queryKey: blogCategoriesQueryKey })
      queryClient.invalidateQueries({ queryKey: blogsQueryKey })
      toast.success("Category deleted successfully.")
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${getApiErrorMessage(error)}`)
    },
  })
}
