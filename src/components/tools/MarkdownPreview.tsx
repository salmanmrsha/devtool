"use client";

import {
  useLayoutEffect,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js/lib/common";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Strikethrough
} from "lucide-react";

const sampleMarkdown = `# Markdown Preview

Live preview with **bold**, *italic*, \`inline code\`, and [links](https://example.com).

## Lists

- First item
- Second item
  - Nested item

1. Ordered one
2. Ordered two

## Code

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Mermaid

\`\`\`mermaid
flowchart LR
  A[Write] --> B{Valid?}
  B -- Yes --> C[Render]
  B -- No --> D[Show error]
\`\`\`

## Table

| Syntax | Result |
| ------ | ------ |
| \`# H1\` | Heading |
| \`**x**\` | Bold |

> Blockquotes work too.
`;

type MermaidEntry = { svg: string } | { error: string };
type Range = { value: string; selStart: number; selEnd: number };

const mermaidCache = new Map<string, MermaidEntry>();
let mermaidIdCounter = 0;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHtml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function mermaidMarkup(entry: MermaidEntry) {
  return "svg" in entry
    ? `<div class="mermaid-diagram">${entry.svg}</div>`
    : `<div class="mermaid-error">${escapeHtml(entry.error)}</div>`;
}

function createMd(theme: string) {
  return new MarkdownIt({
    html: true,
    linkify: true,
    highlight(code, lang) {
      if (lang === "mermaid") {
        const cached = mermaidCache.get(theme + "\u0000" + code);
        if (cached) return mermaidMarkup(cached);
        return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
      }
      if (lang && hljs.getLanguage(lang)) {
        return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`;
      }
      return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
    }
  });
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string
): Range {
  const selected = value.slice(start, end) || placeholder;
  const next =
    value.slice(0, start) + before + selected + after + value.slice(end);
  return {
    value: next,
    selStart: start + before.length,
    selEnd: start + before.length + selected.length
  };
}

function prefixLines(
  value: string,
  start: number,
  end: number,
  transform: (line: string) => string
): Range {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const breakIndex = value.indexOf("\n", end);
  const lineEnd = breakIndex === -1 ? value.length : breakIndex;
  const block = value.slice(lineStart, lineEnd);
  const replaced = block.split("\n").map(transform).join("\n");
  return {
    value: value.slice(0, lineStart) + replaced + value.slice(lineEnd),
    selStart: lineStart,
    selEnd: lineStart + replaced.length
  };
}

function linkAction(value: string, start: number, end: number): Range {
  const selected = value.slice(start, end);
  if (selected) {
    const insert = `[${selected}](url)`;
    return {
      value: value.slice(0, start) + insert + value.slice(end),
      selStart: start + selected.length + 3,
      selEnd: start + selected.length + 6
    };
  }
  const insert = "[text](url)";
  return {
    value: value.slice(0, start) + insert + value.slice(end),
    selStart: start + 1,
    selEnd: start + 5
  };
}

function headingAction(level: number) {
  return (value: string, start: number, end: number): Range =>
    prefixLines(value, start, end, (line) => {
      const text = line.replace(/^#{1,6}\s+/, "");
      return "#".repeat(level) + " " + text;
    });
}

function quoteAction(value: string, start: number, end: number): Range {
  return prefixLines(value, start, end, (line) =>
    line.startsWith("> ") ? line.slice(2) : "> " + line
  );
}

function bulletAction(value: string, start: number, end: number): Range {
  return prefixLines(value, start, end, (line) =>
    /^[-*+]\s/.test(line) ? line.replace(/^[-*+]\s/, "") : "- " + line
  );
}

function orderedAction(value: string, start: number, end: number): Range {
  return prefixLines(value, start, end, (line) =>
    /^\d+\.\s/.test(line) ? line.replace(/^\d+\.\s/, "") : "1. " + line
  );
}

export default function MarkdownPreview() {
  const [source, setSource] = useState(sampleMarkdown);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<[number, number] | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection) return;
    pendingSelection.current = null;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(selection[0], selection[1]);
  });

  const applyRange = (range: Range) => {
    setSource(range.value);
    pendingSelection.current = [range.selStart, range.selEnd];
  };

  const edit = (action: (value: string, start: number, end: number) => Range) =>
    () => {
      const el = textareaRef.current;
      if (!el) return;
      applyRange(action(el.value, el.selectionStart, el.selectionEnd));
    };

  const wrap = (before: string, after: string, placeholder: string) =>
    edit((value, start, end) =>
      wrapSelection(value, start, end, before, after, placeholder)
    );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      wrap("**", "**", "bold text")();
    } else if (key === "i") {
      event.preventDefault();
      wrap("*", "*", "italic text")();
    } else if (key === "e") {
      event.preventDefault();
      wrap("`", "`", "code")();
    } else if (key === "k") {
      event.preventDefault();
      edit(linkAction)();
    }
  };

  const html = useMemo(() => {
    const md = createMd(theme);
    return md.render(source).replace(
      /<pre class="mermaid">([\s\S]*?)<\/pre>/g,
      (full, inner: string) => {
        const cached = mermaidCache.get(theme + "\u0000" + unescapeHtml(inner));
        return cached ? mermaidMarkup(cached) : full;
      }
    );
  }, [source, theme]);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const nodes = Array.from(container.querySelectorAll("pre.mermaid"));
    if (nodes.length === 0) return;
    let cancelled = false;

    (async () => {
      const mermaid = (await import("mermaid")).default;
      if (cancelled) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "default",
        suppressErrorRendering: true
      });
      for (const node of nodes) {
        if (cancelled) return;
        const code = node.textContent ?? "";
        if (!code.trim()) continue;
        const key = theme + "\u0000" + code;
        let entry = mermaidCache.get(key);
        if (!entry) {
          try {
            const { svg } = await mermaid.render(`mmd-${mermaidIdCounter++}`, code);
            entry = { svg };
          } catch (err) {
            entry = { error: err instanceof Error ? err.message : String(err) };
          }
          mermaidCache.set(key, entry);
        }
        if (cancelled) return;
        const wrapper = document.createElement("div");
        wrapper.innerHTML = mermaidMarkup(entry);
        node.replaceWith(wrapper.firstElementChild ?? wrapper);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html, theme]);

  return (
    <div className="tool-stack">
      <div className="md-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className="md-tool-btn"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          onMouseDown={(event) => event.preventDefault()}
          onClick={wrap("**", "**", "bold text")}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          onMouseDown={(event) => event.preventDefault()}
          onClick={wrap("*", "*", "italic text")}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Strikethrough"
          aria-label="Strikethrough"
          onMouseDown={(event) => event.preventDefault()}
          onClick={wrap("~~", "~~", "struck text")}
        >
          <Strikethrough size={16} />
        </button>
        <span className="md-tool-sep" />
        <button
          type="button"
          className="md-tool-btn"
          title="Inline code (Ctrl+E)"
          aria-label="Inline code"
          onMouseDown={(event) => event.preventDefault()}
          onClick={wrap("`", "`", "code")}
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Code block"
          aria-label="Code block"
          onMouseDown={(event) => event.preventDefault()}
          onClick={wrap("```\n", "\n```", "code")}
        >
          <SquareCode size={16} />
        </button>
        <span className="md-tool-sep" />
        <button
          type="button"
          className="md-tool-btn"
          title="Heading 1"
          aria-label="Heading 1"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(headingAction(1))}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Heading 2"
          aria-label="Heading 2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(headingAction(2))}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Heading 3"
          aria-label="Heading 3"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(headingAction(3))}
        >
          <Heading3 size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Heading 4"
          aria-label="Heading 4"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(headingAction(4))}
        >
          <Heading4 size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Heading 5"
          aria-label="Heading 5"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(headingAction(5))}
        >
          <Heading5 size={16} />
        </button>
        <span className="md-tool-sep" />
        <button
          type="button"
          className="md-tool-btn"
          title="Link (Ctrl+K)"
          aria-label="Link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(linkAction)}
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Quote"
          aria-label="Quote"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(quoteAction)}
        >
          <Quote size={16} />
        </button>
        <span className="md-tool-sep" />
        <button
          type="button"
          className="md-tool-btn"
          title="Bullet list"
          aria-label="Bullet list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(bulletAction)}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className="md-tool-btn"
          title="Numbered list"
          aria-label="Numbered list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={edit(orderedAction)}
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <div className="editor-grid md-split">
        <div className="field">
          <span>Markdown</span>
          <div className="md-editor-wrap">
            <textarea
              ref={textareaRef}
              className="md-editor"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              aria-label="Markdown source"
            />
          </div>
        </div>
        <div className="field">
          <span>Preview</span>
          <div
            className="md-preview"
            ref={previewRef}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
