import type { UserRole } from "@/types/auth.types"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Users,
  UserCog,
  UserCheck,
  Building2,
  Stethoscope,
  CalendarDays,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  Lightbulb,
  CalendarOff,
  SlidersHorizontal,
  Smartphone,
  Mail,
  Search,
  MessageSquare,
  Webhook,
  Bell,
  Activity,
  LayoutGrid,
  Video,
  MonitorSmartphone,
  List,
  TextCursorInput,
  Star,
  CreditCard,
  ShieldCheck,
  PanelLeft,
  PlugZap,
  Wrench,
} from "lucide-react"

export type SidebarNavItem = {
  id?: string
  title: string
  href?: string
  url: string
  icon?: LucideIcon
  iconKey?: string
  group?: string
  items?: Array<{
    id?: string
    title: string
    url: string
    isActive?: boolean
  }>
  disableChildrenForRoles?: UserRole[]
}

export type SidebarNavGroup = {
  label: string
  items: SidebarNavItem[]
}

// Map sidebar item IDs to their corresponding permission keys in Advanced Settings.
const SIDEBAR_PERMISSION_MAP: Record<string, string> = {
  dashboard: "dashboard_access",
  appointments: "appointment_access",
  encounters: "encounter_access",
  chat: "chat_access",
  patients: "patient_access",
  doctors: "doctor_access",
  receptionists: "receptionist_access",
  services: "service_access",
  doctor_sessions: "doctor_session_access",
  taxes: "tax_access",
  billing_records: "billing_access",
  reports: "reports_access",
  medical_reports: "medical_records_access",
  encounter_access_sub: "encounter_access",
  encounter_templates_sub: "encounter_template_access",
}

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "Main",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        href: "/dashboard",
        url: "/dashboard",
        iconKey: "dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "appointments",
        title: "Appointments",
        href: "/appointments",
        url: "/appointments",
        iconKey: "appointments",
        icon: CalendarCheck,
      },
      {
        id: "encounters",
        title: "Encounters",
        href: "/encounters",
        url: "/encounters",
        iconKey: "encounters",
        icon: Activity,
        disableChildrenForRoles: ["patient"],
        items: [
          { id: "encounter_access_sub", title: "Encounters List", url: "/encounters" },
          { id: "encounter_templates_sub", title: "Encounter Templates", url: "/encounter-templates" },
        ],
      },
      {
        id: "chat",
        title: "Chat",
        href: "/chat",
        url: "/chat",
        iconKey: "chat",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Users",
    items: [
      {
        id: "patients",
        title: "Patients",
        href: "/patients",
        url: "/patients",
        iconKey: "patients",
        icon: Users,
      },
      {
        id: "doctors",
        title: "Doctors",
        href: "/doctors",
        url: "/doctors",
        iconKey: "doctors",
        icon: UserCog,
      },
      {
        id: "receptionists",
        title: "Receptionists",
        href: "/receptionists",
        url: "/receptionists",
        iconKey: "receptionists",
        icon: UserCheck,
      },
    ],
  },
  {
    label: "Clinic",
    items: [
      {
        id: "clinics",
        title: "Clinics",
        href: "/clinics",
        url: "/clinics",
        iconKey: "clinics",
        icon: Building2,
      },
      {
        id: "services",
        title: "Services",
        href: "/services",
        url: "/services",
        iconKey: "services",
        icon: Stethoscope,
      },
      {
        id: "doctor_sessions",
        title: "Doctor Sessions",
        href: "/doctor-sessions",
        url: "/doctor-sessions",
        iconKey: "doctorSessions",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Financial",
    items: [
      {
        id: "taxes",
        title: "Taxes",
        href: "/taxes",
        url: "/taxes",
        iconKey: "taxes",
        icon: Receipt,
      },
      {
        id: "billing_records",
        title: "Billing Records",
        href: "/billing-records",
        url: "/billing-records",
        iconKey: "billingRecords",
        icon: FileText,
      },
      {
        id: "reports",
        title: "Reports",
        href: "/reports",
        url: "/reports",
        iconKey: "reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        id: "settings",
        title: "Settings",
        href: "/settings/general-setting",
        url: "/settings/general-setting",
        iconKey: "settings",
        icon: Settings,
      },
      {
        id: "content",
        title: "Content",
        href: "/blogs",
        url: "/blogs",
        iconKey: "content",
        icon: ClipboardList,
        items: [
          { id: "blogs_sub", title: "Blogs", url: "/blogs" },
          { id: "inquiries_sub", title: "Inquiries", url: "/inquiries" },
        ],
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        id: "get_help",
        title: "Get Help",
        href: "/get-help",
        url: "/get-help",
        iconKey: "getHelp",
        icon: HelpCircle,
      }
    ],
  },
  {
    label: "Patient",
    items: [
      {
        id: "medical_reports",
        title: "Medical Reports",
        href: "/medical-reports",
        url: "/medical-reports",
        iconKey: "medicalReports",
        icon: ShieldCheck,
        group: "Patient",
      },
    ],
  },
]

export type SettingsNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { title: "General", href: "/settings/general-setting", icon: Settings },
  { title: "Schedule", href: "/settings/schedule-setting", icon: CalendarDays },
  { title: "Notifications", href: "/settings/notifications-setting", icon: Bell },
  { title: "Integration", href: "/settings/integrations-setting", icon: PlugZap },
  { title: "Payment", href: "/settings/payment-setting", icon: CreditCard },
  { title: "SEO", href: "/settings/seo-setting", icon: Search },
  { title: "Advanced Settings", href: "/settings/advanced-setting", icon: Wrench },
]

