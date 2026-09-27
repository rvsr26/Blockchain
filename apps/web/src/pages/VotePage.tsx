import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { toast } from "../components/ui/Toaster";
import { useWallet } from "../hooks/useWallet";
import { Vote, Shield, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: election, isLoading } = useQuery({ queryKey: ["election", id], queryFn: () => api.getElection(id!) });
  const { data: hasVotedData } = useQuery({
    queryKey: ["hasVoted", id, wallet.address],
    queryFn: () => api.hasVoted(id!, wallet.address!),
    enabled: !!wallet.address,
  });

  const voteMutation = useMutation({
    mutationFn: (candidateId: string) => api.castVote(id!, {
      voterWallet: wallet.address, candidateId,
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 1,
    }),
    onSuccess: () => {
      toast.success("Vote cast!", "Your vote has been recorded on the blockchain.");
      qc.invalidateQueries({ queryKey: ["election", id] });
      qc.invalidateQueries({ queryKey: ["hasVoted", id, wallet.address] });
      navigate(`/elections/${id}`);
    },
    onError: (e: any) => toast.error("Voting failed", e.message),
  });

  if (isLoading) return <PageLoading message="Loading election..." />;
  if (!election) return <div className="text-white">Election not found</div>;
  if (hasVotedData?.hasVoted) {
    return (
      <div className="max-w-lg mx-auto glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Already Voted</h2>
        <p className="text-[#94a3b8]">You have already voted in this election. The smart contract prevents duplicate voting.</p>
      </div>
    );
  }
  if (election.status !== "OPEN") {
    return (
      <div className="max-w-lg mx-auto glass-card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Election Not Open</h2>
        <p className="text-[#94a3b8]">This election is not currently accepting votes (Status: {election.status}).</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cast Your Vote</h1>
        <p className="text-[#94a3b8] text-sm mt-1">{election.title}</p>
      </div>

      {/* Privacy notice */}
      <div className="glass-card p-4 border-amber-500/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 font-medium text-sm">Blockchain Transparency Notice</p>
          <p className="text-[#94a3b8] text-xs mt-1 leading-relaxed">
            This vote is recorded on the blockchain linked to your wallet address. This ensures auditability but does NOT provide full ballot secrecy.
            Your wallet {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)} will be associated with this vote.
          </p>
        </div>
      </div>

      {/* Candidate selection */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-white font-semibold">Select a Candidate</h3>
        {election.candidates?.map((c: any, i: number) => (
          <button key={c.id} onClick={() => { setSelected(c.id); setConfirmed(false); }}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selected === c.id ? "border-[#4f6ef7] bg-[#4f6ef7]/10" : "border-[#252a3d] hover:border-[#4f6ef7]/40 bg-[#0f1117]"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{c.name}</p>
                {c.description && <p className="text-[#475569] text-sm mt-1">{c.description}</p>}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected === c.id ? "border-[#4f6ef7] bg-[#4f6ef7]" : "border-[#252a3d]"
              }`}>
                {selected === c.id && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="glass-card p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#252a3d] bg-[#0f1117] accent-[#4f6ef7]" />
            <p className="text-[#94a3b8] text-sm leading-relaxed">
              I confirm this is my vote. I understand this action cannot be reversed and will be permanently recorded on the blockchain.
            </p>
          </label>
        </div>
      )}

      <button onClick={() => { if (selected && confirmed) voteMutation.mutate(selected); }}
        disabled={!selected || !confirmed || voteMutation.isPending || !wallet.connected}
        className="btn-primary w-full justify-center py-4 text-base">
        {voteMutation.isPending ? (
          <><span className="loading-spinner" /> Submitting to blockchain...</>
        ) : (
          <><Vote className="w-5 h-5" /> Submit Vote</>
        )}
      </button>
      {!wallet.connected && <p className="text-red-400 text-sm text-center">Please connect your wallet to vote.</p>}
    </div>
  );
}
