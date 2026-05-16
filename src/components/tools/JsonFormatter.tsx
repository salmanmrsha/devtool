"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";

const sampleJson = `{"name":"DevTool","features":["format","minify","validate"],"settings":{"indent":2,"local":true}}`;

export default function JsonFormatter() {
  const [source, setSource] = useState(sampleJson);
  const [indent, setIndent] = useState<2 | 4>(2);

  const parsed = useMemo((): { value: unknown; error: string } => {
    try {
      return { value: JSON.parse(source) as unknown, error: "" };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Invalid JSON";
      return { value: null, error: message };
    }
  }, [source]);

  function beautify() {
    try {
      setSource(JSON.stringify(JSON.parse(source), null, indent));
    } catch {
      setSource(source);
    }
  }

  function minify() {
    try {
      setSource(JSON.stringify(JSON.parse(source)));
    } catch {
      setSource(source);
    }
  }

  const keys =
    parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value)
      ? Object.keys(parsed.value).length
      : Array.isArray(parsed.value)
        ? parsed.value.length
        : 0;
  const error = parsed.error;

  return (
    <div className="tool-stack json-stack">
      <div className="toolbar-row json-toolbar json-toolbar-sticky">
        <CopyButton value={source} disabled={Boolean(error)} />
        <div className="segmented-control json-indent-control" aria-label="Indentation">
          <button
            type="button"
            className={indent === 2 ? "is-selected" : ""}
            onClick={() => setIndent(2)}
          >
            2 spaces
          </button>
          <button
            type="button"
            className={indent === 4 ? "is-selected" : ""}
            onClick={() => setIndent(4)}
          >
            4 spaces
          </button>
        </div>
        <div className="button-row json-action-row">
          <button className="button button-secondary" type="button" onClick={minify}>
            One-line
          </button>
          <button className="button button-primary" type="button" onClick={beautify}>
            Beautify
          </button>
        </div>
      </div>
      <section className="tool-section json-section">
        <div className="json-editor">
          <div className="json-line-numbers" aria-hidden="true">
            {source.split(/\r\n|\r|\n/).map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          <label className="field json-input-field">
            <span className="visually-hidden">Input</span>
            <textarea
              className="large-textarea"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
            />
          </label>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </div>
  );
}
