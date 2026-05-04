import { api } from "@/lib/api/axios"

type CustomizerBrandColorItem = {
  code: string
  value: string
}

type CustomizerThemeSettings = {
  preset?: string
  tweakcn_preset?: string
  radius?: number
  mode?: "light" | "dark" | "system"
  custom_colors?: Record<string, CustomizerBrandColorItem[]>
  brand_colors?: Record<string, CustomizerBrandColorItem[]>
  light_mode_logo?: string
  dark_mode_logo?: string
  light_mode_logo_width?: number
  light_mode_logo_height?: number
  dark_mode_logo_width?: number
  dark_mode_logo_height?: number
}

type CustomizerLayoutSettings = {
  sidebar_variant?: string
  sidebar_collapsible?: string
  sidebar_position?: "left" | "right"
}

export type LandingSectionConfig = {
  show: boolean
  badge?: string
  title?: string
  description?: string
  // Button 1
  showButton?: boolean
  buttonText?: string
  buttonLink?: string
  // Button 2
  showButton2?: boolean
  button2Text?: string
  button2Link?: string
  button2IconPosition?: 'left' | 'right'
  buttonIconPosition?: 'left' | 'right'
  logos?: { url: string; alt?: string }[]
  items?: { icon: string; value: string; label: string; description?: string }[]
  filter?: 'latest' | 'oldest' | 'top'
  limit?: number
  button2Tooltip?: string
  // Feature Specifics
  feature1Title?: string
  feature1Description?: string
  feature1LightImage?: string
  mainFeatures?: { icon: string; title: string; description: string }[]
  feature2Title?: string
  feature2Description?: string
  feature2LightImage?: string
  secondaryFeatures?: { icon: string; title: string; description: string }[]
  // Team Specifics
  teamFilter?: 'top' | 'latest' | 'oldest'
  teamLimit?: number
  // Testimonial Specifics
  testimonialFilter?: 'auto' | 'highest'
  testimonialLimit?: number
  // Blog Specifics
  posts?: { image: string; category: string; title: string; description: string; link?: string }[]
  // Style 2 specific buttons (Style 1 uses standard showButton/showButton2)
  f2ShowButton?: boolean
  f2ButtonText?: string
  f2ButtonLink?: string
  f2ShowButton2?: boolean
  f2Button2Text?: string
  f2Button2Link?: string
  f2Button2Tooltip?: string
  faqItems?: { question: string; answer: string }[]
  subDescription?: string
  // Hero Specifics
  heroLayout?: 'style1' | 'style2'
  hero2Badge?: string
  hero2BadgeIcon?: string
  hero2Title?: string
  hero2Description?: string
  badgeIcon?: string
  blogLimit?: number
  // Hero Layout 1 Specifics
  heroPoint1?: string
  heroPoint1Icon?: string
  heroPoint2?: string
  heroPoint2Icon?: string
  heroPoint3?: string
  heroPoint3Icon?: string
  heroImage?: string
  showHeroPlayButton?: boolean
  heroVideoLink?: string
  heroBackgroundType?: 'white' | 'accent' | 'primary-opacity'
  // CTA Specifics
  ctaStat1?: string
  ctaStat2?: string
  ctaStat3?: string
  ctaTrust1?: string
  ctaTrust2?: string
  ctaTrust3?: string
  buttonIcon?: string
  button2Icon?: string
  badgeColor?: string
  badgeBgColor?: string
  sectionBgColor?: string
  sectionTextColor?: string
  sectionHighlightColor?: string
  // Contact Specifics
  formIcon?: string
  formTitle?: string
  submitButtonText?: string
  contactOptions?: { icon: string; title: string; description: string; buttonText: string; buttonLink: string; tooltip?: string }[]
  // Header & Footer Specifics
  siteLogo?: string
  siteLogoWidth?: number
  siteLogoHeight?: number
  siteName?: string
  menuLinks?: { label: string; link: string }[]
  socialLinks?: { icon: string; link: string; platform?: string }[]
  copyright?: string
  // Account Menu Specifics
  logoutText?: string
  dashboardText?: string
  profileText?: string
  passwordText?: string
  loginText?: string
  // Footer Specific Contact Info
  footerContactMode?: 'clinic' | 'manual'
  footerClinicId?: string
  footerManualAddress?: string
  footerManualEmail?: string
  footerManualPhone?: string
  showNewsletter?: boolean
  newsletterTitle?: string
  newsletterDescription?: string
  bottomMenuLinks?: { label: string; link: string }[]
  footerMadeByText?: string
  footerMadeByAuthor?: string
  footerMadeByLink?: string
}

