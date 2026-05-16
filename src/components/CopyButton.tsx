"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { notifyValueCopied } from "@/lib/toast";

export default function CopyButton({
  value,
  label = "Copy",
  disabled = false
}: {
  value: string;
  label?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (!value || disabled) return;
    await navigator.clipboard.writeText(value);
    notifyValueCopied();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      className="button button-secondary"
      type="button"
      onClick={copyValue}
      disabled={disabled || !value}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
