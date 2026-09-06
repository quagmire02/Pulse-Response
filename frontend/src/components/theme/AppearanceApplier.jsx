"use client"

import { useEffect } from "react"
import { getVolunteerAppearanceAction } from "@/actions/volunteerActions"

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

    const onChange = () => apply()
    window.addEventListener("appearance-changed", onChange)

    return () => {
      cancelled = true
      window.removeEventListener("appearance-changed", onChange)
    }
  }, [])

  return null
}
