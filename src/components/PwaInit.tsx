"use client";

import { useEffect } from "react";

/**
 * Service worker'ı tarayıcı destekliyorsa kaydet. PWA "ana ekrana ekle"
 * promtu için Chrome bunu zorunlu kılıyor.
 */
export function PwaInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // dev'de çalıştırma

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
