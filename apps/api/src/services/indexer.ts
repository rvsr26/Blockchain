import { ethers } from "ethers";
import { prisma } from "../utils/db";
import { io } from "../index";
import { logger } from "../utils/logger";

const ELECTION_ABI = [
  "event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime)",
  "event VoteCast(uint256 indexed electionId, address indexed voter, uint256 candidateId)"
];
const PROPOSAL_ABI = [
  "event ProposalCreated(uint256 indexed proposalId, string title, address indexed author)",
  "event Voted(uint256 indexed proposalId, address indexed voter, uint8 voteType)"
];
const TENDER_ABI = [
  "event TenderCreated(uint256 indexed tenderId, string title)",
  "event BidCommitted(uint256 indexed tenderId, address indexed bidder)",
  "event BidRevealed(uint256 indexed tenderId, address indexed bidder, uint256 amount)",
  "event AwardRecorded(uint256 indexed tenderId, address indexed awardedTo, uint256 amount)"
];

export class BlockchainIndexer {
  private provider: ethers.JsonRpcProvider;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
  }

  async start() {
    logger.info("Starting blockchain indexer...");
    
    // In a real application, you'd poll blocks or listen to events
    // Here we'll simulate listening to events on the provider if contract addresses are provided
    
    const electionAddr = process.env.ELECTION_CONTRACT_ADDRESS;
    if (electionAddr) {
      const contract = new ethers.Contract(electionAddr, ELECTION_ABI, this.provider);
      contract.on("ElectionCreated", async (id, title, start, end, event) => {
        logger.info(`Indexer: ElectionCreated ${id}`);
        io.emit("election.created", { contractId: Number(id), title });
      });
      contract.on("VoteCast", async (id, voter, candidateId, event) => {
        logger.info(`Indexer: VoteCast ${id} by ${voter}`);
        io.emit("vote.cast", { contractId: Number(id), voter });
      });
    }

    const proposalAddr = process.env.PROPOSAL_CONTRACT_ADDRESS;
    if (proposalAddr) {
      const contract = new ethers.Contract(proposalAddr, PROPOSAL_ABI, this.provider);
      contract.on("ProposalCreated", async (id, title, author, event) => {
        logger.info(`Indexer: ProposalCreated ${id}`);
        io.emit("proposal.created", { contractId: Number(id), title });
      });
      contract.on("Voted", async (id, voter, voteType, event) => {
        logger.info(`Indexer: Proposal Voted ${id} by ${voter}`);
        io.emit("proposal.voted", { contractId: Number(id), voter });
      });
    }

    const tenderAddr = process.env.TENDER_CONTRACT_ADDRESS;
    if (tenderAddr) {
      const contract = new ethers.Contract(tenderAddr, TENDER_ABI, this.provider);
      contract.on("TenderCreated", async (id, title, event) => {
        logger.info(`Indexer: TenderCreated ${id}`);
        io.emit("tender.created", { contractId: Number(id), title });
      });
      contract.on("BidCommitted", async (id, bidder, event) => {
        logger.info(`Indexer: BidCommitted ${id} by ${bidder}`);
        io.emit("bid.committed", { contractId: Number(id), bidder });
      });
      contract.on("BidRevealed", async (id, bidder, amount, event) => {
        logger.info(`Indexer: BidRevealed ${id} by ${bidder}`);
        io.emit("bid.revealed", { contractId: Number(id), bidder });
      });
    }
  }
}
