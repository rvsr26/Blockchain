import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { Users, Plus, UserX } from "lucide-react";
import { toast } from "../components/ui/Toaster";
import { useState } from "react";
import { format } from "date-fns";

export default function Members() {
  const { data: members, isLoading } = useQuery({ queryKey: ["members"], queryFn: () => api.getMembers() });
  const { data: orgs } = useQuery({ queryKey: ["organizations"], queryFn: api.getOrganizations });
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ walletAddress: "", organizationId: "", role: "MEMBER", displayName: "" });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.addMember(data),
    onSuccess: () => { toast.success("Member added!"); qc.invalidateQueries({ queryKey: ["members"] }); setShowAdd(false); },
    onError: (e: any) => toast.error("Failed", e.message),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeMember(id),
    onSuccess: () => { toast.success("Member deactivated"); qc.invalidateQueries({ queryKey: ["members"] }); },
  });

  if (isLoading) return <PageLoading message="Loading members..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Members</h1><p className="text-[#94a3b8] text-sm mt-1">{members?.length || 0} members</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus className="w-4 h-4" /> Add Member</button>
      </div>
      {showAdd && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-white font-semibold">Add Member</h3>
          <input value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} className="input-field" placeholder="Wallet address (0x...)" />
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="input-field" placeholder="Display name" />
          <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="input-field">
            <option value="">Select organization *</option>
            {(orgs || []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
            {["MEMBER", "COORDINATOR", "COMMITTEE_MEMBER", "REVIEWER", "AUDITOR", "ADMIN"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => addMutation.mutate(form)} disabled={!form.walletAddress || !form.organizationId || addMutation.isPending} className="btn-primary">
              {addMutation.isPending ? <span className="loading-spinner" /> : "Add"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-[#252a3d]">
            {["Member", "Organization", "Role", "Status", "Joined", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs text-[#475569] font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {(members || []).map((m: any) => (
              <tr key={m.id} className="table-row">
                <td className="px-4 py-3">
                  <p className="text-sm text-white">{m.user?.displayName || "—"}</p>
                  <p className="text-xs text-[#475569] font-mono">{m.user?.walletAddress?.slice(0, 10)}...</p>
                </td>
                <td className="px-4 py-3 text-sm text-[#94a3b8]">{m.organization?.name}</td>
                <td className="px-4 py-3"><span className="status-badge bg-[#4f6ef7]/10 text-[#6b8cff] border border-[#4f6ef7]/20">{m.role}</span></td>
                <td className="px-4 py-3"><span className={`status-badge border ${m.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-[#252a3d] text-[#475569] border-[#252a3d]"}`}>{m.status}</span></td>
                <td className="px-4 py-3 text-xs text-[#475569]">{format(new Date(m.joinedAt), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  {m.status === "ACTIVE" && (
                    <button onClick={() => removeMutation.mutate(m.id)} className="text-red-400 hover:text-red-300 transition-colors"><UserX className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
            {(!members || members.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[#475569] text-sm">No members found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
