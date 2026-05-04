/** Extract clinic ID from profile for receptionist role */
export function getClinicIdFromProfile(profile: unknown): string | undefined {
  const meta = profile && typeof profile === "object" && "meta" in profile ? (profile as { meta?: unknown }).meta : undefined
  if (!meta || typeof meta !== "object") return undefined
  const clinics = "clinics" in meta ? (meta as { clinics?: unknown }).clinics : undefined
  if (!clinics) return undefined
  const first = Array.isArray(clinics) ? clinics[0] : clinics
  return typeof first === "string" ? first : (first as { _id?: string })?._id
}
