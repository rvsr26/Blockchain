import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { ChevronRight } from "lucide-react";

export default function CreateTender() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: api.getOrganizations });
  const [form, setForm] = useState({ title: "", description: "", organizationId: "", estimatedBudget: "", requirements: "", eligibilityCriteria: "", biddingDeadline: "", revealDeadline: "" });

  const mutation = useMutation({
    mutationFn: (data: any) => api.createTender(data),
    onSuccess: (tender) => { toast.success("Tender created!"); navigate(`/tenders/${tender.id}`); },
    onError: (e: any) => toast.error("Failed", e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected) return toast.error("Connect wallet first");
    mutation.mutate({ ...form, estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined, creatorWallet: wallet.address });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Create Tender</h1><p className="text-[#94a3b8] text-sm mt-1">Create a procurement tender with commit-reveal bidding</p></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-semibold">Tender Details</h3>
          {[
            { label: "Title *", key: "title", placeholder: "e.g., Campus Network Equipment Procurement" },
            { label: "Organization *", key: "organizationId", type: "select" },
            { label: "Description", key: "description", type: "textarea", placeholder: "Describe tender requirements..." },
            { label: "Estimated Budget (₹)", key: "estimatedBudget", type: "number", placeholder: "500000" },
            { label: "Requirements", key: "requirements", type: "textarea", placeholder: "Technical and functional requirements..." },
            { label: "Eligibility Criteria", key: "eligibilityCriteria", type: "textarea", placeholder: "Vendor eligibility criteria..." },
          ].map(({ label, key, type = "text", placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">{label}</label>
              {type === "select" ? (
                <select value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-field" required>
                  <option value="">Select organization</option>
                  {(orgs || []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              ) : type === "textarea" ? (
                <textarea value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-field h-20 resize-none" placeholder={placeholder} />
              ) : (
                <input type={type} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-field" placeholder={placeholder} required={label.includes("*")} />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Bidding Deadline</label>
              <input type="datetime-local" value={form.biddingDeadline} onChange={(e) => setForm({ ...form, biddingDeadline: e.target.value })} className="input-field" /></div>
            <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Reveal Deadline</label>
              <input type="datetime-local" value={form.revealDeadline} onChange={(e) => setForm({ ...form, revealDeadline: e.target.value })} className="input-field" /></div>
          </div>
        </div>
        <div className="glass-card p-4 border-[#252a3d]">
          <p className="text-[#6b8cff] text-sm font-medium mb-1">Commit-Reveal Bidding</p>
          <p className="text-[#475569] text-xs leading-relaxed">Bidders will submit a cryptographic hash of their bid during the bidding phase. After the deadline, they reveal the actual amount. This prevents front-running and bid manipulation.</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center py-3">
            {mutation.isPending ? <><span className="loading-spinner" /> Creating...</> : <>Create Tender <ChevronRight className="w-4 h-4" /></>}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3 px-6">Cancel</button>
        </div>
      </form>
    </div>
  );
}
