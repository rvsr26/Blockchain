import { useWallet } from "../hooks/useWallet";
import { shortenAddress } from "../services/wallet";
import { Wallet, Shield, Bot, Database, Globe } from "lucide-react";

export default function Settings() {
  const { wallet, disconnect } = useWallet();
  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold text-white">Settings</h1><p className="text-[#94a3b8] text-sm mt-1">Platform configuration and connection status</p></div>
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-white font-semibold">Wallet Connection</h3>
        {wallet.connected ? (
          <div className="space-y-3">
            {[["Address", shortenAddress(wallet.address || "")], ["Network", wallet.network || ""], ["Balance", `${wallet.balance} ETH`], ["Mode", wallet.isDemoMode ? "DEMO MODE" : "MetaMask"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-[#252a3d]/50">
                <span className="text-[#475569] text-sm">{k}</span><span className="text-white text-sm font-mono">{v}</span>
              </div>
            ))}
            <button onClick={disconnect} className="btn-secondary text-red-400 border-red-500/30">Disconnect Wallet</button>
          </div>
        ) : (
          <p className="text-[#475569] text-sm">No wallet connected. Connect MetaMask or use Demo Mode from the header.</p>
        )}
      </div>
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-white font-semibold">Platform Info</h3>
        {[
          { icon: Shield, label: "Smart Contracts", value: "Solidity + Hardhat + OpenZeppelin", color: "text-[#6b8cff]" },
          { icon: Bot, label: "AI Provider", value: process.env.VITE_AI_PROVIDER === "openai" ? "OpenAI" : "Demo Fallback", color: "text-purple-400" },
          { icon: Database, label: "Database", value: "PostgreSQL + Prisma ORM", color: "text-green-400" },
          { icon: Globe, label: "IPFS", value: "Mock adapter (dev mode)", color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-[#252a3d]/50">
            <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-[#94a3b8] text-sm">{label}</span></div>
            <span className="text-white text-sm">{value}</span>
          </div>
        ))}
      </div>
      <div className="glass-card p-4 border-amber-500/20">
        <p className="text-amber-400 font-medium text-sm mb-2">Academic Prototype</p>
        <p className="text-[#475569] text-xs leading-relaxed">This is an academic prototype. Team: Vishnu (CSE23644) — Blockchain/Smart Contracts | Pranav (CSE23611) — Frontend/Backend/AI. Amrita Vishwa Vidyapeetham, B.Tech CSE 2026.</p>
      </div>
    </div>
  );
}
