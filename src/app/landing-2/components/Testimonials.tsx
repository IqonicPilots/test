"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Quote, Star } from "lucide-react"

const BLUE = "#2563eb"
const INK = "#1A1C1E"
const MUTED = "#6B7280"
const CARD_BG = "#F4F7FF"

const AUTOPLAY_MS = 4500
const RESUME_AFTER_MS = 9000
/** Must match horizontal `gap-*` on the scroller (`gap-6` = 24px). */
const GAP_PX = 24
/** Mobile: card width as fraction of track so the next card peeks (carousel affordance). */
const MOBILE_CARD_WIDTH_RATIO = 0.88
const MOBILE_CARD_MIN_PX = 240
const MOBILE_TRACK_SLACK_PX = 20
/** Autoplay uses a longer ease so each advance feels fluid, not rushed. */
const AUTOPLAY_SCROLL_MS = 1320
const DOT_SCROLL_MS = 700
const DRAG_SNAP_MS = 520
const WHEEL_CARD_SCROLL_MS = 340
const WHEEL_TRIGGER_PX = 26
const USER_SNAP_MS = 360
const USER_SNAP_IDLE_MS = 140

function maxScrollLeft(el: HTMLElement) {
  return Math.max(0, el.scrollWidth - el.clientWidth)
}

/** For dots / drag snap — responsive, slightly snappier. */
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

/** C² at 0/1 — very gentle acceleration (good for long autoplay glides). */
function smootherstep(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function animateScrollLeft(
  el: HTMLElement,
  to: number,
  durationMs: number,
  ease: (t: number) => number = easeInOutQuint
): { promise: Promise<void>; cancel: () => void } {
  let raf = 0
  let cancelled = false
  const from = el.scrollLeft
  const max = maxScrollLeft(el)
  const target = Math.min(max, Math.max(0, to))
  const delta = target - from

  const promise = new Promise<void>((resolve) => {
    if (Math.abs(delta) < 0.5 || durationMs <= 0) {
      el.scrollLeft = target
      resolve()
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      if (cancelled) {
        resolve()
        return
      }
      const u = Math.min(1, (now - t0) / durationMs)
      const x = from + delta * ease(u)
      el.scrollLeft = Number.isFinite(x) ? x : target
      if (u < 1) {
        raf = requestAnimationFrame(step)
      } else {
        el.scrollLeft = target
        resolve()
      }
    }
    raf = requestAnimationFrame(step)
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      cancelAnimationFrame(raf)
    },
  }
}

type Review = {
  name: string
  text: string
  avatar: "photo" | "initial"
  initial?: string
  avatarBg?: string
  img?: string
}

const reviews: Review[] = [
  {
    name: "Bhanderi Vaidik",
    text: "Toothmate is the best dental clinic in Surat. The doctor is very professional and the treatment was painless. Highly recommended!",
    avatar: "initial",
    initial: "B",
    avatarBg: "#7c3aed",
  },
  {
    name: "Rahul Sharma",
    text: "Excellent service and state-of-the-art facilities. The staff was very courteous and made me feel at ease throughout my treatment.",
    avatar: "initial",
    initial: "P",
    avatarBg: "#ea580c",
  },
  {
    name: "Priya Patel",
    text: "I visited for teeth whitening and the results are amazing. Very transparent pricing and expert care. Best clinic in the city.",
    avatar: "photo",
    img: "/landing-2/wp-content/uploads/2025/09/author-3.jpg",
  },
  {
    name: "Meera Shah",
    text: "From booking to follow-up, everything was smooth. The clinic is spotless and the team genuinely cares about your comfort.",
    avatar: "photo",
    img: "/landing-2/wp-content/uploads/2025/09/author-1.jpg",
  },
  {
    name: "Rahul Sharma2",
    text: "Excellent service and state-of-the-art facilities. The staff was very courteous and made me feel at ease throughout my treatment.",
    avatar: "initial",
    initial: "P",
    avatarBg: "#ea580c",
  },
  {
    name: "Priya Patel2",
    text: "I visited for teeth whitening and the results are amazing. Very transparent pricing and expert care. Best clinic in the city.",
    avatar: "photo",
    img: "/landing-2/wp-content/uploads/2025/09/author-3.jpg",
  }
]

function StarRow() {
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="size-5 shrink-0 fill-[#2563eb] text-[#2563eb] md:size-[1.35rem]" />
      ))}
    </div>
  )
}

