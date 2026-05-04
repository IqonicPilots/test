import { api } from "@/lib/api/axios"

export interface BlogPost {
  _id?: string
  id?: string | number
  slug?: string
  title: string
  description: string
  content?: string
  image: string
  category: string
  author?: string
  publishedAt?: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
  status?: "published" | "draft"
  views?: number
  likes?: number
  commentsCount?: number
  link?: string
}

export interface BlogListResponse {
  status: string
  data: BlogPost[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats?: {
    totalCount?: number
    returnedCount?: number
  }
}

export interface BlogDetailResponse {
  status: string
  data: BlogPost
}

export interface BlogCategoriesResponse {
  status: string
  data: BlogCategory[]
}

export interface BlogCategory {
  _id: string
  name: string
  slug?: string
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface BlogFormPayload {
  title: string
  slug?: string
  description: string
  content?: string
  image: File | string
  category: string
  author?: string
  status: "published" | "draft"
}

export interface BlogCategoryPayload {
  name: string
  slug?: string
}

export const blogApi = {
  /**
   * Fetch all published blog posts
   * Can be used with pagination, search, and filtering
   */
  getAllBlogs: async (
    page = 1,
    limit = 10,
    filters?: {
      search?: string
      category?: string
      status?: "published" | "draft"
      sort?: "newest" | "oldest" | "popular"
    }
  ): Promise<BlogListResponse> => {
    try {
      const response = await api.get<BlogListResponse>("/blogs", {
        params: {
          page,
          limit,
          status: filters?.status || "published",
          ...(filters?.search && { search: filters.search }),
          ...(filters?.category && { category: filters.category }),
          ...(filters?.sort && { sort: filters.sort }),
        },
      })
      return response.data
    } catch (error) {
      // Fallback to empty list if API not available yet
      console.warn("Blog API not available yet, returning empty list")
      return {
        status: "success",
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
      }
    }
  },

  /**
   * Fetch blogs for admin dashboard without forcing published-only status.
   */
  getAdminBlogs: async (
    page = 1,
    limit = 10,
    filters?: {
      search?: string
      category?: string
      status?: "published" | "draft"
      sort?: "newest" | "oldest" | "popular"
    }
  ): Promise<BlogListResponse> => {
    const response = await api.get<BlogListResponse>("/blogs", {
      params: {
        page,
        limit,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.sort && { sort: filters.sort }),
      },
    })
    return response.data
  },

  /**
   * Fetch a single blog post by ID or slug
   */
  getBlogById: async (id: string): Promise<BlogPost> => {
    try {
      const response = await api.get<BlogDetailResponse>(`/blogs/${id}`)
      return response.data.data
    } catch (error) {
      console.warn(`Failed to fetch blog with ID: ${id}`)
      throw error
    }
  },

  /**
   * Fetch a blog post by slug
   */
  getBlogBySlug: async (slug: string): Promise<BlogPost> => {
    try {
      const response = await api.get<BlogDetailResponse>(`/blogs/slug/${slug}`)
      return response.data.data
    } catch (error) {
      console.warn(`Failed to fetch blog with slug: ${slug}`)
      throw error
    }
  },

  /**
   * Get related/similar blog posts
   */
  getRelatedBlogs: async (
    blogId: string,
    limit = 5
  ): Promise<BlogPost[]> => {
    try {
      const response = await api.get<BlogListResponse>(
        `/blogs/${blogId}/related`,
        {
          params: { limit },
        }
      )
      return response.data.data
    } catch (error) {
      console.warn(`Failed to fetch related blogs for: ${blogId}`)
      return []
    }
  },

  /**
   * Get blog posts by category
   */
  getBlogsByCategory: async (
    category: string,
    limit = 10,
    page = 1
  ): Promise<BlogListResponse> => {
    try {
      const response = await api.get<BlogListResponse>("/blogs", {
        params: {
          category,
          status: "published",
          limit,
          page,
        },
      })
      return response.data
    } catch (error) {
      console.warn(`Failed to fetch blogs for category: ${category}`)
      return {
        status: "success",
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
      }
    }
  },

  /**
   * Search blogs
   */
  searchBlogs: async (query: string, limit = 10): Promise<BlogPost[]> => {
    try {
      const response = await api.get<BlogListResponse>("/blogs", {
        params: {
          search: query,
          status: "published",
          limit,
        },
      })
      return response.data.data
    } catch (error) {
      console.warn(`Failed to search blogs with query: ${query}`)
      return []
    }
  },

  createBlog: async (payload: FormData): Promise<BlogPost> => {
    const response = await api.post<BlogDetailResponse>("/blogs", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data
  },

  updateBlog: async (id: string, payload: FormData): Promise<BlogPost> => {
    const response = await api.put<BlogDetailResponse>(`/blogs/${id}`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data
  },

  deleteBlog: async (id: string): Promise<void> => {
    await api.delete(`/blogs/${id}`)
  },

  getBlogCategories: async (): Promise<BlogCategory[]> => {
    const response = await api.get<BlogCategoriesResponse>("/blog-categories")
    return response.data.data || []
  },

  createBlogCategory: async (payload: BlogCategoryPayload): Promise<BlogCategory> => {
    const response = await api.post<{ status: string; data: BlogCategory }>("/blog-categories", payload)
    return response.data.data
  },

  updateBlogCategory: async (id: string, payload: BlogCategoryPayload): Promise<BlogCategory> => {
    const response = await api.put<{ status: string; data: BlogCategory }>(`/blog-categories/${id}`, payload)
    return response.data.data
  },

  deleteBlogCategory: async (id: string): Promise<void> => {
    await api.delete(`/blog-categories/${id}`)
  },
}
