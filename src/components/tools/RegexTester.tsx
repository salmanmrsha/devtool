"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import StatGrid from "@/components/StatGrid";

type FlagKey = "g" | "i" | "m" | "s" | "u";

type RegexMatch = {
  value: string;
  index: number;
  groups: string[];
};

const flagLabels: FlagKey[] = ["g", "i", "m", "s", "u"];

function buildFlags(flags: Record<FlagKey, boolean>) {
  return flagLabels.filter((flag) => flags[flag]).join("");
}

function findMatches(pattern: string, rawFlags: string, text: string) {
  if (!pattern) return { matches: [] as RegexMatch[], error: "" };

  try {
    const flags = rawFlags.includes("g") ? rawFlags : `${rawFlags}g`;
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) && matches.length < 250) {
      matches.push({
        value: match[0],
        index: match.index,
        groups: match.slice(1)
      });
      if (match[0] === "") regex.lastIndex += 1;
    }

    return { matches, error: "" };
  } catch (caught) {
    return {
      matches: [] as RegexMatch[],
      error: caught instanceof Error ? caught.message : "Invalid regular expression"
    };
  }
}

function highlightedText(text: string, matches: RegexMatch[]) {
  const usable = matches.filter((match) => match.value.length > 0);
  if (!usable.length) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  usable.forEach((match, index) => {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index));
    }
    parts.push(
      <mark key={`${match.index}-${index}`}>
        {text.slice(match.index, match.index + match.value.length)}
      </mark>
    );
    cursor = match.index + match.value.length;
  });

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("\\bdev\\w*");
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    g: true,
    i: true,
    m: false,
    s: false,
    u: false
  });
  const [text, setText] = useState(
    "DevTool pages should feel direct, durable, and developer-friendly."
  );

  const rawFlags = buildFlags(flags);
  const result = useMemo(() => findMatches(pattern, rawFlags, text), [pattern, rawFlags, text]);
  const first = result.matches[0];

  function toggleFlag(flag: FlagKey) {
    setFlags((current) => ({ ...current, [flag]: !current[flag] }));
  }

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <div className="control-row">
          <label className="field">
            <span>Pattern</span>
            <input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              spellCheck={false}
            />
          </label>
          <div className="flag-group" aria-label="Regex flags">
            {flagLabels.map((flag) => (
              <button
                key={flag}
                type="button"
                className={flags[flag] ? "is-selected" : ""}
                onClick={() => toggleFlag(flag)}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Test text</span>
          <textarea
            className="large-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
          />
        </label>
        {result.error ? <p className="error-text">{result.error}</p> : null}
      </section>

      <StatGrid
        stats={[
          { label: "Matches", value: result.matches.length },
          { label: "Flags", value: rawFlags || "-" },
          { label: "First index", value: first ? first.index : "-" },
          { label: "Pattern length", value: pattern.length }
        ]}
      />

      <section className="tool-section">
        <div className="section-heading">
          <h2>Preview</h2>
          <span>{result.matches.length} matches</span>
        </div>
        <pre className="regex-preview">{highlightedText(text, result.matches)}</pre>
      </section>

      <section className="tool-section">
        <div className="match-list">
          {result.matches.length ? (
            result.matches.map((match, index) => (
              <div className="match-row" key={`${match.index}-${index}`}>
                <span>#{index + 1}</span>
                <code>{match.value || "(empty)"}</code>
                <small>index {match.index}</small>
                {match.groups.length ? (
                  <small>groups {match.groups.map((group) => group || "(empty)").join(", ")}</small>
                ) : null}
              </div>
            ))
          ) : (
            <p className="empty-state">No matches</p>
          )}
        </div>
      </section>
    </div>
  );
}
