"use client"

import React from 'react'
import * as Icons from 'lucide-react'
import { Palette, RotateCcw, Settings, X, Dices, Upload, ExternalLink, Layout, FileEdit, Save, Loader2, Building2, BarChart3, Info, Zap, Users2, CreditCard, Quote, Newspaper, HelpCircle, MousePointer2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useThemeManager } from '@/hooks/use-theme-manager'
import { useCircularTransition } from '@/hooks/use-circular-transition'
import { customizerApi, type LandingContentSettings, type LandingSectionConfig } from '@/services/customizer.service'
import { useLandingContent, AVAILABLE_LINKS, DEFAULT_SETTINGS } from '../../../contexts/landing-content-context'
import { useClinics } from '@/hooks/api/use-clinics'
import { toast } from 'sonner'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'
import { radiusOptions, customColorGroups } from '@/config/theme-customizer-constants'
import { ColorPicker } from '@/components/color-picker'
import { ImportModal } from '@/components/theme-customizer/import-modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ImportedTheme } from '@/types/theme-customizer'
import { Plus, Trash2, ArrowUpDown, Image as ImageIcon } from 'lucide-react'

const DEFAULT_CONTACT_OPTIONS = [
  {
    icon: "MessageCircle",
    title: "Talk to Our Team",
    description: "Connect with our team to discuss your clinic requirements and get the best solution.",
    buttonText: "Contact on LinkedIn",
    buttonLink: "#",
    tooltip: "Response within 24 hours"
  },
  {
    icon: "Headphones",
    title: "Contact Support",
    description: "Get help with setup, customization, or any queries related to your clinic management system.",
    buttonText: "Contact Support",
    buttonLink: "#"
  },
  {
    icon: "BookOpen",
    title: "Documentation",
    description: "Browse our comprehensive guides, tutorials, and component documentation.",
    buttonText: "View Docs",
    buttonLink: "#"
  }
]

const ColorSettingsGroup = ({
  settings,
  config,
  onUpdate,
  section
}: {
  settings: { label: string, property: keyof LandingSectionConfig, fallback?: string }[],
  config: LandingSectionConfig,
  onUpdate: (section: keyof LandingContentSettings, config: Partial<LandingSectionConfig>) => void,
  section: keyof LandingContentSettings
}) => (
  <div className="grid grid-cols-1 gap-4 pt-2 border-t border-dashed">
    {settings.map((s) => (
      <ColorPicker
        key={s.property}
        label={s.label}
        cssVar={s.fallback || s.property}
        value={(config as any)[s.property] || ""}
        onChange={(_, val) => onUpdate(section, { [s.property]: val })}
      />
    ))}
  </div>
)

interface LandingThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function IconPicker({
  value,
  onChange,
  placeholder = "Search or type icon..."
}: {
  value: string,
  onChange: (value: string) => void,
  placeholder?: string
}) {
  const [search, setSearch] = React.useState(value || "")

  const COMMON_ICONS = [
    "Star", "Zap", "Sparkles", "TrendingUp", "Award", "Flame", "CheckCircle2",
    "ShieldCheck", "Rocket", "Crown", "Gift", "Heart", "Bell", "Newspaper",
    "Mail", "Users", "Calendar", "Activity", "Stethoscope", "Hospital",
    "Clock", "Info", "ArrowRight", "ChevronRight", "Search", "Settings",
    "Briefcase", "MessageSquare", "Phone", "Globe", "CreditCard", "ClipboardList",
    "Video", "Pill", "Syringe", "CalendarCheck2", "Settings2", "HeartPulse", "Users2", "BarChart3",
    "Facebook", "Twitter", "Instagram", "Linkedin"
  ]

  const filteredIcons = COMMON_ICONS.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-2 p-2 bg-muted/20 rounded-md border border-border/50">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              // Allow manual typing by updating parent if icon exists
              if ((Icons as any)[e.target.value]) {
                onChange(e.target.value)
              }
            }}
            placeholder={placeholder}
            className="h-8 text-[11px] pr-8 bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center p-1 rounded bg-background w-8 h-8 shrink-0 border border-primary/20 shadow-sm">
          {React.createElement((Icons as any)[value] || Icons.HelpCircle, { className: "h-3.5 w-3.5 text-primary" })}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 max-h-[140px] overflow-y-auto p-1.5 rounded-md bg-background border custom-scrollbar">
        {filteredIcons.map((name) => (
          <TooltipProvider key={name}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    onChange(name)
                    setSearch(name)
                  }}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-sm hover:bg-primary/10 transition-colors border border-transparent",
                    value === name ? "bg-primary/20 border-primary/40 shadow-sm scale-95" : "bg-muted/40"
                  )}
                >
                  {React.createElement((Icons as any)[name] || Icons.HelpCircle, { className: "h-4 w-4" })}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[10px] py-1 px-2 bg-popover text-popover-foreground border shadow-md">
                {name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {filteredIcons.length === 0 && search && (
          <div className="col-span-6 py-4 text-center text-[10px] text-muted-foreground italic">
            Press enter to use "{search}"
          </div>
        )}
      </div>
    </div>
  )
}

const FOOTER_SOCIAL_PLATFORMS = ["Facebook", "Twitter", "Instagram", "Linkedin", "Whatsapp", "Youtube"]

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const SOCIAL_ICON_MAP: Record<string, string> = {
  "Facebook": "Facebook",
  "Twitter": "Twitter",
  "Instagram": "Instagram",
  "Linkedin": "Linkedin",
  "Whatsapp": "Whatsapp",
  "Youtube": "Youtube"
}

