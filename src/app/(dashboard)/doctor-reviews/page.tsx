"use client"

import * as React from "react"
import { useProfile } from "@/hooks/api/use-profile"
import { useDoctorReviews } from "@/hooks/api/use-reviews"
import {
  Star,
  Filter,
  ArrowUpDown,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { RoleGuard } from "@/components/role-guard"

export default function DoctorReviewsPage() {
  const { data: profile } = useProfile()
  const doctorId = profile?._id

  const [page, setPage] = React.useState(1)
  const [ratingFilter, setRatingFilter] = React.useState<string>("all")
  const [sortOrder, setSortOrder] = React.useState<string>("newest")

  // Translate UI sort value → API params
  const sortParams = React.useMemo(() => {
    if (sortOrder === "highest") return { sortBy: "rating", sortOrder: "desc" }
    if (sortOrder === "lowest") return { sortBy: "rating", sortOrder: "asc" }
    return { sortBy: "createdAt", sortOrder: "desc" } // newest
  }, [sortOrder])

  const { data, isLoading } = useDoctorReviews(doctorId, {
    page,
    perPage: 10,
    rating: ratingFilter,
    ...sortParams
  })
  const reviews = data?.reviews || []
  const analytics = data?.analytics
  const pagination = data?.pagination

  // Reset to page 1 when filters change
  const handleRatingChange = (val: string) => { setRatingFilter(val); setPage(1) }
  const handleSortChange = (val: string) => { setSortOrder(val); setPage(1) }

  // Formatting for Dynamic Stats
  const avgRating = analytics?.averageRating || 0
  const totalCount = analytics?.totalReviews || 0
  const starCounts = analytics?.ratingCounts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  return (
    <RoleGuard allowedRoles={["doctor"]} fallback="forbidden">
      <div className="flex flex-col gap-6 p-2 md:p-3 max-w-7xl w-full self-center animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Patient Reviews</h1>
            <p className="text-muted-foreground">Manage your professional reputation and patient journey feedback.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Summary Panel (Dynamic) */}
          <div className="w-full lg:w-[320px] space-y-5 sticky top-6">
            <Card className="shadow-sm border border-border/60 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="size-4 fill-[#FBBF24] text-[#FBBF24]" />
                  Overall Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="text-5xl font-bold text-foreground mb-1.5 leading-none">{avgRating}</div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`size-4 ${s <= Math.round(avgRating) ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 font-medium tracking-tight">
                  Based on {totalCount} reviews
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border/60 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = starCounts[rating] || 0;
                  const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-8 shrink-0">
                        <span className="text-xs font-bold">{rating}</span>
                        <Star className="size-3 fill-[#FBBF24] text-[#FBBF24]" />
                      </div>
                      <Progress value={percentage} className="h-1.5 flex-1 bg-muted rounded-full" />
                      <span className="text-[10px] text-muted-foreground w-6 text-right font-medium">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: Review List Content */}
          <div className="flex-1 space-y-4 w-full">
            <Card className="flex flex-col border-border/60">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-semibold">Reviews History</CardTitle>
                  <CardDescription className="text-xs">Recently received reviews.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={ratingFilter} onValueChange={handleRatingChange}>
                    <SelectTrigger className="w-[110px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="all">All Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="highest">Highest Rated</SelectItem>
                      <SelectItem value="lowest">Lowest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {isLoading && !reviews.length ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-11 rounded-xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full rounded-xl" />
                      </div>
                    ))
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review._id} className="p-4 md:p-6 transition-all hover:bg-muted/30">
                        <div className="flex items-start gap-4">
                          <Avatar className="size-11 rounded-xl ring-1 ring-border border-background shrink-0">
                            <AvatarImage src={review.patient.profilePicture} alt="" className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary rounded-xl">
                              {review.patient.firstName[0]}{review.patient.lastName[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-sm text-foreground">
                                  {review.patient.firstName} {review.patient.lastName}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-medium">
                                  <Calendar className="size-3" />
                                  {format(new Date(review.createdAt), "PPP")}
                                </div>
                              </div>
                              <div className="flex gap-0.5 bg-background p-1.5 rounded-lg border border-border/40">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`size-3 ${s <= review.rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-muted/20'}`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 bg-muted/40 p-4 rounded-xl border border-border/40 group-hover:bg-background transition-colors">
                              <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
                                "{review.reviewText || "Outstanding service and professional care throughout the session."}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-24 flex flex-col items-center justify-center text-center space-y-4">
                      <MessageSquare className="size-12 text-muted-foreground/20" />
                      <div className="max-w-[280px]">
                        <h3 className="text-lg font-semibold">No feedback found</h3>
                        <p className="text-sm text-muted-foreground">Adjust your filters to see historical reviews.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 border-t p-4">
                  <p className="text-sm text-muted-foreground mr-2">
                    Page {page} of {pagination.totalPages}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
