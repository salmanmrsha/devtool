import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { toolBySlug, type ToolSlug } from "@/lib/tools";
import { ToolIcon } from "@/components/AppShell";

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
      <div className="tool-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          <span>All tools</span>
        </Link>
        <div className="tool-title-row">
          <span className="tool-title-icon">
            <ToolIcon slug={slug} size={24} />
          </span>
          <div>
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}
