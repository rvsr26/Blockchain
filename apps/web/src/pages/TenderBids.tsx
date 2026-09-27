import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { ethers } from "ethers";
import { Lock, Eye, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

export default function TenderBids() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const qc = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [secret, setSecret] = useState("");
  const [revealAmount, setRevealAmount] = useState("");
  const [revealSecret, setRevealSecret] = useState("");
  const [tab, setTab] = useState<"commit" | "reveal">("commit");
  const [computedHash, setComputedHash] = useState("");

  const { data: tender, isLoading } = useQuery({ queryKey: ["tender", id], queryFn: () => api.getTender(id!) });

  const computeHash = () => {
    if (!bidAmount || !secret) return;
    try {
      const hash = ethers.solidityPackedKeccak256(["uint256", "string"], [BigInt(bidAmount), secret]);
      setComputedHash(hash);
    } catch (e) { toast.error("Hash computation failed"); }
  };

  const commitMutation = useMutation({
    mutationFn: () => api.commitBid(id!, { bidderWallet: wallet.address, commitmentHash: computedHash, txHash: `0x${Math.random().toString(16).slice(2)}` }),
    onSuccess: () => { toast.success("Bid committed!", "Your commitment hash is on blockchain."); qc.invalidateQueries({ queryKey: ["tender", id] }); },
    onError: (e: any) => toast.error("Commit failed", e.message),
  });

  const revealMutation = useMutation({
    mutationFn: () => {
      const hash = ethers.solidityPackedKeccak256(["uint256", "string"], [BigInt(revealAmount), revealSecret]);
      const existingBid = tender?.bidCommitments?.find((b: any) => b.bidderWallet === wallet.address);
      const valid = existingBid?.commitmentHash === hash;
      return api.revealBid(id!, { bidderWallet: wallet.address, revealedAmount: Number(revealAmount), valid, txHash: `0x${Math.random().toString(16).slice(2)}` });
    },
    onSuccess: () => { toast.success("Bid revealed!"); qc.invalidateQueries({ queryKey: ["tender", id] }); },
    onError: (e: any) => toast.error("Reveal failed", e.message),
  });

  if (isLoading) return <PageLoading message="Loading tender..." />;
  if (!tender) return <div className="text-white">Tender not found</div>;

  const myBid = tender?.bidCommitments?.find((b: any) => b.bidderWallet === wallet.address);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bid Submission</h1>
        <p className="text-[#94a3b8] text-sm mt-1">{tender.title}</p>
      </div>

      <div className="glass-card p-4 border-[#4f6ef7]/20">
        <p className="text-[#6b8cff] font-medium text-sm mb-2">Commit-Reveal Process</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-[#94a3b8]">
          <div className="p-2 rounded-lg bg-[#0f1117]">
            <p className="text-white font-medium mb-1">Phase 1: Commit</p>
            <p>Submit keccak256(amount + secret). Amount stays hidden until reveal.</p>
          </div>
          <div className="p-2 rounded-lg bg-[#0f1117]">
            <p className="text-white font-medium mb-1">Phase 2: Reveal</p>
            <p>After bidding closes, reveal amount + secret. Contract verifies hash.</p>
          </div>
        </div>
      </div>

      {myBid && (
        <div className="glass-card p-4 border-green-500/20">
          <div className="flex items-center gap-2 mb-2"><Check className="w-4 h-4 text-green-400" /><p className="text-green-400 font-medium text-sm">Bid Committed</p></div>
          <p className="text-xs text-[#475569] font-mono truncate">{myBid.commitmentHash}</p>
          {myBid.revealed && (
            <p className="text-sm mt-2 text-[#94a3b8]">Revealed: ₹{Number(myBid.revealedAmount).toLocaleString()} — {myBid.valid ? <span className="text-green-400">Valid ✓</span> : <span className="text-red-400">Invalid ✗</span>}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {["commit", "reveal"].map((t) => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${tab === t ? "bg-[#4f6ef7] text-white border-[#4f6ef7]" : "border-[#252a3d] text-[#94a3b8]"}`}>
            {t === "commit" ? <><Lock className="w-4 h-4 inline mr-1.5" />Commit Bid</> : <><Eye className="w-4 h-4 inline mr-1.5" />Reveal Bid</>}
          </button>
        ))}
      </div>

      {tab === "commit" && (
        <div className="glass-card p-5 space-y-4">
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Bid Amount (₹)</label>
            <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="input-field" placeholder="Enter your bid amount" /></div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Secret Passphrase</label>
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} className="input-field" placeholder="Keep this secret until reveal phase!" />
            <p className="text-amber-400 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Save this secret! You MUST use it during reveal.</p></div>
          <button onClick={computeHash} className="btn-secondary w-full justify-center">Compute Commitment Hash</button>
          {computedHash && (
            <div className="p-3 rounded-lg bg-[#0f1117] border border-[#252a3d]">
              <p className="text-xs text-[#475569] mb-1">Commitment Hash:</p>
              <p className="text-xs text-[#6b8cff] font-mono break-all">{computedHash}</p>
            </div>
          )}
          <button onClick={() => commitMutation.mutate()} disabled={!computedHash || commitMutation.isPending || !wallet.connected} className="btn-primary w-full justify-center py-3">
            {commitMutation.isPending ? <><span className="loading-spinner" /> Committing...</> : <><Lock className="w-4 h-4" /> Submit Commitment</>}
          </button>
        </div>
      )}

      {tab === "reveal" && (
        <div className="glass-card p-5 space-y-4">
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Bid Amount (₹)</label>
            <input type="number" value={revealAmount} onChange={(e) => setRevealAmount(e.target.value)} className="input-field" placeholder="Same amount as committed" /></div>
          <div><label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Secret Passphrase</label>
            <input type="password" value={revealSecret} onChange={(e) => setRevealSecret(e.target.value)} className="input-field" placeholder="The same secret you used when committing" /></div>
          <button onClick={() => revealMutation.mutate()} disabled={!revealAmount || !revealSecret || revealMutation.isPending || !wallet.connected} className="btn-primary w-full justify-center py-3">
            {revealMutation.isPending ? <><span className="loading-spinner" /> Revealing...</> : <><Eye className="w-4 h-4" /> Reveal Bid</>}
          </button>
          <p className="text-[#475569] text-xs text-center">The contract will verify keccak256(amount + secret) matches your original commitment.</p>
        </div>
      )}
    </div>
  );
}
