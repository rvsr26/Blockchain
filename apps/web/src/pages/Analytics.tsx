import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, PieChart, Pie, Legend } from "recharts";

const COLORS = ["#4f6ef7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });

  if (isLoading) return <PageLoading message="Loading analytics..." />;

  const ov = analytics?.overview || {};
  const elData = analytics?.electionStats?.map((s: any) => ({ name: s.status, value: s._count })) || [];
  const propData = analytics?.proposalStats?.map((s: any) => ({ name: s.status, value: s._count })) || [];
  const tenderData = analytics?.tenderStats?.map((s: any) => ({ name: s.status, value: s._count })) || [];

  const overview = [
    { label: "Elections", value: ov.totalElections || 0, active: ov.activeElections || 0 },
    { label: "Proposals", value: ov.totalProposals || 0, active: ov.activeProposals || 0 },
    { label: "Tenders", value: ov.totalTenders || 0, active: ov.activeTenders || 0 },
    { label: "Members", value: ov.totalMembers || 0, active: ov.totalOrgs || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Platform-wide statistics and insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overview.map(({ label, value, active }) => (
          <div key={label} className="metric-card">
            <div><p className="text-3xl font-bold text-white">{value}</p><p className="text-[#475569] text-xs">{label}</p></div>
            <p className="text-xs text-[#6b8cff]">{active} active</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Elections by Status", data: elData },
          { title: "Proposals by Status", data: propData },
          { title: "Tenders by Status", data: tenderData },
        ].map(({ title, data }) => (
          <div key={title} className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">{title}</h3>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} barSize={30}>
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#171b2d", border: "1px solid #252a3d", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-[#475569] text-sm">No data yet</div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="text-white font-semibold mb-4">Platform Overview Pie</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={[
              { name: "Elections", value: ov.totalElections || 0 },
              { name: "Proposals", value: ov.totalProposals || 0 },
              { name: "Tenders", value: ov.totalTenders || 0 },
            ]} cx="50%" cy="50%" outerRadius={80} dataKey="value">
              {[0,1,2].map((i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#171b2d", border: "1px solid #252a3d", borderRadius: 8, color: "#e2e8f0" }} />
            <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
