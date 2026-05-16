"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { notifyValueCopied } from "@/lib/toast";

type EpochUnit = "seconds" | "milliseconds" | "microseconds";
type DateInputMode = "local" | "iso";
type CopyValue = {
  key: string;
  label: string;
  value: string;
};

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromEpoch(value: string, unit: EpochUnit) {
  const numeric = Number(value.trim());
  if (!Number.isFinite(numeric)) return null;
  const millis =
    unit === "seconds"
      ? numeric * 1000
      : unit === "microseconds"
        ? numeric / 1000
        : numeric;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function EpochConverter() {
  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);
  const [copiedKey, setCopiedKey] = useState("");
  const [epochDraft, setEpochDraft] = useState(String(Math.floor(now.getTime() / 1000)));
  const [epochApplied, setEpochApplied] = useState(String(Math.floor(now.getTime() / 1000)));
  const [unit, setUnit] = useState<EpochUnit>("seconds");
  const [localInput, setLocalInput] = useState(toLocalDateTimeInput(now));
  const [isoInput, setIsoInput] = useState(now.toISOString());
  const [dateInputMode, setDateInputMode] = useState<DateInputMode>("local");

  const epochDate = useMemo(() => fromEpoch(epochApplied, unit), [epochApplied, unit]);
  const parsedLocalDate = useMemo(() => {
    const date = new Date(localInput);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [localInput]);
  const parsedIsoDate = useMemo(() => {
    const date = new Date(isoInput);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [isoInput]);
  const dateToEpochValue = dateInputMode === "local" ? parsedLocalDate : parsedIsoDate;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  function useCurrentTime() {
    const date = new Date();
    const nextEpoch = String(Math.floor(date.getTime() / 1000));
    setEpochDraft(nextEpoch);
    setEpochApplied(nextEpoch);
    setUnit("seconds");
    setLocalInput(toLocalDateTimeInput(date));
    setIsoInput(date.toISOString());
  }

  function applyEpochInput() {
    setEpochApplied(epochDraft);
  }

  function syncFromDateInput() {
    if (!dateToEpochValue) return;
    const nextEpoch = String(Math.floor(dateToEpochValue.getTime() / 1000));
    setEpochDraft(nextEpoch);
    setEpochApplied(nextEpoch);
    setUnit("seconds");
  }

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    notifyValueCopied();
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 900);
  }

  const currentValues = [
    {
      key: "epoch-s",
      label: "Epoch s",
      value: String(Math.floor(currentDate.getTime() / 1000))
    },
    {
      key: "epoch-ms",
      label: "Epoch ms",
      value: String(currentDate.getTime())
    },
    {
      key: "iso8601",
      label: "ISO8601",
      value: currentDate.toISOString()
    },
    {
      key: "normal",
      label: "Normal date",
      value: currentDate.toLocaleString()
    }
  ];

  const epochOutput = epochDate
    ? [
        `ISO8601: ${epochDate.toISOString()}`,
        `UTC: ${epochDate.toUTCString()}`,
        `Local: ${epochDate.toLocaleString()}`,
        `Seconds: ${Math.floor(epochDate.getTime() / 1000)}`,
        `Milliseconds: ${epochDate.getTime()}`
      ].join("\n")
    : "";
  const epochDateValues: CopyValue[] = epochDate
    ? [
        { key: "epoch-date-iso8601", label: "ISO8601", value: epochDate.toISOString() },
        { key: "epoch-date-utc", label: "UTC", value: epochDate.toUTCString() },
        { key: "epoch-date-local", label: "Local", value: epochDate.toLocaleString() }
      ]
    : [];
  const dateToEpochValues: CopyValue[] = dateToEpochValue
    ? [
        {
          key: "date-to-epoch-seconds",
          label: "Seconds",
          value: String(Math.floor(dateToEpochValue.getTime() / 1000))
        },
        {
          key: "date-to-epoch-ms",
          label: "Milliseconds",
          value: String(dateToEpochValue.getTime())
        },
        {
          key: "date-to-epoch-iso8601",
          label: "ISO8601",
          value: dateToEpochValue.toISOString()
        },
        {
          key: "date-to-epoch-offset",
          label: "Timezone offset",
          value: `${-dateToEpochValue.getTimezoneOffset() / 60}h`
        }
      ]
    : [];

  function renderCopyCards(values: CopyValue[]) {
    return (
      <div className="copy-stat-grid">
        {values.map((item) => (
          <button
            className={`copy-stat-card ${copiedKey === item.key ? "is-copied" : ""}`}
            type="button"
            key={item.key}
            onClick={() => copyValue(item.key, item.value)}
            aria-label={`Copy ${item.label}`}
            title="Copy"
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="tool-stack">
      <section className="tool-section">
        <div className="section-heading">
          <h2>Current time</h2>
        </div>
        {renderCopyCards(currentValues)}
      </section>

      <div className="split-panel">
        <section className="tool-section">
          <div className="section-heading">
            <h2>Epoch to date</h2>
            <CopyButton value={epochOutput} />
          </div>
          <div className="control-row">
            <label className="field">
              <span>Timestamp</span>
              <input
                value={epochDraft}
                onChange={(event) => setEpochDraft(event.target.value)}
                inputMode="numeric"
              />
            </label>
            <label className="field compact-field">
              <span>Unit</span>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value as EpochUnit)}
              >
                <option value="seconds">Seconds</option>
                <option value="milliseconds">Milliseconds</option>
                <option value="microseconds">Microseconds</option>
              </select>
            </label>
          </div>
          <div className="button-row epoch-button-row">
            <button className="button button-primary" type="button" onClick={applyEpochInput}>
              Convert
            </button>
            <button className="button button-secondary" type="button" onClick={useCurrentTime}>
              Now
            </button>
          </div>
          <div className="output-box">
            {epochDate ? (
              epochDateValues.map((item) => (
                <button
                  className={`copy-output-row ${copiedKey === item.key ? "is-copied" : ""}`}
                  type="button"
                  key={item.key}
                  onClick={() => copyValue(item.key, item.value)}
                  aria-label={`Copy ${item.label}`}
                  title="Copy"
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </button>
              ))
            ) : (
              <p className="empty-state">Invalid timestamp</p>
            )}
          </div>
        </section>

        <section className="tool-section">
          <div className="section-heading">
            <h2>Date to epoch</h2>
          </div>
          <div className="segmented-control date-mode-control" aria-label="Date input format">
            <button
              type="button"
              className={dateInputMode === "local" ? "is-selected" : ""}
              onClick={() => setDateInputMode("local")}
            >
              Local picker
            </button>
            <button
              type="button"
              className={dateInputMode === "iso" ? "is-selected" : ""}
              onClick={() => setDateInputMode("iso")}
            >
              ISO8601/RFC3339
            </button>
          </div>

          {dateInputMode === "local" ? (
            <label className="field">
              <span>Local date and time</span>
              <input
                type="datetime-local"
                value={localInput}
                onChange={(event) => setLocalInput(event.target.value)}
              />
            </label>
          ) : (
            <label className="field">
              <span>ISO8601/RFC3339 date string</span>
              <input
                value={isoInput}
                onChange={(event) => setIsoInput(event.target.value)}
                placeholder="2026-05-16T12:00:00.000Z"
                spellCheck={false}
              />
            </label>
          )}

          <div className="button-row epoch-button-row">
            <button className="button button-primary" type="button" onClick={syncFromDateInput}>
              Convert
            </button>
          </div>
          {dateToEpochValue ? (
            renderCopyCards(dateToEpochValues)
          ) : (
            <p className="empty-state">Invalid date</p>
          )}
        </section>
      </div>
    </div>
  );
}
