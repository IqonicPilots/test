export type DashboardCard = {
  key: string
  label: string
  currentMonth: number
  previousMonth: number
  percentages: [number, number]
  growthPercentage: number
}

export type DashboardStatsResponse = {
  role: string
  cards: DashboardCard[]
  insights?: {
    growth?: {
      month: string
      totalPatients: number
      retentionRate: number
      averagePayAmount: number
    }[]
    totalPatients?: number
    retentionRate?: number
    averagePayAmount?: number
    demographics?: {
      age: string
      totalCustomer: number
      percentage: number
      growth: number
    }[]
    topClinics?: {
      clinicName: string
      totalCustomer: number
      revenue: number
      percentage: number
    }[]
  }
  salesPerformance?: SalesPerformancePoint[]
  services?: {
    serviceId: string
    serviceName?: string
    revenue?: number
  }[]
  recentTransactions?: {
    billId: string
    image?: string
    name?: string
    email?: string
    serviceName?: string
    billStatus: string
    grandTotal: number
    billedAt: string
  }[]
  topDoctors?: {
    doctorId: string
    doctorName?: string
    rating?: number
    totalAppointmentCount?: number
    revenue?: number
    growthPercentage?: number
  }[]
  topServices?: {
    serviceId: string
    serviceName?: string
    totalAppointmentCount?: number
    revenue?: number
    growthPercentage?: number
  }[]
  upcomingAppointments?: {
    appointmentId: string
    appointmentDate: string
    slot: string
    status: string
    /** Doctor photo (patient role) or patient photo (receptionist role) */
    image?: string
    patientName?: string
    patientEmail?: string
    clinicName?: string
    doctorName?: string
    serviceName?: string
    charge?: number
  }[]
}

export type SalesPerformancePoint = {
  month: string
  year: number
  monthNumber: number
  revenue: number
}

export type DashboardChartStatsResponse = {
  role: string
  chart: string
  months: number
  salesPerformance: SalesPerformancePoint[]
}
