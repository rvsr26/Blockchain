import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { Plus, Trash2, ChevronRight } from "lucide-react";

export default function CreateElection() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: api.getOrganizations });
  
  const [form, setForm] = useState({
    title: "", description: "", organizationId: "", electionType: "CR",
    startTime: "", endTime: "", quorumPercent: 50, totalEligibleVoters: 60, metadataCid: "",
  });
  const [candidates, setCandidates] = useState([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  const mutation = useMutation({
    mutationFn: (data: any) => api.createElection(data),
    onSuccess: (election) => {
      toast.success("Election created!", "Election has been created successfully.");
      navigate(`/elections/${election.id}`);
    },
    onError: (err: any) => toast.error("Failed to create election", err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) return toast.error("Connect wallet first");
    if (!form.organizationId) return toast.error("Select an organization");
    if (candidates.filter((c) => c.name.trim()).length < 2) return toast.error("At least 2 candidates required");
    mutation.mutate({
      ...form,
      creatorWallet: wallet.address,
      candidates: candidates.filter((c) => c.name.trim()),
    });
  };

  const addCandidate = () => setCandidates([...candidates, { name: "", description: "" }]);
  const removeCandidate = (i: number) => setCandidates(candidates.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Election</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Set up a new election with candidates and voting rules</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-semibold">Basic Information</h3>
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Election Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field" placeholder="e.g., CSE Class Representative Election 2026" required />
          </div>
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field h-24 resize-none" placeholder="Describe the election purpose..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Organization *</label>
              <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                className="input-field" required>
                <option value="">Select organization</option>
                {(orgs || []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Election Type</label>
              <select value={form.electionType} onChange={(e) => setForm({ ...form, electionType: e.target.value })} className="input-field">
                {["CR", "CLUB", "DEPARTMENT", "COMMITTEE", "DAO", "GENERAL"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Start Time *</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">End Time *</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Quorum Percent</label>
              <input type="number" min="1" max="100" value={form.quorumPercent}
                onChange={(e) => setForm({ ...form, quorumPercent: parseInt(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Total Eligible Voters</label>
              <input type="number" min="1" value={form.totalEligibleVoters}
                onChange={(e) => setForm({ ...form, totalEligibleVoters: parseInt(e.target.value) })} className="input-field" />
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Candidates</h3>
            <button type="button" onClick={addCandidate} className="btn-secondary text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {candidates.map((c, i) => (
            <div key={i} className="p-4 rounded-lg bg-[#0f1117] border border-[#252a3d] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#475569] font-medium">Candidate {i + 1}</span>
                {candidates.length > 2 && (
                  <button type="button" onClick={() => removeCandidate(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input value={c.name} onChange={(e) => { const n = [...candidates]; n[i].name = e.target.value; setCandidates(n); }}
                className="input-field" placeholder="Candidate name *" />
              <input value={c.description} onChange={(e) => { const n = [...candidates]; n[i].description = e.target.value; setCandidates(n); }}
                className="input-field" placeholder="Brief description (optional)" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center py-3">
            {mutation.isPending ? <><span className="loading-spinner" /> Creating...</> : <>Create Election <ChevronRight className="w-4 h-4" /></>}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
