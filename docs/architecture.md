# System Architecture

## Overview

ChainGov follows a layered architecture where each layer has a clear responsibility:

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Vite + TypeScript)       │
│     Dashboard · Elections · Proposals · Tenders       │
└──────────────────────┬──────────────────────────────┘
                       │ REST API / ethers.js
┌──────────────────────▼──────────────────────────────┐
│           Node.js / Express Backend API               │
│    Auth · Business Logic · AI Service · Indexer       │
└────────┬──────────────────┬───────────────────────────┘
         │                  │
┌────────▼────────┐  ┌──────▼──────────────────────────┐
│   PostgreSQL DB  │  │     EVM Blockchain (Hardhat)    │
│  Search/Index   │  │  ElectionContract, ProposalCon  │
│  AI Results     │  │  tract, TenderContract          │
│  Analytics      │  └──────────────────────────────────┘
└─────────────────┘
         │
┌────────▼────────┐
│   IPFS Storage  │
│  (Mock in dev)  │
└─────────────────┘
         │ Advisory only
┌────────▼────────┐
│   AI Service    │
│ (OpenAI/Demo)   │
└─────────────────┘
```

## Core Principle

**Blockchain enforces critical rules. AI advises. Humans decide.**

- Blockchain: Voting rules, state machines, commitments, awards
- AI: Analysis, summaries, risk flags (advisory only)
- Database: Searchable index, analytics, non-critical data
- IPFS: Large documents with CID-based tamper detection

## State Machines

### Election: DRAFT → OPEN → CLOSED → FINALIZED
### Proposal: DRAFT → ACTIVE → SUCCEEDED/DEFEATED → EXECUTED
### Tender: DRAFT → PUBLISHED → BIDDING_OPEN → CLOSED → EVALUATION → AWARDED

