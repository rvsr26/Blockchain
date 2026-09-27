import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { Vote, Users, Clock, Award, ExternalLink, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { format } from "date-fns";

export default function ElectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const qc = useQueryClient();
  
  const { data: election, isLoading } = useQuery({
    queryKey: ["election", id],
    queryFn: () => api.getElection(id!),
  });
  const { data: hasVotedData } = useQuery({
    queryKey: ["hasVoted", id, wallet.address],
    queryFn: () => api.hasVoted(id!, wallet.address!),
    enabled: !!wallet.address && !!id,
  });

  const closeMutation = useMutation({
    mutationFn: () => api.updateElection(id!, { status: "CLOSED" }),
    onSuccess: () => { toast.success("Election closed"); qc.invalidateQueries({ queryKey: ["election", id] }); },
    onError: (e: any) => toast.error("Failed to close election", e.message),
  });
  const finalizeMutation = useMutation({
    mutationFn: () => api.updateElection(id!, { status: "FINALIZED" }),
    onSuccess: () => { toast.success("Election finalized"); qc.invalidateQueries({ queryKey: ["election", id] }); },
    onError: (e: any) => toast.error("Failed to finalize", e.message),
  });

  if (isLoading) return <PageLoading message="Loading election..." />;
  if (!election) return <div className="text-white">Election not found</div>;

  const totalVotes = election.votes?.length || 0;
  const turnout = election.totalEligibleVoters > 0 ? ((totalVotes / election.totalEligibleVoters) * 100).toFixed(1) : 0;
  const chartData = election.candidates?.map((c: any) => ({ name: c.name.slice(0, 15), votes: c.voteCount })) || [];
  const COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={election.status} />
            <span className="text-xs text-[#475569]">{election.electionType} Election</span>
            {election.description?.includes("SYNTHETIC") && (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">DEMO DATA</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{election.title}</h1>
          <p className="text-[#94a3b8] text-sm mt-1">{election.organization?.name}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {election.status === "OPEN" && (
            <>
              {!hasVotedData?.hasVoted && (
                <Link to={`/elections/${id}/vote`} className="btn-primary">
                  <Vote className="w-4 h-4" /> Cast Vote
                </Link>
              )}
              <button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} className="btn-secondary">
                Close Election
              </button>
            </>
          )}
          {election.status === "CLOSED" && (
            <button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending} className="btn-primary">
              Finalize
            </button>
          )}
          {election.status === "FINALIZED" && (
            <Link to={`/elections/${id}/results`} className="btn-primary">
              <Award className="w-4 h-4" /> View Results
            </Link>
          )}
        </div>
      </div>

      {hasVotedData?.hasVoted && election.status === "OPEN" && (
        <div className="glass-card p-4 border-green-500/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <Vote className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-green-400 font-medium text-sm">You have already voted</p>
            <p className="text-[#475569] text-xs">Your vote has been recorded. You cannot vote again in this election.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Eligible Voters", value: election.totalEligibleVoters, icon: Users },
          { label: "Votes Cast", value: totalVotes, icon: Vote },
          { label: "Turnout", value: `${turnout}%`, icon: ChevronRight },
          { label: "Quorum Required", value: `${election.quorumPercent}%`, icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="metric-card">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-[#475569] text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Candidates */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Candidates</h3>
          <div className="space-y-3">
            {election.candidates?.map((c: any, i: number) => {
              const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0;
              return (
                <div key={c.id} className="p-3 rounded-lg bg-[#0f1117] border border-[#252a3d]">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">{c.name}</p>
                      {c.description && <p className="text-[#475569] text-xs">{c.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{c.voteCount}</p>
                      <p className="text-[#475569] text-xs">{pct}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#252a3d] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Vote Distribution</h3>
          {chartData.length > 0 && totalVotes > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#171b2d", border: "1px solid #252a3d", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#475569] text-sm">No votes cast yet</div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Election Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            ["Start Time", format(new Date(election.startTime), "PPP p")],
            ["End Time", format(new Date(election.endTime), "PPP p")],
            ["Creator", `${election.creatorWallet?.slice(0, 6)}...${election.creatorWallet?.slice(-4)}`],
            ["Created", format(new Date(election.createdAt), "PPP")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-[#252a3d]/50">
              <span className="text-[#475569]">{k}</span>
              <span className="text-white font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
