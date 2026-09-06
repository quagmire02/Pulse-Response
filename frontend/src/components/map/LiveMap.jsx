"use client"

import { useState, useEffect } from "react"
import { reverseGeocodeAction } from "@/actions/geocodeActions"
import styles from "./LiveMap.module.css"

/**
 * Small OpenStreetMap panel with a readable address underneath.
 *
 * Uses the OSM embed iframe rather than a mapping library so the project keeps
 * zero frontend dependencies. The driver and volunteer consoles both render
 * this, which is why it also handles the "no position yet" state instead of
 * silently showing nothing, the way the old inline iframe did.
 */
export default function LiveMap({
  latitude,
  longitude,
  // Optional starting point. When given, the link routes from here to the
  // marker, so "from my position to the emergency" reads the right way round.
  fromLat,
  fromLng,
  label = "Current location",
  height = 260,
  zoom = 15,
}) {
  const [address, setAddress] = useState(null)

  const lat = Number(latitude)
  const lng = Number(longitude)
  const hasPosition = Number.isFinite(lat) && Number.isFinite(lng)

  const originLat = Number(fromLat)
  const originLng = Number(fromLng)
  const hasOrigin = Number.isFinite(originLat) && Number.isFinite(originLng)

  useEffect(() => {
    if (!hasPosition) {
      setAddress(null)
      return
    }

    let cancelled = false

    const resolve = async () => {
      const result = await reverseGeocodeAction(lat, lng)
      if (!cancelled) setAddress(result.address || null)
    }

    resolve()
    return () => {
      cancelled = true
    }
    // Round so tiny GPS drift does not refetch the address constantly.
  }, [hasPosition, lat.toFixed ? lat.toFixed(4) : lat, lng.toFixed ? lng.toFixed(4) : lng])

  if (!hasPosition) {
    return (
      <div className={styles.placeholder} style={{ height }}>
        <span>No location yet. Go on duty and allow location access.</span>
      </div>
    )
  }

  // A tighter box means a closer zoom; roughly one city block at 0.006.
  const span = 0.006 * (16 / Math.max(zoom, 1))
  const bbox = [lng - span, lat - span, lng + span, lat + span].join(",")

  const routeHref = hasOrigin
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat},${originLng};${lat},${lng}`
    : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`

  return (
    <div className={styles.wrapper}>
      <iframe
        title={label}
        className={styles.map}
        style={{ height }}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
      />

      <div className={styles.footer}>
        <div className={styles.addressBlock}>
          <span className={styles.label}>{label}</span>
          <span className={styles.address}>
            {address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          </span>
          {address && (
            <span className={styles.coords}>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          )}
        </div>

        <a className={styles.mapLink} href={routeHref} target="_blank" rel="noreferrer">
          {hasOrigin ? "Open route" : "Open in maps"}
        </a>
      </div>
    </div>
  )
}
