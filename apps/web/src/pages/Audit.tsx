import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { Shield, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function Audit() {
  const [module, setModule] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit", module, page],
    queryFn: () => api.getAuditEvents({ ...(module ? { module } : {}), page, limit: 20 }),
  });

  if (isLoading) return <PageLoading message="Loading audit trail..." />;

  const modules = ["", "ELECTION", "PROPOSAL", "TENDER", "MEMBER", "ORGANIZATION"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
          <p className="text-[#94a3b8] text-sm mt-1">{data?.total || 0} events recorded</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#252a3d] text-xs text-[#94a3b8]">
          <Shield className="w-3.5 h-3.5 text-[#6b8cff]" /> Blockchain-backed audit
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {modules.map((m) => (
          <button key={m} onClick={() => { setModule(m); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${module === m ? "bg-[#4f6ef7] text-white border-[#4f6ef7]" : "border-[#252a3d] text-[#94a3b8] hover:border-[#4f6ef7]/40"}`}>
            {m || "All Modules"}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#252a3d]">
              {["Module", "Action", "Actor", "Ref", "Tx Hash", "Status", "Time"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-[#475569] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.events || []).map((ev: any) => (
              <tr key={ev.id} className="table-row">
                <td className="px-4 py-3"><span className="status-badge bg-[#4f6ef7]/10 text-[#6b8cff] border border-[#4f6ef7]/20">{ev.module}</span></td>
                <td className="px-4 py-3 text-sm text-white">{ev.action.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-xs text-[#94a3b8] font-mono">{ev.actorWallet ? `${ev.actorWallet.slice(0, 8)}...${ev.actorWallet.slice(-4)}` : "—"}</td>
                <td className="px-4 py-3 text-xs text-[#475569]">{ev.refType || "—"}</td>
                <td className="px-4 py-3">
                  {ev.txHash ? (
                    <span className="blockchain-badge cursor-pointer hover:text-white transition-colors" title={ev.txHash}>
                      {ev.txHash.slice(0, 8)}... <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  ) : <span className="text-[#475569] text-xs">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                <td className="px-4 py-3 text-xs text-[#475569]">{format(new Date(ev.createdAt), "MMM d, HH:mm")}</td>
              </tr>
            ))}
            {(!data?.events || data.events.length === 0) && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[#475569] text-sm">No audit events found. Run the seed script to populate demo data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {data?.total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5">Previous</button>
          <span className="text-[#94a3b8] text-xs flex items-center">Page {page} of {Math.ceil(data.total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 20)} className="btn-secondary text-xs py-1.5">Next</button>
        </div>
      )}
    </div>
  );
}
