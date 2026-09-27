import { Wallet, LogOut, Bell, ChevronDown, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { shortenAddress } from "../../services/wallet";
import { WalletState } from "../../services/wallet";
import { useWallet } from "../../hooks/useWallet";

interface Props { wallet: WalletState; }

export default function Header({ wallet }: Props) {
  const { connect, connectDemo, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setConnecting(true); setError("");
    try { await connect(); } catch (e: any) { setError(e.message); } finally { setConnecting(false); }
  };
  const handleDemo = async () => {
    setConnecting(true);
    try { await connectDemo(); } finally { setConnecting(false); }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[#252a3d] bg-[#0d1121]/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {wallet.connected ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs text-[#94a3b8]">{wallet.network}</span>
            {wallet.isDemoMode && (
              <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                DEMO MODE
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Not connected</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-[#1e2438] transition-colors text-[#475569] hover:text-white">
          <Bell className="w-4 h-4" />
        </button>

        {wallet.connected ? (
          <div className="relative">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#252a3d] bg-[#171b2d] hover:border-[#4f6ef7]/40 transition-all text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f6ef7] to-[#7c3aed] flex items-center justify-center text-white text-xs font-bold">
                {wallet.address?.slice(2, 4).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-xs">{shortenAddress(wallet.address || "")}</p>
                <p className="text-[#475569] text-[10px]">{wallet.balance} ETH</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#475569]" />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card p-1 z-50">
                <button onClick={() => { disconnect(); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[#1e2438] rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-400 max-w-48 truncate">{error}</p>}
            <button onClick={handleDemo} disabled={connecting} className="btn-secondary text-xs py-1.5">
              {connecting ? <span className="loading-spinner" /> : "Demo Mode"}
            </button>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary text-xs py-1.5">
              <Wallet className="w-3.5 h-3.5" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
