'use client'

import { useEffect } from 'react'
import { useSettings } from '@core/hooks/useSettings'

const DEFAULT_FAVICON_HREF = '/favicon.ico'

/** Applies the "FavIcon" branding logo slot to the browser tab icon at runtime. Next.js only
 * serves a static /favicon.ico by convention — there's no server-side way to swap it per tenant,
 * so this upserts a <link rel="icon"> in <head> on mount and whenever the configured favicon
 * changes, falling back to the default file when no custom one is set. */
const DynamicFavicon = () => {
  const { settings } = useSettings()
  const faviconUrl = settings.logos?.favicon

  useEffect(() => {
    const href = faviconUrl || DEFAULT_FAVICON_HREF
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    link.href = href
  }, [faviconUrl])

  return null
}

export default DynamicFavicon
