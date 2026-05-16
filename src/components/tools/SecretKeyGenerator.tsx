"use client";

import { useEffect, useState } from "react";
import StatGrid from "@/components/StatGrid";
import { notifyValueCopied } from "@/lib/toast";

type KeyFormat = "hex" | "base64";

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function SecretKeyGenerator() {
  const [bytes, setBytes] = useState(32);
  const [format, setFormat] = useState<KeyFormat>("hex");
  const [secret, setSecret] = useState("");

  function generate(nextFormat = format) {
    const safeBytes = Math.min(Math.max(bytes, 1), 4096);
    setBytes(safeBytes);
    const randomBytes = new Uint8Array(safeBytes);
    crypto.getRandomValues(randomBytes);
    setSecret(nextFormat === "hex" ? bytesToHex(randomBytes) : bytesToBase64(randomBytes));
  }

  useEffect(() => {
    generate();
  }, []);

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    notifyValueCopied();
  }

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <div className="control-row lorem-control-row">
          <label className="field compact-field">
            <span>Bytes</span>
            <select
              value={bytes}
              onChange={(event) => setBytes(Number(event.target.value))}
            >
              <option value="8">8</option>
              <option value="16">16</option>
              <option value="32">32</option>
              <option value="64">64</option>
            </select>
          </label>
          <label className="field compact-field">
            <span>Format</span>
            <select
              value={format}
              onChange={(event) => {
                const nextFormat = event.target.value as KeyFormat;
                setFormat(nextFormat);
                generate(nextFormat);
              }}
            >
              <option value="hex">Hex</option>
              <option value="base64">Base64</option>
            </select>
          </label>
          <button className="button button-primary" type="button" onClick={() => generate()}>
            Generate
          </button>
        </div>
      </section>

      <section className="tool-section">
        <button
          className="copy-output-row secret-output-row"
          type="button"
          onClick={copySecret}
          aria-label="Copy secret key"
          title="Copy"
        >
          <span>Secret key</span>
          <strong>{secret}</strong>
        </button>
      </section>
    </div>
  );
}
