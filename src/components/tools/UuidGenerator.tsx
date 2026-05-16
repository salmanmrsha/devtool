"use client";

import { useEffect, useState } from "react";
import { notifyValueCopied } from "@/lib/toast";

function fallbackUuid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function makeUuid() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallbackUuid();
}

export default function UuidGenerator() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    const safeCount = Math.min(Math.max(count, 1), 100);
    setCount(safeCount);
    const values = Array.from({ length: safeCount }, () => makeUuid());
    setUuids(values);
  }

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <div className="control-row lorem-control-row">
          <label className="field compact-field">
            <span>Count</span>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <button className="button button-primary" type="button" onClick={generate}>
            Generate
          </button>
        </div>
      </section>

      <section className="tool-section">
        <div className="uuid-list">
          {uuids.map((uuid, index) => (
            <button
              key={`${uuid}-${index}`}
              className="uuid-copy-row"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(uuid);
                notifyValueCopied();
              }}
              aria-label={`Copy UUID ${index + 1}`}
              title="Copy"
            >
              <code>{uuid}</code>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