export type LandingContentSettings = {
  header: LandingSectionConfig
  hero: LandingSectionConfig
  logos: LandingSectionConfig
  stats: LandingSectionConfig
  about: LandingSectionConfig
  features: LandingSectionConfig
  team: LandingSectionConfig
  pricing: LandingSectionConfig
  testimonials: LandingSectionConfig
  blog: LandingSectionConfig
  faq: LandingSectionConfig
  cta: LandingSectionConfig
  contact: LandingSectionConfig
  footer: LandingSectionConfig
}

export type CustomizerSettings = {
  theme?: CustomizerThemeSettings
  landing_theme?: CustomizerThemeSettings
  layout?: CustomizerLayoutSettings
  // Legacy flattened keys still returned by some payloads
  light_mode_logo?: string
  dark_mode_logo?: string
  light_mode_logo_width?: number
  light_mode_logo_height?: number
  dark_mode_logo_width?: number
  dark_mode_logo_height?: number
  landing_content?: LandingContentSettings
}

type CustomizerApiResponse = {
  statusCode: number
  data: any
  message: string
  success: boolean
}

type UpdateCustomizerPayload = {
  name: "customizer"
  data: CustomizerSettings
}

const unescapeHtml = (str: string) => {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

const unescapeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return unescapeHtml(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(unescapeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = unescapeObject(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/**
 * Server Components / RSC: fetch public customizer using absolute API URL
 * (same normalized settings as the client, so presets match for all users).
 */
function resolveServerApiV1BaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")

  if (fromEnv && !fromEnv.startsWith("/")) return fromEnv

  const internal =
    process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") || "http://localhost:5000"
  return `${internal}/api/v1`
}

export async function fetchCustomizerSettingsPublicServer(): Promise<CustomizerSettings | null> {
  try {
    const res = await fetch(
      `${resolveServerApiV1BaseUrl()}/settings/customizer/public`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) return null
    const json = (await res.json()) as {
      data?: CustomizerSettings
      statusCode?: number
    }
    const raw = json.data
    return raw ? (unescapeObject(raw) as CustomizerSettings) : null
  } catch {
    return null
  }
}

export const customizerApi = {
  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("customizerLogo", file)

    const response = await api.post<CustomizerApiResponse>("/settings/customizer/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data?.data?.url ?? ""
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post<CustomizerApiResponse>("/settings/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data?.data?.url ?? ""
  },

  getSettings: async (): Promise<CustomizerSettings> => {
    const response = await api.get<CustomizerApiResponse>("/settings/customizer", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      params: {
        _t: Date.now(),
      },
    })
    return unescapeObject(response.data.data)
  },

  getSettingsPublic: async (): Promise<CustomizerSettings> => {
    const response = await api.get<CustomizerApiResponse>("/settings/customizer/public", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      params: {
        _t: Date.now(),
      },
    })
    return unescapeObject(response.data.data)
  },

  saveSettings: async (data: CustomizerSettings): Promise<CustomizerSettings> => {
    const payload: UpdateCustomizerPayload = {
      name: "customizer",
      data,
    }
    const response = await api.post<CustomizerApiResponse>("/settings", payload)
    const raw = response.data?.data
    if (raw && typeof raw === "object" && raw.data && typeof raw.data === "object") {
      return raw.data as CustomizerSettings
    }
    return (raw as CustomizerSettings) ?? data
  },
}
