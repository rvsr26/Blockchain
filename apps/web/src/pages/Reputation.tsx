import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { Award, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Reputation() {
  const { data, isLoading } = useQuery({ queryKey: ["reputation"], queryFn: () => api.getReputation() });
  if (isLoading) return <PageLoading />;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Reputation</h1><p className="text-[#94a3b8] text-sm mt-1">Contribution-based reputation scores. Advisory only — does not replace formal eligibility.</p></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Leaderboard</h3>
          {(data?.leaderboard || []).map((l: any, i: number) => (
            <div key={l.wallet} className="flex items-center justify-between py-2.5 border-b border-[#252a3d]/50">
              <div className="flex items-center gap-3">
                <span className="text-[#475569] font-bold w-6">#{i + 1}</span>
                <p className="text-sm text-white font-mono">{l.wallet.slice(0, 10)}...{l.wallet.slice(-4)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#6b8cff]" /><span className="text-[#6b8cff] font-bold">{l.score}</span>
              </div>
            </div>
          ))}
          {(!data?.leaderboard || data.leaderboard.length === 0) && <p className="text-[#475569] text-sm text-center py-4">No reputation data yet</p>}
        </div>
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Recent Events</h3>
          {(data?.events || []).slice(0, 8).map((e: any) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#252a3d]/50">
              <div>
                <p className="text-sm text-white">{e.reason}</p>
                <p className="text-xs text-[#475569] font-mono">{e.walletAddress.slice(0, 10)}... · {format(new Date(e.createdAt), "MMM d")}</p>
              </div>
              <span className={`font-bold text-sm ${e.points > 0 ? "text-green-400" : "text-red-400"}`}>+{e.points}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-4 border-amber-500/20">
        <p className="text-amber-400 text-sm font-medium mb-1">Important Note</p>
        <p className="text-[#94a3b8] text-xs leading-relaxed">Reputation scores are contribution indicators only. They do NOT automatically replace formal eligibility requirements for elections or tenders. The scoring formula is configurable by organization admins.</p>
      </div>
    </div>
  );
}
