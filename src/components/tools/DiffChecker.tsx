"use client";

import { useMemo, useState } from "react";

type DiffPart = {
  type: "same" | "added" | "removed";
  value: string;
  leftLine?: number;
  rightLine?: number;
  inlineSegments?: InlineSegment[];
};

type InlineSegment = {
  value: string;
  changed: boolean;
};

type DiffRow = {
  type: "same" | "changed" | "added" | "removed";
  left?: DiffPart;
  right?: DiffPart;
};

const initialLeft = `function greet(name) {
  return "Hello, " + name;
}

console.log(greet("Aman"));`;

const initialRight = `function greet(name) {
  return \`Hello, ${"${name}"}\`;
}

console.log(greet("Developer"));`;

function splitLines(value: string) {
  return value.length ? value.split(/\r\n|\r|\n/) : [];
}

function buildLineDiff(left: string, right: string): DiffPart[] {
  const a = splitLines(left);
  const b = splitLines(right);
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0)
  );

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  let leftLine = 1;
  let rightLine = 1;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      parts.push({
        type: "same",
        value: a[i],
        leftLine,
        rightLine
      });
      i += 1;
      j += 1;
      leftLine += 1;
      rightLine += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      parts.push({ type: "removed", value: a[i], leftLine });
      i += 1;
      leftLine += 1;
    } else {
      parts.push({ type: "added", value: b[j], rightLine });
      j += 1;
      rightLine += 1;
    }
  }

  while (i < a.length) {
    parts.push({ type: "removed", value: a[i], leftLine });
    i += 1;
    leftLine += 1;
  }

  while (j < b.length) {
    parts.push({ type: "added", value: b[j], rightLine });
    j += 1;
    rightLine += 1;
  }

  return parts;
}

function compactSegments(segments: InlineSegment[]) {
  return segments.reduce<InlineSegment[]>((current, segment) => {
    if (!segment.value) return current;
    const last = current[current.length - 1];
    if (last && last.changed === segment.changed) {
      last.value += segment.value;
    } else {
      current.push({ ...segment });
    }
    return current;
  }, []);
}

function buildPrefixSuffixSegments(source: string, target: string): InlineSegment[] {
  const sourceChars = Array.from(source);
  const targetChars = Array.from(target);
  let start = 0;

  while (
    start < sourceChars.length &&
    start < targetChars.length &&
    sourceChars[start] === targetChars[start]
  ) {
    start += 1;
  }

  let sourceEnd = sourceChars.length - 1;
  let targetEnd = targetChars.length - 1;

  while (
    sourceEnd >= start &&
    targetEnd >= start &&
    sourceChars[sourceEnd] === targetChars[targetEnd]
  ) {
    sourceEnd -= 1;
    targetEnd -= 1;
  }

  return compactSegments([
    { value: sourceChars.slice(0, start).join(""), changed: false },
    { value: sourceChars.slice(start, sourceEnd + 1).join(""), changed: true },
    { value: sourceChars.slice(sourceEnd + 1).join(""), changed: false }
  ]);
}

