"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUp, Building2, Calendar, Clock, UserCheck } from "lucide-react"
import { toast } from "sonner"

import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCreateDoctorSession,
  useDeleteDoctorSession,
  useDoctorSessions,
  useDoctorSessionsSummaryStats,
  useDoctorSessionsByDoctor,
  useUpdateDoctorSession,
} from "@/hooks/api/use-doctor-sessions"
import { useInfiniteClinics } from "@/hooks/api/use-clinics"
import { useInfiniteDoctors } from "@/hooks/api/use-doctors"
import type { Clinic } from "@/types/clinic.types"
import type { Doctor } from "@/types/doctor.types"
import type {
  DoctorSessionClinicRef,
  DoctorSessionDoctorRef,
  DoctorSessionPayload,
  DoctorSessionSchedule,
} from "@/types/doctor-session.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./components/data-table"
import { getColumns, type DoctorSessionTableRow } from "./components/columns"
import {
  DoctorSessionFormDialog,
  type DoctorSessionFormValues,
} from "./components/doctor-session-form-dialog"

function getReferenceId(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null) {
    const candidate = value as { _id?: unknown; id?: unknown; doctorId?: unknown; clinicId?: unknown }
    const maybeId = candidate._id ?? candidate.id ?? candidate.doctorId ?? candidate.clinicId
    return typeof maybeId === "string" ? maybeId : ""
  }
  return ""
}

function getDoctorName(value: string | DoctorSessionDoctorRef | undefined, doctorMap: Map<string, Doctor>) {
  if (!value) return "Unknown doctor"
  if (typeof value === "object") {
    const firstName = value.firstName?.trim() ?? ""
    const lastName = value.lastName?.trim() ?? ""
    const fullName = `${firstName} ${lastName}`.trim()
    if (fullName) return fullName
    if (value.name?.trim()) return value.name.trim()
  }
  const doctor = doctorMap.get(getReferenceId(value))
  if (!doctor) return "Unknown doctor"
  return `${doctor.firstName} ${doctor.lastName}`.trim()
}

function getDoctorEmail(value: string | DoctorSessionDoctorRef | undefined, doctorMap: Map<string, Doctor>) {
  if (value && typeof value === "object" && value.email?.trim()) return value.email.trim()
  return doctorMap.get(getReferenceId(value))?.email ?? "N/A"
}

function getDoctorAvatar(value: string | DoctorSessionDoctorRef | undefined, doctorMap: Map<string, Doctor>) {
  if (value && typeof value === "object") {
    const avatar = value.meta?.profilePicture ?? value.meta?.avatar
    if (avatar) return avatar
  }
  const doctor = doctorMap.get(getReferenceId(value))
  return doctor?.meta?.profilePicture ?? doctor?.meta?.avatar
}

function getClinicAvatarUrl(value: string | DoctorSessionClinicRef | undefined, clinicMap: Map<string, Clinic>) {
  if (value && typeof value === "object") {
    const avatar = (value as any).cliniclogo
    if (avatar) return avatar
  }
  const clinic = clinicMap.get(getReferenceId(value))
  return clinic?.cliniclogo
}

function getClinicName(value: string | DoctorSessionClinicRef | undefined, clinicMap: Map<string, Clinic>) {
  if (value && typeof value === "object" && value.name?.trim()) return value.name.trim()
  return clinicMap.get(getReferenceId(value))?.name ?? "Unknown clinic"
}

function getClinicEmail(value: string | DoctorSessionClinicRef | undefined, clinicMap: Map<string, Clinic>) {
  if (value && typeof value === "object" && value.email?.trim()) return value.email.trim()
  return clinicMap.get(getReferenceId(value))?.email ?? "N/A"
}

function getInitials(label: string) {
  const parts = label.split(" ").filter(Boolean)
  if (parts.length === 0) return "NA"
  return parts.slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase()
}

