import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { Plus, Building2, Users, Vote, FileText, Package } from "lucide-react";
import { PageLoading } from "../components/ui/Loading";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";

export default function Organizations() {
  const { data: orgs, isLoading } = useQuery({ queryKey: ["organizations"], queryFn: api.getOrganizations });
  const { wallet } = useWallet();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rules: "" });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createOrganization(data),
    onSuccess: () => { toast.success("Organization created!"); qc.invalidateQueries({ queryKey: ["organizations"] }); setShowForm(false); setForm({ name: "", description: "", rules: "" }); },
    onError: (e: any) => toast.error("Failed", e.message),
  });

  if (isLoading) return <PageLoading message="Loading organizations..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Organizations</h1><p className="text-[#94a3b8] text-sm mt-1">{orgs?.length || 0} organizations</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4" /> New Organization</button>
      </div>

      {showForm && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-white font-semibold">Create Organization</h3>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Organization name *" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field h-20 resize-none" placeholder="Description..." />
          <input value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="input-field" placeholder="Governance rules (optional)" />
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate({ ...form, adminWallet: wallet.address || "0x0000000000000000000000000000000000000000" })} disabled={!form.name || createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <span className="loading-spinner" /> : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(orgs || []).map((org: any) => (
          <Link key={org.id} to={`/organizations/${org.id}`} className="glass-card p-5 hover:border-[#4f6ef7]/30 transition-all group block">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold group-hover:text-[#6b8cff] transition-colors">{org.name}</h3>
                {org.description && <p className="text-[#475569] text-sm mt-0.5 line-clamp-2">{org.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-[#475569]">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {org._count?.members || 0} members</span>
                  <span className="flex items-center gap-1"><Vote className="w-3 h-3" /> {org._count?.elections || 0} elections</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {org._count?.proposals || 0} proposals</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {org._count?.tenders || 0} tenders</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!orgs || orgs.length === 0) && (
          <div className="glass-card p-12 text-center col-span-2">
            <Building2 className="w-12 h-12 text-[#252a3d] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No organizations yet</p>
            <p className="text-[#475569] text-sm">Create an organization to start managing elections, proposals, and tenders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