function buildInlineSegments(source: string, target: string): InlineSegment[] {
  if (source === target) return [{ value: source, changed: false }];

  const sourceChars = Array.from(source);
  const targetChars = Array.from(target);
  const cellCount = sourceChars.length * targetChars.length;

  if (cellCount > 200_000) {
    return buildPrefixSuffixSegments(source, target);
  }

  const dp = Array.from({ length: sourceChars.length + 1 }, () =>
    Array<number>(targetChars.length + 1).fill(0)
  );

  for (let i = sourceChars.length - 1; i >= 0; i -= 1) {
    for (let j = targetChars.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        sourceChars[i] === targetChars[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const matchingIndexes = new Set<number>();
  let i = 0;
  let j = 0;

  while (i < sourceChars.length && j < targetChars.length) {
    if (sourceChars[i] === targetChars[j]) {
      matchingIndexes.add(i);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return compactSegments(
    sourceChars.map((character, index) => ({
      value: character,
      changed: !matchingIndexes.has(index)
    }))
  );
}

function lcsLength(source: string, target: string) {
  const sourceChars = Array.from(source.trim());
  const targetChars = Array.from(target.trim());

  if (!sourceChars.length && !targetChars.length) return 0;
  if (!sourceChars.length || !targetChars.length) return 0;

  const dp = Array.from({ length: sourceChars.length + 1 }, () =>
    Array<number>(targetChars.length + 1).fill(0)
  );

  for (let i = sourceChars.length - 1; i >= 0; i -= 1) {
    for (let j = targetChars.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        sourceChars[i] === targetChars[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  return dp[0][0];
}

function lineSimilarity(source: string, target: string) {
  const left = source.trim();
  const right = target.trim();
  const totalLength = left.length + right.length;

  if (!totalLength) return 1;
  if (!left.length || !right.length) return 0;

  return (2 * lcsLength(left, right)) / totalLength;
}

function changedRow(left?: DiffPart, right?: DiffPart): DiffRow {
  if (!left) {
    return {
      type: "added",
      right: right
        ? {
            ...right,
            inlineSegments: [{ value: right.value, changed: true }]
          }
        : undefined
    };
  }

  if (!right) {
    return {
      type: "removed",
      left: {
        ...left,
        inlineSegments: [{ value: left.value, changed: true }]
      }
    };
  }

  return {
    type: "changed",
    left: {
      ...left,
      inlineSegments: buildInlineSegments(left.value, right.value)
    },
    right: {
      ...right,
      inlineSegments: buildInlineSegments(right.value, left.value)
    }
  };
}

function alignChangedChunk(removals: DiffPart[], additions: DiffPart[]) {
  if (!removals.length) return additions.map((part) => changedRow(undefined, part));
  if (!additions.length) return removals.map((part) => changedRow(part));
  if (removals.length === 1 && additions.length === 1) {
    return [changedRow(removals[0], additions[0])];
  }

  const pairThreshold = 0.34;
  const scores = removals.map((removal) =>
    additions.map((addition) => lineSimilarity(removal.value, addition.value))
  );
  const dp = Array.from({ length: removals.length + 1 }, () =>
    Array<number>(additions.length + 1).fill(0)
  );

  for (let i = 1; i <= removals.length; i += 1) {
    for (let j = 1; j <= additions.length; j += 1) {
      const score = scores[i - 1][j - 1];
      const pairScore = score >= pairThreshold ? score : -1;
      dp[i][j] = Math.max(
        dp[i - 1][j],
        dp[i][j - 1],
        dp[i - 1][j - 1] + pairScore
      );
    }
  }

  const rows: DiffRow[] = [];
  let i = removals.length;
  let j = additions.length;
  const epsilon = 0.000001;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const score = scores[i - 1][j - 1];
      const pairScore = score >= pairThreshold ? score : -1;
      if (pairScore >= 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + pairScore)) < epsilon) {
        rows.push(changedRow(removals[i - 1], additions[j - 1]));
        i -= 1;
        j -= 1;
        continue;
      }
    }

    if (i > 0 && (j === 0 || dp[i - 1][j] > dp[i][j - 1])) {
      rows.push(changedRow(removals[i - 1]));
      i -= 1;
    } else if (j > 0) {
      rows.push(changedRow(undefined, additions[j - 1]));
      j -= 1;
    }
  }

  return rows.reverse();
}

function buildSideBySideRows(parts: DiffPart[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let index = 0;

  while (index < parts.length) {
    if (parts[index].type === "same") {
      rows.push({
        type: "same",
        left: parts[index],
        right: parts[index]
      });
      index += 1;
      continue;
    }

    const chunk: DiffPart[] = [];
    while (index < parts.length && parts[index].type !== "same") {
      chunk.push(parts[index]);
      index += 1;
    }

    rows.push(
      ...alignChangedChunk(
        chunk.filter((part) => part.type === "removed"),
        chunk.filter((part) => part.type === "added")
      )
    );
  }

  return rows;
}

function renderInlineSegments(part: DiffPart) {
  const segments =
    part.inlineSegments && part.inlineSegments.length
      ? part.inlineSegments
      : [{ value: part.value || " ", changed: false }];

  return segments.map((segment, index) => (
    <span className={segment.changed ? "inline-change" : undefined} key={index}>
      {segment.value || " "}
    </span>
  ));
}

export default function DiffChecker() {
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  const [comparedLeft, setComparedLeft] = useState(initialLeft);
  const [comparedRight, setComparedRight] = useState(initialRight);

  const diffRows = useMemo(
    () => buildSideBySideRows(buildLineDiff(comparedLeft, comparedRight)),
    [comparedLeft, comparedRight]
  );

  function compareTexts() {
    setComparedLeft(left);
    setComparedRight(right);
  }

  return (
    <div className="tool-stack diff-tool-stack">
      <div className="editor-grid">
        <label className="field">
          <span>Original</span>
          <textarea
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            spellCheck={false}
          />
        </label>
        <label className="field">
          <span>Changed</span>
          <textarea
            value={right}
            onChange={(event) => setRight(event.target.value)}
            spellCheck={false}
          />
        </label>
      </div>

      <section className="tool-section diff-action-section">
        <div className="button-row diff-action-row">
          <button className="button button-primary" type="button" onClick={compareTexts}>
            Compare
          </button>
        </div>
      </section>

      <section className="tool-section">
        <div className="section-heading">
          <h2>Side-by-side diff</h2>
          <span>{diffRows.length} rows</span>
        </div>
        <div className="diff-view" aria-label="Line diff output">
          {diffRows.length ? (
            <>
              <div className="diff-header">
                <span />
                <strong>Original</strong>
                <span />
                <strong>Changed</strong>
              </div>
              {diffRows.map((row, index) => (
                <div className={`diff-row diff-row-${row.type}`} key={index}>
                  <span className="line-number">{row.left?.leftLine ?? ""}</span>
                  <code className={`diff-cell diff-${row.left?.type ?? "empty"}`}>
                    {row.left ? renderInlineSegments(row.left) : " "}
                  </code>
                  <span className="line-number">{row.right?.rightLine ?? ""}</span>
                  <code className={`diff-cell diff-${row.right?.type ?? "empty"}`}>
                    {row.right ? renderInlineSegments(row.right) : " "}
                  </code>
                </div>
              ))}
            </>
          ) : (
            <p className="empty-state">No content</p>
          )}
        </div>
      </section>
    </div>
  );
}
