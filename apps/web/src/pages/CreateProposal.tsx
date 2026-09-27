import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { Bot, ChevronRight } from "lucide-react";

export default function CreateProposal() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: api.getOrganizations });
  const [form, setForm] = useState({ title: "", description: "", organizationId: "", requestedBudget: "", objectives: "", timeline: "", votingDeadline: "" });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => api.createProposal(data),
    onSuccess: (proposal) => { toast.success("Proposal created!"); navigate(`/proposals/${proposal.id}`); },
    onError: (e: any) => toast.error("Failed", e.message),
  });

  const runAI = async () => {
    if (!form.title) return toast.error("Enter a title first");
    setAiLoading(true);
    try {
      const result = await api.analyzeProposal({ title: form.title, description: form.description, budget: Number(form.requestedBudget) || undefined, objectives: form.objectives });
      setAiAnalysis(result);
    } catch (e: any) { toast.error("AI analysis failed", e.message); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) return toast.error("Connect wallet first");
    mutation.mutate({ ...form, requestedBudget: form.requestedBudget ? Number(form.requestedBudget) : undefined, authorWallet: wallet.address });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Create Proposal</h1><p className="text-[#94a3b8] text-sm mt-1">Submit a proposal for community review and voting</p></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-semibold">Proposal Details</h3>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g., Annual Hackathon 2026" required /></div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Organization *</label>
            <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="input-field" required>
              <option value="">Select organization</option>
              {(orgs || []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select></div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-28 resize-none" placeholder="Describe your proposal in detail..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Requested Budget (₹)</label>
              <input type="number" value={form.requestedBudget} onChange={(e) => setForm({ ...form, requestedBudget: e.target.value })} className="input-field" placeholder="0" /></div>
            <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Voting Deadline</label>
              <input type="datetime-local" value={form.votingDeadline} onChange={(e) => setForm({ ...form, votingDeadline: e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Objectives</label>
            <textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} className="input-field h-20 resize-none" placeholder="List key objectives..." /></div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Timeline</label>
            <input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className="input-field" placeholder="e.g., March 2026 - 2 day event" /></div>
        </div>

        {/* AI Analysis */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-purple-400" /><h3 className="text-white font-semibold">AI Analysis (Advisory)</h3></div>
            <button type="button" onClick={runAI} disabled={aiLoading} className="btn-secondary text-xs py-1.5">
              {aiLoading ? <><span className="loading-spinner" /> Analyzing...</> : "Run AI Analysis"}
            </button>
          </div>
          <p className="text-[#475569] text-xs mb-3">AI will analyze your proposal for missing information, potential risks, and suggestions. Final decision remains with human reviewers.</p>
          {aiAnalysis && (
            <div className="space-y-3 p-4 rounded-lg bg-[#0f1117] border border-[#252a3d]">
              <div className="flex items-center gap-2 text-xs text-purple-400 font-medium"><Bot className="w-3.5 h-3.5" /> AI-Generated Advisory Analysis</div>
              <p className="text-[#e2e8f0] text-sm">{aiAnalysis.summary}</p>
              {aiAnalysis.missingInformation?.length > 0 && (
                <div><p className="text-amber-400 text-xs font-medium mb-1">Missing Information:</p>
                  <ul className="text-[#94a3b8] text-xs space-y-1">{aiAnalysis.missingInformation.map((m: string, i: number) => <li key={i}>• {m}</li>)}</ul></div>
              )}
              {aiAnalysis.questionsForReviewer?.length > 0 && (
                <div><p className="text-[#6b8cff] text-xs font-medium mb-1">Reviewer Questions:</p>
                  <ul className="text-[#94a3b8] text-xs space-y-1">{aiAnalysis.questionsForReviewer.slice(0, 3).map((q: string, i: number) => <li key={i}>• {q}</li>)}</ul></div>
              )}
              <p className="text-[#475569] text-xs italic border-t border-[#252a3d] pt-2">{aiAnalysis.advisoryNote}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center py-3">
            {mutation.isPending ? <><span className="loading-spinner" /> Creating...</> : <>Submit Proposal <ChevronRight className="w-4 h-4" /></>}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