const ROLE_SIDEBAR_IDS: Record<UserRole, Set<string>> = {
  admin: new Set([
    "dashboard",
    "appointments",
    "encounters",
    "patients",
    "doctors",
    "receptionists",
    "clinics",
    "services",
    "doctor_sessions",
    "taxes",
    "billing_records",
    "reports",
    "settings",
    "content",
    "get_help",
    "chat",
  ]),
  clinic_admin: new Set([
    "dashboard",
    "appointments",
    "encounters",
    "patients",
    "doctors",
    "receptionists",
    "services",
    "doctor_sessions",
    "taxes",
    "billing_records",
    "reports",
    "settings",
    "chat",
  ]),
  doctor: new Set([
    "dashboard",
    "appointments",
    "encounters",
    "patients",
    "services",
    "doctor_sessions",
    "billing_records",
    "settings",
    "chat",
  ]),
  receptionist: new Set([
    "dashboard",
    "appointments",
    "encounters",
    "patients",
    "doctors",
    "services",
    "doctor_sessions",
    "billing_records",
    "settings",
    "chat",
  ]),
  patient: new Set([
    "dashboard",
    "appointments",
    "encounters",
    "billing_records",
    "medical_reports",
    "chat",
  ]),
}

const ROLE_SETTINGS_TITLES: Record<UserRole, Set<string>> = {
  admin: new Set([
    "General",
    "Schedule",
    "Notifications",
    "Integration",
    "Payment",
    "SEO",
    "Advanced Settings",
  ]),
  clinic_admin: new Set(["General", "Schedule"]),
  doctor: new Set([
    "General",
    "Schedule",
    "Integration",
  ]),
  receptionist: new Set(["General", "Schedule"]),
  patient: new Set([]),
}

const ROLE_SETTINGS_SUB_KEYS: Record<UserRole, Set<string>> = {
  admin: new Set([
    "general-setting",
    "configurations-setting",
    "listing",
    "appointment-setting",
    "holidays",
    "notification-setting",
    "email-template",
    "sms-whatsapp",
    "custom-notification",
    "google-configuration",
    "google-event-template",
    "google-meet",
    "zoom-telemed",
    "paylater",
    "paypal",
    "razorpay",
    "stripe",
    "seo-setting",
    "clinic-admin",
    "receptionist",
    "doctor",
    "patient",
  ]),
  clinic_admin: new Set([
    "general-setting",
    "configurations-setting",
    "listing",
    "appointment-setting",
    "holidays",
  ]),
  doctor: new Set([
    "general-setting",
    "configurations-setting",
    "listing",
    "appointment-setting",
    "holidays",
    "google-configuration",
    "google-meet",
    "google-event-template",
    "zoom-telemed",
  ]),
  receptionist: new Set([
    "general-setting",
    "listing",
    "holidays",
  ]),
  patient: new Set([]),
}

