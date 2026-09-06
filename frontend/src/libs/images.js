const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")

export function storageUrl(path, fallback = null) {
  if (!path) return fallback

  const raw = String(path).trim()

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  const clean = raw.replace(/^\/+/, "")
  const suffix = clean.startsWith("storage/") ? clean : `storage/${clean}`

  return `${BASE_URL}/${suffix}`
}

export const medicineImage = (medicine) =>
  storageUrl(medicine?.image_url, "/placeholder.svg?height=200&width=200&query=medicine")

export const equipmentImage = (equipment) =>
  storageUrl(equipment?.image, "/placeholder.svg?height=200&width=200&query=equipment")
