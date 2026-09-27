// ============================================================
// Shared TypeScript types for the Governance Platform frontend
// ============================================================

export type UserRole =
  | "SUPER_ADMIN" | "ADMIN" | "COORDINATOR" | "COMMITTEE_MEMBER"
  | "MEMBER" | "VOTER" | "CANDIDATE" | "BIDDER" | "REVIEWER" | "AUDITOR";

export type ElectionStatus = "DRAFT" | "OPEN" | "CLOSED" | "FINALIZED";
export type ProposalStatus = "DRAFT" | "ACTIVE" | "SUCCEEDED" | "DEFEATED" | "EXECUTED" | "EXPIRED";
export type TenderStatus = "DRAFT" | "PUBLISHED" | "BIDDING_OPEN" | "CLOSED" | "EVALUATION" | "AWARDED" | "CANCELLED";

export interface User {
  id: string;
  walletAddress: string;
  displayName?: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  adminWallet: string;
  rules?: string;
  status: string;
  createdAt: string;
  _count?: { members: number; elections: number; proposals: number; tenders: number };
}

export interface Candidate {
  id: string;
  electionId: string;
  name: string;
  description?: string;
  ipfsCid?: string;
  voteCount: number;
  contractId?: number;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  electionType: string;
  startTime: string;
  endTime: string;
  quorumPercent: number;
  totalEligibleVoters: number;
  status: ElectionStatus;
  contractElectionId?: number;
  creatorWallet: string;
  winnerCandidateId?: string;
  createdAt: string;
  candidates: Candidate[];
  organization?: { name: string };
  votes?: Vote[];
  _count?: { votes: number };
}

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  voterWallet: string;
  txHash?: string;
  blockNumber?: number;
  castAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  authorWallet: string;
  requestedBudget?: number;
  objectives?: string;
  timeline?: string;
  status: ProposalStatus;
  ipfsCid?: string;
  votingDeadline?: string;
  yesVotes: number;
  noVotes: number;
  createdAt: string;
  organization?: { name: string };
  aiAnalyses?: AiAnalysis[];
  _count?: { proposalVotes: number };
}

export interface Tender {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  estimatedBudget?: number;
  requirements?: string;
  eligibilityCriteria?: string;
  status: TenderStatus;
  ipfsCid?: string;
  biddingDeadline?: string;
  revealDeadline?: string;
  awardedBidder?: string;
  awardedAmount?: number;
  awardNotes?: string;
  awardedBy?: string;
  creatorWallet: string;
  createdAt: string;
  organization?: { name: string };
  bidCommitments?: BidCommitment[];
  aiAnalyses?: AiAnalysis[];
  _count?: { bidCommitments: number };
}

export interface BidCommitment {
  id: string;
  tenderId: string;
  bidderWallet: string;
  commitmentHash: string;
  revealed: boolean;
  revealedAmount?: number;
  valid?: boolean;
  txHashCommit?: string;
  txHashReveal?: string;
  committedAt: string;
  revealedAt?: string;
}

export interface AiAnalysis {
  id: string;
  refId: string;
  refType: string;
  summary?: string;
  analysisJson: string;
  confidence: string;
  provider: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  module: string;
  action: string;
  actorWallet?: string;
  refId?: string;
  refType?: string;
  txHash?: string;
  blockNumber?: number;
  status: string;
  details?: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalOrgs: number;
  totalElections: number;
  totalProposals: number;
  totalTenders: number;
  totalMembers: number;
  activeElections: number;
  activeProposals: number;
  activeTenders: number;
  totalVotes: number;
}

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  isDemoMode: boolean;
  network?: string;
}
