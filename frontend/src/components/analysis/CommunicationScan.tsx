import type { Analysis } from "../../types/analysis";
import { getRiskLabel } from "../../utils/risk";

export function CommunicationScan({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis-section reveal" aria-labelledby="scan-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Communication scan</p>
          <h2 id="scan-heading">Take a breath. Here&apos;s what this could signal.</h2>
        </div>
      </div>
      <div className="scan-layout">
        <div className="risk-mark" aria-label={`Communication risk ${analysis.riskScore} out of 100`}>
          <span>Communication Risk</span>
          <strong>{analysis.riskScore}</strong>
          <small>{getRiskLabel(analysis.riskScore)}</small>
        </div>
        <dl className="scan-details">
          <div><dt>Emotion</dt><dd>{analysis.emotion}</dd></div>
          <div><dt>Intensity</dt><dd>{analysis.emotionIntensity}%</dd></div>
          <div><dt>Tone</dt><dd>{analysis.tone}</dd></div>
          <div><dt>Intent</dt><dd>{analysis.intent}</dd></div>
        </dl>
      </div>
      <div className="triggers">
        <span>Trigger phrases</span>
        {analysis.triggers.length
          ? analysis.triggers.map((trigger) => <strong key={trigger}>“{trigger}”</strong>)
          : <strong>None identified</strong>}
      </div>
      <p className="analysis-explanation">{analysis.explanation}</p>
    </section>
  );
}
