import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

/** Web-only Vercel telemetry. No user location or app data is sent as custom events. */
export function VercelObservability() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
