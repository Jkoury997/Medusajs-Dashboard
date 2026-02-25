"use client"

import { useMemo } from "react"
import { buildEmailPreviewHtml } from "./render-section-html"
import type { ContentSection } from "@/types/campaigns"

interface EmailPreviewProps {
  heading: string
  sections: ContentSection[]
  buttonText: string
  buttonUrl: string
  footerText: string
}

export function EmailPreview({ heading, sections, buttonText, buttonUrl, footerText }: EmailPreviewProps) {
  const html = useMemo(
    () => buildEmailPreviewHtml({ heading, sections, buttonText, buttonUrl, footerText }),
    [heading, sections, buttonText, buttonUrl, footerText]
  )

  return (
    <div className="rounded-md border bg-gray-100 p-4">
      <iframe
        srcDoc={html}
        className="w-full rounded-md border bg-white"
        style={{ height: "500px" }}
        sandbox="allow-same-origin"
        title="Email preview"
      />
    </div>
  )
}
