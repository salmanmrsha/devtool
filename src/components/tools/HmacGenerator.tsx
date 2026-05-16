"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import { notifyValueCopied } from "@/lib/toast";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type OutputFormat = "hex" | "base64";

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64(bytes: ArrayBuffer) {
  const array = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < array.length; i += chunkSize) {
    binary += String.fromCharCode(...array.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function HmacGenerator() {
  const [message, setMessage] = useState("payload");
  const [secret, setSecret] = useState("change-me");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [format, setFormat] = useState<OutputFormat>("hex");
  const [digest, setDigest] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    try {
      setError("");
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: algorithm },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(message)
      );
      setDigest(format === "hex" ? bytesToHex(signature) : bytesToBase64(signature));
    } catch {
      setDigest("");
      setError("Unable to generate HMAC in this browser.");
    }
  }

  return (
    <div className="tool-stack hmac-stack">
      <section className="tool-section">
        <div className="control-row">
          <label className="field compact-field">
            <span>Algorithm</span>
            <select
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}
            >
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </label>
          <label className="field compact-field">
            <span>Output</span>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as OutputFormat)}
            >
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
            </select>
          </label>
        </div>

        <label className="field hmac-secret-field">
          <span>Secret key</span>
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value.replace(/[\r\n]+/g, ""))}
            spellCheck={false}
            autoComplete="off"
            className="one-line-input"
          />
        </label>

        <label className="field hmac-message-field">
          <span>Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            spellCheck={false}
          />
        </label>

        <div className="button-row">
          <button className="button button-primary" type="button" onClick={generate}>
            Generate
          </button>
        </div>
      </section>

      <section className="tool-section">
        <div className="section-heading">
          <h2>Digest</h2>
          <CopyButton value={digest} />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <pre
          className="code-output hmac-digest-output"
          onClick={async () => {
            if (!digest) return;
            await navigator.clipboard.writeText(digest);
            notifyValueCopied();
          }}
          role="button"
          tabIndex={0}
          title="Click to copy"
        >
          {digest}
        </pre>
      </section>
    </div>
  );
}
