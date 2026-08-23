"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      // Versioned query busts any CDN-cached copy of sw.js (the sweep logic
      // in the file must never be served stale). Bump together with VERSION
      // in public/sw.js.
      navigator.serviceWorker.register("/sw.js?v=3", { scope: "/" }).catch(() => {
        // Registration is a progressive enhancement; never surface errors.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
