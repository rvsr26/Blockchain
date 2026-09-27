import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Vote, FileText, Package,
  FileArchive, Bot, BarChart3, Shield, Award, Settings, ChevronRight, Zap
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/organizations", icon: Building2, label: "Organizations" },
  { path: "/members", icon: Users, label: "Members" },
  { path: "/elections", icon: Vote, label: "Elections" },
  { path: "/proposals", icon: FileText, label: "Proposals" },
  { path: "/tenders", icon: Package, label: "Tenders" },
  { path: "/documents", icon: FileArchive, label: "Documents" },
  { path: "/ai-assistant", icon: Bot, label: "AI Assistant" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/audit", icon: Shield, label: "Audit Trail" },
  { path: "/reputation", icon: Award, label: "Reputation" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#252a3d] bg-[#0d1121]/90">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#252a3d]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#4f6ef7]/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-sm tracking-tight">ChainGov</span>
          <p className="text-[10px] text-[#475569] leading-none mt-0.5">Blockchain Governance</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-link ${isActive || location.pathname.startsWith(path) && path !== "/dashboard" ? "active" : ""}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-[#252a3d]">
        <div className="glass-card p-3 text-xs">
          <p className="text-[#6b8cff] font-medium mb-1">Academic Prototype</p>
          <p className="text-[#475569] leading-relaxed">Amrita Vishwa Vidyapeetham — CSE 2026</p>
        </div>
      </div>
    </aside>
  );
}
