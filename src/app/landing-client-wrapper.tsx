"use client"

import dynamic from 'next/dynamic'

// This wrapper handles the "ssr: false" logic safely in a client context
// so the parent page.tsx can remain a server component for SEO metadata.
const LandingPageContent = dynamic(
  () => import('./landing/landing-page-content').then((mod) => mod.LandingPageContent),
  { 
    ssr: false,
    loading: () => <div className="min-h-screen bg-background" /> 
  }
)

export default function LandingClientWrapper() {
  return <LandingPageContent initialSettings={null} />
}
