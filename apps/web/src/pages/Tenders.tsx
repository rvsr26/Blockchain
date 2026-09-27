import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { Plus, Package } from "lucide-react";
import { StatusBadge } from "../components/ui/Badge";
import { PageLoading } from "../components/ui/Loading";
import { useState } from "react";

export default function Tenders() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: tenders, isLoading } = useQuery({
    queryKey: ["tenders", statusFilter],
    queryFn: () => api.getTenders(statusFilter ? { status: statusFilter } : undefined),
  });

  if (isLoading) return <PageLoading message="Loading tenders..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Tenders</h1><p className="text-[#94a3b8] text-sm mt-1">{tenders?.length || 0} tenders</p></div>
        <Link to="/tenders/create" className="btn-primary"><Plus className="w-4 h-4" /> Create Tender</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "DRAFT", "PUBLISHED", "BIDDING_OPEN", "CLOSED", "EVALUATION", "AWARDED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? "bg-[#4f6ef7] text-white border-[#4f6ef7]" : "border-[#252a3d] text-[#94a3b8] hover:border-[#4f6ef7]/40"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {(tenders || []).map((t: any) => (
          <div key={t.id} className="glass-card p-5 hover:border-[#4f6ef7]/30 transition-all group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={t.status} />
                  {t.description?.includes("SYNTHETIC") && <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">DEMO DATA</span>}
                </div>
                <h3 className="text-white font-semibold group-hover:text-[#6b8cff] transition-colors">{t.title}</h3>
                <p className="text-[#475569] text-sm mt-0.5">{t.organization?.name}</p>
                {t.description && <p className="text-[#94a3b8] text-sm mt-2 line-clamp-2">{t.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-[#475569]">
                  {t.estimatedBudget && <span>Est. ₹{Number(t.estimatedBudget).toLocaleString()}</span>}
                  <span>{t._count?.bidCommitments || 0} bids</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Link to={`/tenders/${t.id}`} className="btn-secondary text-xs py-1.5">View</Link>
                {t.status === "BIDDING_OPEN" && <Link to={`/tenders/${t.id}/bids`} className="btn-primary text-xs py-1.5">Submit Bid</Link>}
              </div>
            </div>
          </div>
        ))}
        {(!tenders || tenders.length === 0) && (
          <div className="glass-card p-12 text-center">
            <Package className="w-12 h-12 text-[#252a3d] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No tenders found</p>
            <Link to="/tenders/create" className="btn-primary"><Plus className="w-4 h-4" /> Create Tender</Link>
          </div>
        )}
      </div>
    </div>
  );
}
