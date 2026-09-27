import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { Award, Vote } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function ElectionResults() {
  const { id } = useParams<{ id: string }>();
  const { data: election, isLoading } = useQuery({ queryKey: ["election", id], queryFn: () => api.getElection(id!) });

  if (isLoading) return <PageLoading message="Loading results..." />;
  if (!election) return <div className="text-white">Election not found</div>;

  const totalVotes = election.candidates?.reduce((sum: number, c: any) => sum + c.voteCount, 0) || 0;
  const winner = election.candidates?.reduce((best: any, c: any) => (!best || c.voteCount > best.voteCount ? c : best), null);
  const COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const pieData = election.candidates?.map((c: any) => ({ name: c.name, value: c.voteCount })) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <StatusBadge status={election.status} />
        <h1 className="text-2xl font-bold text-white mt-2">{election.title}</h1>
        <p className="text-[#94a3b8] text-sm">Election Results</p>
      </div>

      {election.status === "FINALIZED" && winner && (
        <div className="glass-card p-6 border-[#4f6ef7]/30 text-center">
          <div className="w-16 h-16 rounded-full bg-[#4f6ef7]/10 flex items-center justify-center mx-auto mb-3">
            <Award className="w-8 h-8 text-[#6b8cff]" />
          </div>
          <p className="text-[#6b8cff] text-sm font-medium mb-1">WINNER</p>
          <h2 className="text-white text-2xl font-bold">{winner.name}</h2>
          <p className="text-[#94a3b8] mt-1">{winner.voteCount} votes ({totalVotes > 0 ? ((winner.voteCount / totalVotes) * 100).toFixed(1) : 0}%)</p>
          <p className="text-xs text-[#475569] mt-3">Result recorded on blockchain. Subject to quorum requirements.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-white font-semibold">Final Tally</h3>
          {election.candidates?.sort((a: any, b: any) => b.voteCount - a.voteCount).map((c: any, i: number) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f1117]">
              <span className="text-[#475569] text-sm font-bold w-5">#{i + 1}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{c.name}</p>
                <div className="h-1.5 bg-[#252a3d] rounded-full mt-1">
                  <div className="h-full rounded-full" style={{ width: `${totalVotes > 0 ? (c.voteCount / totalVotes * 100) : 0}%`, background: COLORS[i] }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{c.voteCount}</p>
                <p className="text-[#475569] text-xs">{totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-[#252a3d] flex justify-between text-sm">
            <span className="text-[#475569]">Total votes</span>
            <span className="text-white font-bold">{totalVotes} / {election.totalEligibleVoters}</span>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#171b2d", border: "1px solid #252a3d", borderRadius: 8, color: "#e2e8f0" }} />
              <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
