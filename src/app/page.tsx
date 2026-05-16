import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { tools } from "@/lib/tools";
import { ToolIcon } from "@/components/AppShell";

export default function Home() {
  return (
    <section className="home-page">
      <div className="home-heading">
        <p className="eyebrow">Browser-based utilities</p>
        <h1>All-in-one devtool</h1>
        <p>
          Fast local tools for common text, crypto, data, and formatting work.
        </p>
      </div>

      <div className="tool-grid">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${tool.slug}`}
            className="tool-card"
            style={{ "--tool-accent": tool.accent } as CSSProperties}
          >
            <span className="tool-card-icon">
              <ToolIcon slug={tool.slug} size={22} />
            </span>
            <span className="tool-card-copy">
              <strong>{tool.name}</strong>
              <span>{tool.description}</span>
            </span>
            <ArrowUpRight className="tool-card-arrow" size={18} />
          </Link>
        ))}
      </div>
    </section>
  );
}
