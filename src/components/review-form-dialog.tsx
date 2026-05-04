import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDoctorReviews, useCreateReview, useUpdateReview } from "@/hooks/api/use-reviews"
import { useProfile } from "@/hooks/api/use-profile"

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  reviewText: z.string().optional(),
})

export type ReviewFormValues = z.infer<typeof reviewSchema>

interface ReviewFormDialogProps {
  trigger?: React.ReactNode
  onSubmitReview?: (data: ReviewFormValues) => void | Promise<void>
  targetName?: string
  role?: string | null
  doctorId?: string
}

export function ReviewFormDialog({ trigger, onSubmitReview, targetName, role, doctorId }: ReviewFormDialogProps) {
  const [open, setOpen] = useState(false)

  const { data: profile } = useProfile()
  const { data: reviewsData, isLoading: isLoadingReviews } = useDoctorReviews(open ? doctorId : undefined)
  const reviewsList = reviewsData?.reviews || []
  const createMutation = useCreateReview()
  const updateMutation = useUpdateReview()

  const isAdminView = role === "admin" || role === "clinic_admin" || role === "receptionist"
  const myReview = profile ? reviewsList.find((r) => r.patient?._id === profile._id || (typeof r.patient === "string" && r.patient === profile._id)) : null

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      reviewText: "",
    },
  })

  // Watch open or reviewsList. If patient view and myReview exists, populate.
  useEffect(() => {
    if (open && !isAdminView) {
      if (myReview) {
        form.reset({ 
          rating: myReview.rating,
          reviewText: myReview.reviewText || ""
        })
      } else {
        form.reset({ rating: 0, reviewText: "" })
      }
    } else if (!open) {
      form.reset({ rating: 0, reviewText: "" })
    }
  }, [open, myReview, isAdminView, form])

  const rating = form.watch("rating")

  const handleSubmit = async (data: ReviewFormValues) => {
    if (onSubmitReview) {
      await onSubmitReview(data)
      setOpen(false)
      return
    }

    if (!doctorId) return

    if (myReview) {
      await updateMutation.mutateAsync({ id: myReview._id, doctor: doctorId, ...data })
    } else {
      await createMutation.mutateAsync({ doctor: doctorId, ...data })
    }
    setOpen(false)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <span
          onClick={() => setOpen(true)}
          style={{ display: "contents" }}
        >
          {trigger}
        </span>
      )}
      <DialogContent className={cn("sm:max-w-[425px]", isAdminView && "sm:max-w-[550px]")}>
        <DialogHeader>
          <DialogTitle>{isAdminView ? "Patient Reviews" : (myReview ? "Update Your Review" : "Leave a Review")}</DialogTitle>
          <DialogDescription>
            {isAdminView ? `Viewing reviews for ${targetName || "this doctor"}.` : (targetName ? `Share your experience with ${targetName}.` : "Share your experience.")}
          </DialogDescription>
        </DialogHeader>

        {isAdminView ? (
          <div className="flex flex-col gap-4 py-2">
            {isLoadingReviews ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : reviewsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border border-dashed rounded-lg">
                <Star className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground/80">No reviews yet for this doctor.</p>
                <p className="text-xs text-muted-foreground mt-1">Patients can leave reviews after their appointments.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-2 p-5 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center justify-center bg-yellow-100 dark:bg-yellow-500/20 rounded-full w-14 h-14 shadow-sm border border-yellow-200 dark:border-yellow-500/30">
                    <Star className="w-7 h-7 text-yellow-600 dark:text-yellow-400 fill-current drop-shadow-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-3xl tracking-tight text-foreground">
                      {(reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">Out of 5 ({reviewsList.length} reviews)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2 pr-2" style={{ maxHeight: "40vh", overflowY: "auto" }}>
                  {reviewsList.map((r) => (
                    <div key={r._id} className="flex flex-col gap-2 p-4 bg-muted/30 border rounded-lg hover:border-primary/20 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {r.patient?.firstName?.[0] || ""}{r.patient?.lastName?.[0] || ""}
                          </div>
                          <span className="text-sm font-semibold text-foreground/90">
                            {r.patient?.firstName} {r.patient?.lastName}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground bg-background px-2 py-0.5 border rounded-full">
                          {new Date(r.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 ml-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("w-3.5 h-3.5", r.rating >= star ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
                        ))}
                      </div>

                      <p className="text-sm mt-1.5 ml-10 text-foreground/80 leading-relaxed">{r.reviewText}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            <DialogFooter className="mt-4 sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 py-4">
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold">Overall Rating</label>
                <div className="flex items-center gap-1.5 p-3 rounded-lg bg-muted/20 border justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => form.setValue("rating", star, { shouldValidate: true })}
                      className={cn(
                        "cursor-pointer p-1.5 transition-all hover:scale-110 active:scale-95 focus:outline-none",
                        rating >= star ? "text-yellow-400 drop-shadow-sm" : "text-muted-foreground/20 hover:text-yellow-400/50"
                      )}
                    >
                      <Star className="w-10 h-10 md:w-12 md:h-12 fill-current transition-colors" />
                    </button>
                  ))}
                </div>
                {form.formState.errors.rating && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.rating.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-semibold">Your Review <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  {...form.register("reviewText")}
                  value={form.watch("reviewText")}
                  onChange={(e) => form.setValue("reviewText", e.target.value)}
                  placeholder="Tell others about your experience, the doctor's table manner, clinic environment..."
                  rows={4}
                  className={cn("resize-none bg-muted/20 transition-all focus:bg-background")}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {myReview ? "Updating..." : "Submitting..."}</>
                ) : (
                  myReview ? "Update Review" : "Submit Review"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
