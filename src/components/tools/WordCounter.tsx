"use client";

import { useMemo, useState } from "react";
import StatGrid from "@/components/StatGrid";

const sampleText =
  "Good developer tools stay quiet, predictable, and fast. They make repetitive work feel simple without getting in the way.";

function getWords(value: string) {
  return value.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
}

function countSentences(value: string) {
  const matches = value.match(/[^.!?]+[.!?]+/g) ?? [];
  return matches.length || (value.trim() ? 1 : 0);
}

function countParagraphs(value: string) {
  return value.trim() ? value.trim().split(/\n\s*\n/).length : 0;
}

function topWords(words: string[]) {
  const counts = new Map<string, number>();
  words.forEach((word) => {
    const normalized = word.toLowerCase();
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);
}

export default function WordCounter() {
  const [text, setText] = useState(sampleText);

  const analysis = useMemo(() => {
    const words = getWords(text);
    const unique = new Set(words.map((word) => word.toLowerCase()));
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const lines = text.length ? text.split(/\r\n|\r|\n/).length : 0;
    const bytes = new TextEncoder().encode(text).length;
    const longest = words.reduce((longestWord, word) => {
      return word.length > longestWord.length ? word : longestWord;
    }, "");

    return {
      words,
      unique: unique.size,
      characters: text.length,
      charactersNoSpaces,
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      lines,
      bytes,
      longest,
      readingTime: Math.max(1, Math.ceil(words.length / 225)),
      speakingTime: Math.max(1, Math.ceil(words.length / 150)),
      top: topWords(words)
    };
  }, [text]);

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <label className="field">
          <span>Text</span>
          <textarea
            className="large-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
      </section>

      <StatGrid
        stats={[
          { label: "Words", value: analysis.words.length },
          { label: "Characters", value: analysis.characters },
          { label: "No spaces", value: analysis.charactersNoSpaces },
          { label: "Sentences", value: analysis.sentences },
          { label: "Paragraphs", value: analysis.paragraphs },
          { label: "Lines", value: analysis.lines },
          { label: "Unique words", value: analysis.unique },
          { label: "Bytes", value: analysis.bytes },
          { label: "Reading time", value: `${analysis.readingTime} min` },
          { label: "Speaking time", value: `${analysis.speakingTime} min` },
          { label: "Longest word", value: analysis.longest || "-" }
        ]}
      />

      <section className="tool-section">
        <div className="section-heading">
          <h2>Top words</h2>
        </div>
        <div className="word-cloud">
          {analysis.top.length ? (
            analysis.top.map(([word, count]) => (
              <span key={word}>
                {word}
                <strong>{count}</strong>
              </span>
            ))
          ) : (
            <p className="empty-state">No words</p>
          )}
        </div>
      </section>
    </div>
  );
}
