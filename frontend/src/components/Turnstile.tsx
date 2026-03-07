"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

interface TurnstileProps {
  siteKey: string
  action: string
  onToken: (token: string) => void
}

export default function Turnstile({ siteKey, action, onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return
      if (widgetIdRef.current) return

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      })
    }

    const scriptId = "cf-turnstile-script"
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!existing) {
      const script = document.createElement("script")
      script.id = scriptId
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      script.async = true
      script.defer = true
      script.onload = renderWidget
      document.body.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      existing.addEventListener("load", renderWidget, { once: true })
    }

    return () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore widget cleanup errors
        }
      }
      widgetIdRef.current = null
    }
  }, [action, onToken, siteKey])

  return <div ref={containerRef} className="min-h-[65px]" />
}