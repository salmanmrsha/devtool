"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import StatGrid from "@/components/StatGrid";

type LoremMode = "paragraphs" | "sentences" | "words";

const words = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "integer",
  "mattis",
  "nibh",
  "viverra",
  "fermentum",
  "mauris",
  "aliquam",
  "curabitur",
  "rhoncus",
  "lacus",
  "praesent",
  "volutpat",
  "egestas",
  "sapien",
  "pulvinar",
  "dapibus",
  "semper",
  "facilisis",
  "suscipit",
  "venenatis",
  "porttitor",
  "sodales"
];

function randomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function makeWords(count: number) {
  return Array.from({ length: count }, randomWord);
}

function makeSentence(wordCount: number) {
  return `${capitalize(makeWords(wordCount).join(" "))}.`;
}

function generateLorem(mode: LoremMode, amount: number, wordsPerSentence: number) {
  if (mode === "words") {
    return makeWords(amount).join(" ");
  }

  if (mode === "sentences") {
    return Array.from({ length: amount }, () => makeSentence(wordsPerSentence)).join(" ");
  }

  return Array.from({ length: amount }, () =>
    Array.from({ length: 4 }, () => makeSentence(wordsPerSentence)).join(" ")
  ).join("\n\n");
}

function countWords(value: string) {
  return value.trim().match(/\S+/g)?.length ?? 0;
}

export default function LoremIpsumGenerator() {
  const [mode, setMode] = useState<LoremMode>("paragraphs");
  const [amount, setAmount] = useState(3);
  const [wordsPerSentence, setWordsPerSentence] = useState(12);
  const [output, setOutput] = useState("");

  function generate() {
    const safeAmount = Math.min(Math.max(amount, 1), 100);
    const safeWords = Math.min(Math.max(wordsPerSentence, 4), 30);
    setAmount(safeAmount);
    setWordsPerSentence(safeWords);
    setOutput(generateLorem(mode, safeAmount, safeWords));
  }

  useEffect(() => {
    generate();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Words", value: countWords(output) },
      { label: "Characters", value: output.length },
      { label: "Paragraphs", value: output ? output.split(/\n\s*\n/).length : 0 }
    ],
    [output]
  );

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <div className="control-row lorem-control-row">
          <label className="field compact-field">
            <span>Type</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as LoremMode)}>
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </label>
          <label className="field compact-field">
            <span>Amount</span>
            <input
              type="number"
              min="1"
              max="100"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label className="field compact-field">
            <span>Words per sentence</span>
            <input
              type="number"
              min="4"
              max="30"
              value={wordsPerSentence}
              onChange={(event) => setWordsPerSentence(Number(event.target.value))}
            />
          </label>
          <button className="button button-primary" type="button" onClick={generate}>
            Generate
          </button>
          <span style={{ marginLeft: "auto" }}>
            <CopyButton value={output} />
          </span>
        </div>
      </section>

      <section className="tool-section">
        <textarea
          className="large-textarea output-textarea"
          value={output}
          onChange={(event) => setOutput(event.target.value)}
          spellCheck={false}
        />
      </section>

      <StatGrid stats={stats} />
    </div>
  );
}