function SectionCustomizer({
  label,
  section,
  config,
  onUpdate,
  icon: Icon
}: {
  label: string
  section: keyof LandingContentSettings
  config: LandingSectionConfig
  onUpdate: (section: keyof LandingContentSettings, config: Partial<LandingSectionConfig>) => void
  icon: React.ElementType
}) {
  const addLogo = () => {
    const newLogos = [...(config.logos || []), { url: "", alt: "" }]
    onUpdate(section, { logos: newLogos })
  }

  const removeLogo = (index: number) => {
    const newLogos = (config.logos || []).filter((_, i) => i !== index)
    onUpdate(section, { logos: newLogos })
  }

  const updateLogo = (index: number, url: string) => {
    const newLogos = [...(config.logos || [])]
    newLogos[index] = { ...newLogos[index], url }
    onUpdate(section, { logos: newLogos })
  }

  const addItem = () => {
    const newItems = [...(config.items || []), { icon: "Activity", value: "", label: "" }]
    onUpdate(section, { items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = (config.items || []).filter((_, i) => i !== index)
    onUpdate(section, { items: newItems })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...(config.items || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate(section, { items: newItems })
  }

  // Feature Helpers
  const addFeature = (type: 'main' | 'secondary') => {
    const field = type === 'main' ? 'mainFeatures' : 'secondaryFeatures'
    const current = config[field] || []
    onUpdate(section, { [field]: [...current, { icon: "Zap", title: "", description: "" }] })
  }

  const removeFeature = (type: 'main' | 'secondary', index: number) => {
    const field = type === 'main' ? 'mainFeatures' : 'secondaryFeatures'
    const newFeatures = (config[field] || []).filter((_, i: number) => i !== index)
    onUpdate(section, { [field]: newFeatures })
  }

  const updateFeature = (type: 'main' | 'secondary', index: number, field: string, value: string) => {
    const listField = type === 'main' ? 'mainFeatures' : 'secondaryFeatures'
    const newFeatures = [...(config[listField] || [])]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    onUpdate(section, { [listField]: newFeatures })
  }

  const moveFeature = (type: 'main' | 'secondary', index: number, direction: 'up' | 'down') => {
    const listField = type === 'main' ? 'mainFeatures' : 'secondaryFeatures'
    const list = [...(config[listField] || [])]
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]]
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]]
    }
    onUpdate(section, { [listField]: list })
  }

  // Blog Helpers
  const addPost = () => {
    const newPosts = [...(config.posts || []), { image: "", category: "General", title: "", description: "", link: "#" }]
    onUpdate(section, { posts: newPosts })
  }

  const removePost = (index: number) => {
    const newPosts = (config.posts || []).filter((_, i) => i !== index)
    onUpdate(section, { posts: newPosts })
  }

  const updatePost = (index: number, field: string, value: string) => {
    const newPosts = [...(config.posts || [])]
    newPosts[index] = { ...newPosts[index], [field]: value }
    onUpdate(section, { posts: newPosts })
  }

  // FAQ Helpers
  const addFaqItem = () => {
    const newItems = [...(config.faqItems || []), { question: "", answer: "" }]
    onUpdate(section, { faqItems: newItems })
  }

  const removeFaqItem = (index: number) => {
    const newItems = (config.faqItems || []).filter((_, i) => i !== index)
    onUpdate(section, { faqItems: newItems })
  }

  const updateFaqItem = (index: number, field: string, value: string) => {
    const newItems = [...(config.faqItems || [])]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate(section, { faqItems: newItems })
  }

  // Contact Helpers
  const addContactOption = () => {
    const newOptions = [...(config.contactOptions || []), { icon: "MessageCircle", title: "", description: "", buttonText: "Contact Us", buttonLink: "#" }]
    onUpdate(section, { contactOptions: newOptions })
  }

  const removeContactOption = (index: number) => {
    const newOptions = (config.contactOptions || []).filter((_, i) => i !== index)
    onUpdate(section, { contactOptions: newOptions })
  }

  const updateContactOption = (index: number, field: string, value: string) => {
    const currentOptions = config.contactOptions && config.contactOptions.length > 0 ? config.contactOptions : DEFAULT_CONTACT_OPTIONS
    const newOptions = [...currentOptions]
      ; (newOptions[index] as any)[field] = value
    onUpdate(section, { contactOptions: newOptions })
  }

  // Header/Footer Helpers
  const addMenuLink = () => {
    const newLinks = [...(config.menuLinks || []), { label: "", link: "#" }]
    onUpdate(section, { menuLinks: newLinks })
  }

  const removeMenuLink = (index: number) => {
    const newLinks = (config.menuLinks || []).filter((_, i) => i !== index)
    onUpdate(section, { menuLinks: newLinks })
  }

  const updateMenuLink = (index: number, field: string, value: string) => {
    const newLinks = [...(config.menuLinks || [])]
      ; (newLinks[index] as any)[field] = value
    onUpdate(section, { menuLinks: newLinks })
  }

  const hasButtons = ['hero', 'about', 'cta', 'team', 'faq'].includes(section)
  const hasSecondaryButton = ['hero', 'about', 'cta'].includes(section)
  const defaultBlogLimit = Number(DEFAULT_SETTINGS.blog.blogLimit || 1)
  const [blogLimitInput, setBlogLimitInput] = React.useState<string>(
    String(Math.max(1, Number(config.blogLimit ?? defaultBlogLimit) || defaultBlogLimit))
  )
  const isEditingBlogLimitRef = React.useRef(false)

  React.useEffect(() => {
    if (section !== 'blog' || isEditingBlogLimitRef.current) return
    const nextLimit = Math.max(1, Number(config.blogLimit ?? defaultBlogLimit) || defaultBlogLimit)
    const nextValue = String(nextLimit)
    if (nextValue !== blogLimitInput) {
      setBlogLimitInput(nextValue)
    }
  }, [section, config.blogLimit, defaultBlogLimit, blogLimitInput])

  const commitBlogLimit = (rawValue: string) => {
    const parsedValue = Number(rawValue)
    const nextValue = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultBlogLimit
    onUpdate(section, { blogLimit: nextValue })
    setBlogLimitInput(String(nextValue))
  }


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSuccess(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const COMMON_ICONS = [
    "Star", "Zap", "Sparkles", "TrendingUp", "Award", "Flame", "CheckCircle2",
    "ShieldCheck", "Rocket", "Crown", "Gift", "Heart", "Bell", "Newspaper",
    "Mail", "Users", "Calendar", "Activity", "Stethoscope", "Hospital",
    "Clock", "Info", "ArrowRight", "ChevronRight", "Search", "Settings",
    "Briefcase", "MessageSquare", "Phone", "Globe", "CreditCard", "ClipboardList",
    "Video", "Pill", "Syringe", "CalendarCheck2", "Settings2", "HeartPulse", "Users2", "BarChart3"
  ]


  // CTA Helpers removed as we use specific fields now

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
        <AccordionItem value={section as string} className="border-none">
          <div className="flex items-center hover:bg-muted/50 transition-colors group relative">
            {section !== 'header' && section !== 'footer' && (
              <Switch
                checked={!!config.show}
                onCheckedChange={(checked) => onUpdate(section, { show: checked })}
                className="absolute left-4 z-10 scale-90 shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <AccordionTrigger className={cn(
              "flex-1 py-4 pr-4 hover:no-underline items-center justify-between w-full",
              (section === 'header' || section === 'footer') ? "pl-4" : "pl-14"
            )}>
              <div className="flex items-center gap-3 text-left">
                <div className="p-1.5 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold truncate">{label}</span>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4 border-t border-border bg-muted/20">
            {/* Common Section Settings - Grouped in Accordion */}
            <div className="pt-2">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="colors" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline font-semibold text-xs text-primary uppercase">
                    Color Settings
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-2 space-y-4 px-1">
                    <ColorSettingsGroup
                      settings={[
                        { label: "Section Background Color", property: "sectionBgColor", fallback: "--background" },
                        { label: "Font Color", property: "sectionTextColor", fallback: "--foreground" },
                        { label: "Highlight Color", property: "sectionHighlightColor", fallback: "--primary" }
                      ]}
                      config={config}
                      onUpdate={onUpdate}
                      section={section}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Separator className="mt-2" />
            </div>



            {/* Section Settings Accordion - Consolidated everything except colors */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="section-settings" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline font-semibold text-xs text-primary uppercase">
                  Section Settings
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2 space-y-6 px-1">
                  {/* Layout Settings (Conditional) */}
                  {(section === 'hero' || section === 'cta' || section === 'about') && (
                    <div className="space-y-4 pt-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Layout & Design</Label>
                      {section === 'hero' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground">Hero Design Style</Label>
                          <Select
                            value={config.heroLayout || 'style1'}
                            onValueChange={(val: any) => onUpdate(section, { heroLayout: val })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select Layout" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="style1">Layout 1 (Standard Hero)</SelectItem>
                              <SelectItem value="style2">Layout 2 (Mini CTA as Hero)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground mt-1 px-1">Choose your primary design style.</p>
                        </div>
                      )}

                      {section === 'about' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground/70">Clinic Filter</Label>
                            <Select value={config.filter || "latest"} onValueChange={(value: any) => onUpdate(section, { filter: value })}>
                              <SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="Filter..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="latest">Latest</SelectItem>
                                <SelectItem value="oldest">Oldest</SelectItem>
                                <SelectItem value="top">Top Rated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground/70">Limit</Label>
                            <Input type="number" value={config.limit || 4} onChange={(e) => onUpdate(section, { limit: parseInt(e.target.value) || 4 })} className="h-8 text-[10px]" />
                          </div>
                        </div>
                      )}
                      <Separator />
                    </div>
                  )}

                  {/* Main Content (Title & Description) */}
                  <div className="space-y-4 pt-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Main Content</Label>
                    <div className="space-y-3">
                      {section !== 'header' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Title</Label>
                          {section === 'hero' && config.heroLayout === 'style2' ? (
                            <Input
                              value={config.hero2Title || ""}
                              onChange={(e) => onUpdate(section, { hero2Title: e.target.value })}
                              placeholder="Hero Style 2 Title"
                              className="h-9 font-bold"
                            />
                          ) : (
                            <Input
                              value={config.title || (DEFAULT_SETTINGS[section] as any)?.title || ""}
                              onChange={(e) => onUpdate(section, { title: e.target.value })}
                              placeholder="Section Title"
                              className="h-9 font-bold"
                            />
                          )}
                        </div>
                      )}
                      {section !== 'logos' && section !== 'stats' && section !== 'header' && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Description</Label>
                            {section === 'hero' && config.heroLayout === 'style2' ? (
                              <Textarea
                                value={config.hero2Description || ""}
                                onChange={(e) => onUpdate(section, { hero2Description: e.target.value })}
                                placeholder="Hero Style 2 Description"
                                className="min-h-[80px] text-xs resize-none"
                              />
                            ) : (
                              <Textarea
                                value={config.description || (DEFAULT_SETTINGS[section] as any)?.description || ""}
                                onChange={(e) => onUpdate(section, { description: e.target.value })}
                                placeholder="Section Description"
                                className="min-h-[80px] text-xs resize-none"
                              />
                            )}
                          </div>
                        </>
                      )}

                      {/* Navigation Links - Shown for BOTH Header and Footer */}
                      {(section === 'header' || section === 'footer') && (
                        <div className="space-y-4 pt-2">
                          {(section !== 'footer') && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Navigation Links</Label>
                                <Button variant="outline" size="sm" onClick={addMenuLink} className="h-6 px-2 text-[10px] font-bold"><Plus className="h-3 w-3 mr-1" /> Add</Button>
                              </div>
                              <div className="space-y-2">
                                {(config.menuLinks ?? (DEFAULT_SETTINGS[section] as any)?.menuLinks ?? []).map((link: any, index: number) => (
                                  <div key={index} className="p-2 bg-card border rounded-md space-y-2 relative group-item hover:border-primary/20 transition-all">
                                    <Button variant="ghost" size="icon" onClick={() => removeMenuLink(index)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-2.5 w-2.5" /></Button>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input value={link.label} onChange={(e) => updateMenuLink(index, 'label', e.target.value)} className="h-7 text-[10px] font-bold" placeholder="Label" />
                                      <Input value={link.link} onChange={(e) => updateMenuLink(index, 'link', e.target.value)} className="h-7 text-[10px]" placeholder="Link/ID" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {section === 'footer' && (
                            <>
                              <Separator />
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase text-muted-foreground">Social Media Links</Label>
                                  <p className="text-[9px] text-muted-foreground italic mb-4">Any link (including #) will display the icon in the footer</p>
                                  {FOOTER_SOCIAL_PLATFORMS.map((platform) => {
                                    const existingSocial = (config.socialLinks || []).find((social: any) => social.icon === platform)
                                    const currentLink = existingSocial?.link || ""
                                    const isConfigured = currentLink.trim() && currentLink.trim() !== ""

                                    return (
                                      <div key={platform} className={`p-3 bg-card border rounded-md space-y-2 transition-all ${isConfigured ? 'border-primary/40 bg-primary/5' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${isConfigured ? 'bg-primary/20 text-primary border-primary/40' : 'bg-muted text-muted-foreground border-border'}`}>
                                            {platform === "Whatsapp" ? <WhatsAppIcon className="h-4 w-4" /> : React.createElement((Icons as any)[SOCIAL_ICON_MAP[platform]] || Icons.HelpCircle, { className: "h-4 w-4" })}
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">{platform} URL</Label>
                                              {isConfigured && <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-700 dark:text-green-400 font-medium">Active</span>}
                                            </div>
                                            <Input
                                              value={currentLink}
                                              onChange={(e) => {
                                                const link = e.target.value
                                                const currentLinks = [...(config.socialLinks || [])]
                                                const existingIndex = currentLinks.findIndex((social: any) => social.icon === platform)

                                                if (link.trim() === "") {
                                                  if (existingIndex !== -1) {
                                                    currentLinks.splice(existingIndex, 1)
                                                  }
                                                } else if (existingIndex !== -1) {
                                                  currentLinks[existingIndex] = { ...currentLinks[existingIndex], link }
                                                } else {
                                                  currentLinks.push({ icon: platform, link })
                                                }

                                                onUpdate(section, { socialLinks: currentLinks })
                                              }}
                                              className="h-8 text-[10px]"
                                              placeholder="https://"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Copyright Info</Label>
                                <Input value={config.copyright || (DEFAULT_SETTINGS[section] as any)?.copyright || ""} onChange={(e) => onUpdate(section, { copyright: e.target.value })} className="h-8 text-[11px] font-bold" />
                              </div>

                              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">"Made By" Credits</Label>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-[9px]">Text (e.g. Made with)</Label>
                                      <Input value={config.footerMadeByText || (DEFAULT_SETTINGS[section] as any)?.footerMadeByText || ""} onChange={(e) => onUpdate(section, { footerMadeByText: e.target.value })} className="h-7 text-[10px]" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[9px]">Author Name</Label>
                                      <Input value={config.footerMadeByAuthor || (DEFAULT_SETTINGS[section] as any)?.footerMadeByAuthor || ""} onChange={(e) => onUpdate(section, { footerMadeByAuthor: e.target.value })} className="h-7 text-[10px]" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[9px]">Author Link/URL</Label>
                                    <Input value={config.footerMadeByLink || (DEFAULT_SETTINGS[section] as any)?.footerMadeByLink || ""} onChange={(e) => onUpdate(section, { footerMadeByLink: e.target.value })} className="h-7 text-[10px]" />
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              <div className="space-y-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-bold uppercase">Newsletter Section</Label>
                                  <Switch
                                    checked={config.showNewsletter !== false}
                                    onCheckedChange={(val) => onUpdate(section, { showNewsletter: val })}
                                  />
                                </div>
                                {(config.showNewsletter !== false) && (
                                  <div className="space-y-3 mt-2">
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px]">Title</Label>
                                      <Input value={config.newsletterTitle || (DEFAULT_SETTINGS[section] as any)?.newsletterTitle || ""} onChange={(e) => onUpdate(section, { newsletterTitle: e.target.value })} className="h-8 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px]">Description</Label>
                                      <Textarea value={config.newsletterDescription || (DEFAULT_SETTINGS[section] as any)?.newsletterDescription || ""} onChange={(e) => onUpdate(section, { newsletterDescription: e.target.value })} className="min-h-[60px] text-[10px] resize-none" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Separator />

                              <FooterContactSettings config={config} onUpdate={onUpdate} />

                              <Separator />

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-bold uppercase text-muted-foreground">Bottom Foot Menu</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const current = config.bottomMenuLinks || []
                                      onUpdate(section, { bottomMenuLinks: [...current, { label: "New Link", link: "#" }] })
                                    }}
                                    className="h-6 px-2 text-[10px] font-bold"
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {(config.bottomMenuLinks || (DEFAULT_SETTINGS[section] as any)?.bottomMenuLinks || []).map((link: any, index: number) => (
                                    <div key={index} className="p-2 bg-card border rounded-md space-y-2 relative">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          const current = [...(config.bottomMenuLinks || [])]
                                          current.splice(index, 1)
                                          onUpdate(section, { bottomMenuLinks: current })
                                        }}
                                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border shadow-xs text-destructive"
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </Button>
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input value={link.label} onChange={(e) => {
                                          const current = [...(config.bottomMenuLinks || [])]
                                          current[index] = { ...current[index], label: e.target.value }
                                          onUpdate(section, { bottomMenuLinks: current })
                                        }} className="h-7 text-[10px] font-bold" placeholder="Label" />
                                        <Input value={link.link} onChange={(e) => {
                                          const current = [...(config.bottomMenuLinks || [])]
                                          current[index] = { ...current[index], link: e.target.value }
                                          onUpdate(section, { bottomMenuLinks: current })
                                        }} className="h-7 text-[10px]" placeholder="Link" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <Separator />
                  </div>

                  {/* Header-specific Simplified Action Labels */}
                  {section === 'header' && (
                    <div className="space-y-4 pt-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Action Labels</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Book Appointment Label</Label>
                          <Input value={config.buttonText || (DEFAULT_SETTINGS.header as any).buttonText} onChange={(e) => onUpdate(section, { buttonText: e.target.value })} className="h-8 text-xs font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Sign In Label</Label>
                            <Input value={config.button2Text || (DEFAULT_SETTINGS.header as any).button2Text} onChange={(e) => onUpdate(section, { button2Text: e.target.value, loginText: e.target.value })} className="h-8 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Sign Out Label</Label>
                            <Input value={config.logoutText || (DEFAULT_SETTINGS.header as any).logoutText} onChange={(e) => onUpdate(section, { logoutText: e.target.value })} className="h-8 text-xs font-bold" />
                          </div>
                        </div>
                      </div>
                      <Separator />

                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Account Menu Settings</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Dashboard Label</Label>
                          <Input value={config.dashboardText || (DEFAULT_SETTINGS.header as any).dashboardText} onChange={(e) => onUpdate(section, { dashboardText: e.target.value })} className="h-8 text-xs font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Profile Label</Label>
                          <Input value={config.profileText || (DEFAULT_SETTINGS.header as any).profileText} onChange={(e) => onUpdate(section, { profileText: e.target.value })} className="h-8 text-xs font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px]">Security Label</Label>
                          <Input value={config.passwordText || (DEFAULT_SETTINGS.header as any).passwordText} onChange={(e) => onUpdate(section, { passwordText: e.target.value })} className="h-8 text-xs font-bold" />
                        </div>
                      </div>
                      <Separator />
                    </div>
                  )}

                  {/* Badge Configuration */}
                  {section !== 'logos' && section !== 'stats' && section !== 'header' && section !== 'footer' && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Badge Settings</Label>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Badge Text</Label>
                          <Input
                            value={(section === 'hero' && config.heroLayout === 'style2' ? (config.hero2Badge || DEFAULT_SETTINGS.hero.hero2Badge) : (config.badge || (DEFAULT_SETTINGS[section] as any)?.badge)) || ""}
                            onChange={(e) => onUpdate(section, section === 'hero' && config.heroLayout === 'style2' ? { hero2Badge: e.target.value } : { badge: e.target.value })}
                            placeholder="e.g. New Feature"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Badge Icon</Label>
                          <IconPicker
                            value={(section === 'hero' && config.heroLayout === 'style2' ? config.hero2BadgeIcon : config.badgeIcon) || ""}
                            onChange={(val) => onUpdate(section, section === 'hero' && config.heroLayout === 'style2' ? { hero2BadgeIcon: val } : { badgeIcon: val })}
                          />
                        </div>
                      </div>
                      <Separator />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {hasButtons && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Button Settings</Label>
                      <div className="space-y-6">
                        {/* Primary Button */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase">Primary Button</Label>
                            <Switch
                              checked={!!config.showButton}
                              onCheckedChange={(checked) => onUpdate(section, { showButton: checked })}
                              className="scale-75"
                            />
                          </div>
                          {config.showButton && (
                            <div className="space-y-3 bg-muted/30 p-2 rounded-md border border-dashed">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Text</Label>
                                  <Input
                                    value={config.buttonText || ""}
                                    onChange={(e) => onUpdate(section, { buttonText: e.target.value })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Link</Label>
                                  <Select
                                    value={config.buttonLink || ""}
                                    onValueChange={(value) => onUpdate(section, { buttonLink: value })}
                                  >
                                    <SelectTrigger className="h-8 text-[10px]">
                                      <SelectValue placeholder="Link" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_LINKS.map((link) => (
                                        <SelectItem key={link.value} value={link.value} className="text-[10px]">
                                          {link.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Icon</Label>
                                <IconPicker
                                  value={config.buttonIcon || ""}
                                  onChange={(val) => onUpdate(section, { buttonIcon: val })}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Secondary Button */}
                        {hasSecondaryButton && (
                          <div className="space-y-3 pt-4 border-t border-dashed">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold uppercase">Secondary Button</Label>
                              <Switch
                                checked={!!config.showButton2}
                                onCheckedChange={(checked) => onUpdate(section, { showButton2: checked })}
                                className="scale-75"
                              />
                            </div>
                            {config.showButton2 && (
                              <div className="space-y-3 bg-muted/30 p-2 rounded-md border border-dashed">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Text</Label>
                                    <Input
                                      value={config.button2Text || ""}
                                      onChange={(e) => onUpdate(section, { button2Text: e.target.value })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px]">Link</Label>
                                    <Select
                                      value={config.button2Link || ""}
                                      onValueChange={(value) => onUpdate(section, { button2Link: value })}
                                    >
                                      <SelectTrigger className="h-8 text-[10px]">
                                        <SelectValue placeholder="Link" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {AVAILABLE_LINKS.map((link) => (
                                          <SelectItem key={link.value} value={link.value} className="text-[10px]">
                                            {link.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-1 text-left">
                                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Secondary Icon</Label>
                                  <IconPicker
                                    value={config.button2Icon || ""}
                                    onChange={(val) => onUpdate(section, { button2Icon: val })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px]">Tooltip Text</Label>
                                  <Input
                                    value={config.button2Tooltip || ""}
                                    onChange={(e) => onUpdate(section, { button2Tooltip: e.target.value })}
                                    placeholder="e.g. Response within 24 hours"
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Separator />
                    </div>
                  )}
                  {/* Advanced Configuration Container */}
                  <div className="space-y-6 pt-2 border-t mt-4">
                    {/* Logo Repeater */}
                    {section === 'logos' && (
                      <div className="space-y-3">
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Partner Logos</Label>
                        <div className="space-y-2">
                          {(config.logos ?? []).map((logo, index) => (
                            <div key={index} className="p-2 border rounded-md bg-card space-y-2 group transition-all hover:border-primary/50">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                  {logo.url ? (
                                    <img src={logo.url} alt="Preview" className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <Input
                                  value={logo.url}
                                  onChange={(e) => updateLogo(index, e.target.value)}
                                  placeholder="Image URL"
                                  className="h-8 text-xs flex-1 bg-muted/30 cursor-not-allowed"
                                  disabled
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeLogo(index)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="flex gap-2 pl-10">
                                <Input
                                  type="file"
                                  id={`logo-upload-${index}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        updateLogo(index, reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] w-full"
                                  onClick={() => document.getElementById(`logo-upload-${index}`)?.click()}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload Image
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addLogo} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all"><Plus className="h-3.5 w-3.5 mr-1" /> Add Logo</Button>
                        </div>
                      </div>
                    )}

                    {/* Stats Repeater */}
                    {section === 'stats' && (
                      <div className="space-y-3">
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Statistic Items</Label>
                        <div className="space-y-4">
                          {(config.items ?? []).map((item, index) => (
                            <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item">
                              <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold">Value</Label>
                                  <Input value={item.value} onChange={(e) => updateItem(index, 'value', e.target.value)} className="h-8 text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-bold">Label</Label>
                                  <Input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className="h-8 text-xs font-semibold" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold">Sub Label</Label>
                                <Input value={item.description || ""} onChange={(e) => updateItem(index, 'description', e.target.value)} className="h-8 text-xs" placeholder="Short description..." />
                              </div>
                              <IconPicker value={item.icon} onChange={(val) => updateItem(index, 'icon', val)} />
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addItem} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all"><Plus className="h-3 w-3 mr-1" /> Add Stat Item</Button>
                        </div>
                      </div>
                    )}

                    {/* Network Section (About) */}
                    {section === 'about' && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Clinic Filter</Label>
                            <Select
                              value={config.filter || "latest"}
                              onValueChange={(value: any) => onUpdate(section, { filter: value })}
                            >
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Filter..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="latest">Latest Addition</SelectItem>
                                <SelectItem value="oldest">Oldest Addition</SelectItem>
                                <SelectItem value="top">Top Rated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Display Count</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={config.limit || 4}
                              onChange={(e) => onUpdate(section, { limit: parseInt(e.target.value) || 4 })}
                              className="h-9 text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features Section Customizer */}
                    {section === 'features' && (
                      <div className="space-y-6 pt-2 pb-4">
                        {/* Feature Style 1 (Main) */}
                        <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-primary/10 rounded-md text-primary"><Zap className="h-3.5 w-3.5" /></div>
                            <Label className="text-xs font-bold uppercase">Feature Style 1 (Standard)</Label>
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold">Block Title</Label>
                              <Input value={config.feature1Title || ""} onChange={(e) => onUpdate(section, { feature1Title: e.target.value })} className="h-8 text-xs font-bold" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-bold">Block Description</Label>
                              <Textarea value={config.feature1Description || ""} onChange={(e) => onUpdate(section, { feature1Description: e.target.value })} className="min-h-[60px] text-xs resize-none" />
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Style 1 Features List</Label>
                          <div className="space-y-3 mt-2">
                            {(config.mainFeatures ?? []).map((feature, index) => (
                              <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item hover:border-primary/30 transition-colors">
                                <div className="absolute -top-2 -right-2 flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => removeFeature('main', index)} className="h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                                <Input value={feature.title} onChange={(e) => updateFeature('main', index, 'title', e.target.value)} className="h-8 text-xs font-bold" />
                                <Textarea value={feature.description} onChange={(e) => updateFeature('main', index, 'description', e.target.value)} className="min-h-[40px] text-[11px] resize-none" />
                                <IconPicker value={feature.icon} onChange={(val) => updateFeature('main', index, 'icon', val)} />
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addFeature('main')} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all focus:ring-0 focus:ring-offset-0"><Plus className="h-3.5 w-3.5 mr-1" /> Add Feature</Button>
                          </div>
                        </div>

                        {/* Style 2 */}
                        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded-md text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Layout className="h-3.5 w-3.5" /></div>
                            <Label className="text-xs font-bold uppercase">Feature Style 2 (Flipped Layout)</Label>
                          </div>
                          <div className="space-y-2">
                            <Input value={config.feature2Title || ""} onChange={(e) => onUpdate(section, { feature2Title: e.target.value })} className="h-8 text-xs font-bold" placeholder="Title" />
                            <Textarea value={config.feature2Description || ""} onChange={(e) => onUpdate(section, { feature2Description: e.target.value })} className="min-h-[60px] text-xs resize-none" placeholder="Description" />
                          </div>
                          <Separator className="my-3" />
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Style 2 Features List</Label>
                          <div className="space-y-3 mt-2">
                            {(config.secondaryFeatures ?? []).map((feature, index) => (
                              <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item hover:border-primary/30 transition-colors">
                                <div className="absolute -top-2 -right-2 flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => removeFeature('secondary', index)} className="h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                                </div>
                                <Input value={feature.title} onChange={(e) => updateFeature('secondary', index, 'title', e.target.value)} className="h-8 text-xs font-bold" />
                                <Textarea value={feature.description} onChange={(e) => updateFeature('secondary', index, 'description', e.target.value)} className="min-h-[40px] text-[11px] resize-none" />
                                <IconPicker value={feature.icon} onChange={(val) => updateFeature('secondary', index, 'icon', val)} />
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addFeature('secondary')} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all focus:ring-0 focus:ring-offset-0"><Plus className="h-3.5 w-3.5 mr-1" /> Add Feature</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Team Sorting & Limit */}
                    {section === 'team' && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Sorting</Label>
                            <Select value={config.teamFilter || "latest"} onValueChange={(v: any) => onUpdate(section, { teamFilter: v })}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sort..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="latest">Latest Addition</SelectItem>
                                <SelectItem value="top">Top Rated</SelectItem>
                                <SelectItem value="oldest">Oldest Member</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Records</Label>
                            <Input type="number" min={1} max={20} value={config.teamLimit || 8} onChange={(e) => onUpdate(section, { teamLimit: parseInt(e.target.value) || 8 })} className="h-9 text-xs font-bold" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Testimonials Filter & Limit */}
                    {section === 'testimonials' && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Selection</Label>
                            <Select value={config.testimonialFilter || "highest"} onValueChange={(v: any) => onUpdate(section, { testimonialFilter: v })}>
                              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto Selection</SelectItem>
                                <SelectItem value="highest">Highest Rating</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium uppercase text-muted-foreground">Limit</Label>
                            <Input type="number" min={1} max={20} value={config.testimonialLimit || 6} onChange={(e) => onUpdate(section, { testimonialLimit: parseInt(e.target.value) || 6 })} className="h-9 text-xs font-bold" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 italic">
                          Choosing 'Highest Rating' will pull your top-star reviews automatically.
                        </p>
                      </div>
                    )}

                    {/* Blog Posts Management */}
                    {section === 'blog' && (
                      <div className="space-y-4 pt-2">
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Total Blog to Show</Label>
                        <div className="space-y-4">
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={blogLimitInput}
                            onFocus={() => {
                              isEditingBlogLimitRef.current = true
                            }}
                            onBlur={() => {
                              isEditingBlogLimitRef.current = false
                              commitBlogLimit(blogLimitInput)
                            }}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '') {
                                setBlogLimitInput('')
                                return
                              }
                              if (/^\d+$/.test(value)) {
                                setBlogLimitInput(value)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            className="h-9 text-xs font-bold"
                          />
                          <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 italic">
                            This setting determines how many of your latest blog posts will be displayed in the blog section.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* FAQ Repeater */}
                    {section === 'faq' && (
                      <div className="space-y-4 pt-2">
                        <Label className="text-xs font-medium uppercase text-muted-foreground">Question Feed</Label>
                        <div className="space-y-4">
                          {(config.faqItems ?? []).map((item, index) => (
                            <div key={index} className="p-3 bg-card border rounded-md space-y-3 relative group-item hover:border-primary/30 transition-colors">
                              <Button variant="ghost" size="icon" onClick={() => removeFaqItem(index)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                              <Input value={item.question} onChange={(e) => updateFaqItem(index, 'question', e.target.value)} className="h-8 text-xs font-bold" placeholder="Question Title" />
                              <Textarea value={item.answer} onChange={(e) => updateFaqItem(index, 'answer', e.target.value)} className="min-h-[70px] text-xs resize-none" placeholder="Detailed Answer..." />
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addFaqItem} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all"><Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ Item</Button>
                        </div>
                      </div>
                    )}

                    {/* Contact Form & Options */}
                    {section === 'contact' && (
                      <div className="space-y-6 pt-2">
                        <div className="space-y-4 p-3 bg-muted/30 rounded-lg border border-border">
                          <Label className="text-xs font-bold uppercase">Form Header Settings</Label>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-[10px]">Form Title</Label>
                              <Input value={config.formTitle || (DEFAULT_SETTINGS[section] as any)?.formTitle || ""} onChange={(e) => onUpdate(section, { formTitle: e.target.value })} className="h-8 text-xs font-bold" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px]">Form Icon</Label>
                              <IconPicker value={config.formIcon || (DEFAULT_SETTINGS[section] as any)?.formIcon || "Mail"} onChange={(val) => onUpdate(section, { formIcon: val })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px]">Submit Button Text</Label>
                              <Input value={config.submitButtonText || (DEFAULT_SETTINGS[section] as any)?.submitButtonText || ""} onChange={(e) => onUpdate(section, { submitButtonText: e.target.value })} className="h-8 text-xs font-bold" />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <Label className="text-xs font-bold uppercase text-muted-foreground">Contact Cards Feed</Label>
                          <div className="space-y-4">
                            {(config.contactOptions && config.contactOptions.length > 0 ? config.contactOptions : DEFAULT_CONTACT_OPTIONS).map((option, index) => (
                              <div key={index} className="p-3 bg-card border rounded-md space-y-3 relative group-item hover:border-primary/30 transition-colors">
                                <Button variant="ghost" size="icon" onClick={() => removeContactOption(index)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Input value={option.title} onChange={(e) => updateContactOption(index, 'title', e.target.value)} className="h-8 text-xs font-bold" placeholder="Card Title" />
                                    <Textarea value={option.description} onChange={(e) => updateContactOption(index, 'description', e.target.value)} className="min-h-[50px] text-[11px] resize-none" placeholder="Card Description" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input value={option.buttonText} onChange={(e) => updateContactOption(index, 'buttonText', e.target.value)} className="h-8 text-[10px]" placeholder="Button Text" />
                                    <Input value={option.buttonLink} onChange={(e) => updateContactOption(index, 'buttonLink', e.target.value)} className="h-8 text-[10px]" placeholder="Button Link" />
                                  </div>
                                  <Input value={option.tooltip || ""} onChange={(e) => updateContactOption(index, 'tooltip', e.target.value)} className="h-8 text-[10px]" placeholder="Tooltip (Optional)" />
                                  <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Card Icon</Label>
                                    <IconPicker value={option.icon} onChange={(val) => updateContactOption(index, 'icon', val)} />
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(config.contactOptions ?? []).length < 3 && (
                              <Button variant="outline" size="sm" onClick={addContactOption} className="w-full text-xs h-9 dashed border-2 border-primary/20 text-primary font-bold hover:bg-primary/5 transition-all"><Plus className="h-3.5 w-3.5 mr-1" /> Add Contact Card</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </div>
    </div>
  )
}

export function LandingThemeCustomizer({ open, onOpenChange }: LandingThemeCustomizerProps) {
  const {
    applyImportedTheme,
    isDarkMode,
    resetTheme,
    applyRadius,
    setBrandColorsValues,
    applyTheme,
    applyTweakcnTheme,
    brandColorsValues,
    handleColorChange
  } = useThemeManager()

  const { toggleTheme } = useCircularTransition()

  const { settings: landingContent, updateSection, updateSettings: setLandingContent } = useLandingContent()

  const [activeTab, setActiveTab] = React.useState("theme")
  const [selectedTheme, setSelectedTheme] = React.useState("")
  const [selectedTweakcnTheme, setSelectedTweakcnTheme] = React.useState("")
  const [activePresetType, setActivePresetType] = React.useState<"theme" | "tweakcn" | "custom">("theme")
  const [selectedRadius, setSelectedRadius] = React.useState("0.5rem")
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [importedTheme, setImportedTheme] = React.useState<ImportedTheme | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  const handleReset = () => {
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    setActivePresetType("theme")
    setSelectedRadius("0.5rem")
    setImportedTheme(null)
    setBrandColorsValues({})
    setLandingContent(DEFAULT_SETTINGS)
    resetTheme()
    applyRadius("0.5rem")
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const handleRandomShadcn = () => {
    const randomTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)]
    setSelectedTheme(randomTheme.value)
    setSelectedTweakcnTheme("")
    setBrandColorsValues({})
    setActivePresetType("theme")
    setImportedTheme(null)
    applyTheme(randomTheme.value, false)
  }

  const handleRandomTweakcn = () => {
    const randomTheme = tweakcnThemes[Math.floor(Math.random() * tweakcnThemes.length)]
    setSelectedTweakcnTheme(randomTheme.value)
    setSelectedTheme("")
    setBrandColorsValues({})
    setActivePresetType("tweakcn")
    setImportedTheme(null)
    applyTweakcnTheme(randomTheme.preset, false)
  }

  const handleRadiusSelect = (radius: string) => {
    setSelectedRadius(radius)
    applyRadius(radius)
  }

  const handleHeaderLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingLogo(true)
      const url = await customizerApi.uploadFile(file)
      updateSection('header', { siteLogo: url })
      toast.success("Logo uploaded successfully")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const radiusNumber = Number.parseFloat(selectedRadius.replace("rem", ""))

      const payload = {
        landing_theme: {
          preset: activePresetType === "theme" ? (selectedTheme || "") : "",
          tweakcn_preset: activePresetType === "tweakcn" ? (selectedTweakcnTheme || "") : "",
          radius: Number.isFinite(radiusNumber) ? radiusNumber : 0.5,
          mode: "light" as const,
          custom_colors:
            activePresetType === "custom"
              ? Object.entries(brandColorsValues).reduce<Record<string, Array<{ code: string; value: string }>>>(
                  (acc, [cssVar, value]) => {
                    if (!value) return acc
                    const apiKey = cssVar.replace(/^--/, "").replace(/-/g, "_")
                    acc[apiKey] = [{ code: value, value: apiKey }]
                    return acc
                  },
                  {}
                )
              : {},
        },
        landing_content: landingContent
      }

      localStorage.setItem('kivicare-landing-theme', JSON.stringify(payload))
      await customizerApi.saveSettings(payload)
      const latestSettings = await customizerApi.getSettingsPublic()
      if (latestSettings?.landing_content) {
        setLandingContent({
          ...landingContent,
          ...latestSettings.landing_content,
        })
      }
      window.dispatchEvent(new CustomEvent('kivicare-customizer-updated'))
      toast.success("Customizer settings saved")
    } catch {
      toast.error("Failed to save customizer settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Hydrate UI State
  React.useEffect(() => {
    const hydrateUI = async () => {
      try {
        let settings = null
        const localStr = localStorage.getItem('kivicare-landing-theme')
        if (localStr) settings = JSON.parse(localStr)

        if (!settings) {
          settings = await customizerApi.getSettings()
        }

        if (settings?.landing_theme) {
          if (settings.landing_theme.preset) {
            setSelectedTheme(settings.landing_theme.preset)
            setSelectedTweakcnTheme("")
            setActivePresetType("theme")
            setBrandColorsValues({})
          } else if (settings.landing_theme.tweakcn_preset) {
            setSelectedTweakcnTheme(settings.landing_theme.tweakcn_preset)
            setSelectedTheme("")
            setActivePresetType("tweakcn")
            setBrandColorsValues({})
          }
          if (settings.landing_theme.radius) setSelectedRadius(`${settings.landing_theme.radius}rem`)
          const persistedColors = settings.landing_theme.custom_colors || settings.landing_theme.brand_colors
          if (
            persistedColors &&
            !settings.landing_theme.preset &&
            !settings.landing_theme.tweakcn_preset
          ) {
            const colors: Record<string, string> = {}
            Object.entries(persistedColors).forEach(([key, values]) => {
              const color = (values as any)?.[0]?.code
              if (color) {
                const cssVar = `--${key.replace(/_/g, '-')}`
                colors[cssVar] = color
                document.documentElement.style.setProperty(cssVar, color)
              }
            })
            setBrandColorsValues(colors)
            setActivePresetType("custom")
          } else if (!settings.landing_theme.preset && !settings.landing_theme.tweakcn_preset) {
            setBrandColorsValues({})
            setActivePresetType("theme")
          }
        }
      } catch (e) { }
    }
    hydrateUI()
  }, [])

  // Re-apply themes when theme mode changes
  React.useEffect(() => {
    if (importedTheme) {
      applyImportedTheme(importedTheme, false)
    } else if (selectedTheme) {
      applyTheme(selectedTheme, false)
    } else if (selectedTweakcnTheme) {
      const selectedPreset = tweakcnThemes.find(t => t.value === selectedTweakcnTheme)?.preset
      if (selectedPreset) {
        applyTweakcnTheme(selectedPreset, false)
      }
    } else if (activePresetType === "custom" && Object.keys(brandColorsValues).length > 0) {
      applyTheme("default", false)
      Object.entries(brandColorsValues).forEach(([cssVar, value]) => {
        if (value) {
          document.documentElement.style.setProperty(cssVar, value)
        }
      })
    }
  }, [importedTheme, selectedTheme, selectedTweakcnTheme, activePresetType, brandColorsValues, applyImportedTheme, applyTheme, applyTweakcnTheme])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="right"
          className="w-[400px] p-0 gap-0 pointer-events-auto [&>button]:hidden overflow-hidden flex flex-col"
          onInteractOutside={(e) => {
            if (importModalOpen) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader className="space-y-0 p-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-4 w-4" />
              </div>
              <SheetTitle className="text-lg font-semibold">Theme Customizer</SheetTitle>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleReset} className="cursor-pointer h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} className="cursor-pointer h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="py-2">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-12 p-1.5">
                  <TabsTrigger
                    value="theme"
                    className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Palette className="h-4 w-4 mr-1" /> Theme
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <FileEdit className="h-4 w-4 mr-1" /> Theme Content
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="theme" className="flex-1 mt-0 p-4 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Theme Presets</Label>
                      <Button variant="outline" size="sm" onClick={handleRandomShadcn} className="cursor-pointer">
                        <Dices className="h-3.5 w-3.5 mr-1.5" />
                        Random
                      </Button>
                    </div>

                    <Select
                      value={selectedTheme}
                      onValueChange={(value) => {
                        setSelectedTheme(value)
                        setSelectedTweakcnTheme("")
                        setBrandColorsValues({})
                        setActivePresetType("theme")
                        setImportedTheme(null)
                        applyTheme(value, false)
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Choose Shadcn Theme" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {colorThemes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.primary }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.secondary }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.accent }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.muted }} />
                              </div>
                              <span>{theme.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Tweakcn Theme Presets</Label>
                      <Button variant="outline" size="sm" onClick={handleRandomTweakcn} className="cursor-pointer">
                        <Dices className="h-3.5 w-3.5 mr-1.5" />
                        Random
                      </Button>
                    </div>

                    <Select
                      value={selectedTweakcnTheme}
                      onValueChange={(value) => {
                        setSelectedTweakcnTheme(value)
                        setSelectedTheme("")
                        setBrandColorsValues({})
                        setActivePresetType("tweakcn")
                        setImportedTheme(null)
                        const selectedPreset = tweakcnThemes.find(t => t.value === value)?.preset
                        if (selectedPreset) {
                          applyTweakcnTheme(selectedPreset, false)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Choose Tweakcn Theme" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {tweakcnThemes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.primary }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.secondary }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.accent }} />
                                <div className="w-3 h-3 rounded-full border border-border/20" style={{ backgroundColor: theme.preset.styles.light.muted }} />
                              </div>
                              <span>{theme.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Radius</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {radiusOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`relative cursor-pointer rounded-md p-3 border transition-colors ${selectedRadius === option.value
                            ? "border-primary"
                            : "border-border hover:border-border/60"
                            }`}
                          onClick={() => handleRadiusSelect(option.value)}
                        >
                          <div className="text-center text-xs font-medium">{option.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <Accordion type="multiple" className="w-full space-y-1 border-b rounded-lg">
                    {customColorGroups.map((group) => (
                    <AccordionItem key={group.label} value={group.label} className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 transition-colors text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3 pt-1 space-y-3 border-t border-border bg-muted/10">
                        {group.colors.map((color) => (
                          <ColorPicker
                            key={color.cssVar}
                            label={color.name}
                            cssVar={color.cssVar}
                            value={brandColorsValues[color.cssVar] || ""}
                            onChange={(cssVar, value) => {
                              setSelectedTheme("")
                              setSelectedTweakcnTheme("")
                              setActivePresetType("custom")
                              handleColorChange(cssVar, value)
                            }}
                          />
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    ))}
                  </Accordion>

                  <Separator />

                  {/* Header Logo Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Header Logo</Label>
                    <p className="text-xs text-muted-foreground">
                      Recommended: transparent PNG, ratio around 4:1 (e.g. 320x80), and maximum size 800KB.
                    </p>

                    <div className="space-y-3 rounded-md border p-3">
                      <div className="h-14 w-full overflow-hidden rounded border bg-muted/30">
                        {landingContent.header.siteLogo ? (
                          <img alt="Landing logo preview" className="h-full w-full object-contain" src={landingContent.header.siteLogo} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="cursor-pointer"
                        >
                          {isUploadingLogo ? <Icons.Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Icons.Upload className="h-3.5 w-3.5 mr-1" />}
                          Upload
                        </Button>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleHeaderLogoUpload}
                        />
                        {landingContent.header.siteLogo && (
                          <Button variant="outline" size="sm" onClick={() => updateSection('header', { siteLogo: "" })} className="cursor-pointer">
                            <Icons.Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Width (px)</Label>
                          <Input
                            type="number"
                            value={landingContent.header.siteLogoWidth || ""}
                            onChange={(e) => updateSection('header', { siteLogoWidth: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Height (px)</Label>
                          <Input
                            type="number"
                            value={landingContent.header.siteLogoHeight || ""}
                            onChange={(e) => updateSection('header', { siteLogoHeight: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="flex-1 mt-0 p-4 pt-0">
                <Accordion type="single" collapsible className="w-full mt-4">
                  <SectionCustomizer label="Header Settings" section="header" config={landingContent.header} onUpdate={updateSection} icon={Layout} />
                  <SectionCustomizer label="Hero Section" section="hero" config={landingContent.hero} onUpdate={updateSection} icon={Layout} />
                  <SectionCustomizer label="Trusted Partners" section="logos" config={landingContent.logos} onUpdate={updateSection} icon={Building2} />
                  <SectionCustomizer label="Statistics" section="stats" config={landingContent.stats} onUpdate={updateSection} icon={BarChart3} />
                  <SectionCustomizer label="Clinics" section="about" config={landingContent.about} onUpdate={updateSection} icon={Info} />
                  <SectionCustomizer label="About" section="features" config={landingContent.features} onUpdate={updateSection} icon={Zap} />
                  <SectionCustomizer label="Doctors" section="team" config={landingContent.team} onUpdate={updateSection} icon={Users2} />
                  {/* <SectionCustomizer label="Pricing" section="pricing" config={landingContent.pricing} onUpdate={updateSection} icon={CreditCard} /> */}
                  <SectionCustomizer label="Reviews & Ratings" section="testimonials" config={landingContent.testimonials} onUpdate={updateSection} icon={Quote} />
                  <SectionCustomizer label="Blog Posts" section="blog" config={landingContent.blog} onUpdate={updateSection} icon={Newspaper} />
                  <SectionCustomizer label="F.A.Q" section="faq" config={landingContent.faq} onUpdate={updateSection} icon={HelpCircle} />
                  <SectionCustomizer label="Contact Form" section="contact" config={landingContent.contact} onUpdate={updateSection} icon={Mail} />
                  <SectionCustomizer label="Footer Settings" section="footer" config={landingContent.footer} onUpdate={updateSection} icon={Layout} />
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t p-3">
            <Button onClick={handleSave} disabled={isSaving} className="w-full cursor-pointer h-10">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Landing Configuration
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} onImport={handleImport} />
    </>
  )
}

export function LandingThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn("fixed top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer right-4")}
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}

function FooterContactSettings({ config, onUpdate }: { config: LandingSectionConfig, onUpdate: any }) {
  const { data: clinicsData, isLoading } = useClinics(1, 100, true, { status: true })
  const clinics = clinicsData?.data || []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Contact Display Mode</Label>
        <div className="flex bg-muted p-1 rounded-md">
          <button
            onClick={() => onUpdate('footer', { footerContactMode: 'clinic' })}
            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${config.footerContactMode === 'clinic' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            Clinic Sync
          </button>
          <button
            onClick={() => onUpdate('footer', { footerContactMode: 'manual' })}
            className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${config.footerContactMode === 'manual' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {config.footerContactMode === 'clinic' ? (
        <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Select Clinic to Pull Data From</Label>
            {isLoading ? (
              <div className="h-8 w-full bg-muted animate-pulse rounded flex items-center justify-center text-[10px]">Loading clinics...</div>
            ) : (
              <select
                className="w-full h-8 text-xs bg-background border rounded px-2 font-bold focus:ring-1 focus:ring-primary outline-none"
                value={config.footerClinicId || ""}
                onChange={(e) => onUpdate('footer', { footerClinicId: e.target.value })}
              >
                <option value="">-- Choose Clinic --</option>
                {clinics.map((clinic: any) => (
                  <option key={clinic._id} value={clinic._id}>{clinic.name}</option>
                ))}
              </select>
            )}
            <p className="text-[9px] text-muted-foreground italic">Pulls address, email, and mobile from the selected profile.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Manual Address</Label>
            <Input value={config.footerManualAddress || ""} onChange={(e) => onUpdate('footer', { footerManualAddress: e.target.value })} className="h-8 text-xs font-bold" placeholder="123 Clinic Ave..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Manual Email</Label>
            <Input value={config.footerManualEmail || ""} onChange={(e) => onUpdate('footer', { footerManualEmail: e.target.value })} className="h-8 text-xs font-bold" placeholder="clinic@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Manual Phone</Label>
            <Input value={config.footerManualPhone || ""} onChange={(e) => onUpdate('footer', { footerManualPhone: e.target.value })} className="h-8 text-xs font-bold" placeholder="+1 (555) 000-0000" />
          </div>
        </div>
      )}
    </div>
  )
}
