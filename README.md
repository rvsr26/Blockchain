# ChainGov — Blockchain-Based Transparent Governance, Election and Tender Management Platform

> **Subtitle:** A General-Purpose Web3 Platform for Transparent Voting, Secure Proposals, Tendering and AI-Assisted Decision Support

**Team:**
- Vishnu — CSE23644 (Blockchain, Smart Contracts, Hardhat, Web3 Integration)
- Pranav — CSE23611 (React Frontend, Node.js Backend, AI Integration, Analytics)

**Institution:** Amrita Vishwa Vidyapeetham — B.Tech Computer Science and Engineering — Academic Project 2026

---

## ⚠️ Academic Prototype Disclaimer

This is an academic prototype demonstrating how blockchain, IPFS, AI, and conventional application services can be combined to provide transparent, auditable, and configurable governance workflows. It is NOT:
- A replacement for official government election infrastructure
- A legally binding procurement platform
- A production-ready national voting system
- A claim of perfect AI accuracy or complete decentralization

All demo data is **synthetic** and does not represent real students, vendors, or government processes.

---

## Project Overview

ChainGov is a **general-purpose configurable governance platform** supporting:
- College CR elections and student club elections
- Department/committee representative selection
- Class proposals, club budget approvals
- Community governance and DAO governance
- Organization/vendor selection and procurement
- Tender management and grant allocation

### Core Architecture Principle

```
Blockchain enforces critical rules → Records important events
AI provides advisory analysis → Humans make final decisions
IPFS stores large documents → Traditional DB for indexing/search
```

---

## Features

### Election Module
- Smart-contract enforced voting (one eligible member, one vote)
- Duplicate vote prevention at contract AND database layers
- Election state machine: DRAFT → OPEN → CLOSED → FINALIZED
- On-chain vote recording with wallet linkage (transparency, not secrecy)
- Configurable quorum requirements
- Demo: CSE Class Representative Election 2026

### Proposal Module
- Community/organization proposal submission
- AI-assisted analysis (missing info, risks, reviewer questions)
- On-chain voting records
- State machine: DRAFT → ACTIVE → SUCCEEDED/DEFEATED → EXECUTED
- Human reviewers make final decisions

### Tender Module
- **Commit-reveal bidding**: `commitmentHash = keccak256(bidAmount + secret)`
- Bidders submit hash first; reveal after bidding deadline
- Contract verifies reveal matches commitment
- AI analyzes bid documents (advisory only)
- **Award requires authorized human approval** (never automatic)
- State machine: DRAFT → PUBLISHED → BIDDING_OPEN → CLOSED → EVALUATION → AWARDED

### Additional Features
- IPFS document storage (mock adapter for development)
- AI assistant chat interface
- Complete audit trail with blockchain tx references
- Analytics dashboards with Recharts visualizations
- Reputation/contribution tracking module
- Role-based access control (9 roles)
- Dark/light professional enterprise UI

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Blockchain | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Web3 | ethers.js v6, MetaMask |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Storage | IPFS (mock adapter for dev) |
| AI | OpenAI API (demo fallback if no key) |
| Auth | JWT + Wallet signature |
| Charts | Recharts |
| Icons | Lucide React |

---

## Repository Structure

```
blockchain-governance-platform/
├── apps/
│   ├── web/                    # React frontend (Vite + TypeScript)
│   └── api/                    # Node.js + Express backend
├── packages/
│   └── contracts/              # Solidity smart contracts
├── data/
│   ├── elections/              # Synthetic election datasets
│   ├── proposals/              # Synthetic proposal datasets
│   ├── tenders/                # Synthetic tender datasets
│   └── ai/                     # AI labelled examples
├── docs/                       # Documentation
├── .env.example                # Environment variable template
├── docker-compose.yml          # Docker services
└── README.md
```

---

## Installation and Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 14+ (or Docker)
- MetaMask browser extension (or use Demo Mode)

### Step 1: Clone and Install

```bash
git clone <repo-url>
cd blockchain-governance-platform

# Install all dependencies
cd packages/contracts && npm install && cd ../..
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### Step 3: Start Blockchain (Local Hardhat)

```bash
cd packages/contracts
npm run node          # Starts local blockchain on port 8545
# In another terminal:
npm run compile       # Compile Solidity contracts
npm run deploy        # Deploy to local network
```

### Step 4: Setup Database

```bash
cd apps/api
npm run db:push       # Push Prisma schema to PostgreSQL
npm run seed          # Load synthetic demo data
```

### Step 5: Start the Application

```bash
# Terminal 1: API
cd apps/api && npm run dev

