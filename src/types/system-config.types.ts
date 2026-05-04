export type SystemConfig = {
  app_subtext?: string
  copyright_text?: string
  currency_prefix: string
  currency_postfix: string
  /** E.164-style dial prefix for phone inputs (e.g. "+373") from General Settings */
  country_code?: string
  language_display?: boolean
  default_language?: string
  hide_customizer?: boolean
  booking_appointment_layout?: string
  booking_hero_badge_text?: string
  booking_hero_title_text?: string
  booking_hero_description_text?: string
  configuration_settings?: {
    receptionist: boolean
    billing: boolean
    problem: boolean
    observations: boolean
    note: boolean
    prescription: boolean
  }
}

