"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import {
  HighlightStyle,
  codeFolding,
  foldGutter,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { json } from "@codemirror/lang-json";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { tags } from "@lezer/highlight";
import CopyButton from "@/components/CopyButton";
import { showToast } from "@/lib/toast";

const sampleJson = `{"name":"DevTool","features":["format","validate","fold"],"settings":{"indent":2,"local":true}}`;

const jsonHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: "#0f172a" },
  { tag: tags.string, color: "#15803d" },
  { tag: tags.number, color: "#1d4ed8" },
  { tag: tags.bool, color: "#b45309" },
  { tag: tags.null, color: "#b45309" },
  { tag: tags.punctuation, color: "#64748b" },
]);

export default function JsonFormatter() {
  const [source, setSource] = useState(sampleJson);
  const [indent, setIndent] = useState<2 | 4>(2);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const indentCompartment = useMemo(() => new Compartment(), []);

  const parsed = useMemo((): { value: unknown; error: string } => {
    try {
      return { value: JSON.parse(source) as unknown, error: "" };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Invalid JSON";
      return { value: null, error: message };
    }
  }, [source]);

  const lines = useMemo(() => source.split(/\r\n|\r|\n/), [source]);

  // Create the editor once; `source` is only the initial document.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: source,
        extensions: [
          json(),
          lineNumbers(),
          foldGutter({ openText: "⌄", closedText: "›" }),
          codeFolding({ placeholderText: "{...}" }),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.lineWrapping,
          indentCompartment.of([
            indentUnit.of("  "),
            EditorState.tabSize.of(2),
          ]),
          syntaxHighlighting(jsonHighlight),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setSource(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep editor indentation in step with the 2/4-space toggle.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: indentCompartment.reconfigure([
        indentUnit.of(indent === 2 ? "  " : "    "),
        EditorState.tabSize.of(indent),
      ]),
    });
  }, [indent, indentCompartment]);

  function replaceDoc(next: string) {
    const view = viewRef.current;
    if (!view) {
      setSource(next);
      return;
    }
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: next },
    });
  }

  function requireValid(): boolean {
    if (!parsed.error) return true;
    showToast("Fix the invalid JSON first");
    return false;
  }

  function beautify() {
    if (!requireValid()) return;
    replaceDoc(JSON.stringify(parsed.value, null, indent));
  }

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
          <button className="button button-primary" type="button" onClick={beautify}>
            Beautify
          </button>
        </div>
      </div>
      <section className="tool-section json-section">
        <div className="json-editor" ref={hostRef} />
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p className="json-status">
            Valid JSON · {lines.length} {lines.length === 1 ? "line" : "lines"}
          </p>
        )}
      </section>
    </div>
  );
}
