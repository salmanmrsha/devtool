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
  Moon,
  Regex,
  Sun,
  Text,
  Wrench
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
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toastTimeout = useRef<number | null>(null);
  const currentTool = tools.find((tool) => pathname === `/${tool.slug}`);
  const toastAccent = currentTool?.accent ?? "#0f766e";

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("devtool-theme", next);
    setTheme(next);
  }

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
      <header className="navbar">
        <Link href="/" className="brand-mark">
          <Wrench size={20} />
          <span>DevTool</span>
        </Link>

        <nav className="tool-nav" aria-label="Developer tools">
          {tools.map((tool) => {
            const active = pathname === `/${tool.slug}`;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={`nav-item ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                style={{ "--tool-accent": tool.accent } as CSSProperties}
              >
                <ToolIcon slug={tool.slug} size={16} />
                <span>{tool.shortName}</span>
              </Link>
            );
          })}
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

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
