import { Link } from "react-router-dom";
import { Shield, Bot, FileText, Vote, Package, Zap, ChevronRight, Lock, Eye, Users, BarChart3 } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useState } from "react";

export default function Landing() {
  const { connectDemo } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try { await connectDemo(); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#252a3d]/50 sticky top-0 z-50 bg-[#0b0f1a]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">ChainGov</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDemo} disabled={loading}
            className="btn-secondary text-sm py-2">
            {loading ? <span className="loading-spinner" /> : "Demo Mode"}
          </button>
          <Link to="/dashboard" className="btn-primary text-sm py-2">
            Launch Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#4f6ef7]/5 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#252a3d] bg-[#171b2d] text-xs text-[#6b8cff] mb-8 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Academic Prototype — Amrita Vishwa Vidyapeetham, CSE 2026
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Transparent Governance.<br />
            <span className="gradient-text">Verifiable Decisions.</span><br />
            AI-Assisted Analysis.
          </h1>
          <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            A general-purpose Web3 platform combining blockchain auditability, IPFS document storage, 
            and AI advisory analysis for elections, proposals, and procurement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
              Launch Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
            <button onClick={handleDemo} disabled={loading} className="btn-secondary px-6 py-3 text-base">
              {loading ? <span className="loading-spinner" /> : <>Explore Demo</>}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-3">Platform Capabilities</h2>
          <p className="text-[#94a3b8] text-center mb-12 text-sm">Three integrated modules sharing common infrastructure</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Vote, title: "Election Module", desc: "Smart-contract enforced voting. One eligible member, one vote. Duplicate prevention at contract and DB layers. Finalize results on-chain.", color: "from-[#4f6ef7] to-[#6b4fff]" },
              { icon: FileText, title: "Proposal Module", desc: "Community proposals with AI-assisted analysis. On-chain voting records. Human reviewers make final decisions. Complete audit trail.", color: "from-[#059669] to-[#10b981]" },
              { icon: Package, title: "Tender Module", desc: "Commit-reveal bidding prevents front-running. AI analyzes documents. Award must be authorized by human reviewer. Full blockchain audit.", color: "from-[#d97706] to-[#f59e0b]" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6 hover:border-[#4f6ef7]/30 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-3">System Architecture</h2>
          <p className="text-[#94a3b8] text-center mb-12 text-sm">Layered design — blockchain enforces rules, AI advises, humans decide</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: "Blockchain", desc: "Smart contracts enforce voting rules, state machines, commit-reveal. Solidity + Hardhat + OpenZeppelin.", color: "text-[#6b8cff]", bg: "bg-[#4f6ef7]/10" },
              { icon: Bot, title: "AI (Advisory)", desc: "Analyzes proposals and tenders. Flags missing info, risks. Never casts votes or awards tenders.", color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: Lock, title: "IPFS", desc: "Stores large documents. CIDs recorded on-chain for tamper detection. Works with mock adapter in dev.", color: "text-amber-400", bg: "bg-amber-500/10" },
              { icon: BarChart3, title: "Database", desc: "PostgreSQL for search, analytics, AI results, and blockchain event indexing. Not source of truth.", color: "text-green-400", bg: "bg-green-500/10" },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="glass-card p-5 text-center">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-white font-medium mb-2">{title}</h3>
                <p className="text-[#475569] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-8 py-12">
        <div className="max-w-3xl mx-auto glass-card p-6 border-amber-500/20">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-400 font-semibold mb-2">Academic Prototype Disclaimer</h3>
              <p className="text-[#94a3b8] text-sm leading-relaxed">
                This prototype demonstrates how blockchain, IPFS, AI, and conventional application services can be combined
                to provide transparent, auditable, and configurable governance workflows. It is NOT a replacement for official
                government election infrastructure, a legally binding procurement platform, or a production-ready system.
                All demo data is synthetic and does not represent real students, vendors, or government processes.
              </p>
              <p className="text-[#475569] text-xs mt-2">
                Team: Vishnu (CSE23644) — Blockchain/Smart Contracts | Pranav (CSE23611) — Frontend/Backend/AI
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 py-8 border-t border-[#252a3d] text-center text-xs text-[#475569]">
        <p>ChainGov — Blockchain Governance Platform | B.Tech CSE | Amrita Vishwa Vidyapeetham | 2026</p>
      </footer>
    </div>
  );
}
