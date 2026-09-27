import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { Plus, Vote, Users, Clock, ChevronRight } from "lucide-react";
import { StatusBadge } from "../components/ui/Badge";
import { PageLoading } from "../components/ui/Loading";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";

export default function Elections() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: elections, isLoading } = useQuery({
    queryKey: ["elections", statusFilter],
    queryFn: () => api.getElections(statusFilter ? { status: statusFilter } : undefined),
  });

  if (isLoading) return <PageLoading message="Loading elections..." />;

  const statuses = ["", "DRAFT", "OPEN", "CLOSED", "FINALIZED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Elections</h1>
          <p className="text-[#94a3b8] text-sm mt-1">{elections?.length || 0} elections found</p>
        </div>
        <Link to="/elections/create" className="btn-primary">
          <Plus className="w-4 h-4" /> Create Election
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? "bg-[#4f6ef7] text-white border-[#4f6ef7]" : "border-[#252a3d] text-[#94a3b8] hover:border-[#4f6ef7]/40"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {(elections || []).map((election: any) => {
          const totalVotes = election._count?.votes || 0;
          const turnout = election.totalEligibleVoters > 0
            ? Math.round((totalVotes / election.totalEligibleVoters) * 100) : 0;
          return (
            <div key={election.id} className="glass-card p-5 hover:border-[#4f6ef7]/30 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={election.status} />
                    <span className="text-xs text-[#475569]">{election.electionType}</span>
                    {election.status === "OPEN" && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg">{election.title}</h3>
                  <p className="text-[#475569] text-sm mt-1">{election.organization?.name}</p>
                  {election.description && <p className="text-[#94a3b8] text-sm mt-2 line-clamp-2">{election.description}</p>}
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#475569]">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {election.totalEligibleVoters} eligible</span>
                    <span className="flex items-center gap-1.5"><Vote className="w-3.5 h-3.5" /> {totalVotes} votes ({turnout}%)</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                      {new Date(election.endTime) > new Date()
                        ? `Ends ${formatDistanceToNow(new Date(election.endTime), { addSuffix: true })}`
                        : `Ended ${format(new Date(election.endTime), "MMM d, yyyy")}`}
                    </span>
                  </div>

                  {/* Turnout bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-[#252a3d] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4f6ef7] to-[#7c3aed] rounded-full transition-all"
                        style={{ width: `${Math.min(turnout, 100)}%` }} />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <Link to={`/elections/${election.id}`} className="btn-secondary text-xs py-1.5">
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  {election.status === "OPEN" && (
                    <Link to={`/elections/${election.id}/vote`} className="btn-primary text-xs py-1.5">
                      <Vote className="w-3.5 h-3.5" /> Vote
                    </Link>
                  )}
                  {election.status === "FINALIZED" && (
                    <Link to={`/elections/${election.id}/results`} className="btn-secondary text-xs py-1.5">
                      Results
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {(!elections || elections.length === 0) && (
          <div className="glass-card p-12 text-center">
            <Vote className="w-12 h-12 text-[#252a3d] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No elections found</p>
            <p className="text-[#475569] text-sm mb-4">Create your first election or run the seed script to load demo data.</p>
            <Link to="/elections/create" className="btn-primary">
              <Plus className="w-4 h-4" /> Create Election
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
