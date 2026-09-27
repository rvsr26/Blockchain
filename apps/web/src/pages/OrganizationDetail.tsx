import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { StatusBadge } from "../components/ui/Badge";
import { Vote, FileText, Package, Users } from "lucide-react";

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useQuery({ queryKey: ["organization", id], queryFn: () => api.getOrganization(id!) });

  if (isLoading) return <PageLoading />;
  if (!org) return <div className="text-white">Organization not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
        <p className="text-[#94a3b8] text-sm mt-1">{org.description}</p>
        <p className="text-xs text-[#475569] mt-1 font-mono">Admin: {org.adminWallet}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="text-white font-semibold">Elections ({org.elections?.length || 0})</h3><Link to="/elections" className="text-xs text-[#6b8cff]">View all</Link></div>
          {(org.elections || []).slice(0, 5).map((e: any) => (
            <Link key={e.id} to={`/elections/${e.id}`} className="flex items-center justify-between py-2 border-b border-[#252a3d]/50 hover:text-[#6b8cff] transition-colors">
              <span className="text-sm text-white">{e.title}</span><StatusBadge status={e.status} />
            </Link>
          ))}
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="text-white font-semibold">Members ({org.members?.length || 0})</h3></div>
          {(org.members || []).slice(0, 5).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-[#252a3d]/50">
              <span className="text-sm text-white">{m.user?.displayName || m.user?.walletAddress?.slice(0, 10)}</span>
              <span className="text-xs text-[#475569]">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
