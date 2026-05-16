"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  AlignLeft,
  Binary,
  Braces,
  Clock,
  FileDiff,
  Fingerprint,
  Hash,
  KeyRound,
  Menu,
  Regex,
  Text,
  Wrench,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tools, type ToolSlug } from "@/lib/tools";
import { TOAST_EVENT } from "@/lib/toast";

const iconMap: Record<ToolSlug, ComponentType<{ size?: number }>> = {
  "diff-checker": FileDiff,
  "epoch-converter": Clock,
  "hmac-generator": KeyRound,
  "json-formatter": Braces,
  "jwt-decoder": Fingerprint,
  "lorem-ipsum-generator": AlignLeft,
  "regex-tester": Regex,
  "secret-key-generator": Binary,
  "uuid-generator": Hash,
  "word-counter": Text
};

export function ToolIcon({
  slug,
  size = 20
}: {
  slug: ToolSlug;
  size?: number;
}) {
  const Icon = iconMap[slug];
  return <Icon size={size} />;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<number | null>(null);
  const currentTool = tools.find((tool) => pathname === `/${tool.slug}`);
  const toastAccent = currentTool?.accent ?? "#0f766e";

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setToast(detail?.message || "Value copied");

      if (toastTimeout.current) {
        window.clearTimeout(toastTimeout.current);
      }

      toastTimeout.current = window.setTimeout(() => {
        setToast("");
      }, 1600);
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      if (toastTimeout.current) {
        window.clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  return (
    <div className="app-frame">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <Link href="/" className="brand-mark" onClick={() => setOpen(false)}>
            <Wrench size={20} />
            <span>DevTool</span>
          </Link>
          <button
            className="icon-button mobile-only"
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="tool-nav" aria-label="Developer tools">
          {tools.map((tool) => {
            const active = pathname === `/${tool.slug}`;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={`nav-item ${active ? "is-active" : ""}`}
                style={{ "--tool-accent": tool.accent } as CSSProperties}
                onClick={() => setOpen(false)}
              >
                <ToolIcon slug={tool.slug} size={18} />
                <span>{tool.shortName}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="mobile-bar">
        <Link href="/" className="brand-mark">
          <Wrench size={19} />
          <span>DevTool</span>
        </Link>
        <button
          className="icon-button"
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      {open ? (
        <button
          className="backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="app-main">{children}</main>

      {toast ? (
        <div
          className="global-toast"
          role="status"
          aria-live="polite"
          style={{ "--toast-accent": toastAccent } as CSSProperties}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
