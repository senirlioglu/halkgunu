"use client";

// Google Analytics 4 wrapper.
// NEXT_PUBLIC_GA_ID set ise gtag yüklenir, track() event gönderir.
// Set değilse track() no-op — dev ya da analytics yokken sessiz kalır.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Primitive = string | number | boolean | null | undefined;
type EventParams = Record<string, Primitive>;

export function track(name: string, params?: EventParams): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("event", name, params ?? {});
}
