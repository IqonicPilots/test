
export const TARGET_CONDITION_VARIABLES: Record<string, string[]> = {
  all: ["user_name", "user_email"],
  new_user: ["user_name", "user_email", "user_password", "login_url"],
  all_clinic_admin: [
    "user_name",
    "user_email",
    "current_date",
    "current_date_time",
    "clinic_name",
    "clinic_email",
    "clinic_address",
    "clinic_contact_number"
  ],
  all_patients: ["patient_name", "patient_email", "patient_contact_number"],
  new_patients: ["patient_name", "patient_email", "patient_contact_number", "user_password"],
  all_doctors: ["doctor_name", "doctor_email", "doctor_contact_number"],
  new_doctors: ["doctor_name", "doctor_email", "doctor_contact_number", "user_password"],
  particular_clinic_all_user: ["user_name", "user_email"],
  particular_clinic_all_doctor: ["doctor_name", "doctor_email", "doctor_contact_number"],
  particular_clinic_all_receptionist: ["user_name", "user_email", "user_contact_number"],
  particular_clinic_all_patient: ["patient_name", "patient_email", "patient_contact_number"],
  particular_clinic_all_admin: ["user_name", "user_email"],
  patients_with_pending_bills: ["patient_name", "total_amount", "bill_id"],
  patients_with_appointments_today: [
    "patient_name",
    "doctor_name",
    "appointment_time",
    "service_name",
    "appointment_date"
  ],
  birthday_today: ["user_name", "user_email"],
}

export const getVariablesForCondition = (condition?: string) => {
  if (!condition) return []
  return TARGET_CONDITION_VARIABLES[condition] || []
}