# Terminal 2: Frontend
cd apps/web && npm run dev
```

Access at: http://localhost:5173

---

## Environment Variables

See `.env.example` for all variables. Key ones:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/governance_platform
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<hardhat-test-key-only>
OPENAI_API_KEY=                    # Leave empty for demo AI responses
JWT_SECRET=<32-char-secret>
DEMO_MODE=true
```

⚠️ **Never use personal wallet private keys. Use Hardhat test accounts only.**

---

## Smart Contracts

### ElectionContract.sol
- `createElection()` — COORDINATOR_ROLE only
- `addCandidate()` — COORDINATOR_ROLE, DRAFT state only
- `registerMember()` — COORDINATOR_ROLE
- `openElection()` — Min 2 candidates required
- `castVote()` — Eligible member, once only, within deadline
- `closeElection()` — COORDINATOR_ROLE
- `finalizeElection()` — COORDINATOR_ROLE, CLOSED state only

### ProposalContract.sol
- `createProposal()` — Any member
- `activateProposal()` — COORDINATOR_ROLE
- `voteProposal()` — Eligible voter, 0=YES, 1=NO, 2=ABSTAIN
- `finalizeProposal()` — COORDINATOR_ROLE, after deadline
- `executeProposal()` — COORDINATOR_ROLE, SUCCEEDED state

### TenderContract.sol
- `createTender()` — COORDINATOR_ROLE
- `submitCommitment()` — Authorized bidder, before deadline
- `revealBid()` — After bidding closed, within reveal deadline
- `recordAward()` — REVIEWER_ROLE only (human decision required)

---

## Demo Mode

The application can run fully in Demo Mode without MetaMask:

1. Click **"Demo Mode"** in the header
2. Loads synthetic demo organization, election, proposals, tenders
3. Demonstrates all features without real blockchain

Demo data includes:
- CSE Class Representative Election (synthetic, 60 students)
- Candidate A: 28 votes, Candidate B: 15, Candidate C: 5
- Annual Hackathon proposal
- Campus Network Equipment tender with commit-reveal bids

---

## Running Tests

```bash
# Smart contract tests
cd packages/contracts
npm test

# Backend API tests
cd apps/api
npm test
```

Test coverage includes:
- Duplicate vote prevention
- Unauthorized access rejection
- Commit-reveal verification
- Incorrect reveal rejection
- Invalid state transitions
- Award authorization checks

---

## Security Considerations

| Threat | Mitigation |
|--------|-----------|
| Duplicate voting | `hasVoted[election][member]` mapping |
| Unauthorized actions | OpenZeppelin AccessControl |
| Bid spying | Commit-reveal scheme |
| Document tampering | IPFS content addressing |
| AI prompt injection | Input sanitization, structured output |
| AI hallucination | Advisory-only display, human verification |
| Private vote exposure | Known limitation — see privacy notice |
| Smart contract bugs | Comprehensive test suite |

### Vote Privacy Notice

> On a public blockchain, votes are linked to wallet addresses. This provides **auditability** but does NOT provide **full ballot secrecy**. Privacy-preserving mechanisms (zk-SNARKs, commit-reveal voting) would be required for production secret-ballot use. This prototype clearly distinguishes transparency from secrecy.

---

## Synthetic Dataset Information

All data in `/data/` is **synthetically generated** for demonstration purposes:
- No real student names, wallet addresses, or personal data
- No real vendor companies, bid amounts, or procurement data
- Candidate names are generic (Candidate A, B, C)
- All blockchain addresses are Hardhat test accounts

---

## Future Improvements

1. Privacy-preserving voting (zk-SNARK based)
2. Real IPFS integration (Pinata/Web3.Storage)
3. Multi-signature authorization for critical actions
4. Layer 2 deployment for gas efficiency
5. Mobile application
6. Email/push notifications
7. Advanced AI with RAG on governance documents
8. Cross-organization governance federation

---

## API Documentation

See `/docs/api.md` for complete API reference.

---

## Limitations

- Local Hardhat network only (no real testnet in basic setup)
- IPFS is mocked in development
- AI uses demo responses without OpenAI key
- Not production-audited for security
- No real identity verification (wallet ≠ person)

---

*Academic Project — Amrita Vishwa Vidyapeetham — B.Tech CSE — 2026*

