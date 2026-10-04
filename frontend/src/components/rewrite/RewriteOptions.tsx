"use client";

import { useEffect, useRef, useState } from "react";
import { generateVoice } from "../../services/voice";
import type { Rewrite } from "../../types/rewrite";
import { RiskComparison } from "../comparison/RiskComparison";
import { getRiskLabel } from "../../utils/risk";

type VoiceState = {
  style: keyof Rewrite | null;
  status: "idle" | "generating" | "playing" | "played";
  error: string | null;
};

export function RewriteOptions({
  beforeRisk,
  rewrite,
  onSave,
}: {
  beforeRisk: number;
  rewrite: Rewrite;
  onSave: (style: keyof Rewrite, message: string) => void;
}) {
  const [voiceState, setVoiceState] = useState<VoiceState>({ style: null, status: "idle", error: null });
  const [selectedStyle, setSelectedStyle] = useState<keyof Rewrite | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function stopCurrentAudio() {
    abortRef.current?.abort();
    abortRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  useEffect(() => () => stopCurrentAudio(), []);

  async function playVoice(style: keyof Rewrite, text: string) {
    stopCurrentAudio();
    const controller = new AbortController();
    abortRef.current = controller;
    setVoiceState({ style, status: "generating", error: null });

    try {
      const blob = await generateVoice(text, controller.signal);
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      objectUrlRef.current = objectUrl;
      audioRef.current = audio;
      audio.onended = () => setVoiceState({ style, status: "played", error: null });
      audio.onerror = () => {
        stopCurrentAudio();
        setVoiceState({ style, status: "played", error: "Audio playback failed." });
      };
      setVoiceState({ style, status: "playing", error: null });
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      stopCurrentAudio();
      setVoiceState({ style, status: "played", error: "Unable to generate audio. Try again." });
    }
  }

  return (
    <section className="rewrite-section reveal" aria-labelledby="rewrite-heading">
      <p className="eyebrow">Your options</p>
      <h2 id="rewrite-heading">Here are three ways you could say it.</h2>
      <p className="rewrite-intro">AI-estimated communication risk is a coaching signal, not a scientific probability.</p>
      <div className="rewrite-grid">
        {(Object.keys(rewrite) as Array<keyof Rewrite>).map((style) => (
          <Card
            key={style}
            style={style}
            version={rewrite[style]}
            isSelected={selectedStyle === style}
            onSelect={() => setSelectedStyle(style)}
            onSave={onSave}
            voiceState={voiceState.style === style ? voiceState : null}
            onVoice={playVoice}
          />
        ))}
      </div>
      {voiceState.error ? <p className="voice-error" role="status">{voiceState.error}</p> : null}

      {selectedStyle && (
        <div style={{ marginTop: "3rem" }}>
          <p className="eyebrow">Before vs After</p>
          <RiskComparison 
            originalRisk={beforeRisk} 
            rewrittenRisk={rewrite[selectedStyle].riskScore} 
          />
        </div>
      )}
    </section>
  );
}

function Card({
  style,
  version,
  isSelected,
  onSelect,
  onSave,
  voiceState,
  onVoice,
}: {
  style: keyof Rewrite;
  version: Rewrite[keyof Rewrite];
  isSelected: boolean;
  onSelect: () => void;
  onSave: (style: keyof Rewrite, message: string) => void;
  voiceState: VoiceState | null;
  onVoice: (style: keyof Rewrite, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(version.message);
  const [copied, setCopied] = useState(false);
  
  // Track if we have edited from the initial AI generation
  const [hasEdited, setHasEdited] = useState(false);

  const status = voiceState?.status ?? "idle";
  const voiceLabel = status === "generating"
    ? "Generating..."
    : status === "playing"
      ? "▶ Play"
      : status === "played"
        ? "▶ Play"
        : "▶ Listen";

  async function copy() {
    try {
      await navigator.clipboard.writeText(version.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function handleSave() {
    if (draft.trim()) {
      if (draft.trim() !== version.message) setHasEdited(true);
      onSave(style, draft.trim());
      setEditing(false);
    }
  }

  return (
    <article className={`rewrite-card rewrite-card-${style}`} style={{
      border: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
      boxShadow: isSelected ? "0 4px 12px rgba(101, 212, 187, 0.15)" : "none",
      transition: "border 0.2s, box-shadow 0.2s"
    }}>
      <div className="rewrite-card-head">
        <h3>{style.toUpperCase()}</h3>
        <button 
          className="text-button" 
          style={{ textDecoration: "none", color: isSelected ? "var(--accent)" : "var(--faint)", fontWeight: isSelected ? 700 : 400 }} 
          onClick={onSelect}
        >
          {isSelected ? "✓ Selected" : "Select"}
        </button>
      </div>
      {editing ? (
        <textarea aria-label={`Edit ${style} version`} className="rewrite-editor" value={draft} onChange={(event) => setDraft(event.target.value)} />
      ) : (
        <p className="rewrite-message" style={{ margin: "1rem 0" }}>{version.message}</p>
      )}

      {hasEdited ? (
        <div style={{ marginTop: "auto", marginBottom: "1rem" }}>
          <p className="status-message" style={{ color: "var(--danger)", margin: 0, lineHeight: 1.3 }}>Edited message<br/>Risk score may no longer reflect your changes.</p>
        </div>
      ) : (
        <div style={{ marginTop: "auto", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--faint)" }}>Risk: <strong>{version.riskScore}</strong></span>
          <span style={{ fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>{getRiskLabel(version.riskScore)}</span>
        </div>
      )}

      <div className="rewrite-actions" style={{ marginTop: "0" }}>
        {editing ? (
          <>
            <button className="text-button" type="button" onClick={handleSave}>Save</button>
            <button className="text-button" type="button" onClick={() => { setDraft(version.message); setEditing(false); }}>Cancel</button>
          </>
        ) : (
          <>
            <button className="text-button" type="button" onClick={copy}>{copied ? "✓ Copied" : "Copy"}</button>
            <button className="text-button" type="button" onClick={() => setEditing(true)}>Edit</button>
            <button className="text-button hear-button" type="button" disabled={status === "generating"} aria-live="polite" onClick={() => onVoice(style, version.message)}>{voiceLabel}</button>
          </>
        )}
      </div>
    </article>
  );
}
