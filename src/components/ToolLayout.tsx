import type { CSSProperties, ReactNode } from "react";
import { toolBySlug, type ToolSlug } from "@/lib/tools";

export default function ToolLayout({
  slug,
  children
}: {
  slug: ToolSlug;
  children: ReactNode;
}) {
  const tool = toolBySlug[slug];

  return (
    <section
      className="tool-page"
      style={{ "--tool-accent": tool.accent } as CSSProperties}
    >
      {children}
    </section>
  );
}
