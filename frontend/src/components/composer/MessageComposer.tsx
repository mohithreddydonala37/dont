type MessageComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onAnalyze: () => void;
  onTalk: () => void;
  isAnalyzing: boolean;
};

export function MessageComposer({
  draft,
  onDraftChange,
  onAnalyze,
  onTalk,
  isAnalyzing,
}: MessageComposerProps) {
  return (
    <section className="composer" aria-labelledby="composer-heading">
      <div className="composer-topline">
        <label id="composer-heading" htmlFor="message-draft">
          What are you about to send?
        </label>
        <span aria-live="polite">{draft.length} characters</span>
      </div>
      <textarea
        id="message-draft"
        value={draft}
        disabled={isAnalyzing}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Type it exactly as you want to say it."
        rows={5}
      />
      <div className="composer-actions">
        <button className="button button-primary" disabled={isAnalyzing} type="button" onClick={onAnalyze}>
          {isAnalyzing ? "Analyzing…" : "Analyze Message"}
        </button>
        <button className="button button-secondary" disabled={isAnalyzing} type="button" onClick={onTalk}>
          <span aria-hidden="true">🎙️</span> Just Let Me Talk
        </button>
      </div>
    </section>
  );
}
