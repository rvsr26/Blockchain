import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Building2, Vote, FileText, Package, Users, TrendingUp, Shield, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { StatusBadge } from "../components/ui/Badge";
import { PageLoading } from "../components/ui/Loading";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });
  const { data: elections } = useQuery({ queryKey: ["elections", "recent"], queryFn: () => api.getElections() });
  const { data: proposals } = useQuery({ queryKey: ["proposals", "recent"], queryFn: () => api.getProposals() });
  const { data: tenders } = useQuery({ queryKey: ["tenders", "recent"], queryFn: () => api.getTenders() });

  if (isLoading) return <PageLoading message="Loading dashboard..." />;

  const ov = analytics?.overview || {};
  const metrics = [
    { label: "Organizations", value: ov.totalOrgs || 0, icon: Building2, color: "text-[#6b8cff]", bg: "bg-[#4f6ef7]/10", link: "/organizations" },
    { label: "Active Elections", value: ov.activeElections || 0, icon: Vote, color: "text-green-400", bg: "bg-green-500/10", link: "/elections" },
    { label: "Active Proposals", value: ov.activeProposals || 0, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10", link: "/proposals" },
    { label: "Active Tenders", value: ov.activeTenders || 0, icon: Package, color: "text-amber-400", bg: "bg-amber-500/10", link: "/tenders" },
    { label: "Total Members", value: ov.totalMembers || 0, icon: Users, color: "text-sky-400", bg: "bg-sky-500/10", link: "/members" },
    { label: "Total Votes Cast", value: ov.totalVotes || 0, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10", link: "/elections" },
  ];

  const electionChartData = analytics?.electionStats?.map((s: any) => ({ name: s.status, count: s._count })) || [];
  const COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Blockchain Governance Platform Overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#252a3d] bg-[#171b2d]">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-xs text-[#94a3b8]">Live</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link} className="metric-card hover:border-[#4f6ef7]/30 transition-all cursor-pointer group">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white group-hover:text-[#6b8cff] transition-colors">{value}</p>
              <p className="text-[#475569] text-xs">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4">Election Status Distribution</h3>
          {electionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={electionChartData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#171b2d", border: "1px solid #252a3d", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {electionChartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-[#475569] text-sm">No election data yet</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <Link to="/audit" className="text-xs text-[#6b8cff] hover:text-white transition-colors">View all</Link>
          </div>
          <div className="space-y-2.5">
            {(analytics?.recentActivity || []).slice(0, 6).map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0f1117]/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4f6ef7] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{ev.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-[#475569]">{ev.module} · {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}</p>
                </div>
                <StatusBadge status={ev.status} />
              </div>
            ))}
            {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
              <p className="text-[#475569] text-sm text-center py-4">No recent activity. Run seed script to load demo data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Recent Elections</h3>
            <Link to="/elections" className="text-xs text-[#6b8cff] hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {(elections || []).slice(0, 3).map((e: any) => (
              <Link key={e.id} to={`/elections/${e.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e2438]/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{e.title}</p>
                  <p className="text-xs text-[#475569]">{e.organization?.name}</p>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
            {(!elections || elections.length === 0) && <p className="text-[#475569] text-xs text-center py-2">No elections yet</p>}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Active Proposals</h3>
            <Link to="/proposals" className="text-xs text-[#6b8cff] hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {(proposals || []).slice(0, 3).map((p: any) => (
              <Link key={p.id} to={`/proposals/${p.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e2438]/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{p.title}</p>
                  <p className="text-xs text-[#475569]">₹{Number(p.requestedBudget || 0).toLocaleString()}</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {(!proposals || proposals.length === 0) && <p className="text-[#475569] text-xs text-center py-2">No proposals yet</p>}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Active Tenders</h3>
            <Link to="/tenders" className="text-xs text-[#6b8cff] hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {(tenders || []).slice(0, 3).map((t: any) => (
              <Link key={t.id} to={`/tenders/${t.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1e2438]/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{t.title}</p>
                  <p className="text-xs text-[#475569]">₹{Number(t.estimatedBudget || 0).toLocaleString()}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
            {(!tenders || tenders.length === 0) && <p className="text-[#475569] text-xs text-center py-2">No tenders yet</p>}
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="glass-card p-4 border-amber-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 font-medium text-sm">Privacy & Transparency Notice</p>
          <p className="text-[#94a3b8] text-xs mt-1 leading-relaxed">
            On a public blockchain, votes are linked to wallet addresses providing auditability but NOT full ballot secrecy.
            Privacy-preserving mechanisms (e.g., zk-SNARKs) would be required for production secret-ballot use.
            This platform is an academic prototype — not a production election system.
          </p>
        </div>
      </div>
    </div>
  );
}
