"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { z } from "zod"
import { GenericFormDialog, type FormFieldConfig } from "@/components/generic-form-dialog"
import {
  useBlogCategories,
  useCreateBlog,
  useCreateBlogCategory,
  useDeleteBlogCategory,
  useUpdateBlog,
  useUpdateBlogCategory,
} from "@/hooks/api/use-blogs"
import type { BlogPost } from "@/services/blog.service"
import { Input } from "@/components/ui/input"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RichTextEditor } from "@/components/common/rich-text-editor"
import { TagsInput } from "@/components/common/tags-input"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"

const blogFormSchema = z
  .object({
    image: z
      .any()
      .refine(
        (value) => value instanceof File || (typeof value === "string" && value.trim().length > 0),
        { message: "Featured image is required." }
      ),
    title: z.string().trim().min(2, { message: "Title must be at least 2 characters." }),
    slug: z.string().trim().optional(),
    category: z.string().trim().min(1, { message: "Category is required." }),
    author: z.string().trim().min(2, { message: "Author is required." }),
    status: z.enum(["published", "draft"]),
    description: z.string().trim().min(10, { message: "Description must be at least 10 characters." }),
    content: z.string().trim().min(1, { message: "Content is required." }),
  })

type BlogFormValues = z.infer<typeof blogFormSchema>

interface BlogFormDialogProps {
  blogToEdit?: BlogPost | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  onSuccess?: () => void
}

