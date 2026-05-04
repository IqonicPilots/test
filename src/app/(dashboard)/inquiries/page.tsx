"use client"

import { useCallback, useMemo, useState } from "react"
import { ArrowUp, Mail, MessageSquare } from "lucide-react"

import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatValueSkeleton } from "@/components/dashboard-page-skeleton"
import { getApiErrorMessage } from "@/lib/api/axios"
import { useDeleteInquiry, useInquiries } from "@/hooks/api/use-inquiries"
import { DataTable } from "./components/data-table"
import { getColumns } from "./components/columns"
import type { InquiryRecord } from "@/types/inquiry.types"

export default function InquiriesPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data: response, isLoading, error } = useInquiries({ page, perPage })
  const deleteInquiryMutation = useDeleteInquiry()

  const inquiries = useMemo(() => response?.data ?? [], [response])
  const pagination = response?.pagination
  const stats = response?.stats
  const fallbackInquiryCount = useMemo(
    () => inquiries.filter((item) => item.type === "inquiry").length,
    [inquiries]
  )
  const fallbackNewsletterCount = useMemo(
    () => inquiries.filter((item) => item.type === "newsletter").length,
    [inquiries]
  )
  const handleDeleteInquiry = useCallback(async (record: InquiryRecord) => {
    await deleteInquiryMutation.mutateAsync({
      id: record.id,
      type: record.type,
    })
  }, [deleteInquiryMutation])

  const columns = useMemo(
    () =>
      getColumns({
        onDeleteInquiry: handleDeleteInquiry,
        isDeleting: deleteInquiryMutation.isPending,
      }),
    [deleteInquiryMutation.isPending, handleDeleteInquiry]
  )
  const inquiryStats = useMemo(() => {
    const total = stats?.total ?? pagination?.total ?? inquiries.length
    const inquiry = stats?.totalInquiries ?? stats?.inquiry ?? fallbackInquiryCount
    const newsletter = stats?.totalNewsletters ?? stats?.newsletter ?? fallbackNewsletterCount
    const getPct = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0)

    return {
      inquiry,
      newsletter,
      inquiryPct: getPct(inquiry),
      newsletterPct: getPct(newsletter),
    }
  }, [fallbackInquiryCount, fallbackNewsletterCount, inquiries.length, pagination?.total, stats])

  return (
    <RoleGuard allowedRoles={["admin"]} fallback="forbidden">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Inquiries</h1>
        <p className="text-muted-foreground">Track and manage incoming content and support inquiries.</p>
      </div>

      <div className="mt-4 flex h-full min-w-0 w-full flex-1 flex-col space-y-6 px-4 md:px-6">
        <div className="grid w-full min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Inquiries</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{inquiryStats.inquiry}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {inquiryStats.inquiryPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <MessageSquare className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Newsletter</p>
                  {isLoading ? (
                    <StatValueSkeleton />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{inquiryStats.newsletter}</span>
                      <span className="flex items-center gap-0.5 text-sm text-green-500">
                        <ArrowUp className="size-3.5" />
                        {inquiryStats.newsletterPct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 rounded-lg p-3">
                  <Mail className="size-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Inquiries</CardTitle>
            <CardDescription>View and manage all received inquiries in one place</CardDescription>
            {error ? (
              <p className="text-sm text-destructive pt-1">
                {getApiErrorMessage(error)}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <DataTable
              data={inquiries}
              columns={columns}
              isLoading={(isLoading || deleteInquiryMutation.isPending) && !inquiries.length}
              pageCount={pagination?.totalPages || 1}
              pageIndex={Math.max(0, (pagination?.page || page) - 1)}
              pageSize={pagination?.perPage || perPage}
              onPaginationChange={(pageIndex, pageSize) => {
                setPage(pageIndex + 1)
                setPerPage(pageSize)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
