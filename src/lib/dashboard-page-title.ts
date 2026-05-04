export const DASHBOARD_TITLE_PREFIXES: Array<[prefix: string, title: string]> = [
  ["/settings/notifications-setting/custom-notification", "Custom Notifications"],
  ["/settings/notifications-setting/email-template", "Email Templates"],
  ["/settings/notifications-setting/sms-template", "SMS Templates"],
  ["/settings/notifications-setting/twilio-account", "Twilio Account"],
  ["/settings/notifications-setting", "Notification Settings"],
  ["/settings/integrations-setting/zoom-telemed", "Zoom Telemed Settings"],
  ["/settings/integrations-setting/google-event-template", "Google Event Template"],
  ["/settings/integrations-setting/google-meet", "Google Meet Settings"],
  ["/settings/integrations-setting", "Integration Settings"],
  ["/settings/schedule-setting/holidays", "Holidays"],
  ["/settings/schedule-setting/appointment-setting", "Appointment Settings"],
  ["/settings/schedule-setting", "Schedule Settings"],
  ["/settings/payment-setting", "Payment Settings"],
  ["/settings/advanced-setting", "Advanced Settings"],
  ["/settings/general-setting/listings", "Listings"],
  ["/settings/general-setting/configurations", "Configurations"],
  ["/settings/general-setting", "General Settings"],
  ["/settings/user", "User Settings"],
  ["/settings/account", "Account Settings"],
  ["/settings", "Settings"],
  ["/blogs", "Blogs"],
  ["/inquiries", "Inquiries"],
  ["/appointments/calendar", "Appointments Calendar"],
  ["/appointments", "Appointments"],
  ["/encounters/add", "Add Encounter"],
  ["/encounters", "Encounters"],
  ["/encounter-templates/add", "Add Encounter Template"],
  ["/encounter-templates", "Encounter Templates"],
  ["/doctor-sessions", "Doctor Sessions"],
  ["/billing-records", "Billing Records"],
  ["/medical-reports", "Medical Reports"],
  ["/doctor-reviews", "Doctor Reviews"],
  ["/receptionists", "Receptionists"],
  ["/notifications", "Notifications"],
  ["/dashboard", "Dashboard"],
  ["/patients", "Patients"],
  ["/doctors", "Doctors"],
  ["/clinics", "Clinics"],
  ["/services", "Services"],
  ["/reports", "Reports"],
  ["/pricing", "Pricing"],
  ["/tasks", "Tasks"],
  ["/taxes", "Taxes"],
  ["/users", "Users"],
  ["/chat", "Chat"],
  ["/mail", "Mail"],
  ["/faqs", "FAQs"],
]

function toTitleCase(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getDashboardPageTitle(pathname: string) {
  for (const [prefix, title] of DASHBOARD_TITLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title
    }
  }

  const segment = pathname.split("/").filter(Boolean).pop()
  return segment ? toTitleCase(segment) : "Dashboard"
}