export function BlogFormDialog({
  blogToEdit,
  trigger,
  open,
  onOpenChange,
  hideTrigger = false,
  onSuccess,
}: BlogFormDialogProps) {
  const sanitizeSlugInput = (value = "") =>
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")

  const toKebabCase = (value = "") =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")

  const isEditing = Boolean(blogToEdit?._id)
  const createBlogMutation = useCreateBlog()
  const updateBlogMutation = useUpdateBlog()
  const { data: categories = [] } = useBlogCategories()
  const createCategoryMutation = useCreateBlogCategory()
  const updateCategoryMutation = useUpdateBlogCategory()
  const deleteCategoryMutation = useDeleteBlogCategory()
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryOriginalName, setEditingCategoryOriginalName] = useState("")
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const previousTitleRef = useRef("")
  const isSubmitting = createBlogMutation.isPending || updateBlogMutation.isPending

  const defaultValues = useMemo<BlogFormValues>(() => ({
    image: blogToEdit?.image || "",
    title: blogToEdit?.title || "",
    slug: blogToEdit?.slug || "",
    category: blogToEdit?.category || "",
    author: blogToEdit?.author || "",
    status: blogToEdit?.status === "draft" ? "draft" : "published",
    description: blogToEdit?.description || "",
    content: blogToEdit?.content || "",
  }), [blogToEdit])

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(categories.map((value) => value.name.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [categories]
  )

  const isUpdatingCategory = updateCategoryMutation.isPending
  const isDeletingCategory = deleteCategoryMutation.isPending

  useEffect(() => {
    setIsSlugManuallyEdited(false)
    previousTitleRef.current = (blogToEdit?.title || "").trim()
  }, [blogToEdit?._id, blogToEdit?.title])

  const fields: FormFieldConfig[] = [
    {
      name: "image",
      label: "Featured Image",
      type: "image-upload",
      required: true,
      section: "Featured Image",
      gridClass: "md:col-span-2 lg:col-span-3",
      accept: "image/jpeg,image/gif,image/png",
      maxFileSizeKb: 5120,
      imageUploadVariant: "banner",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      section: "Basic Information",
      gridClass: "col-span-2",
    },
    {
      name: "slug",
      label: "Slug",
      type: "custom",
      section: "Basic Information",
      render: (form) => (
        <FormItem>
          <FormLabel>Slug</FormLabel>
          <FormControl>
            <Input
              placeholder="Enter slug"
              className="min-w-0 w-full"
              value={form.watch("slug") || ""}
              onChange={(event) => {
                const nextSlug = sanitizeSlugInput(event.target.value)
                setIsSlugManuallyEdited(nextSlug.length > 0)
                form.setValue("slug", nextSlug, { shouldValidate: true, shouldDirty: true })
              }}
            />
          </FormControl>
          <p className="text-[11px] text-blue-500 dark:text-amber-500">
            Note: Leave blank to auto-generate from title
          </p>
          <FormMessage>{form.formState.errors.slug?.message as string}</FormMessage>
        </FormItem>
      ),
    },
    {
      name: "category",
      label: "Category",
      type: "custom",
      required: true,
      section: "Meta Information",
      render: (form) => {
        const selectedCategory = (form.watch("category") || "").trim()
        const editingCategoryRecord =
          editingCategoryId !== null
            ? categories.find((category) => category._id === editingCategoryId)
            : undefined
        const isEditingSelectedCategory = editingCategoryId !== null

        const handleSaveCategory = async () => {
          const nextCategoryName = selectedCategory.trim()
          if (!editingCategoryId || !nextCategoryName) return

          const previousName = editingCategoryOriginalName || editingCategoryRecord?.name || ""
          const updatedCategory = await updateCategoryMutation.mutateAsync({
            id: editingCategoryId,
            payload: { name: nextCategoryName },
          })

          if (
            previousName &&
            selectedCategory.toLowerCase() === previousName.toLowerCase()
          ) {
            form.setValue("category", updatedCategory.name, { shouldValidate: true, shouldDirty: true })
          }

          setEditingCategoryId(null)
          setEditingCategoryOriginalName("")
        }

        return (
          <FormItem>
            <FormLabel>
              Category<span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TagsInput
                    options={categoryOptions}
                    className="flex-1"
                    singleMode
                    singleValue={selectedCategory}
                    onUpdateSingleValue={(value) =>
                      form.setValue("category", value, { shouldValidate: true, shouldDirty: true })
                    }
                    onEditOption={(option) => {
                      const matchedCategory = categories.find(
                        (category) => category.name.toLowerCase() === option.toLowerCase()
                      )
                      if (!matchedCategory) return
                      setEditingCategoryId(matchedCategory._id)
                      setEditingCategoryOriginalName(matchedCategory.name)
                      form.setValue("category", matchedCategory.name, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                    onDeleteOption={(option) => {
                      const matchedCategory = categories.find(
                        (category) => category.name.toLowerCase() === option.toLowerCase()
                      )
                      if (!matchedCategory) return
                      setCategoryToDelete({
                        id: matchedCategory._id,
                        name: matchedCategory.name,
                      })
                    }}
                    onCreateNew={async (value) => {
                      const trimmed = value.trim()
                      if (!trimmed) return trimmed
                      const createdCategory = await createCategoryMutation.mutateAsync({ name: trimmed })
                      return createdCategory.name
                    }}
                    placeholder="Type or select category..."
                  />
                  {isEditingSelectedCategory ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={handleSaveCategory}
                        disabled={isUpdatingCategory || !selectedCategory.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          form.setValue("category", editingCategoryOriginalName, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                          setEditingCategoryId(null)
                          setEditingCategoryOriginalName("")
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
                <p className="text-[11px] text-blue-500 dark:text-amber-500">
                  Note: Type and press enter to add new category.
                </p>
              </div>
            </FormControl>
            <FormMessage>{form.formState.errors.category?.message as string}</FormMessage>
          </FormItem>
        )
      },
    },
    {
      name: "author",
      label: "Author",
      type: "text",
      required: true,
      section: "Meta Information",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      section: "Meta Information",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
    },
    {
      name: "description",
      label: "Short Description",
      type: "textarea",
      required: true,
      rows: 3,
      section: "Summary",
      gridClass: "md:col-span-2 lg:col-span-3",
    },
    {
      name: "content",
      label: "Content",
      type: "custom",
      section: "Content",
      gridClass: "md:col-span-2 lg:col-span-3",
      render: (form) => (
        <FormItem>
          <FormLabel>
            Content<span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <RichTextEditor
              value={form.watch("content") || ""}
              onChange={(html) => form.setValue("content", html, { shouldValidate: true, shouldDirty: true })}
              placeholder="Write blog content..."
            />
          </FormControl>
          <FormMessage>{form.formState.errors.content?.message as string}</FormMessage>
        </FormItem>
      ),
    },
  ]

  const handleSubmit = async (values: BlogFormValues) => {
    const normalizedSlug = toKebabCase(values.slug || "")
    const payload = new FormData()
    payload.append("title", values.title.trim())
    if (normalizedSlug) payload.append("slug", normalizedSlug)
    payload.append("category", values.category.trim())
    payload.append("author", values.author.trim())
    payload.append("status", values.status)
    payload.append("description", values.description.trim())
    payload.append("content", values.content || "")

    if (values.image instanceof File) {
      payload.append("image", values.image)
    } else if (typeof values.image === "string" && values.image.trim()) {
      payload.append("image", values.image.trim())
    }

    if (isEditing && blogToEdit?._id) {
      await updateBlogMutation.mutateAsync({ id: blogToEdit._id, payload })
    } else {
      await createBlogMutation.mutateAsync(payload)
    }

    onSuccess?.()
  }

  return (
    <>
      <GenericFormDialog
        title={isEditing ? "Edit Blog" : "Add New Blog"}
        description="Fill in the blog details below."
        triggerLabel={isEditing ? "Edit" : "Add Blog"}
        trigger={trigger}
        open={open}
        onOpenChange={onOpenChange}
        hideTrigger={hideTrigger}
        formSchema={blogFormSchema}
        defaultValues={defaultValues}
        fields={fields}
        onSubmit={handleSubmit}
        onValuesChange={(values, form) => {
          const title = values.title?.trim() || ""
          const previousTitle = previousTitleRef.current
          const didTitleChange = title !== previousTitle
          previousTitleRef.current = title

          if (!didTitleChange || isSlugManuallyEdited) {
            return
          }

          if (!title) {
            form.setValue("slug", "", { shouldDirty: false, shouldValidate: true })
            return
          }

          form.setValue("slug", toKebabCase(title), {
            shouldDirty: false,
            shouldValidate: true,
          })
        }}
        dialogSize="xl"
        hideSectionHeadings
        submitButtonText={isEditing ? "Update Blog" : "Save Blog"}
        isSubmitting={isSubmitting}
        submitDisabled={isSubmitting}
      />

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCategoryToDelete(null)
          }
        }}
        title="Delete Category?"
        description={`Are you sure you want to delete "${categoryToDelete?.name || ""}"?`}
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingCategory}
        onConfirm={async () => {
          if (!categoryToDelete) return
          await deleteCategoryMutation.mutateAsync(categoryToDelete.id)
          setCategoryToDelete(null)
          setEditingCategoryId((current) =>
            current === categoryToDelete.id ? null : current
          )
          setEditingCategoryOriginalName("")
        }}
      />
    </>
  )
}