function buildDoctorSessionPayload(sessions: DoctorSessionSchedule[]): DoctorSessionPayload {
  return {
    sessions: sessions.map((session) => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      breaks: session.breaks
        .filter((item) => item.start && item.end)
        .map((item) => ({ start: item.start, end: item.end })),
    })),
  }
}

type DialogMode = "add" | "edit" | null
type SelectedDoctorSession = { doctorId: string; clinicId: string }

import { usePermissions } from "@/hooks/use-permissions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { RoleGuard } from "@/components/role-guard"

import { useProfile } from "@/hooks/api/use-profile"

function DoctorSessionsContent() {
  const { can, isLoading: isPermissionsLoading } = usePermissions()
  const { data: profile } = useProfile()
  const role = profile?.role

  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"
  const isReceptionist = role === "receptionist"

  const searchParams = useSearchParams()
  const initialDoctorId = searchParams.get("doctorId") || ""

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [clinicFilter, setClinicFilter] = useState("")
  const [doctorFilter, setDoctorFilter] = useState(initialDoctorId)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [clinicSearch, setClinicSearch] = useState("")
  const [debouncedClinicSearch, setDebouncedClinicSearch] = useState("")

  const [doctorSearch, setDoctorSearch] = useState("")
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState("")

  useEffect(() => {
    if (initialDoctorId && doctorFilter !== initialDoctorId) {
      setDoctorFilter(initialDoctorId)
    }
  }, [initialDoctorId])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClinicSearch(clinicSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [clinicSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDoctorSearch(doctorSearch.trim()), 350)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  const assignedClinicIds = useMemo(() => {
    if (!profile?.meta?.clinics) return [] as string[]
    return profile.meta.clinics
      .map((clinic): string => {
        if (typeof clinic === "string") return clinic
        return clinic?._id ?? ""
      })
      .filter(Boolean)
  }, [profile])

  const assignedClinics = useMemo<Clinic[]>(() => {
    if (!profile?.meta?.clinics) return []
    return profile.meta.clinics
      .map((clinic) => {
        if (typeof clinic === "string") return null
        return {
          _id: clinic._id,
          name: clinic.name || "",
          email: clinic.email || "",
        } as Clinic
      })
      .filter((c): c is Clinic => !!c)
  }, [profile])

  const apiClinicId =
    (isClinicAdmin || isReceptionist || isDoctor) && assignedClinicIds.length
      ? clinicFilter || undefined // Can filter by one of their clinics or see all
      : clinicFilter || undefined

  const apiDoctorId = isDoctor ? profile?._id : (doctorFilter || undefined)

  const statsScopeFilters = useMemo(
    () => ({
      clinicId:
        (isClinicAdmin || isReceptionist) && assignedClinicIds.length
          ? assignedClinicIds[0]
          : undefined,
      doctorId: isDoctor ? profile?._id : undefined,
    }),
    [isClinicAdmin, isReceptionist, assignedClinicIds, isDoctor, profile?._id]
  )

  const { data: statsSummaryResponse, isLoading: isStatsLoading } = useDoctorSessionsSummaryStats(
    statsScopeFilters,
    { enabled: !isDoctor || !!profile?._id }
  )

  const {
    data: response,
    isLoading,
    error
  } = useDoctorSessions(page, perPage, {
    clinicId: clinicFilter || (assignedClinicIds.length && (isClinicAdmin || isReceptionist) ? assignedClinicIds[0] : undefined),
    doctorId: apiDoctorId,
    search: debouncedSearch || undefined,
  })

  const {
    data: clinicsInfiniteData,
    fetchNextPage: fetchNextClinicsPage,
    hasNextPage: hasNextClinicsPage,
    isFetchingNextPage: isFetchingNextClinicsPage,
    isLoading: isClinicsLoading,
  } = useInfiniteClinics(10, { search: debouncedClinicSearch }, !isDoctor && !isClinicAdmin && !isReceptionist)

  const {
    data: doctorsInfiniteData,
    fetchNextPage: fetchNextDoctorsPage,
    hasNextPage: hasNextDoctorsPage,
    isFetchingNextPage: isFetchingNextDoctorsPage,
    isLoading: isDoctorsLoading,
  } = useInfiniteDoctors(10, {
    search: debouncedDoctorSearch,
    clinicId: clinicFilter || (assignedClinicIds.length && (isClinicAdmin || isReceptionist) ? assignedClinicIds[0] : undefined),
    status: "active",
  }, !isDoctor)

  const rawSessions = useMemo(() => {
    if (!response) return []
    return response.data || []
  }, [response])

  const clinics = useMemo<Clinic[]>(() => {
    if (isDoctor || isClinicAdmin || isReceptionist) return assignedClinics
    if (!clinicsInfiniteData) return []
    return clinicsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [clinicsInfiniteData, assignedClinics, isDoctor, isClinicAdmin, isReceptionist])

  const doctors = useMemo<Doctor[]>(() => {
    if (isDoctor && profile) return [{ _id: profile._id, firstName: profile.firstName, lastName: profile.lastName }] as Doctor[]
    if (!doctorsInfiniteData) return []
    return doctorsInfiniteData.pages.flatMap((page: any) => page.data || [])
  }, [doctorsInfiniteData, isDoctor, profile])

  const pagination = useMemo(() => {
    if (!response) return null
    return response.pagination || null
  }, [response])

  const createDoctorSessionMutation = useCreateDoctorSession()
  const updateDoctorSessionMutation = useUpdateDoctorSession()
  const deleteDoctorSessionMutation = useDeleteDoctorSession()

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedSession, setSelectedSession] = useState<SelectedDoctorSession | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<DoctorSessionTableRow | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: doctorSessionsByDoctorResponse, isLoading: isLoadingDoctorSession } =
    useDoctorSessionsByDoctor(dialogMode === "edit" ? selectedSession?.doctorId ?? "" : "", 1, 10)

  const doctorSessionsByDoctor = useMemo(() => {
    if (!doctorSessionsByDoctorResponse) return []
    if (Array.isArray(doctorSessionsByDoctorResponse.data)) return doctorSessionsByDoctorResponse.data
    return (doctorSessionsByDoctorResponse as any).data?.data || []
  }, [doctorSessionsByDoctorResponse])

  const doctorMap = useMemo(() => new Map<string, Doctor>(doctors.map((doctor: any) => [doctor._id, doctor])), [doctors])
  const clinicMap = useMemo(() => new Map<string, Clinic>(clinics.map((clinic: any) => [clinic._id, clinic])), [clinics])

  const selectedSessionData = useMemo(() => {
    if (!selectedSession) return null
    const matchedSession =
      doctorSessionsByDoctor.find((session: any) => {
        const sessionClinicId = getReferenceId(session.clinicId) || getReferenceId(session.clinic)
        return sessionClinicId === selectedSession.clinicId
      }) ??
      rawSessions.find((session: any) => {
        const sessionDoctorId = getReferenceId(session.doctorId) || getReferenceId(session.doctor)
        const sessionClinicId = getReferenceId(session.clinicId) || getReferenceId(session.clinic)
        return sessionDoctorId === selectedSession.doctorId && sessionClinicId === selectedSession.clinicId
      }) ??
      null

    if (!matchedSession) return null
    return {
      ...matchedSession,
      clinicId: getReferenceId(matchedSession.clinicId) || getReferenceId(matchedSession.clinic) || selectedSession.clinicId,
      doctorId: getReferenceId(matchedSession.doctorId) || getReferenceId(matchedSession.doctor) || selectedSession.doctorId,
    }
  }, [doctorSessionsByDoctor, selectedSession, rawSessions])

  const sessionRows: DoctorSessionTableRow[] = useMemo(
    () =>
      rawSessions.map((session: any, index: number) => {
        const doctorRef = session.doctor ?? session.doctorId
        const clinicRef = session.clinic ?? session.clinicId
        const doctorId = getReferenceId(session.doctorId) || getReferenceId(session.doctor)
        const clinicId = getReferenceId(session.clinicId) || getReferenceId(session.clinic)
        const doctorName = getDoctorName(doctorRef, doctorMap)
        const clinicName = getClinicName(clinicRef, clinicMap)
        const activeSessions = (session.sessions ?? []).filter((item: any) => item.isActive ?? true)

        return {
          id: session._id ?? `${doctorId || "doctor"}-${clinicId || "clinic"}-${index}`,
          doctorId,
          clinicId,
          doctorName,
          doctorEmail: getDoctorEmail(doctorRef, doctorMap),
          doctorAvatar: getInitials(doctorName),
          doctorAvatarUrl: getDoctorAvatar(doctorRef, doctorMap),
          clinicName,
          clinicEmail: getClinicEmail(clinicRef, clinicMap),
          clinicAvatar: getInitials(clinicName),
          clinicAvatarUrl: getClinicAvatarUrl(clinicRef, clinicMap),
          activeDays: activeSessions.map((item: any) => item.id),
        }
      }),
    [clinicMap, doctorMap, rawSessions]
  )

  function openDialog(mode: Exclude<DialogMode, null>, session?: DoctorSessionTableRow) {
    setDialogMode(mode)
    if (mode === "edit" && session) {
      setSelectedSession({ doctorId: session.doctorId, clinicId: session.clinicId })
      return
    }
    setSelectedSession(null)
  }

  function closeDialog() {
    setDialogMode(null)
    setSelectedSession(null)
  }

  function handleAddSession(values: DoctorSessionFormValues) {
    if (!values.clinicId || !values.doctorId) {
      toast.error("Clinic and doctor are required to create the doctor session.")
      return
    }
    createDoctorSessionMutation.mutate(
      { clinicId: values.clinicId, doctorId: values.doctorId, data: buildDoctorSessionPayload(values.sessions) },
      { onSuccess: () => closeDialog() }
    )
  }

  function handleEditSession(values: DoctorSessionFormValues) {
    const clinicId = values.clinicId || selectedSession?.clinicId || ""
    const doctorId = values.doctorId || selectedSession?.doctorId || ""
    if (!clinicId || !doctorId) {
      toast.error("Clinic and doctor are required to update the doctor session.")
      return
    }
    updateDoctorSessionMutation.mutate(
      { clinicId, doctorId, data: buildDoctorSessionPayload(values.sessions) },
      { onSuccess: () => closeDialog() }
    )
  }

  function handleDeleteSession() {
    if (!sessionToDelete) return
    deleteDoctorSessionMutation.mutate(sessionToDelete.id, {
      onSuccess: () => {
        setIsConfirmOpen(false)
        setSessionToDelete(null)
      },
    })
  }

  const isBusy = createDoctorSessionMutation.isPending || updateDoctorSessionMutation.isPending || deleteDoctorSessionMutation.isPending
  const columns = useMemo(() => getColumns({
    onEditSession: (session) => openDialog("edit", session),
    onDeleteSession: (session) => {
      setSessionToDelete(session)
      setIsConfirmOpen(true)
    },
    isBusy,
    can,
    role
  }), [isBusy, can, role])

  const stats = useMemo(() => {
    if (!statsSummaryResponse?.stats) {
      return {
        total: 0,
        uniqueDoctors: 0,
        uniqueClinics: 0,
        activeDays: 0,
        doctorsPct: 0,
        clinicsPct: 0,
        activeDaysPct: 0,
      }
    }
    const s = statsSummaryResponse.stats as {
      total: number
      uniqueDoctors?: number
      uniqueClinics?: number
      activeDaysCount?: number
    }
    const total = s.total
    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)
    const uniqueDoctors = s.uniqueDoctors ?? 0
    const uniqueClinics = s.uniqueClinics ?? 0
    const activeDays = s.activeDaysCount ?? 0
    /** Each doctor–clinic session row can schedule at most one entry per weekday (7 max). */
    const maxActiveDaySlots = total * 7
    const activeDaysPct =
      maxActiveDaySlots > 0
        ? Math.min(100, Math.round((activeDays / maxActiveDaySlots) * 100))
        : 0
    return {
      total,
      uniqueDoctors,
      uniqueClinics,
      activeDays,
      doctorsPct: getPct(uniqueDoctors),
      clinicsPct: getPct(uniqueClinics),
      activeDaysPct,
    }
  }, [statsSummaryResponse?.stats])

  return (
    <RoleGuard permission="doctor_session_access" fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">{isDoctor ? "Sessions" : "Doctor Sessions"}</h1>
        <p className="text-muted-foreground">
          {isDoctor
            ? "Manage your availability and session schedules."
            : isClinicAdmin || isReceptionist
              ? "Configure and manage doctor availability and session schedules for your clinic."
              : "Configure and manage all doctor availability and session schedules."}
        </p>
      </div>
      <div className="flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Sessions</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.total}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />100%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><Calendar className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Doctors</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.uniqueDoctors}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.doctorsPct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><UserCheck className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Clinics</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.uniqueClinics}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.clinicsPct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><Building2 className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Days</p>
                  {isStatsLoading ? <StatValueSkeleton /> : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{stats.activeDays}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500"><ArrowUp className="size-3.5" />{stats.activeDaysPct}%</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3"><Clock className="size-6 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{isDoctor ? "My Sessions" : "All Doctor Sessions"}</CardTitle>
            <CardDescription>{isDoctor ? "View, filter, and manage your doctor session schedules" : "View, filter, and manage all doctor session schedules"}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={sessionRows}
              columns={columns}
              onAddSession={can("clinic_sessions_add") ? () => openDialog("add") : undefined}
              isLoading={isLoading && !rawSessions.length}
              clinicFilter={clinicFilter}
              onClinicFilterChange={setClinicFilter}
              doctorFilter={doctorFilter}
              onDoctorFilterChange={setDoctorFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onResetFilters={() => {
                setClinicFilter("")
                setDoctorFilter("")
                setSearchQuery("")
                setDebouncedSearch("")
                setClinicSearch("")
                setDoctorSearch("")
              }}
              pageCount={pagination?.totalPages || 0}
              pageIndex={page - 1}
              pageSize={perPage}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => setPerPage(s)}
              clinicOptions={clinics}
              doctorOptions={doctors}
              onClinicsLoadMore={fetchNextClinicsPage}
              onClinicsSearchChange={setClinicSearch}
              hasNextClinicsPage={hasNextClinicsPage}
              isFetchingNextClinicsPage={isFetchingNextClinicsPage}
              onDoctorsLoadMore={fetchNextDoctorsPage}
              onDoctorsSearchChange={setDoctorSearch}
              hasNextDoctorsPage={hasNextDoctorsPage}
              isFetchingNextDoctorsPage={isFetchingNextDoctorsPage}
              isClinicsLoading={isClinicsLoading}
              isDoctorsLoading={isDoctorsLoading}
              role={role}
            />
          </CardContent>
        </Card>
      </div>

      {dialogMode ? (
        <DoctorSessionFormDialog
          open={Boolean(dialogMode)}
          onOpenChange={(isOpen) => { if (!isOpen) closeDialog() }}
          mode={dialogMode}
          clinics={clinics}
          sessionData={dialogMode === "edit" ? selectedSessionData : undefined}
          fallbackClinicId={selectedSession?.clinicId}
          fallbackDoctorId={selectedSession?.doctorId}
          onAddSession={handleAddSession}
          onEditSession={handleEditSession}
          isSubmitting={isBusy}
          isLoadingSession={dialogMode === "edit" && isLoadingDoctorSession && !selectedSessionData}
        />
      ) : null}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDeleteSession}
        isLoading={deleteDoctorSessionMutation.isPending}
        title="Delete Doctor Session?"
        description={`This will permanently remove the session schedule for ${sessionToDelete?.doctorName} at ${sessionToDelete?.clinicName}.`}
      />
    </RoleGuard>
  )
}

export default function DoctorSessionsPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center">Loading sessions...</div>}>
      <DoctorSessionsContent />
    </Suspense>
  )
}
