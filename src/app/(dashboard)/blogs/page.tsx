"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowUp, BookOpen, CheckCircle2, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/role-guard"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { getApiErrorMessage } from "@/lib/api/axios"
import { useAdminBlogs, useBlogCategories, useDeleteBlog } from "@/hooks/api/use-blogs"
import { blogApi } from "@/services/blog.service"
import { toast } from "sonner"
import { DataTable } from "@/app/(dashboard)/patients/components/data-table"
import { getColumns, type BlogTableRow } from "./components/columns"
import { BlogFormDialog } from "./components/blog-form-dialog"
import { BlogViewDialog } from "./components/blog-view-dialog"
import type { BlogPost } from "@/services/blog.service"

export default function AdminBlogsPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const { data: response, isLoading, error } = useAdminBlogs(page, perPage, {
    search: debouncedSearch || undefined,
    status: statusFilter ? (statusFilter as "published" | "draft") : undefined,
    category: categoryFilter || undefined,
    sort: "newest",
  })
  const { data: categoryOptions = [] } = useBlogCategories()
  const deleteBlogMutation = useDeleteBlog()

  const blogs = useMemo(() => response?.data ?? [], [response])
  const pagination = response?.pagination

  const rows = useMemo<BlogTableRow[]>(
    () =>
      blogs.map((blog) => ({
        id: String(blog._id || blog.id || ""),
        title: blog.title || "-",
        category: blog.category || "-",
        author: blog.author || "",
        createdAt: String(blog.createdAt || blog.publishedAt || ""),
        status: blog.status === "draft" ? "draft" : "published",
        sourceBlog: blog,
      })),
    [blogs]
  )

  const stats = useMemo(() => {
    const total = pagination?.total ?? blogs.length
    const published = blogs.filter((blog) => blog.status !== "draft").length
    const draft = blogs.filter((blog) => blog.status === "draft").length
    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)

    return {
      total,
      published,
      draft,
      publishedPct: getPct(published),
      draftPct: getPct(draft),
    }
  }, [blogs, pagination?.total])

  const handleDeleteBlog = useCallback(async (blog: BlogPost) => {
    const blogId = String(blog?._id || blog?.id || "")
    if (!blogId) return
    await deleteBlogMutation.mutateAsync(blogId)
  }, [deleteBlogMutation])

  const handleViewBlog = useCallback(
    async (blog: BlogPost) => {
      const slug = blog.slug?.trim()
      if (!slug) return

      setIsViewModalOpen(true)
      const cachedBlog = queryClient.getQueryData<BlogPost>(["blog", "slug", slug]) ?? null
      if (cachedBlog) {
        setSelectedBlog(cachedBlog)
        return
      }

      try {
        setSelectedBlog(null)
        setIsViewLoading(true)
        const fetchedBlog = await queryClient.fetchQuery({
          queryKey: ["blog", "slug", slug],
          queryFn: () => blogApi.getBlogBySlug(slug),
          staleTime: 5 * 60 * 1000,
        })
        setSelectedBlog(fetchedBlog)
      } catch (error) {
        toast.error(`Failed to load blog preview: ${getApiErrorMessage(error)}`)
      } finally {
        setIsViewLoading(false)
      }
    },
    [queryClient]
  )

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteBlog: handleDeleteBlog,
        onViewBlog: handleViewBlog,
        isDeleting: deleteBlogMutation.isPending,
        isViewing: isViewLoading,
      }),
    [deleteBlogMutation.isPending, handleDeleteBlog, handleViewBlog, isViewLoading]
  )

  return (
    <RoleGuard allowedRoles={["admin"]} fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Blogs</h1>
        <p className="text-muted-foreground">Manage all blog content published across your platform.</p>
      </div>

      <div className="mt-4 flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Blogs</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        100%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <BookOpen className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Published</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.published}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {stats.publishedPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <CheckCircle2 className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Draft</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.draft}</span>
                      <span className="flex items-center gap-0.5 text-sm text-orange-500">
                        <ArrowUp className="size-3.5" />
                        {stats.draftPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <FileText className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Blogs</CardTitle>
            <CardDescription>View and manage all blog entries in one place</CardDescription>
            {error ? (
              <p className="text-sm text-destructive pt-1">{getApiErrorMessage(error)}</p>
            ) : null}
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={rows}
              toolbarConfig={{
                searchPlaceholder: "Search blogs...",
                addButton: { label: "Add Blog", onClick: () => setShowAddDialog(true) },
                categoryFilter: {
                  allLabel: "All Categories",
                  placeholder: "Categories",
                  options: categoryOptions.map((category) => ({
                    label: category.name,
                    value: category.name,
                  })),
                },
                selectFilter: {
                  columnId: "status",
                  placeholder: "Status",
                  options: [
                    { label: "Published", value: "published" },
                    { label: "Draft", value: "draft" },
                  ],
                  allLabel: "All Status",
                },
                showViewOptions: true,
                serverSideFilters: true,
                filterState: {
                  search: searchQuery,
                  category: categoryFilter || "all",
                  status: statusFilter || "all",
                },
                onFilterChange: (filters) => {
                  if (filters.search !== undefined) {
                    setSearchQuery(filters.search)
                  }
                  if (filters.status !== undefined) {
                    setStatusFilter(filters.status === "all" ? "" : filters.status)
                  }
                  if (filters.category !== undefined) {
                    setCategoryFilter(filters.category === "all" ? "" : filters.category)
                  }
                },
                onResetFilters: () => {
                  setSearchQuery("")
                  setStatusFilter("")
                  setCategoryFilter("")
                  setPage(1)
                },
              }}
              isLoading={isLoading && !rows.length}
              pageCount={pagination?.pages || 1}
              pageIndex={Math.max(0, page - 1)}
              pageSize={pagination?.limit || perPage}
              onPageChange={(nextPage) => setPage(nextPage)}
              onPageSizeChange={(size) => {
                setPerPage(size)
                setPage(1)
              }}
              serverSideFiltering={true}
            />
          </CardContent>
        </Card>
      </div>
      <BlogFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        hideTrigger
      />
      <BlogViewDialog
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) {
            setIsViewLoading(false)
          }
        }}
        blog={selectedBlog}
        isLoading={isViewLoading}
      />
    </RoleGuard>
  )
}
