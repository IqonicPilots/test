"use client"

import { getStoredAuthSession } from '@/lib/auth-session'
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Star, MapPin, Clock, Calendar, User, Mail, Phone, Hospital, CalendarDays, Stethoscope, HeartPulse, Loader2 } from "lucide-react"
import type { Doctor } from "@/types/doctor.types"
import { StatusBadge } from "../ui/status-badge"
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Clinic } from "@/types/clinic.types"
import { useDoctorReviews } from "@/hooks/api/use-reviews"

interface GenericCardProps {
  doctor?: Doctor
  clinic?: Clinic
}

export function GenericCard({ doctor, clinic }: GenericCardProps) {
  const router = useRouter()

  // Determine if the user is a patient
  const session = getStoredAuthSession()
  const isPatient = !session || session.user.role === 'patient'
  
  // Fetch doctor reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useDoctorReviews(doctor?._id)
  const averageRating = reviewsData?.analytics?.averageRating || 0
  
  // Common extraction
  const isActive = doctor ? doctor.isActive : (clinic ? clinic.isActive : false)
  const email = doctor ? doctor.email : clinic?.email
  const mobile = doctor ? doctor.mobile : clinic?.mobile
  const countryCode = doctor ? doctor.countryCode : clinic?.countryCode
  const id = doctor ? doctor._id : clinic?._id

  // Doctor specific logic
  const fullName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : (clinic ? clinic.name : "")
  const profilePic = doctor 
    ? (doctor.meta?.profilePicture || doctor.meta?.avatar || "") 
    : (clinic ? clinic.cliniclogo : "")
  
  const gender = doctor?.meta?.gender || ""
  const dob = doctor?.meta?.dob || ""
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  const experience = doctor?.meta?.experience ? `${doctor.meta.experience} Years of Experience` : ""

  // Specialties - handle both doctor and clinic structures
  const specialties = doctor?.meta?.specialties || clinic?.specialties || []
  
  // Clinics (for doctor card)
  const doctorClinics = doctor?.meta?.clinics || []

  // Specialty color
  const specialtyColors: Record<string, string> = {
    neurologist: "text-teal-600",
    cardiologist: "text-sky-500",
    psychologist: "text-indigo-600",
    pediatrician: "text-pink-500",
    dermatologist: "text-violet-600",
    orthopedics: "text-orange-500",
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="flex h-full flex-col md:flex-row">

        {/* ── Image (top on mobile, left on md+) ── */}
        <div className="relative w-full h-48 shrink-0 bg-slate-50 overflow-hidden md:h-auto md:w-56 md:self-stretch md:min-h-[200px]">
          {profilePic ? (
            <Image
              src={profilePic}
              alt={fullName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary bg-primary/30">
              {doctor ? <User className='h-10 w-10' /> : <Hospital className='h-10 w-10' />}
            </div>
          )}

          {/* Rating Badge */}
          {doctor && (
            <div className="absolute top-3 left-3">
              {isLoadingReviews ? (
                <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <Loader2 className="size-3 animate-spin" />
                </span>
              ) : averageRating > 0 ? (
                <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  <Star className="size-3 fill-current" />
                  {averageRating.toFixed(1)}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Right: Content ── */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {clinic && (
            <>
              <Stethoscope className="absolute top-5 right-40 w-12 h-12 text-blue-600/10 -rotate-12" />
              <HeartPulse className="absolute top-22 right-4 w-10 h-10 text-blue-600/10 rotate-12" />
              <Hospital className="absolute bottom-2 right-62 w-16 h-16 text-blue-600/10" />
            </>
          )}

          {/* Specialty + Status row */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-3 border-b">
            {clinic && (
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 leading-tight my-2">
                  {clinic.name}
                </h3>
                {email && (
                  <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                    <Mail className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <div className="text-[13px] text-slate-600 leading-snug break-all">{email}</div>
                  </div>
                )}
              </div>
            )}
            {doctor && (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  {specialties.slice(0, 2).map((specialty: any, idx: number) => {
                    const label = typeof specialty === 'string' ? specialty : (specialty.label || specialty.name || specialty.value)
                    const safeLabel = String(label || "General")
                    const colorKey = safeLabel.toLowerCase().replace(/\s+/g, "")
                    const color = specialtyColors[colorKey] || "text-teal-600"
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-lg hover:bg-slate-50 transition-colors">
                        {idx !== 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        )}
                        <span className={`${color} text-xs uppercase font-bold text-slate-600`}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                  
                  {specialties.length > 2 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <span className="text-xs">+{specialties.length - 2} more</span>
                      </TooltipTrigger>
                      <TooltipContent className="p-3 bg-white border shadow-lg rounded-xl z-50">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Additional Specialties</p>
                          {specialties.slice(2).map((specialty: any, idx: number) => {
                            const label = typeof specialty === 'string' ? specialty : (specialty.label || specialty.name || specialty.value)
                            const safeLabel = String(label || "General")
                            const colorKey = safeLabel.toLowerCase().replace(/\s+/g, "")
                            const color = specialtyColors[colorKey] || "text-teal-600"
                            return (
                                <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                  <span className={`${color} mr-2 text-xs uppercase font-bold text-slate-600`}>
                                    {label}
                                  </span>
                                </div>
                            )
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            )}  
            <StatusBadge status={isActive ? "Available" : "Unavailable"} />
          </div>

          {/* Info Section */}
          <div className="px-5 py-2 flex-1">
            {doctor && (
              <h3 className="text-lg font-bold text-slate-900 leading-tight my-2">
                {fullName}
              </h3>
            )}

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {/* Mobile */}
              {mobile && (
                <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                  <Phone className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <div className="text-[13px] text-slate-600 leading-snug">
                    {countryCode ? `${countryCode} ` : ''}{mobile}
                  </div>
                </div>
              )}

              {/* Email */}
              {email && doctor && (
                <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                  <Mail className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <div className="text-[13px] text-slate-600 leading-snug break-all">{email}</div>
                </div>
              )}

              {/* Doctor-only fields: Gender, DOB, Experience */}
              {doctor && (
                <>
                  {gender && (
                    <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                      <User className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                      <div className="text-[13px] text-slate-600 leading-snug">{gender}</div>
                    </div>
                  )}
                  {dob && (
                    <div className="flex items-start gap-2 col-span-2 md:col-span-1">
                      <CalendarDays className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                      <div className="text-[13px] text-slate-600 leading-snug">{formatDate(dob)}</div>
                    </div>
                  )}
                  {experience && (
                    <div className="flex items-start gap-2">
                      <Clock className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                      <div className="text-[13px] text-slate-600 leading-snug">{experience}</div>
                    </div>
                  )}
                </>
              )}

              {/* Clinic-only field: Address */}
              {clinic && (
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="size-3.5 mt-0.5 shrink-0 text-slate-400" />
                  <div className="text-[13px] text-slate-600 leading-snug">
                    {[clinic.address?.street, clinic.address?.city, clinic.address?.state].filter(Boolean).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinics (for doctor card only) */}
          {doctor && doctorClinics.length > 0 && (
            <div className="px-5 py-3 flex flex-wrap gap-2">
              <TooltipProvider>
                {doctorClinics.slice(0, 2).map((c: any, idx: number) => {
                  const clinicName = typeof c === 'string' ? c : c.name
                  return (
                    <Badge key={idx} variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-secondary/10 bg-secondary/5 text-secondary font-medium gap-1.5 shadow-none">
                      <Hospital className="w-2.5 h-2.5 shrink-0" />
                      <span className="break-words">{clinicName}</span>
                    </Badge>
                  )
                })}
                {doctorClinics.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-primary/10 bg-primary/5 text-primary font-medium gap-1.5 shadow-none">
                        +{doctorClinics.length - 2} More
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 bg-white border shadow-lg rounded-xl z-50">
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Other Clinics</p>
                        {doctorClinics.slice(2).map((c: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                            <Hospital className="w-3 h-3 text-primary/60" />
                            <span className="text-xs font-medium text-slate-600">
                              {typeof c === 'string' ? c : c.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}

          {/* Specialties (for clinic card only) */}
          {clinic && specialties.length > 0 && (
            <div className="px-5 py-3 flex flex-wrap gap-2">
              <TooltipProvider>
                {specialties.slice(0, 3).map((specialty: any, idx: number) => {
                  const label = typeof specialty === 'string' ? specialty : (specialty.label || specialty.name || specialty.value)
                  return (
                    <Badge key={idx} variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-secondary/10 bg-secondary/5 text-secondary font-medium gap-1.5 shadow-none">
                      <span className="break-words">{label}</span>
                    </Badge>
                  )
                })}
                {specialties.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs h-auto py-1 px-2.5 rounded-full border-primary/10 bg-primary/5 text-primary font-medium gap-1.5 shadow-none">
                        +{specialties.length - 3} More
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 bg-white border shadow-lg rounded-xl z-50">
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Other Specialties</p>
                        {specialties.slice(3).map((specialty: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                            <Hospital className="w-3 h-3 text-primary/60" />
                            <span className="text-xs font-medium text-slate-600">
                              {typeof specialty === 'string' ? specialty : (specialty.label || specialty.name || specialty.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}

          {/* Action Button */}
          {isPatient && 
            <div className="px-5 pt-2 pb-4 flex justify-end">
              <button
                onClick={() => {
                  // Store ID in sessionStorage before navigation
                  if (doctor) {
                    sessionStorage.setItem('bookingDoctorId', id || '')
                    sessionStorage.removeItem('bookingClinicId')
                  } else {
                    sessionStorage.setItem('bookingClinicId', id || '')
                    sessionStorage.removeItem('bookingDoctorId')
                  }
                  // Navigate without query params
                  router.push('/book-appointment')
                }}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Calendar className="size-4" />
                Book Appointment
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

