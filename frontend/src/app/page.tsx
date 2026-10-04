"use client";
import { useState } from "react";
import { CommunicationScan } from "../components/analysis/CommunicationScan";
import { MessageComposer } from "../components/composer/MessageComposer";
import { GoalSelector } from "../components/goals/GoalSelector";
import { RewriteOptions } from "../components/rewrite/RewriteOptions";
import { analyzeMessage } from "../services/analyze";
import { rewriteMessage } from "../services/rewrite";
import type { Analysis } from "../types/analysis";
import { goals } from "../types/communication";
import type { Rewrite } from "../types/rewrite";

export default function Home() {
  const [draft, setDraft] = useState(""); const [analysis, setAnalysis] = useState<Analysis | null>(null); const [selectedGoal, setSelectedGoal] = useState(""); const [rewrite, setRewrite] = useState<Rewrite | null>(null); const [notice, setNotice] = useState(""); const [analyzing, setAnalyzing] = useState(false); const [rewriting, setRewriting] = useState(false); const [rewriteError, setRewriteError] = useState(false);
  async function revealAnalysis() { if (!draft.trim()) return setNotice("Write something you might regret sending..."); setAnalyzing(true); setNotice("Analyzing your message..."); setAnalysis(null); setRewrite(null); setSelectedGoal(""); try { setAnalysis(await analyzeMessage(draft)); setNotice("Here's what your message is communicating."); } catch (error) { setNotice(error instanceof Error ? error.message : "Analysis could not be completed. Please try again."); } finally { setAnalyzing(false); } }
  async function chooseGoal(goal: string) { if (!analysis || rewriting) return; setSelectedGoal(goal); setRewrite(null); setRewriteError(false); setRewriting(true); try { setRewrite(await rewriteMessage(draft, analysis, goal)); } catch { setRewriteError(true); } finally { setRewriting(false); } }
  return <main><div className="site-shell"><header className="site-header"><a className="wordmark" href="#top">DON&apos;T SEND THAT</a><span className="privacy-chip"><i aria-hidden="true" /> Private by design</span></header><section className="hero" id="top"><p className="eyebrow">A pause, before it&apos;s permanent</p><h1>DON&apos;T SEND THAT</h1><p className="hero-copy">An AI pause button for messages you might regret sending.</p><MessageComposer draft={draft} isAnalyzing={analyzing} onAnalyze={revealAnalysis} onDraftChange={(value) => { setDraft(value); setAnalysis(null); setRewrite(null); setSelectedGoal(""); }} onTalk={() => setNotice("Voice capture is not connected yet.")} /><p className="status-message" aria-live="polite">{notice}</p></section>{analysis && <div className="results-flow"><CommunicationScan analysis={analysis} /><GoalSelector goals={goals} selectedGoal={selectedGoal} onSelect={chooseGoal} disabled={rewriting} />{rewriting && <p className="rewrite-loading" aria-live="polite">Creating better ways to say it...</p>}{rewriteError && <div className="rewrite-error" role="alert"><p>Couldn&apos;t generate your versions. Try again.</p><button className="button button-secondary" type="button" onClick={() => chooseGoal(selectedGoal)}>Try Again</button></div>}{rewrite && <RewriteOptions beforeRisk={analysis.riskScore} rewrite={rewrite} onSave={(style, message) => setRewrite((current) => current ? { ...current, [style]: { ...current[style], message } } : current)} />}</div>}<footer className="privacy-note"><span aria-hidden="true">◉</span> Core analysis can run locally with Gemma 3.</footer></div></main>;
}