function Avatar({ review }: { review: Review }) {
  if (review.avatar === "photo" && review.img) {
    return (
      <img
        src={review.img}
        alt=""
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white md:size-14"
      />
    )
  }
  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ring-2 ring-white md:size-14 md:text-lg"
      style={{ backgroundColor: review.avatarBg ?? BLUE }}
      aria-hidden
    >
      {review.initial}
    </div>
  )
}

function ReviewCard({
  review,
  cardWidth,
}: {
  review: Review
  cardWidth: number
}) {
  return (
    <article
      className="flex min-h-[360px] shrink-0 flex-col rounded-2xl border border-slate-100/80 p-5 shadow-sm sm:min-h-[400px] sm:p-8 md:min-h-[440px] md:p-9"
      style={{
        backgroundColor: CARD_BG,
        width: cardWidth,
        minWidth: cardWidth,
      }}
    >
      <StarRow />
      <p
        className="mt-5 min-h-[7.25rem] flex-1 text-left text-[15px] leading-relaxed sm:mt-6 sm:min-h-[9.25rem] sm:text-base md:mt-7 md:min-h-[10rem] md:text-[17px] md:leading-relaxed"
        style={{ color: MUTED }}
      >
        {review.text}
      </p>
      <div className="my-6 h-px w-full bg-slate-200/90 md:my-7" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Avatar review={review} />
          <div className="min-w-0 text-left">
            <p className="truncate text-base font-bold md:text-[17px]" style={{ color: INK }}>
              {review.name}
            </p>
            <p className="text-sm font-medium text-slate-500 md:text-[15px]">Dental patient</p>
          </div>
        </div>
        <Quote className="size-9 shrink-0 text-[#2563eb] md:size-10" strokeWidth={2} aria-hidden />
      </div>
    </article>
  )
}

function scrollStepPx(cardWidth: number) {
  return cardWidth + GAP_PX
}

/** Horizontal scroll position so card `index` is centered in the viewport (clamped). */
function scrollLeftToCenterCard(
  el: HTMLElement,
  index: number,
  cardWidth: number,
  totalCards: number
) {
  const step = scrollStepPx(cardWidth)
  if (step <= 0 || totalCards <= 0) return 0
  const clampedIndex = Math.min(totalCards - 1, Math.max(0, index))
  const raw = clampedIndex * step + cardWidth / 2 - el.clientWidth / 2
  const max = maxScrollLeft(el)
  return Math.min(max, Math.max(0, raw))
}

/** Index of the card whose center is closest to the viewport center. */
function indexFromScroll(el: HTMLElement, cardWidth: number, totalCards: number) {
  const step = scrollStepPx(cardWidth)
  if (step <= 0 || totalCards <= 0) return 0
  const center = el.scrollLeft + el.clientWidth / 2
  const idx = Math.round((center - cardWidth / 2) / step)
  return Math.min(totalCards - 1, Math.max(0, idx))
}

function nearestCenteredScrollLeft(el: HTMLElement, cardWidth: number, totalCards: number) {
  return scrollLeftToCenterCard(el, indexFromScroll(el, cardWidth, totalCards), cardWidth, totalCards)
}

