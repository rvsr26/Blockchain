import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const prisma = new PrismaClient();

// SYNTHETIC DEMO DATA - NOT REAL STUDENT DATA
const DEMO_WALLETS = [
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
  "0x976ea74026e726554db657fa54763abd0c3a0aa9",
  "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
  "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
  "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
];

async function main() {
  console.log("Seeding demo data (SYNTHETIC - not real data)...");

  // Create organization
  const adminUser = await prisma.user.upsert({
    where: { walletAddress: DEMO_WALLETS[0] },
    update: {},
    create: { walletAddress: DEMO_WALLETS[0], displayName: "Demo Admin", role: "ADMIN" },
  });

  const org = await prisma.organization.upsert({
    where: { id: "demo-org-cse" },
    update: {},
    create: {
      id: "demo-org-cse",
      name: "Amrita CSE Class 2026",
      description: "Computer Science and Engineering batch demonstration organization",
      adminWallet: DEMO_WALLETS[0],
      rules: "Quorum: 50%. Voting period: 72 hours. One vote per registered student.",
      status: "ACTIVE",
    },
  });

  // Create member users (synthetic students)
  const memberWallets = DEMO_WALLETS.slice(1);
  const memberNames = [
    "Pranav Kumar", "Arun Sharma", "Divya Nair", "Karthik Reddy",
    "Meera Pillai", "Suresh Babu", "Ananya Singh", "Rahul Menon", "Pooja Verma",
  ];

  for (let i = 0; i < memberWallets.length; i++) {
    const user = await prisma.user.upsert({
      where: { walletAddress: memberWallets[i] },
      update: {},
      create: { walletAddress: memberWallets[i], displayName: memberNames[i], role: "MEMBER" },
    });
    await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      update: {},
      create: { userId: user.id, organizationId: org.id, role: "MEMBER" },
    });
  }

  // Create demo election
  const election = await prisma.election.upsert({
    where: { id: "demo-election-cr-2026" },
    update: {},
    create: {
      id: "demo-election-cr-2026",
      title: "CSE Class Representative Election 2026",
      description: "Election for selecting the Class Representative for CSE batch 2026. SYNTHETIC DEMONSTRATION DATA.",
      organizationId: org.id,
      electionType: "CR",
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      quorumPercent: 50,
      totalEligibleVoters: 60,
      status: "OPEN",
      creatorWallet: DEMO_WALLETS[0],
    },
  });

  // Candidates (synthetic)
  const candidateData = [
    { name: "Candidate A (Demo)", description: "Focuses on academic excellence and student welfare. Active in coding clubs.", voteCount: 28 },
    { name: "Candidate B (Demo)", description: "Emphasizes event management and inter-college relations. Sports coordinator.", voteCount: 15 },
    { name: "Candidate C (Demo)", description: "Advocates for better lab facilities and industry connections.", voteCount: 5 },
  ];

  for (const c of candidateData) {
    await prisma.candidate.create({
      data: { electionId: election.id, name: c.name, description: c.description, voteCount: c.voteCount },
    }).catch(() => {});
  }

  // Demo proposals
  const proposalData = [
    {
      id: "demo-proposal-hackathon",
      title: "Annual Hackathon 2026",
      description: "Inter-college hackathon to promote innovation and problem-solving skills. Expected 200+ participants.",
      authorWallet: DEMO_WALLETS[1],
      requestedBudget: 20000,
      objectives: "1. Promote coding culture\n2. Industry networking\n3. Innovation showcase",
      status: "ACTIVE",
      yesVotes: 18,
      noVotes: 4,
    },
    {
      id: "demo-proposal-trip",
      title: "Educational Industry Visit",
      description: "Visit to Infosys Mysore campus for exposure to enterprise software practices.",
      authorWallet: DEMO_WALLETS[2],
      requestedBudget: 15000,
      objectives: "Industry exposure for final year students",
      status: "ACTIVE",
      yesVotes: 22,
      noVotes: 8,
    },
    {
      id: "demo-proposal-lab",
      title: "GPU Lab Equipment Upgrade",
      description: "Upgrade GPU lab with 10 additional RTX 4070 cards for ML/AI courses.",
      authorWallet: DEMO_WALLETS[3],
      requestedBudget: 200000,
      objectives: "Better AI/ML learning infrastructure",
      status: "DRAFT",
      yesVotes: 0,
      noVotes: 0,
    },
  ];

  for (const p of proposalData) {
    await prisma.proposal.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...p,
        organizationId: org.id,
        votingDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });
  }

  // Demo tender
  const tender = await prisma.tender.upsert({
    where: { id: "demo-tender-network" },
    update: {},
    create: {
      id: "demo-tender-network",
      title: "Campus Network Equipment Procurement",
      description: "Procurement of network switches, routers, and related equipment for campus network upgrade. SYNTHETIC DEMONSTRATION DATA.",
      organizationId: org.id,
      estimatedBudget: 500000,
      requirements: "IEEE 802.11ax WiFi 6 support, 10 Gbps backbone, 3-year warranty",
      eligibilityCriteria: "ISO certified vendor, minimum 5 years experience, turnover > ₹50L",
      status: "EVALUATION",
      biddingDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
      revealDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      creatorWallet: DEMO_WALLETS[0],
    },
  });

  // Demo bidders
  const bidderData = [
    { wallet: DEMO_WALLETS[4], name: "Vendor Alpha Pvt Ltd", amount: 480000, valid: true },
    { wallet: DEMO_WALLETS[5], name: "Netcom Systems", amount: 460000, valid: true },
    { wallet: DEMO_WALLETS[6], name: "TechLink Solutions", amount: 475000, valid: true },
  ];

  for (const b of bidderData) {
    const user = await prisma.user.upsert({
      where: { walletAddress: b.wallet },
      update: {},
      create: { walletAddress: b.wallet, displayName: b.name, role: "MEMBER" },
    });
    await prisma.bidCommitment.upsert({
      where: { tenderId_bidderWallet: { tenderId: tender.id, bidderWallet: b.wallet } },
      update: {},
      create: {
        tenderId: tender.id,
        bidderWallet: b.wallet,
        commitmentHash: `0x${Buffer.from(`${b.amount}demo-hash`).toString("hex").slice(0, 64)}`,
        revealed: true,
        revealedAmount: b.amount,
        valid: b.valid,
        revealedAt: new Date(),
      },
    });
  }

  // Audit events
  const auditData = [
    { module: "ELECTION", action: "ELECTION_CREATED", actorWallet: DEMO_WALLETS[0], refId: election.id, refType: "election" },
    { module: "ELECTION", action: "CANDIDATE_ADDED", actorWallet: DEMO_WALLETS[0], refId: election.id, refType: "election" },
    { module: "ELECTION", action: "VOTE_CAST", actorWallet: DEMO_WALLETS[1], refId: election.id, refType: "election", txHash: "0xdemo1111" },
    { module: "PROPOSAL", action: "PROPOSAL_CREATED", actorWallet: DEMO_WALLETS[1], refId: "demo-proposal-hackathon", refType: "proposal" },
    { module: "TENDER", action: "TENDER_CREATED", actorWallet: DEMO_WALLETS[0], refId: tender.id, refType: "tender" },
    { module: "TENDER", action: "BID_COMMITTED", actorWallet: DEMO_WALLETS[4], refId: tender.id, refType: "tender", txHash: "0xdemo2222" },
    { module: "TENDER", action: "BID_REVEALED", actorWallet: DEMO_WALLETS[4], refId: tender.id, refType: "tender", txHash: "0xdemo3333" },
  ];

  for (const a of auditData) {
    await prisma.auditEvent.create({ data: { ...a, status: "SUCCESS" } });
  }

  // Reputation events
  await prisma.reputationEvent.create({
    data: { walletAddress: DEMO_WALLETS[1], points: 1, reason: "Participated in governance vote", refId: election.id, refType: "election" }
  });
  await prisma.reputationEvent.create({
    data: { walletAddress: DEMO_WALLETS[1], points: 5, reason: "Submitted useful proposal", refId: "demo-proposal-hackathon", refType: "proposal" }
  });

  console.log("Demo data seeded successfully!");
  console.log("Organization ID:", org.id);
  console.log("Election ID:", election.id);
  console.log("SYNTHETIC DATA - Do not use real student information.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
