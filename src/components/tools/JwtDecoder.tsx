"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import StatGrid from "@/components/StatGrid";

const sampleToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRldnRvb2wiLCJpYXQiOjE3MTYyMzkwMjIsImV4cCI6MTg5MzQ1NjAwMH0.signature";

function decodeBase64Url(part: string) {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function formatUnixDate(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Date(value * 1000).toLocaleString();
}

export default function JwtDecoder() {
  const [token, setToken] = useState(sampleToken);

  const decoded = useMemo(() => {
    try {
      const parts = token.trim().split(".");
      if (parts.length < 2) throw new Error("Token must contain header and payload.");
      const header = JSON.parse(decodeBase64Url(parts[0])) as Record<string, unknown>;
      const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
      return {
        header,
        payload,
        signature: parts[2] ?? "",
        error: ""
      };
    } catch (caught) {
      return {
        header: null,
        payload: null,
        signature: "",
        error: caught instanceof Error ? caught.message : "Invalid JWT"
      };
    }
  }, [token]);

  const headerOutput = decoded.header ? JSON.stringify(decoded.header, null, 2) : "";
  const payloadOutput = decoded.payload ? JSON.stringify(decoded.payload, null, 2) : "";
  const expired =
    decoded.payload && typeof decoded.payload.exp === "number"
      ? decoded.payload.exp * 1000 < Date.now()
      : false;

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <label className="field">
          <span>Token</span>
          <textarea
            className="token-textarea"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            spellCheck={false}
          />
        </label>
        {decoded.error ? <p className="error-text">{decoded.error}</p> : null}
      </section>

      <StatGrid
        stats={[
          { label: "Algorithm", value: decoded.header?.alg?.toString() ?? "-" },
          { label: "Type", value: decoded.header?.typ?.toString() ?? "-" },
          {
            label: "Expires",
            value: decoded.payload ? formatUnixDate(decoded.payload.exp) : "-"
          },
          { label: "Expired", value: decoded.payload ? (expired ? "Yes" : "No") : "-" },
          { label: "Issued", value: decoded.payload ? formatUnixDate(decoded.payload.iat) : "-" },
          { label: "Signature chars", value: decoded.signature.length }
        ]}
      />

      <div className="split-panel">
        <section className="tool-section">
          <div className="section-heading">
            <h2>Header</h2>
            <CopyButton value={headerOutput} disabled={!headerOutput} />
          </div>
          <pre className="code-output">{headerOutput}</pre>
        </section>
        <section className="tool-section">
          <div className="section-heading">
            <h2>Payload</h2>
            <CopyButton value={payloadOutput} disabled={!payloadOutput} />
          </div>
          <pre className="code-output">{payloadOutput}</pre>
        </section>
      </div>
    </div>
  );
}
