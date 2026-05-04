import { api } from "@/lib/api/axios"

export type SEOSettingsData = {
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  og_title: string
  og_description: string
  og_image: string
  twitter_title: string
  twitter_description: string
  robots_index: boolean
  robots_follow: boolean
  favicon: string
  apple_touch_icon: string
}

type SEOSettingsResponse = {
  statusCode: number
  data: any
  message?: string
  success?: boolean
}

type UpdateSEOSettingsPayload = {
  name: "seo"
  data: Partial<SEOSettingsData>
}

const DEFAULT_SEO_SETTINGS: SEOSettingsData = {
  meta_title: 'KiviCare – Clinic Management System | EHR, Appointments & Billing Software',
  meta_description: 'KiviCare is a complete clinic management system to manage patients, appointments, EHR, billing, and telemedicine. Built for modern clinics and healthcare providers to streamline operations and improve patient care.',
  meta_keywords: [
    'clinic management system',
    'hospital management software',
    'patient management system',
    'EHR software',
    'EMR system',
    'appointment scheduling software',
    'healthcare management software',
    'clinic software',
    'telemedicine software',
    'medical practice management software'
  ],
  og_title: 'KiviCare – All-in-One Clinic Management Software',
  og_description: 'Manage patients, appointments, EHR, billing, and telemedicine with KiviCare. A modern healthcare management system for clinics and hospitals.',
  og_image: '',
  twitter_title: 'KiviCare – Clinic Management System',
  twitter_description: 'All-in-one healthcare software for patient management, appointments, EHR, billing, and telemedicine.',
  robots_index: true,
  robots_follow: true,
  favicon: '',
  apple_touch_icon: '',
}

function normalizeSEOSettings(payload: any): SEOSettingsData {
  const maybe = payload?.data?.data ?? payload?.data ?? payload
  
  const unescape = (str: any): any => {
    if (typeof str !== 'string') return str
    return str
      .replace(/&#x2F;/g, '/')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
  }

  const clean: any = {}
  if (maybe) {
    Object.keys(maybe).forEach((key) => {
      const val = maybe[key]
      if (typeof val === 'string') {
        clean[key] = unescape(val)
      } else if (Array.isArray(val)) {
        clean[key] = val.map(unescape)
      } else {
        clean[key] = val
      }
    })
  }

  return { ...DEFAULT_SEO_SETTINGS, ...(clean ?? {}) }
}

export const seoSettingsApi = {
  getSettings: async (): Promise<SEOSettingsData> => {
    const response = await api.get<SEOSettingsResponse>("/settings/seo")
    return normalizeSEOSettings(response.data?.data)
  },

  getSettingsPublic: async (): Promise<SEOSettingsData> => {
    const response = await api.get<SEOSettingsResponse>("/settings/seo/public")
    return normalizeSEOSettings(response.data?.data)
  },

  saveSettings: async (data: Partial<SEOSettingsData>): Promise<SEOSettingsData> => {
    const payload: UpdateSEOSettingsPayload = {
      name: "seo",
      data,
    }
    const response = await api.post<SEOSettingsResponse>("/settings", payload)
    return normalizeSEOSettings(response.data?.data)
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await api.post<{ data: { url: string } }>("/settings/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data.url
  },
}
