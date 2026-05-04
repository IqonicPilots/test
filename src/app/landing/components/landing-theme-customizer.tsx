"use client"

import React from 'react'
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
import { customizerApi, type LandingContentSettings, type LandingSectionConfig, type CustomizerSettings } from '@/services/customizer.service'
import { useLandingContent, AVAILABLE_LINKS, DEFAULT_SETTINGS } from '../../../contexts/landing-content-context'
import { toast } from 'sonner'
import { colorThemes, tweakcnThemes } from '@/config/theme-data'
import { radiusOptions, baseColors } from '@/config/theme-customizer-constants'
import { ColorPicker } from '@/components/color-picker'
import { ImportModal } from '@/components/theme-customizer/import-modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { ImportedTheme } from '@/types/theme-customizer'
import { Plus, Trash2, ArrowUpDown, Image as ImageIcon } from 'lucide-react'
import "@/components/theme-customizer/circular-transition.css"

interface LandingThemeCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

  const hasButtons = ['hero', 'about', 'cta', 'team', 'pricing', 'blog', 'faq', 'contact'].includes(section)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>, arg1: (url: any) => void): void {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
        <AccordionItem value={section as string} className="border-none">
          <div className="flex items-center hover:bg-muted/50 transition-colors group relative">
            <Switch
              checked={!!config.show}
              onCheckedChange={(checked) => onUpdate(section, { show: checked })}
              className="absolute left-4 z-10 scale-90 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <AccordionTrigger className="flex-1 py-4 pl-14 pr-4 hover:no-underline items-center justify-between w-full">
              <div className="flex items-center gap-3 text-left">
                <div className="p-1.5 bg-muted rounded-md group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold truncate">{label}</span>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4 border-t border-border bg-muted/20">
            {/* Title */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Title</Label>
              <Input
                value={config.title || ""}
                onChange={(e) => onUpdate(section, { title: e.target.value })}
                placeholder={`Enter ${label} title`}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground/80 font-medium px-1">Tip: Use {"{text}"} to highlight.</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase text-muted-foreground">Description</Label>
              <Textarea
                value={config.description || ""}
                onChange={(e) => onUpdate(section, { description: e.target.value })}
                placeholder={`Enter ${label} description`}
                className="min-h-[80px] text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground/80 font-medium px-1">Tip: Use {"{text}"} to highlight</p>
            </div>

            {/* Logo Repeater (Trusted Partners) */}
            {section === 'logos' && (
              <div className="space-y-3 pt-2">
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
                  <Button variant="outline" size="sm" onClick={addLogo} className="w-full text-xs h-8">
                    <Plus className="h-3 w-3 mr-1" /> Add Logo
                  </Button>
                  <p className="text-[10px] text-muted-foreground font-medium text-center bg-primary/5 p-2 rounded-md">
                    Tip: Use images with transparent background. Suggested size: 150x50px.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Repeater */}
            {section === 'stats' && (
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Statistic Items</Label>
                <div className="space-y-4">
                  {(config.items ?? []).map((item, index) => (
                    <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-xs text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Value</Label>
                          <Input value={item.value} onChange={(e) => updateItem(index, 'value', e.target.value)} className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Label</Label>
                          <Input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className="h-7 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Sub Label</Label>
                        <Input value={item.description || ""} onChange={(e) => updateItem(index, 'description', e.target.value)} className="h-7 text-xs" placeholder="Short description..." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Icon Name (Lucide)</Label>
                        <Input value={item.icon} onChange={(e) => updateItem(index, 'icon', e.target.value)} className="h-7 text-xs" placeholder="e.g. Users, Activity" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addItem} className="w-full text-xs h-8">
                    <Plus className="h-3 w-3 mr-1" /> Add Stat
                  </Button>
                  <div className="bg-primary/5 p-3 rounded-md space-y-2">
                    <p className="text-[10px] font-bold text-primary uppercase">Icon Cheat Sheet (Lucide):</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Users, Activity, Stethoscope, Hospital, Heart, Award, Star, Calendar, Clock, Shield, TrendingUp, Smile, CheckCircle, Briefcase, Thermometer
                    </p>
                    <p className="text-[10px] italic text-muted-foreground/70">Tip: Names are case-sensitive.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Filter (Network Section) */}
            {section === 'about' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">Clinic Filter</Label>
                  <Select
                    value={config.filter || "latest"}
                    onValueChange={(value: any) => onUpdate(section, { filter: value })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        <SelectValue placeholder="Select filter..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest Clinics</SelectItem>
                      <SelectItem value="oldest">Oldest Clinics</SelectItem>
                      <SelectItem value="top">Top Clinics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 mt-3">
                  <Label className="text-xs font-medium uppercase text-muted-foreground">Clinics Display Count</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={config.limit || 4}
                      onChange={(e) => onUpdate(section, { limit: parseInt(e.target.value) || 4 })}
                      className="h-9 w-24"
                    />
                    <span className="text-xs text-muted-foreground">Number of clinics to show</span>
                  </div>
                </div>
              </div>
            )}

            {/* Features Section Customizer */}
            {section === 'features' && (
              <div className="space-y-6 pt-2">
                {/* Feature Style 1 (Main) */}
                <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <Label className="text-xs font-bold uppercase">Feature Style 1 (Standard)</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Block Title</Label>
                      <Input
                        value={config.feature1Title || ""}
                        onChange={(e) => onUpdate(section, { feature1Title: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. Smart Features Built for Healthcare..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Block Description</Label>
                      <Textarea
                        value={config.feature1Description || ""}
                        onChange={(e) => onUpdate(section, { feature1Description: e.target.value })}
                        className="min-h-[60px] text-xs resize-none"
                        placeholder="e.g. Designed to simplify workflows..."
                      />
                    </div>
                    {/* Style 1 Images */}
                    <div className="pt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold">Feature Image</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="/feature-1-light.png"
                            value={config.feature1LightImage || ""}
                            onChange={(e) => onUpdate(section, { feature1LightImage: e.target.value })}
                            className="h-8 text-[10px]"
                            disabled
                          />
                          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-dashed" asChild>
                            <label className="cursor-pointer">
                              <Upload className="h-3 w-3" /> Upload
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => onUpdate(section, { feature1LightImage: url }))} />
                            </label>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Style 1 Features List</Label>
                  <div className="space-y-3 mt-2">
                    {(config.mainFeatures ?? []).map((feature, index) => (
                      <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item hover:border-primary/30 transition-colors">
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <Button variant="outline" size="icon" onClick={() => moveFeature('main', index, 'up')} disabled={index === 0} className="h-6 w-6 rounded-full bg-background border shadow-xs">
                            <ArrowUpDown className="h-3 w-3 rotate-180" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => moveFeature('main', index, 'down')} disabled={index === (config.mainFeatures?.length || 0) - 1} className="h-6 w-6 rounded-full bg-background border shadow-xs">
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeFeature('main', index)} className="h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Title</Label>
                          <Input value={feature.title} onChange={(e) => updateFeature('main', index, 'title', e.target.value)} className="h-7 text-xs font-semibold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Description</Label>
                          <Textarea value={feature.description} onChange={(e) => updateFeature('main', index, 'description', e.target.value)} className="min-h-[40px] text-[11px] resize-none" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Icon Name</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="w-64 p-3 border shadow-xl bg-card">
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-bold border-b pb-1">Common Icons (Lucide-React)</p>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                      <span><b>Stethoscope</b> - Clinic</span>
                                      <span><b>Activity</b> - Vitality</span>
                                      <span><b>HeartPulse</b> - Cardiology</span>
                                      <span><b>Hospital</b> - Building</span>
                                      <span><b>Clock</b> - Timing</span>
                                      <span><b>CalendarDays</b> - Booking</span>
                                      <span><b>Users</b> - Patients</span>
                                      <span><b>ShieldCheck</b> - Security</span>
                                      <span><b>Video</b> - Telemedicine</span>
                                      <span><b>MessageSquare</b> - Alerts</span>
                                      <span><b>Pill</b> - Pharmacy</span>
                                      <span><b>FileText</b> - EHR</span>
                                      <span><b>Zap</b> - Automation</span>
                                      <span><b>Microscope</b> - Lab</span>
                                      <span><b>Syringe</b> - Vaccine</span>
                                      <span><b>Phone</b> - Contact</span>
                                      <span><b>Mail</b> - Email</span>
                                      <span><b>Globe</b> - Language</span>
                                      <span><b>ClipboardList</b> - Reports</span>
                                      <span><b>CreditCard</b> - Billing</span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground pt-1 italic">Type exact name as shown.</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input value={feature.icon} onChange={(e) => updateFeature('main', index, 'icon', e.target.value)} className="h-7 text-[10px]" />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addFeature('main')} className="w-full text-xs h-8 border-dashed border-2 hover:border-primary hover:text-primary transition-all">
                      <Plus className="h-3 w-3 mr-1" /> Add Style 1 Feature
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  {/* Style 1 Buttons */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="s1-buttons" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <Label className="text-[10px] font-bold uppercase cursor-pointer">Style 1 Buttons</Label>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {/* Primary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Primary Button</Label>
                            <Switch checked={!!config.showButton} onCheckedChange={(val) => onUpdate(section, { showButton: val })} className="scale-75" />
                          </div>
                          {config.showButton && (
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={config.buttonText || ""} onChange={(e) => onUpdate(section, { buttonText: e.target.value })} className="h-7 text-[10px]" placeholder="Text" />
                              <Select value={config.buttonLink || ""} onValueChange={(val) => onUpdate(section, { buttonLink: val })}>
                                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Link" /></SelectTrigger>
                                <SelectContent>{AVAILABLE_LINKS.map(l => <SelectItem key={l.value} value={l.value} className="text-[10px]">{l.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        {/* Secondary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Secondary Button</Label>
                            <Switch checked={!!config.showButton2} onCheckedChange={(val) => onUpdate(section, { showButton2: val })} className="scale-75" />
                          </div>
                          {config.showButton2 && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={config.button2Text || ""} onChange={(e) => onUpdate(section, { button2Text: e.target.value })} className="h-7 text-[10px]" placeholder="Text" />
                                <Select value={config.button2Link || ""} onValueChange={(val) => onUpdate(section, { button2Link: val })}>
                                  <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Link" /></SelectTrigger>
                                  <SelectContent>{AVAILABLE_LINKS.map(l => <SelectItem key={l.value} value={l.value} className="text-[10px]">{l.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <Input value={config.button2Tooltip || ""} onChange={(e) => onUpdate(section, { button2Tooltip: e.target.value })} className="h-7 text-[10px]" placeholder="Tooltip Text" />
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Feature Style 2 (Flipped) */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-muted rounded-md text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Layout className="h-3.5 w-3.5" />
                    </div>
                    <Label className="text-xs font-bold uppercase">Feature Style 2 (Flipped Layout)</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Block Title</Label>
                      <Input
                        value={config.feature2Title || ""}
                        onChange={(e) => onUpdate(section, { feature2Title: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. Built for Efficient Clinic Operations..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold">Block Description</Label>
                      <Textarea
                        value={config.feature2Description || ""}
                        onChange={(e) => onUpdate(section, { feature2Description: e.target.value })}
                        className="min-h-[60px] text-xs resize-none"
                        placeholder="e.g. KiviCare is designed to simplify..."
                      />
                    </div>
                    {/* Style 2 Images */}
                    <div className="pt-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold">Feature Image</Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            placeholder="/feature-2-light.png"
                            value={config.feature2LightImage || ""}
                            onChange={(e) => onUpdate(section, { feature2LightImage: e.target.value })}
                            className="h-8 text-[10px]"
                            disabled
                          />
                          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-dashed" asChild>
                            <label className="cursor-pointer">
                              <Upload className="h-3 w-3" /> Upload
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => onUpdate(section, { feature2LightImage: url }))} />
                            </label>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Style 2 Features List</Label>
                  <div className="space-y-3 mt-2">
                    {(config.secondaryFeatures ?? []).map((feature, index) => (
                      <div key={index} className="p-3 bg-card border rounded-md space-y-2 relative group-item hover:border-primary/30 transition-colors">
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <Button variant="outline" size="icon" onClick={() => moveFeature('secondary', index, 'up')} disabled={index === 0} className="h-6 w-6 rounded-full bg-background border shadow-xs">
                            <ArrowUpDown className="h-3 w-3 rotate-180" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => moveFeature('secondary', index, 'down')} disabled={index === (config.secondaryFeatures?.length || 0) - 1} className="h-6 w-6 rounded-full bg-background border shadow-xs">
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeFeature('secondary', index)} className="h-6 w-6 rounded-full bg-background border shadow-xs text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Title</Label>
                          <Input value={feature.title} onChange={(e) => updateFeature('secondary', index, 'title', e.target.value)} className="h-7 text-xs font-semibold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Description</Label>
                          <Textarea value={feature.description} onChange={(e) => updateFeature('secondary', index, 'description', e.target.value)} className="min-h-[40px] text-[11px] resize-none" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Icon Name</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="w-64 p-3 border shadow-xl bg-card">
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-bold border-b pb-1">Common Icons (Lucide-React)</p>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                      <span><b>Stethoscope</b> - Clinic</span>
                                      <span><b>Activity</b> - Vitality</span>
                                      <span><b>HeartPulse</b> - Cardiology</span>
                                      <span><b>Hospital</b> - Building</span>
                                      <span><b>Clock</b> - Timing</span>
                                      <span><b>CalendarDays</b> - Booking</span>
                                      <span><b>Users</b> - Patients</span>
                                      <span><b>ShieldCheck</b> - Security</span>
                                      <span><b>Video</b> - Telemedicine</span>
                                      <span><b>MessageSquare</b> - Alerts</span>
                                      <span><b>Pill</b> - Pharmacy</span>
                                      <span><b>FileText</b> - EHR</span>
                                      <span><b>Zap</b> - Automation</span>
                                      <span><b>Microscope</b> - Lab</span>
                                      <span><b>Syringe</b> - Vaccine</span>
                                      <span><b>Phone</b> - Contact</span>
                                      <span><b>Mail</b> - Email</span>
                                      <span><b>Globe</b> - Language</span>
                                      <span><b>ClipboardList</b> - Reports</span>
                                      <span><b>CreditCard</b> - Billing</span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground pt-1 italic">Type exact name as shown.</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input value={feature.icon} onChange={(e) => updateFeature('secondary', index, 'icon', e.target.value)} className="h-7 text-[10px]" />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addFeature('secondary')} className="w-full text-xs h-8 border-dashed border-2 hover:border-primary hover:text-primary transition-all">
                      <Plus className="h-3 w-3 mr-1" /> Add Style 2 Feature
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  {/* Style 2 Buttons */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="s2-buttons" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <Label className="text-[10px] font-bold uppercase cursor-pointer">Style 2 Buttons</Label>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {/* Primary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Primary Button</Label>
                            <Switch checked={!!config.f2ShowButton} onCheckedChange={(val) => onUpdate(section, { f2ShowButton: val })} className="scale-75" />
                          </div>
                          {config.f2ShowButton && (
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={config.f2ButtonText || ""} onChange={(e) => onUpdate(section, { f2ButtonText: e.target.value })} className="h-7 text-[10px]" placeholder="Text" />
                              <Select value={config.f2ButtonLink || ""} onValueChange={(val) => onUpdate(section, { f2ButtonLink: val })}>
                                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Link" /></SelectTrigger>
                                <SelectContent>{AVAILABLE_LINKS.map(l => <SelectItem key={l.value} value={l.value} className="text-[10px]">{l.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        {/* Secondary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-bold">Secondary Button</Label>
                            <Switch checked={!!config.f2ShowButton2} onCheckedChange={(val) => onUpdate(section, { f2ShowButton2: val })} className="scale-75" />
                          </div>
                          {config.f2ShowButton2 && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={config.f2Button2Text || ""} onChange={(e) => onUpdate(section, { f2Button2Text: e.target.value })} className="h-7 text-[10px]" placeholder="Text" />
                                <Select value={config.f2Button2Link || ""} onValueChange={(val) => onUpdate(section, { f2Button2Link: val })}>
                                  <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Link" /></SelectTrigger>
                                  <SelectContent>{AVAILABLE_LINKS.map(l => <SelectItem key={l.value} value={l.value} className="text-[10px]">{l.label}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <Input value={config.f2Button2Tooltip || ""} onChange={(e) => onUpdate(section, { f2Button2Tooltip: e.target.value })} className="h-7 text-[10px]" placeholder="Tooltip Text" />
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            )}
            {section === 'blog' && (
              <div className="space-y-4 pt-2">
                <Label className="text-xs font-medium uppercase text-muted-foreground">Blog Posts</Label>
                <div className="space-y-4">
                  {(config.posts ?? []).map((post, index) => (
                    <div key={index} className="p-3 bg-card border rounded-md space-y-3 relative group-item">
                      <Button variant="ghost" size="icon" onClick={() => removePost(index)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-xs text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Image URL</Label>
                        <Input value={post.image} onChange={(e) => updatePost(index, 'image', e.target.value)} className="h-7 text-xs" placeholder="https://..." />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Category</Label>
                          <Input value={post.category} onChange={(e) => updatePost(index, 'category', e.target.value)} className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Link (Slug)</Label>
                          <Input value={post.link || "#"} onChange={(e) => updatePost(index, 'link', e.target.value)} className="h-7 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Title</Label>
                        <Input value={post.title} onChange={(e) => updatePost(index, 'title', e.target.value)} className="h-7 text-xs font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold">Description</Label>
                        <Textarea value={post.description} onChange={(e) => updatePost(index, 'description', e.target.value)} className="min-h-[40px] text-[11px] resize-none" />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPost} className="w-full text-xs h-8">
                    <Plus className="h-3 w-3 mr-1" /> Add Blog Post
                  </Button>
                </div>
              </div>
            )}

            {/* Team Filter & Limit */}
            {section === 'team' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Sorting</Label>
                    <Select
                      value={config.teamFilter || "latest"}
                      onValueChange={(value: any) => onUpdate(section, { teamFilter: value })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest" className="text-xs">Latest Added</SelectItem>
                        <SelectItem value="top" className="text-xs">Top Rated</SelectItem>
                        <SelectItem value="oldest" className="text-xs">Oldest Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Show Records</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={config.teamLimit || 8}
                      onChange={(e) => onUpdate(section, { teamLimit: parseInt(e.target.value) || 8 })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 italic">
                  Note: Filter applied instantly. Limit controls initial sections.
                </p>
              </div>
            )}

            {/* Testimonials Filter & Limit */}
            {section === 'testimonials' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Review Selection</Label>
                    <Select
                      value={config.testimonialFilter || "highest"}
                      onValueChange={(value: any) => onUpdate(section, { testimonialFilter: value })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Filter by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto" className="text-xs">Auto (All Reviews)</SelectItem>
                        <SelectItem value="highest" className="text-xs">Highest (Top Rated)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase text-muted-foreground">Show Reviews</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={config.testimonialLimit || 6}
                      onChange={(e) => onUpdate(section, { testimonialLimit: parseInt(e.target.value) || 6 })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 italic">
                  Note: Choosing 'Highest' will automatically pull your top-star reviews.
                </p>
              </div>
            )}

            {/* Button Settings */}
            {hasButtons && (
              <div className="space-y-6 pt-2">
                <Separator />
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
                  )}
                </div>

                {/* Secondary Button */}
                {section !== 'team' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase">Secondary Button</Label>
                      <Switch
                        checked={!!config.showButton2}
                        onCheckedChange={(checked) => onUpdate(section, { showButton2: checked })}
                        className="scale-75"
                      />
                    </div>
                    {config.showButton2 && (
                      <>
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
                        <div className="space-y-1 mt-2">
                          <Label className="text-[10px]">Tooltip Text</Label>
                          <Input
                            value={config.button2Tooltip || ""}
                            onChange={(e) => onUpdate(section, { button2Tooltip: e.target.value })}
                            placeholder="e.g. Response within 24 hours"
                            className="h-8 text-xs"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
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
  const [siteLogo, setSiteLogo] = React.useState<string>("")
  const [siteLogoWidth, setSiteLogoWidth] = React.useState<number>(0)
  const [siteLogoHeight, setSiteLogoHeight] = React.useState<number>(0)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)

  const handleReset = () => {
    // Reset all state variables to initial values
    setSelectedTheme("")
    setSelectedTweakcnTheme("")
    setSelectedRadius("0.5rem")
    setImportedTheme(null)
    setBrandColorsValues({})

    // Reset landing content to defaults
    setLandingContent(DEFAULT_SETTINGS)

    // Reset theme and radius to defaults
    resetTheme()
    applyRadius("0.5rem")
  }

  const handleImport = (themeData: ImportedTheme) => {
    setImportedTheme(themeData)
    // Clear other selections to indicate custom import is active
    setSelectedTheme("")
    setSelectedTweakcnTheme("")

    // Apply the imported theme
    applyImportedTheme(themeData, isDarkMode)
  }

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const handleRandomShadcn = () => {
    // Apply a random shadcn theme
    const randomTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)]
    setSelectedTheme(randomTheme.value)
    setSelectedTweakcnTheme("")
    setBrandColorsValues({})
    setActivePresetType("theme")
    setImportedTheme(null)
    applyTheme(randomTheme.value, false)
  }

  const handleRandomTweakcn = () => {
    // Apply a random tweakcn theme
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

  // Real-time update for components listening to the customizer (e.g. Logo)
  React.useEffect(() => {
    const payload = {
      landing_content: {
        ...landingContent,
        header: {
          ...landingContent.header,
          siteLogo,
          siteLogoWidth,
          siteLogoHeight,
        },
      },
      landing_theme: {
        preset: activePresetType === "theme" ? selectedTheme : "",
        tweakcn_preset: activePresetType === "tweakcn" ? selectedTweakcnTheme : "",
        radius: parseFloat(selectedRadius.replace("rem", "")),
        custom_colors: brandColorsValues,
      }
    }
    localStorage.setItem('kivicare-landing-theme', JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('kivicare-customizer-theme-updated', {
      detail: {
        landing_content: payload.landing_content,
        theme: payload.landing_theme
      }
    }))
  }, [landingContent, siteLogo, siteLogoWidth, siteLogoHeight, activePresetType, selectedTheme, selectedTweakcnTheme, selectedRadius, brandColorsValues])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const radiusNumber = Number.parseFloat(selectedRadius.replace("rem", ""))

      const payload: CustomizerSettings = {
        landing_theme: {
          preset: activePresetType === "theme" ? selectedTheme : "",
          tweakcn_preset: activePresetType === "tweakcn" ? selectedTweakcnTheme : "",
          radius: parseFloat(selectedRadius.replace("rem", "")),
          custom_colors:
            activePresetType === "custom"
              ? Object.entries(brandColorsValues).reduce((acc: any, [key, value]) => {
                  const apiKey = key.replace("--", "").replace(/-/g, "_")
                  acc[apiKey] = [{ code: value, value: apiKey }]
                  return acc
                }, {})
              : {},
          light_mode_logo: siteLogo,
          light_mode_logo_width: siteLogoWidth,
          light_mode_logo_height: siteLogoHeight,
        },
        landing_content: {
          ...landingContent,
          header: {
            ...landingContent.header,
            siteLogo: siteLogo,
            siteLogoWidth: siteLogoWidth,
            siteLogoHeight: siteLogoHeight,
          }
        }
      }

      localStorage.setItem('kivicare-landing-theme', JSON.stringify(payload))
      await customizerApi.saveSettings(payload)
      window.dispatchEvent(new CustomEvent('kivicare-customizer-updated'))
      window.dispatchEvent(new CustomEvent('kivicare-customizer-theme-updated', { detail: { theme: payload.landing_theme } }))
      toast.success("Customizer settings saved")
    } catch {
      toast.error("Failed to save customizer settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Hydrate UI State when context settings change (initial load)
  React.useEffect(() => {
    const hydrateUI = async () => {
      try {
        let settings = null
        const localStr = localStorage.getItem('kivicare-landing-theme')
        if (localStr) settings = JSON.parse(localStr)

        if (!settings) {
          settings = await customizerApi.getSettings()
        }

        const landingTheme = settings?.landing_theme
        if (landingTheme) {
          if (landingTheme.preset) {
            setSelectedTheme(landingTheme.preset)
            setSelectedTweakcnTheme("")
            setActivePresetType("theme")
            setBrandColorsValues({})
            applyTheme(landingTheme.preset, false)
          } else if (landingTheme.tweakcn_preset) {
            setSelectedTweakcnTheme(landingTheme.tweakcn_preset)
            setSelectedTheme("")
            setActivePresetType("tweakcn")
            setBrandColorsValues({})
            const preset = tweakcnThemes.find(t => t.value === landingTheme.tweakcn_preset)?.preset
            if (preset) applyTweakcnTheme(preset, false)
          } else if (landingTheme.custom_colors && Object.keys(landingTheme.custom_colors).length > 0) {
            const mapped: Record<string, string> = {}
            Object.entries(landingTheme.custom_colors).forEach(([key, values]) => {
              const color = (values as any)?.[0]?.code
              if (color) mapped[`--${key.replace(/_/g, '-')}`] = color
            })
            setSelectedTheme("")
            setSelectedTweakcnTheme("")
            setActivePresetType("custom")
            setBrandColorsValues(mapped)
            applyTheme("default", false)
            Object.entries(mapped).forEach(([cssVar, value]) => {
              document.documentElement.style.setProperty(cssVar, value)
            })
          } else {
            setSelectedTheme("")
            setSelectedTweakcnTheme("")
            setActivePresetType("theme")
            setBrandColorsValues({})
          }
          if (landingTheme.radius) setSelectedRadius(`${landingTheme.radius}rem`)
          if (landingTheme.light_mode_logo) setSiteLogo(landingTheme.light_mode_logo)
          if (landingTheme.light_mode_logo_width) setSiteLogoWidth(Number(landingTheme.light_mode_logo_width))
          if (landingTheme.light_mode_logo_height) setSiteLogoHeight(Number(landingTheme.light_mode_logo_height))
        }
      } catch (e) { }
    }
    hydrateUI()
  }, [])

  // Landing customizer is light-mode only.
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
            // Prevent the sheet from closing when dialog is open
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
            <SheetDescription className="text-sm text-muted-foreground">
              Customize the theme and colors of your landing page.
            </SheetDescription>
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
                  {/* Shadcn UI Theme Presets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Theme Presets</Label>
                      <Button variant="outline" size="sm" onClick={handleRandomShadcn} className="cursor-pointer">
                        <Dices className="h-3.5 w-3.5 mr-1.5" />
                        Random
                      </Button>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                          <ImageIcon className="h-3.5 w-3.5" />
                        </div>
                        <Label className="text-xs font-bold uppercase">Landing Site Logo</Label>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-3">
                          <div className="h-20 w-full rounded-md border-2 border-dashed border-primary/20 bg-background flex items-center justify-center overflow-hidden group/logo relative">
                            {siteLogo ? (
                              <>
                                <img src={siteLogo} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 cursor-pointer"
                                    onClick={() => setSiteLogo("")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <Upload className="h-5 w-5" />
                                <span className="text-[10px] font-medium">Click to upload logo</span>
                              </div>
                            )}
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              accept="image/*"
                              disabled={isUploadingLogo}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  try {
                                    setIsUploadingLogo(true)
                                    const url = await customizerApi.uploadLogo(file)
                                    setSiteLogo(url)
                                    toast.success("Logo uploaded successfully")
                                  } catch {
                                    toast.error("Failed to upload logo")
                                  } finally {
                                    setIsUploadingLogo(false)
                                  }
                                }
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Width (px)</Label>
                              <Input
                                type="number"
                                placeholder="Auto"
                                value={siteLogoWidth || ""}
                                onChange={(e) => setSiteLogoWidth(parseInt(e.target.value) || 0)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Height (px)</Label>
                              <Input
                                type="number"
                                placeholder="Auto"
                                value={siteLogoHeight || ""}
                                onChange={(e) => setSiteLogoHeight(parseInt(e.target.value) || 0)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                          Tip: Use a transparent PNG for best results. Leave dimensions empty for auto-scaling.
                        </p>
                      </div>
                    </div>

                    <Separator />

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
                        <div className="p-2">
                          {colorThemes.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.primary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.secondary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.accent }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.muted }}
                                  />
                                </div>
                                <span>{theme.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Tweakcn Theme Presets */}
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
                        <div className="p-2">
                          {tweakcnThemes.map((theme) => (
                            <SelectItem key={theme.value} value={theme.value} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.primary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.secondary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.accent }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full border border-border/20"
                                    style={{ backgroundColor: theme.preset.styles.light.muted }}
                                  />
                                </div>
                                <span>{theme.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Radius Selection */}
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
                          <div className="text-center">
                            <div className="text-xs font-medium">{option.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Brand Colors Section */}
                  <Accordion type="single" collapsible className="w-full rounded-lg">
                    <AccordionItem value="brand-colors" className="border border-border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                        <Label className="text-sm font-medium cursor-pointer">Brand Colors</Label>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2 space-y-3 border-t border-border bg-muted/20">
                        {baseColors.map((color) => (
                          <div key={color.cssVar} className="flex items-center justify-between">
                            <ColorPicker
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
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>

              <TabsContent value="content" className="flex-1 mt-0 p-4 pt-0">
                <Accordion type="single" collapsible className="w-full mt-4">
                  <SectionCustomizer label="Hero Section" section="hero" config={landingContent.hero} onUpdate={updateSection} icon={Layout} />
                  <SectionCustomizer label="Trusted Partners" section="logos" config={landingContent.logos} onUpdate={updateSection} icon={Building2} />
                  <SectionCustomizer label="Statistics" section="stats" config={landingContent.stats} onUpdate={updateSection} icon={BarChart3} />
                  <SectionCustomizer label="Network" section="about" config={landingContent.about} onUpdate={updateSection} icon={Info} />
                  <SectionCustomizer label="Features" section="features" config={landingContent.features} onUpdate={updateSection} icon={Zap} />
                  <SectionCustomizer label="Our Team" section="team" config={landingContent.team} onUpdate={updateSection} icon={Users2} />
                  <SectionCustomizer label="Pricing" section="pricing" config={landingContent.pricing} onUpdate={updateSection} icon={CreditCard} />
                  <SectionCustomizer label="Testimonials" section="testimonials" config={landingContent.testimonials} onUpdate={updateSection} icon={Quote} />
                  <SectionCustomizer label="Blog Posts" section="blog" config={landingContent.blog} onUpdate={updateSection} icon={Newspaper} />
                  <SectionCustomizer label="F.A.Q" section="faq" config={landingContent.faq} onUpdate={updateSection} icon={HelpCircle} />
                  <SectionCustomizer label="C.T.A Section" section="cta" config={landingContent.cta} onUpdate={updateSection} icon={MousePointer2} />
                  <SectionCustomizer label="Contact Form" section="contact" config={landingContent.contact} onUpdate={updateSection} icon={Mail} />
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

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImport}
      />
    </>
  )
}

// Floating trigger button for landing page
export function LandingThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed top-1/2 -translate-y-1/2 h-12 w-12 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer right-4"
      )}
    >
      <Settings className="h-5 w-5" />
    </Button>
  )
}
