import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../services/socket";
import { toast } from "../components/ui/Toaster";

export function useRealTimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function handleElectionCreated(data: any) {
      queryClient.invalidateQueries({ queryKey: ["elections"] });
      toast.success("New Election: " + data.title);
    }

    function handleVoteCast(data: any) {
      queryClient.invalidateQueries({ queryKey: ["elections"] });
      queryClient.invalidateQueries({ queryKey: ["election", String(data.contractId)] });
    }

    function handleProposalCreated(data: any) {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("New Proposal: " + data.title);
    }

    function handleProposalVoted(data: any) {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["proposal", String(data.contractId)] });
    }

    function handleTenderCreated(data: any) {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      toast.success("New Tender: " + data.title);
    }

    function handleBidCommitted(data: any) {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
      queryClient.invalidateQueries({ queryKey: ["tender", String(data.contractId)] });
    }

    function handleBidRevealed(data: any) {
      queryClient.invalidateQueries({ queryKey: ["tender", String(data.contractId)] });
    }

    function handleDocumentUploaded(data: any) {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document Uploaded: " + data.fileName);
    }

    function handleAiAnalysisCompleted(data: any) {
      queryClient.invalidateQueries({ queryKey: [data.refType, String(data.refId)] });
      toast.success("AI Analysis Completed for " + data.refType);
    }

    socket.on("election.created", handleElectionCreated);
    socket.on("vote.cast", handleVoteCast);
    socket.on("proposal.created", handleProposalCreated);
    socket.on("proposal.voted", handleProposalVoted);
    socket.on("tender.created", handleTenderCreated);
    socket.on("bid.committed", handleBidCommitted);
    socket.on("bid.revealed", handleBidRevealed);
    socket.on("document.uploaded", handleDocumentUploaded);
    socket.on("ai.analysis.completed", handleAiAnalysisCompleted);

    return () => {
      socket.off("election.created", handleElectionCreated);
      socket.off("vote.cast", handleVoteCast);
      socket.off("proposal.created", handleProposalCreated);
      socket.off("proposal.voted", handleProposalVoted);
      socket.off("tender.created", handleTenderCreated);
      socket.off("bid.committed", handleBidCommitted);
      socket.off("bid.revealed", handleBidRevealed);
      socket.off("document.uploaded", handleDocumentUploaded);
      socket.off("ai.analysis.completed", handleAiAnalysisCompleted);
    };
  }, [queryClient, toast]);
}