export function Testimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(320)
  const [activeSlide, setActiveSlide] = useState(0)
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, pointerId: -1 })
  const pauseUntilRef = useRef(0)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimerRef = useRef<number | null>(null)
  const autoplayAnimCancelRef = useRef<(() => void) | null>(null)
  const wheelAnimCancelRef = useRef<(() => void) | null>(null)
  const userSnapTimerRef = useRef<number | null>(null)
  const userSnapAnimCancelRef = useRef<(() => void) | null>(null)
  const wheelAccumRef = useRef(0)
  const wheelStepLockRef = useRef(false)
  /** While true, ignore scroll events for dot index (avoids React re-renders every frame during rAF scroll). */
  const suppressScrollIndexSyncRef = useRef(false)

  const clearAutoplayScheduled = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      clearTimeout(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
    if (autoplayAnimCancelRef.current) {
      autoplayAnimCancelRef.current()
      autoplayAnimCancelRef.current = null
    }
  }, [])

  const measureCards = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const inner = el.clientWidth
    if (inner < 768) {
      const maxAllowed = inner - MOBILE_TRACK_SLACK_PX
      const fromRatio = Math.floor(inner * MOBILE_CARD_WIDTH_RATIO)
      const target = Math.min(fromRatio, maxAllowed)
      const minClamped = Math.min(MOBILE_CARD_MIN_PX, maxAllowed)
      setCardWidth(Math.max(minClamped, target))
    } else {
      const w = Math.floor((inner - GAP_PX * 2) / 3)
      setCardWidth(Math.max(260, w))
    }
  }, [])

  useLayoutEffect(() => {
    measureCards()
  }, [measureCards]) 

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => measureCards())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measureCards])

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = maxScrollLeft(el)
    if (max <= 0) {
      setActiveSlide(0)
      return
    }
    setActiveSlide(indexFromScroll(el, cardWidth, reviews.length))
  }, [cardWidth])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      if (suppressScrollIndexSyncRef.current) return
      syncActiveFromScroll()
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [syncActiveFromScroll])

  useEffect(() => {
    const t = requestAnimationFrame(() => syncActiveFromScroll())
    return () => cancelAnimationFrame(t)
  }, [cardWidth, syncActiveFromScroll])

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    },
    []
  )

  const markUserInteraction = useCallback(() => {
    if (autoplayAnimCancelRef.current) {
      autoplayAnimCancelRef.current()
      autoplayAnimCancelRef.current = null
    }
    pauseUntilRef.current = Date.now() + RESUME_AFTER_MS
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      pauseUntilRef.current = 0
    }, RESUME_AFTER_MS)
  }, [])

  useEffect(() => {
    let cancelled = false

    const scheduleAfter = (ms: number, fn: () => void) => {
      autoplayTimerRef.current = window.setTimeout(() => {
        autoplayTimerRef.current = null
        if (!cancelled) fn()
      }, ms)
    }

    const runTick = () => {
      if (cancelled) return
      const el = scrollerRef.current
      if (!el) {
        scheduleAfter(AUTOPLAY_MS, runTick)
        return
      }
      if (Date.now() < pauseUntilRef.current) {
        scheduleAfter(120, runTick)
        return
      }
      const max = maxScrollLeft(el)
      if (max <= 0) {
        scheduleAfter(AUTOPLAY_MS, runTick)
        return
      }
      const i = indexFromScroll(el, cardWidth, reviews.length)
      const next = i >= reviews.length - 1 ? 0 : i + 1
      const targetLeft = scrollLeftToCenterCard(el, next, cardWidth, reviews.length)
      suppressScrollIndexSyncRef.current = true
      const { promise, cancel } = animateScrollLeft(el, targetLeft, AUTOPLAY_SCROLL_MS, smootherstep)
      autoplayAnimCancelRef.current = cancel
      void promise.finally(() => {
        suppressScrollIndexSyncRef.current = false
        autoplayAnimCancelRef.current = null
        if (cancelled) return
        syncActiveFromScroll()
        const delay = Date.now() < pauseUntilRef.current ? 120 : AUTOPLAY_MS
        scheduleAfter(delay, runTick)
      })
    }

    scheduleAfter(AUTOPLAY_MS, runTick)

    return () => {
      cancelled = true
      clearAutoplayScheduled()
    }
  }, [cardWidth, syncActiveFromScroll, clearAutoplayScheduled])

  const goToSlide = useCallback(
    (index: number) => {
      const el = scrollerRef.current
      if (!el) return
      markUserInteraction()
      const clamped = Math.min(reviews.length - 1, Math.max(0, index))
      const left = scrollLeftToCenterCard(el, clamped, cardWidth, reviews.length)
      suppressScrollIndexSyncRef.current = true
      const { promise, cancel } = animateScrollLeft(el, left, DOT_SCROLL_MS)
      autoplayAnimCancelRef.current = cancel
      void promise.finally(() => {
        suppressScrollIndexSyncRef.current = false
        if (autoplayAnimCancelRef.current === cancel) autoplayAnimCancelRef.current = null
        syncActiveFromScroll()
      })
    },
    [markUserInteraction, cardWidth, syncActiveFromScroll]
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    if (!el) return
    if (e.pointerType === "mouse" && e.button === 0) {
      e.preventDefault()
    }
    markUserInteraction()
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    }
    el.style.scrollBehavior = "auto"
    el.style.cursor = "grabbing"
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    const d = dragRef.current
    if (!el || !d.active || e.pointerId !== d.pointerId) return
    el.scrollLeft = d.startScroll - (e.clientX - d.startX)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    const d = dragRef.current
    if (!d.active || e.pointerId !== d.pointerId) return
    dragRef.current.active = false
    if (el) {
      el.style.cursor = "grab"
      el.style.scrollBehavior = "smooth"
      const target = nearestCenteredScrollLeft(el, cardWidth, reviews.length)
      suppressScrollIndexSyncRef.current = true
      const { promise } = animateScrollLeft(el, target, DRAG_SNAP_MS)
      void promise.finally(() => {
        suppressScrollIndexSyncRef.current = false
        syncActiveFromScroll()
      })
    }
    try {
      el?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const max = maxScrollLeft(el)
      if (max <= 0) return
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      // Normalize wheel units (pixels/lines/pages) so one gesture behaves consistently.
      const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1
      const dx = raw * factor
      if (dx === 0) return
      const dir = dx > 0 ? 1 : -1
      const current = el.scrollLeft
      const atStart = current <= 1 && dir < 0
      const atEnd = current >= max - 1 && dir > 0
      // At edges, don't intercept wheel: allow page to scroll to other sections.
      if (atStart || atEnd) {
        wheelAccumRef.current = 0
        return
      }
      markUserInteraction()
      e.preventDefault()
      wheelAccumRef.current += dx
      if (wheelStepLockRef.current) return
      if (Math.abs(wheelAccumRef.current) < WHEEL_TRIGGER_PX) return

      wheelStepLockRef.current = true
      wheelAccumRef.current = 0
      if (wheelAnimCancelRef.current) {
        wheelAnimCancelRef.current()
        wheelAnimCancelRef.current = null
      }
      const i = indexFromScroll(el, cardWidth, reviews.length)
      const next = Math.min(reviews.length - 1, Math.max(0, i + dir))
      const target = scrollLeftToCenterCard(el, next, cardWidth, reviews.length)
      suppressScrollIndexSyncRef.current = true
      const { promise, cancel } = animateScrollLeft(el, target, WHEEL_CARD_SCROLL_MS)
      wheelAnimCancelRef.current = cancel
      void promise.finally(() => {
        if (wheelAnimCancelRef.current === cancel) wheelAnimCancelRef.current = null
        wheelStepLockRef.current = false
        suppressScrollIndexSyncRef.current = false
        syncActiveFromScroll()
      })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
      wheelAccumRef.current = 0
      wheelStepLockRef.current = false
      if (wheelAnimCancelRef.current) {
        wheelAnimCancelRef.current()
        wheelAnimCancelRef.current = null
      }
    }
  }, [markUserInteraction, syncActiveFromScroll])

  // Desktop: after user-driven free scrolling ends, smoothly center nearest card.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScrollEndSnap = () => {
      if (suppressScrollIndexSyncRef.current) return
      if (dragRef.current.active) return
      if (window.innerWidth < 768) return
      if (userSnapTimerRef.current !== null) {
        window.clearTimeout(userSnapTimerRef.current)
        userSnapTimerRef.current = null
      }
      userSnapTimerRef.current = window.setTimeout(() => {
        userSnapTimerRef.current = null
        if (suppressScrollIndexSyncRef.current || dragRef.current.active) return
        const target = nearestCenteredScrollLeft(el, cardWidth, reviews.length)
        if (Math.abs(target - el.scrollLeft) < 1) return
        markUserInteraction()
        if (userSnapAnimCancelRef.current) {
          userSnapAnimCancelRef.current()
          userSnapAnimCancelRef.current = null
        }
        suppressScrollIndexSyncRef.current = true
        const { promise, cancel } = animateScrollLeft(el, target, USER_SNAP_MS)
        userSnapAnimCancelRef.current = cancel
        void promise.finally(() => {
          if (userSnapAnimCancelRef.current === cancel) userSnapAnimCancelRef.current = null
          suppressScrollIndexSyncRef.current = false
          syncActiveFromScroll()
        })
      }, USER_SNAP_IDLE_MS)
    }
    el.addEventListener("scroll", onScrollEndSnap, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScrollEndSnap)
      if (userSnapTimerRef.current !== null) {
        window.clearTimeout(userSnapTimerRef.current)
        userSnapTimerRef.current = null
      }
      if (userSnapAnimCancelRef.current) {
        userSnapAnimCancelRef.current()
        userSnapAnimCancelRef.current = null
      }
    }
  }, [cardWidth, markUserInteraction, syncActiveFromScroll])

  return (
    <section id="testimonials" className="overflow-x-hidden bg-white py-20 md:py-28">
      <div className="container mx-auto max-w-[1300px] px-4 md:px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p
            className="mb-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] md:text-[13px]"
            style={{ color: BLUE }}
          >
            <span className="text-[1.1em] leading-none" aria-hidden>
              ●
            </span>
            Testimonials
          </p>
          <h2
            className="text-balance font-sans text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.65rem] lg:leading-[1.15]"
            style={{ color: INK }}
          >
            Happy patients sharing their dental care journey
          </h2>
        </div>

        <div className="-mx-4 md:mx-0">
          <div
            ref={scrollerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="testimonials-scroller select-none flex cursor-grab touch-pan-x gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 md:gap-6 md:px-0 [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0 [scrollbar-width:none]"
            style={{
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Patient testimonials — drag horizontally to scroll"
          >
            {reviews.map((r) => (
              <ReviewCard key={r.name} review={r} cardWidth={cardWidth} />
            ))}
          </div>
        </div>

        <div
          className="mt-8 flex max-w-full flex-wrap justify-center gap-2 sm:gap-3 md:mt-10 md:gap-3"
          role="tablist"
          aria-label="Testimonial slides"
        >
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={activeSlide === i}
              onClick={() => goToSlide(i)}
              className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 md:min-h-10 md:min-w-10"
              aria-label={`Go to testimonial position ${i + 1}`}
            >
              {activeSlide === i ? (
                <span className="flex size-4 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white p-[3px]">
                  <span className="size-2 rounded-full bg-[#2563eb]" />
                </span>
              ) : (
                <span className="size-2 rounded-full bg-slate-300" />
              )}
            </button>
          ))}
        </div>

        <p
          className="mt-11 flex flex-wrap items-center justify-center gap-2 text-center text-base font-bold md:mt-14 md:text-lg"
          style={{ color: INK }}
        >
          <span>4.9/5</span>
          <Star className="size-5 fill-[#2563eb] text-[#2563eb]" aria-hidden />
          <span>Our 4k Patient Review</span>
        </p>
      </div>
    </section>
  )
}
