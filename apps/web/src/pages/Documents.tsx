import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { PageLoading } from "../components/ui/Loading";
import { FileArchive, Upload, ExternalLink } from "lucide-react";
import { toast } from "../components/ui/Toaster";
import { useRef, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { format } from "date-fns";

export default function Documents() {
  const { data: docs, isLoading } = useQuery({ queryKey: ["documents"], queryFn: api.getDocuments });
  const { wallet } = useWallet();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("PROPOSAL_DOCUMENT");

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append("file", file);
      fd.append("uploadedBy", wallet.address || "demo"); fd.append("documentType", docType);
      return api.uploadDocument(fd);
    },
    onSuccess: () => { toast.success("Document uploaded!"); qc.invalidateQueries({ queryKey: ["documents"] }); },
    onError: (e: any) => toast.error("Upload failed", e.message),
  });

  if (isLoading) return <PageLoading message="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Documents</h1><p className="text-[#94a3b8] text-sm mt-1">{docs?.length || 0} documents · IPFS-backed storage</p></div>
        <div className="flex gap-3">
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-field text-xs">
            {["PROPOSAL_DOCUMENT","TENDER_REQUIREMENT","BID_DOCUMENT","CANDIDATE_PROFILE","BUDGET_PLAN","CERTIFICATE","PROJECT_REPORT"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadMutation.mutate(e.target.files[0]); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending} className="btn-primary">
            {uploadMutation.isPending ? <span className="loading-spinner" /> : <><Upload className="w-4 h-4" /> Upload</>}
          </button>
        </div>
      </div>
      <div className="glass-card p-4 border-[#4f6ef7]/20">
        <p className="text-[#6b8cff] text-sm font-medium">IPFS Document Storage</p>
        <p className="text-[#475569] text-xs mt-1">Documents are stored on IPFS. CID hashes can be recorded on-chain for tamper detection. In demo mode, a mock CID is generated.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {(docs || []).map((d: any) => (
          <div key={d.id} className="glass-card p-4 flex items-start gap-3">
            <FileArchive className="w-8 h-8 text-[#6b8cff] flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{d.fileName}</p>
              <p className="text-xs text-[#475569]">{d.documentType} · {format(new Date(d.createdAt), "MMM d, yyyy")}</p>
              {d.ipfsCid && <p className="text-xs text-[#6b8cff] font-mono mt-1 truncate">{d.ipfsCid}</p>}
            </div>
          </div>
        ))}
        {(!docs || docs.length === 0) && (
          <div className="glass-card p-12 text-center col-span-2">
            <FileArchive className="w-12 h-12 text-[#252a3d] mx-auto mb-4" />
            <p className="text-white font-medium">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
