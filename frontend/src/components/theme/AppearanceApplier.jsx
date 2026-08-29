"use client"

import { useEffect } from "react"
import { getVolunteerAppearanceAction } from "@/actions/volunteerActions"

/**
 * Applies a volunteer's purchased theme and typeface to the whole app by
 * stamping data attributes on <html>, which globals.css keys off.
 *
 * Renders nothing. Non volunteers get "default" for both, so this is a no-op
 * for them rather than something the rest of the app has to guard against.
 */
export default function AppearanceApplier() {
  useEffect(() => {
    let cancelled = false

    const apply = async () => {
      const appearance = await getVolunteerAppearanceAction()
      if (cancelled) return

      const root = document.documentElement

      if (appearance.theme && appearance.theme !== "default") {
        root.setAttribute("data-theme", appearance.theme)
      } else {
        root.removeAttribute("data-theme")
      }

      if (appearance.font && appearance.font !== "default") {
        root.setAttribute("data-font", appearance.font)
      } else {
        root.removeAttribute("data-font")
      }
    }

    apply()

    // The volunteer console dispatches this after a change so the new look
    // lands immediately instead of on the next navigation.
    const onChange = () => apply()
    window.addEventListener("appearance-changed", onChange)

    return () => {
      cancelled = true
      window.removeEventListener("appearance-changed", onChange)
    }
  }, [])

  return null
}
