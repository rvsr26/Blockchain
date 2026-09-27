import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { Plus, FileText, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { StatusBadge } from "../components/ui/Badge";
import { PageLoading } from "../components/ui/Loading";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function Proposals() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: proposals, isLoading } = useQuery({
    queryKey: ["proposals", statusFilter],
    queryFn: () => api.getProposals(statusFilter ? { status: statusFilter } : undefined),
  });

  if (isLoading) return <PageLoading message="Loading proposals..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proposals</h1>
          <p className="text-[#94a3b8] text-sm mt-1">{proposals?.length || 0} proposals</p>
        </div>
        <Link to="/proposals/create" className="btn-primary"><Plus className="w-4 h-4" /> New Proposal</Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "DRAFT", "ACTIVE", "SUCCEEDED", "DEFEATED", "EXECUTED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? "bg-[#4f6ef7] text-white border-[#4f6ef7]" : "border-[#252a3d] text-[#94a3b8] hover:border-[#4f6ef7]/40"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {(proposals || []).map((p: any) => (
          <Link key={p.id} to={`/proposals/${p.id}`} className="glass-card p-5 hover:border-[#4f6ef7]/30 transition-all block group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-[#475569]">{p.organization?.name}</span>
                </div>
                <h3 className="text-white font-semibold group-hover:text-[#6b8cff] transition-colors">{p.title}</h3>
                {p.description && <p className="text-[#94a3b8] text-sm mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-[#475569]">
                  {p.requestedBudget && <span>₹{Number(p.requestedBudget).toLocaleString()}</span>}
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-green-400" /> {p.yesVotes}</span>
                  <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-400" /> {p.noVotes}</span>
                  {p.votingDeadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.votingDeadline) > new Date()
                        ? `Deadline ${formatDistanceToNow(new Date(p.votingDeadline), { addSuffix: true })}`
                        : "Voting closed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!proposals || proposals.length === 0) && (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-[#252a3d] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No proposals found</p>
            <Link to="/proposals/create" className="btn-primary"><Plus className="w-4 h-4" /> Create Proposal</Link>
          </div>
        )}
      </div>
    </div>
  );
}
