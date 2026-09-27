import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { Bot, Award, Users, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function TenderDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const qc = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [awardForm, setAwardForm] = useState({ bidderWallet: "", awardedAmount: "", awardNotes: "" });

  const { data: tender, isLoading } = useQuery({ queryKey: ["tender", id], queryFn: () => api.getTender(id!) });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTender(id!, data),
    onSuccess: () => { toast.success("Tender updated"); qc.invalidateQueries({ queryKey: ["tender", id] }); },
    onError: (e: any) => toast.error("Failed", e.message),
  });

  const awardMutation = useMutation({
    mutationFn: () => api.recordAward(id!, { ...awardForm, awardedAmount: Number(awardForm.awardedAmount), awardedBy: wallet.address, txHash: `0x${Math.random().toString(16).slice(2)}` }),
    onSuccess: () => { toast.success("Award recorded on blockchain!"); qc.invalidateQueries({ queryKey: ["tender", id] }); },
    onError: (e: any) => toast.error("Award failed", e.message),
  });

  const runAI = async () => {
    if (!tender) return;
    setAiLoading(true);
    try {
      const result = await api.analyzeTender({ tenderId: id, title: tender.title, description: tender.description, estimatedBudget: Number(tender.estimatedBudget), requirements: tender.requirements });
      setAiResult(result);
    } catch (e: any) { toast.error("AI failed", e.message); }
    finally { setAiLoading(false); }
  };

  if (isLoading) return <PageLoading message="Loading tender..." />;
  if (!tender) return <div className="text-white">Tender not found</div>;

  const existingAnalysis = tender.aiAnalyses?.[0] ? JSON.parse(tender.aiAnalyses[0].analysisJson) : null;
  const analysis = aiResult || existingAnalysis;
  const bids = tender.bidCommitments || [];
  const revealedBids = bids.filter((b: any) => b.revealed && b.valid);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={tender.status} />
            {tender.description?.includes("SYNTHETIC") && <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">DEMO DATA</span>}
          </div>
          <h1 className="text-2xl font-bold text-white">{tender.title}</h1>
          <p className="text-[#94a3b8] text-sm">{tender.organization?.name} · Est. ₹{Number(tender.estimatedBudget || 0).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          {tender.status === "DRAFT" && <button onClick={() => updateMutation.mutate({ status: "PUBLISHED" })} className="btn-primary">Publish</button>}
          {tender.status === "PUBLISHED" && <button onClick={() => updateMutation.mutate({ status: "BIDDING_OPEN" })} className="btn-primary">Open Bidding</button>}
          {tender.status === "BIDDING_OPEN" && (
            <><Link to={`/tenders/${id}/bids`} className="btn-primary">Submit Bid</Link>
              <button onClick={() => updateMutation.mutate({ status: "CLOSED" })} className="btn-secondary">Close Bidding</button></>
          )}
          {tender.status === "CLOSED" && <button onClick={() => updateMutation.mutate({ status: "EVALUATION" })} className="btn-primary">Start Evaluation</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3">Requirements</h3>
            <p className="text-[#94a3b8] text-sm leading-relaxed">{tender.requirements || "No requirements specified."}</p>
            {tender.eligibilityCriteria && (<><div className="border-t border-[#252a3d] my-3" /><h4 className="text-white font-medium text-sm mb-2">Eligibility Criteria</h4><p className="text-[#94a3b8] text-sm">{tender.eligibilityCriteria}</p></>)}
          </div>

          {/* Bids */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">Bid Commitments ({bids.length})</h3>
            <div className="space-y-3">
              {bids.map((b: any) => (
                <div key={b.id} className="p-3 rounded-lg bg-[#0f1117] border border-[#252a3d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94a3b8] text-xs font-mono">{b.bidderWallet?.slice(0, 10)}...{b.bidderWallet?.slice(-4)}</span>
                    <div className="flex items-center gap-2">
                      {b.revealed ? (
                        <>
                          {b.valid ? <span className="status-badge bg-green-500/10 text-green-400 border border-green-500/20">Valid</span>
                            : <span className="status-badge bg-red-500/10 text-red-400 border border-red-500/20">Invalid</span>}
                          {b.revealedAmount && <span className="text-white font-medium text-sm">₹{Number(b.revealedAmount).toLocaleString()}</span>}
                        </>
                      ) : (
                        <span className="status-badge bg-[#252a3d] text-[#475569] border border-[#252a3d]">Committed</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[#475569] text-xs mt-1 font-mono truncate">{b.commitmentHash}</p>
                </div>
              ))}
              {bids.length === 0 && <p className="text-[#475569] text-sm text-center py-4">No bids submitted yet</p>}
            </div>
          </div>

          {/* Award section */}
          {tender.status === "EVALUATION" && (
            <div className="glass-card p-5 border-[#4f6ef7]/20">
              <div className="flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-[#6b8cff]" /><h3 className="text-white font-semibold">Record Award (Human Decision Required)</h3></div>
              <p className="text-amber-400 text-xs mb-4 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Award must be authorized by a human reviewer. AI analysis is advisory only.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1.5">Awarded Bidder Wallet</label>
                  <select value={awardForm.bidderWallet} onChange={(e) => setAwardForm({ ...awardForm, bidderWallet: e.target.value })} className="input-field">
                    <option value="">Select bidder</option>
                    {revealedBids.map((b: any) => <option key={b.bidderWallet} value={b.bidderWallet}>{b.bidderWallet?.slice(0, 12)}... — ₹{Number(b.revealedAmount).toLocaleString()}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs text-[#94a3b8] mb-1.5">Awarded Amount (₹)</label>
                  <input type="number" value={awardForm.awardedAmount} onChange={(e) => setAwardForm({ ...awardForm, awardedAmount: e.target.value })} className="input-field" /></div>
                <div><label className="block text-xs text-[#94a3b8] mb-1.5">Decision Notes</label>
                  <textarea value={awardForm.awardNotes} onChange={(e) => setAwardForm({ ...awardForm, awardNotes: e.target.value })} className="input-field h-20 resize-none" placeholder="Reason for awarding to this bidder..." /></div>
                <button onClick={() => awardMutation.mutate()} disabled={awardMutation.isPending || !awardForm.bidderWallet} className="btn-primary">
                  {awardMutation.isPending ? <><span className="loading-spinner" /> Recording...</> : <><Award className="w-4 h-4" /> Record Award on Blockchain</>}
                </button>
              </div>
            </div>
          )}

          {tender.status === "AWARDED" && (
            <div className="glass-card p-5 border-green-500/20">
              <div className="flex items-center gap-2 mb-3"><Award className="w-5 h-5 text-green-400" /><h3 className="text-green-400 font-semibold">Award Recorded</h3></div>
              <p className="text-[#94a3b8] text-sm">Awarded to: <span className="font-mono text-white">{tender.awardedBidder?.slice(0, 10)}...</span></p>
              <p className="text-[#94a3b8] text-sm">Amount: <span className="text-white font-bold">₹{Number(tender.awardedAmount || 0).toLocaleString()}</span></p>
              {tender.awardNotes && <p className="text-[#94a3b8] text-sm mt-2">{tender.awardNotes}</p>}
            </div>
          )}
        </div>

        {/* AI sidebar */}
        <div className="glass-card p-5 self-start">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-purple-400" /><h3 className="text-white font-semibold text-sm">AI Analysis</h3></div>
            <button onClick={runAI} disabled={aiLoading} className="btn-secondary text-xs py-1">
              {aiLoading ? <span className="loading-spinner" /> : "Analyze"}
            </button>
          </div>
          {analysis ? (
            <div className="space-y-3">
              <p className="text-[#94a3b8] text-xs leading-relaxed">{analysis.summary}</p>
              <div><p className="text-green-400 text-xs font-medium">Completeness: {analysis.completenessScore}/10</p></div>
              {analysis.potentialConcerns?.length > 0 && (
                <div><p className="text-amber-400 text-xs font-medium mb-1">Concerns:</p>
                  <ul className="text-[#475569] text-xs space-y-1">{analysis.potentialConcerns.map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul></div>
              )}
              <p className="text-[#6b8cff] text-xs leading-relaxed border-t border-[#252a3d] pt-2">{analysis.recommendation}</p>
              <p className="text-[#475569] text-xs italic">{analysis.advisoryNote}</p>
            </div>
          ) : (
            <p className="text-[#475569] text-xs">Run AI analysis for advisory insights. Human review required for all decisions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
