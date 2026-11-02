"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const recorded = new Set<string>();
const pending = new Set<string>();

export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || recorded.has(pathname) || pending.has(pathname)) return;
    pending.add(pathname);
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "page_view", page: pathname }),
      keepalive: true,
    }).then(response => { if (response.ok) recorded.add(pathname); })
      .catch(() => {})
      .finally(() => pending.delete(pathname));
  }, [pathname]);
  return null;
}
