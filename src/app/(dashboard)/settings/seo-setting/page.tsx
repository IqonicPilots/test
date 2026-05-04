"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/axios"
import {
  seoSettingsApi,
  type SEOSettingsData,
} from "@/services/seo-settings.service"
import { useAuthRole } from "@/hooks/use-auth-role"
import { getSettingsSubKeysForRole } from "@/config/roleConfig"
import { ImageUploader } from "@/components/common/ImageUploader"
import { Info, ShieldCheck, Globe, Image as ImageIcon, Smartphone } from "lucide-react"

type SEOSettingsFormState = Omit<SEOSettingsData, 'og_image' | 'favicon' | 'apple_touch_icon'> & {
  og_image: string | File
  favicon: string | File
  apple_touch_icon: string | File
}

function SEOSettingsContent() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SEOSettingsFormState | null>(null)
  const { data, isLoading } = useQuery<SEOSettingsData>({
    queryKey: ["seo-settings"],
    queryFn: () => seoSettingsApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!data) return
    setForm(data as SEOSettingsFormState)
  }, [data])

  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (nextForm: Partial<SEOSettingsData>) => seoSettingsApi.saveSettings(nextForm),
  })

  const updateField = <K extends keyof SEOSettingsFormState>(key: K, value: SEOSettingsFormState[K]) => {
    setForm((prev) => {
      if (!prev) return prev
      return { ...prev, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!form) return
    try {
      const finalData: Partial<SEOSettingsData> = { ...form } as any

      // Handle Image Uploads
      if (form.og_image instanceof File) {
        toast.loading("Uploading OG Image...", { id: "upload-og" })
        const url = await seoSettingsApi.uploadFile(form.og_image)
        updateField("og_image", url)
        finalData.og_image = url
        toast.dismiss("upload-og")
      }

      if (form.favicon instanceof File) {
        toast.loading("Uploading Favicon...", { id: "upload-favicon" })
        const url = await seoSettingsApi.uploadFile(form.favicon)
        updateField("favicon", url)
        finalData.favicon = url
        toast.dismiss("upload-favicon")
      }

      if (form.apple_touch_icon instanceof File) {
        toast.loading("Uploading App Icon...", { id: "upload-app-icon" })
        const url = await seoSettingsApi.uploadFile(form.apple_touch_icon)
        updateField("apple_touch_icon", url)
        finalData.apple_touch_icon = url
        toast.dismiss("upload-app-icon")
      }

      const saved = await saveSettings(finalData)
      setForm(saved as SEOSettingsFormState)
      queryClient.setQueryData(["seo-settings"], saved)
      toast.success("SEO settings saved successfully.")
    } catch (error) {
      toast.error(`Failed to save SEO settings: ${getApiErrorMessage(error)}`)
    }
  }

  const isBusy = isLoading || isSaving || !form

  return (
    <div className="min-w-0 max-w-full space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Standard Meta Tags */}
      <section className="pb-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground/90">Standard Meta Tags</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input
              id="meta-title"
              placeholder="KiviCare – Clinic Management System"
              value={form?.meta_title ?? ""}
              onChange={(e) => updateField("meta_title", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              placeholder="Enter meta description..."
              value={form?.meta_description ?? ""}
              onChange={(e) => updateField("meta_description", e.target.value)}
              disabled={isBusy}
              className="text-foreground min-h-[100px]"
            />
          </div>

          <div className="space-y-3">
            <Label>Meta Keywords</Label>
            <div className="space-y-2">
              {(form?.meta_keywords ?? []).map((keyword, index) => (
                <div key={index} className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <Input
                    placeholder="Enter keyword..."
                    value={keyword}
                    onChange={(e) => {
                      const newKeywords = [...(form?.meta_keywords ?? [])]
                      newKeywords[index] = e.target.value
                      updateField("meta_keywords", newKeywords)
                    }}
                    disabled={isBusy}
                    className="text-foreground"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => {
                      const newKeywords = (form?.meta_keywords ?? []).filter((_, i) => i !== index)
                      updateField("meta_keywords", newKeywords)
                    }}
                    disabled={isBusy}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 cursor-pointer"
                onClick={() => {
                  const newKeywords = [...(form?.meta_keywords ?? []), ""]
                  updateField("meta_keywords", newKeywords)
                }}
                disabled={isBusy}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus mr-2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                Add Keyword
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Robots & Indexing */}
      <section className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground/90">Robots & Indexing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
            <div>
              <Label className="text-sm font-medium">Index this site</Label>
              <p className="text-xs text-muted-foreground">Allow search engines to show this site in search results.</p>
            </div>
            <Switch
              checked={form?.robots_index ?? true}
              onCheckedChange={(checked) => updateField("robots_index", checked)}
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
            <div>
              <Label className="text-sm font-medium">Follow links</Label>
              <p className="text-xs text-muted-foreground">Allow search engines to follow links on this site.</p>
            </div>
            <Switch
              checked={form?.robots_follow ?? true}
              onCheckedChange={(checked) => updateField("robots_follow", checked)}
              disabled={isBusy}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Open Graph (Social Media) */}
      <section className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground/90">Social Media (Open Graph)</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="og-title">OG Title</Label>
            <Input
              id="og-title"
              placeholder="KiviCare – All-in-One Clinic Management Software"
              value={form?.og_title ?? ""}
              onChange={(e) => updateField("og_title", e.target.value)}
              disabled={isBusy}
              className="text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="og-description">OG Description</Label>
            <Textarea
              id="og-description"
              placeholder="Enter OG description..."
              value={form?.og_description ?? ""}
              onChange={(e) => updateField("og_description", e.target.value)}
              disabled={isBusy}
              className="text-foreground min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            <ImageUploader
              label="OG Image"
              value={form?.og_image}
              onChange={(val) => updateField("og_image", val)}
              variant="avatar"
              maxFileSizeKb={1024}
              accept=".jpg,.jpeg,.png,.gif"
              minWidth={1200}
              minHeight={630}
            />
            <div className="flex flex-col justify-center">
              <p className="text-[11px] text-blue-500 dark:text-amber-500 italic">
                Note: Recommended size is 1200x630px. This image appears when you share your link on social media.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Favicon & App Icons */}
      <section className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground/90">Favicon & App Icons</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageUploader
            label="Favicon"
            value={form?.favicon}
            onChange={(val) => updateField("favicon", val)}
            variant="avatar"
            maxFileSizeKb={200}
            accept=".ico,.png,.svg"
            exactWidth={32}
            exactHeight={32}
          />
          <ImageUploader
            label="Apple Touch Icon"
            value={form?.apple_touch_icon}
            onChange={(val) => updateField("apple_touch_icon", val)}
            variant="avatar"
            maxFileSizeKb={500}
            accept=".png"
            exactWidth={180}
            exactHeight={180}
          />
        </div>
        <p className="text-[11px] text-blue-500 dark:text-amber-500 italic mt-4">Note: Favicon should be .ico or .png (32x32px). Apple Touch Icon should be .png (180x180px).</p>
      </section>

      <Separator />

      {/* Note Section */}
      <section className="py-6 px-4 bg-primary/5 rounded-xl border border-primary/10 mt-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">SEO Configuration Guide</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground/80">
              <div>
                <p className="font-medium text-foreground mb-1">Standard Meta Tags</p>
                <p className="text-xs leading-relaxed opacity-80">Title and description appear in search engine results. Keywords help search engines understand your content topics.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Robots Meta Tag</p>
                <p className="text-xs leading-relaxed opacity-80">Controls how search engines crawl and index your site. "Index" allows appearing in searches, while "Follow" allows crawling links.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Open Graph (Social)</p>
                <p className="text-xs leading-relaxed opacity-80">Defines how your site looks when shared on Facebook, WhatsApp, or LinkedIn. The OG Image is crucial for click-through rates.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Favicon & Icons</p>
                <p className="text-xs leading-relaxed opacity-80">Icons represent your brand in browser tabs and mobile home screens. High-quality icons improve trust and user experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isBusy} size="lg" className="min-w-[140px] cursor-pointer shadow-lg shadow-primary/20">
          {isLoading ? "Loading..." : isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}

export default function SEOSettingsPage() {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const { role, isRoleReady } = useAuthRole()

  const allAccordionItems = useMemo(
    () => [
      {
        value: "seo-setting",
        title: "Global SEO & Metadata",
        content: <SEOSettingsContent />,
      },
    ],
    []
  )

  const accordionItems = useMemo(() => {
    if (!isRoleReady || !role) return allAccordionItems
    const allowed = getSettingsSubKeysForRole(role)
    return allAccordionItems.filter((item) => allowed.has(item.value))
  }, [isRoleReady, role, allAccordionItems])

  const [activeTab, setActiveTab] = useState("seo-setting")

  const isValidRequestedTab = useMemo(
    () => Boolean(requestedTab && accordionItems.some((item) => item.value === requestedTab)),
    [requestedTab, accordionItems]
  )

  useEffect(() => {
    if (isValidRequestedTab && requestedTab) {
      setActiveTab(requestedTab)
    }
  }, [requestedTab, accordionItems, isValidRequestedTab])

  useEffect(() => {
    if (!accordionItems.length) return
    if (activeTab === "") return
    const inList = activeTab && accordionItems.some((i) => i.value === activeTab)
    if (!inList) {
      setActiveTab(accordionItems[0].value)
    }
  }, [accordionItems, activeTab])

  return (
    <div className="min-w-0 max-w-full space-y-0">
      <div className="sticky top-0 z-40 mb-3 border-b bg-card pb-3">
        <h2 className="text-xl font-semibold">SEO Settings</h2>
      </div>
      {accordionItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No SEO Settings found matching your search criteria.</p>
        </div>
      ) : (
        <Accordion
          type='single'
          collapsible
          className='min-w-0 w-full max-w-full space-y-4'
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className='rounded-md !border overflow-hidden'
            >
              <AccordionTrigger className='cursor-pointer px-4 hover:no-underline bg-muted/5 hover:bg-muted/10 transition-colors'>
                <div className="flex min-w-0 items-start text-left">
                  <span className="break-words font-medium">{item.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="min-w-0 px-3 text-muted-foreground sm:px-4 pt-6 pb-4">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
