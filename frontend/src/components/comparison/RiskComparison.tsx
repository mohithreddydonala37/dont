import { getRiskLabel } from "../../utils/risk";

export function RiskComparison({
  originalRisk,
  rewrittenRisk,
}: {
  originalRisk: number;
  rewrittenRisk: number;
}) {
  const reduction = originalRisk - rewrittenRisk;
  const reductionPercent = originalRisk > 0 ? Math.round((reduction / originalRisk) * 100) : 0;

  return (
    <div className="risk-compare reveal">
      <div className="risk-numbers">
        <span>
          <small>Original</small>
          <strong>{originalRisk}</strong>
          <small>{getRiskLabel(originalRisk)}</small>
        </span>
        <b aria-hidden="true">-&gt;</b>
        <span className="after-risk">
          <small>Rewritten</small>
          <strong>{rewrittenRisk}</strong>
          <small>{getRiskLabel(rewrittenRisk)}</small>
        </span>
      </div>
      <div>
        {reduction > 0 ? (
          <>
            <p className="eyebrow" style={{marginBottom: "0.5rem"}}>Reduced by {reductionPercent}%</p>
            <p className="hero-copy" style={{marginBottom: 0, fontSize: "0.95rem"}}>
              This version lowers communication risk by {reduction} points while keeping your intent.
            </p>
          </>
        ) : reduction === 0 ? (
          <>
            <p className="eyebrow" style={{marginBottom: "0.5rem"}}>No Change</p>
            <p className="hero-copy" style={{marginBottom: 0, fontSize: "0.95rem"}}>
              This version has the same estimated communication risk.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow" style={{marginBottom: "0.5rem", color: "var(--danger)"}}>Increased by {Math.abs(reductionPercent)}%</p>
            <p className="hero-copy" style={{marginBottom: 0, fontSize: "0.95rem"}}>
              This version actually increases communication risk by {Math.abs(reduction)} points.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