/** Keys allowed under each settings category (General / Schedule / etc.) for the role — keep in sync with filtered accordions on those pages. */
export function getSettingsSubKeysForRole(role: UserRole): Set<string> {
  return ROLE_SETTINGS_SUB_KEYS[role]
}

export function normalizeUserRole(role: unknown): UserRole {
  if (role === "admin" || role === "clinic_admin" || role === "doctor" || role === "receptionist" || role === "patient") {
    return role
  }
  return "patient"
}

function filterSidebarItemForRole(
  item: SidebarNavItem,
  allowedIds: Set<string>,
  role: UserRole
): SidebarNavItem | null {
  const itemId = item.id ?? item.title
  const isAllowed = allowedIds.has(itemId)
  const hasChildren = Array.isArray(item.items) && item.items.length > 0

  if (hasChildren) {
    if (isAllowed) {
      if (item.disableChildrenForRoles?.includes(role)) {
        return {
          ...item,
          items: undefined,
        }
      }

      return item
    }
    return null
  }

  return isAllowed ? item : null
}

export function getSidebarNavForRole(role: UserRole, navGroups: SidebarNavGroup[] = SIDEBAR_NAV_GROUPS) {
  const allowedIds = ROLE_SIDEBAR_IDS[role]
  const nextGroups = navGroups
    .map((group) => {
      const nextItems = group.items
        .map((item) => {
          const nextItem = filterSidebarItemForRole(item, allowedIds, role)
          if (nextItem && role === "doctor" && nextItem.id === "doctor_sessions") {
            return { ...nextItem, title: "Sessions" }
          }
          return nextItem
        })
        .filter((v): v is SidebarNavItem => Boolean(v))

      return { ...group, items: nextItems }
    })
    .filter((group) => group.items.length > 0)

  return nextGroups
}

export function filterSidebarNavByAccess(
  groups: SidebarNavGroup[],
  cfg: { receptionist: boolean; billing: boolean } | undefined,
  can: (key: string) => boolean
): SidebarNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (cfg) {
            if (item.id === "receptionists" && !cfg.receptionist) return false
            if (item.id === "billing_records" && !cfg.billing) return false
          }

          if (item.id && SIDEBAR_PERMISSION_MAP[item.id]) {
            if (!can(SIDEBAR_PERMISSION_MAP[item.id])) return false
          }

          return true
        })
        .map((item) => {
          if (!item.items) return item
          return {
            ...item,
            items: item.items.filter((sub) => {
              if (sub.id && SIDEBAR_PERMISSION_MAP[sub.id]) {
                return can(SIDEBAR_PERMISSION_MAP[sub.id])
              }
              return true
            }),
          }
        })
        .filter((item) => {
          if (item.items && item.items.length === 0 && (!item.url || item.url === "#")) {
            return false
          }
          return true
        }),
    }))
    .filter((group) => group.items.length > 0)
}

export function getSettingsNavForRole(role: UserRole, items: SettingsNavItem[] = SETTINGS_NAV_ITEMS) {
  const allowedTitles = ROLE_SETTINGS_TITLES[role]
  const allowedSubKeys = ROLE_SETTINGS_SUB_KEYS[role]

  return items
    .filter((item) => allowedTitles.has(item.title))
    .map((item) => {
      // Handle potential subItems (as in SettingsCategory from layout.tsx)
      const category = item as any
      if (category.subItems && Array.isArray(category.subItems)) {
        return {
          ...category,
          subItems: category.subItems.filter((sub: any) => allowedSubKeys.has(sub.key)),
        }
      }
      return item
    })
    // Remove categories that ended up with no sub-items after filtering
    .filter((item: any) => !item.subItems || item.subItems.length > 0)
}
