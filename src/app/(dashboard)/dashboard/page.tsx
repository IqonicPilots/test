"use client"

import { MetricsOverview } from "./components/metrics-overview"
import { SalesChart } from "./components/sales-chart"
import { RecentTransactions } from "./components/recent-transactions"
import { TopProducts } from "./components/top-products"
import { CustomerInsights } from "./components/customer-insights"
import { RevenueBreakdown } from "./components/revenue-breakdown"
import { PatientUpcomingAppointments } from "./components/patient-upcoming-appointments"
import { usePermissions } from "@/hooks/use-permissions"
import { RoleGuard } from "@/components/role-guard"

export default function Dashboard2() {
  const { role, can } = usePermissions()
  const isPatient = role === "patient"
  const isReceptionist = role === "receptionist"
  const isDoctor = role === "doctor"
  const isClinicAdmin = role === "clinic_admin"

  const canSeeRevenue = can("dashboard_total_revenue")
  const canSeePatients = can("dashboard_total_patient")
  const canSeeAppointments = can("dashboard_total_appointment")

  return (
    <RoleGuard permission="dashboard_access" fallback="forbidden">
      <div className="flex-1 space-y-6 px-4 md:px-6 pt-0">
        {/* Enhanced Header */}

        <div className="flex md:flex-row flex-col md:items-center justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {isPatient ? "Patient Dashboard" : isDoctor ? "Doctor Dashboard" : (isClinicAdmin || isReceptionist) ? "Clinic Dashboard" : "Business Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {isPatient
                ? "View your upcoming appointments, medical history, and quick insights."
                : isDoctor
                  ? "Monitor your practice performance, patient appointments, and daily stats."
                  : isClinicAdmin || isReceptionist
                    ? "Monitor clinic performance, appointments, and patient flow in real-time."
                    : "Monitor overall platform performance and key metrics in real-time."}
            </p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="@container/main space-y-6">
          {/* Top Row - Key Metrics */}

          <MetricsOverview />

          {/* Second Row - Charts in 6-6 columns */}
          {!isPatient && (canSeeRevenue || canSeeAppointments) ? (
            <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
              {isReceptionist ? <PatientUpcomingAppointments /> : (canSeeRevenue ? <SalesChart /> : <PatientUpcomingAppointments />)}
              {canSeeRevenue ? <RevenueBreakdown /> : null}
            </div>
          ) : null}

          {/* Third Row - Two Column Layout */}
          <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
            <RecentTransactions />
            {isPatient ? <PatientUpcomingAppointments /> : (canSeePatients ? <TopProducts /> : null)}
          </div>

          {/* Fourth Row - Customer Insights and Team Performance */}
          {!isPatient && canSeePatients ? <CustomerInsights /> : null}
        </div>
      </div>
    </RoleGuard>
  )
}
