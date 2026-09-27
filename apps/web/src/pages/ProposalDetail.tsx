import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { ThumbsUp, ThumbsDown, Bot, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const qc = useQueryClient();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const { data: proposal, isLoading } = useQuery({ queryKey: ["proposal", id], queryFn: () => api.getProposal(id!) });

  const voteMutation = useMutation({
    mutationFn: (voteType: string) => api.voteProposal(id!, { voterWallet: wallet.address, voteType, txHash: `0x${Math.random().toString(16).slice(2)}` }),
    onSuccess: () => { toast.success("Vote recorded!"); qc.invalidateQueries({ queryKey: ["proposal", id] }); },
    onError: (e: any) => toast.error("Vote failed", e.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.updateProposal(id!, { status: "ACTIVE" }),
    onSuccess: () => { toast.success("Proposal activated"); qc.invalidateQueries({ queryKey: ["proposal", id] }); },
    onError: (e: any) => toast.error("Failed", e.message),
  });

  const runAI = async () => {
    if (!proposal) return;
    setAiLoading(true);
    try {
      const result = await api.analyzeProposal({ proposalId: id, title: proposal.title, description: proposal.description, budget: Number(proposal.requestedBudget), objectives: proposal.objectives });
      setAiResult(result);
    } catch (e: any) { toast.error("AI failed", e.message); }
    finally { setAiLoading(false); }
  };

  if (isLoading) return <PageLoading message="Loading proposal..." />;
  if (!proposal) return <div className="text-white">Proposal not found</div>;

  const existingAnalysis = proposal.aiAnalyses?.[0] ? JSON.parse(proposal.aiAnalyses[0].analysisJson) : null;
  const analysis = aiResult || existingAnalysis;
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPct = totalVotes > 0 ? ((proposal.yesVotes / totalVotes) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2"><StatusBadge status={proposal.status} /></div>
          <h1 className="text-2xl font-bold text-white">{proposal.title}</h1>
          <p className="text-[#94a3b8] text-sm">{proposal.organization?.name} · ₹{Number(proposal.requestedBudget || 0).toLocaleString()}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {proposal.status === "DRAFT" && (
            <button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending} className="btn-primary">Activate</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-3">Description</h3>
            <p className="text-[#94a3b8] text-sm leading-relaxed">{proposal.description || "No description provided."}</p>
            {proposal.objectives && (<><div className="border-t border-[#252a3d] my-3" /><h4 className="text-white font-medium text-sm mb-2">Objectives</h4><p className="text-[#94a3b8] text-sm">{proposal.objectives}</p></>)}
          </div>

          {/* Voting */}
          {proposal.status === "ACTIVE" && (
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4">Cast Your Vote</h3>
              <div className="flex gap-3">
                <button onClick={() => voteMutation.mutate("YES")} disabled={voteMutation.isPending || !wallet.connected}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10 transition-all font-medium">
                  <ThumbsUp className="w-5 h-5" /> YES
                </button>
                <button onClick={() => voteMutation.mutate("NO")} disabled={voteMutation.isPending || !wallet.connected}
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all font-medium">
                  <ThumbsDown className="w-5 h-5" /> NO
                </button>
              </div>
              <p className="text-[#475569] text-xs mt-2 text-center">Votes are recorded on blockchain. One vote per wallet per proposal.</p>
            </div>
          )}

          {/* Vote tally */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">Current Votes</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-green-400">Yes</span><span className="text-white">{proposal.yesVotes} ({yesPct}%)</span></div>
                <div className="h-3 bg-[#252a3d] rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${yesPct}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-red-400">No</span><span className="text-white">{proposal.noVotes} ({100 - Number(yesPct)}%)</span></div>
                <div className="h-3 bg-[#252a3d] rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${100 - Number(yesPct)}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-purple-400" /><h3 className="text-white font-semibold text-sm">AI Analysis</h3></div>
              <button onClick={runAI} disabled={aiLoading} className="btn-secondary text-xs py-1">
                {aiLoading ? <span className="loading-spinner" /> : "Analyze"}
              </button>
            </div>
            {analysis ? (
              <div className="space-y-3">
                <p className="text-[#94a3b8] text-xs leading-relaxed">{analysis.summary}</p>
                {analysis.missingInformation?.length > 0 && (
                  <div><p className="text-amber-400 text-xs font-medium mb-1">Missing:</p>
                    <ul className="text-[#475569] text-xs space-y-1">{analysis.missingInformation.slice(0, 4).map((m: string, i: number) => <li key={i}>• {m}</li>)}</ul></div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Advisory only — human review required
                </div>
              </div>
            ) : (
              <p className="text-[#475569] text-xs">Click Analyze to run AI advisory analysis on this proposal.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
