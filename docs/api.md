# API Documentation

Base URL: http://localhost:3001

## Authentication
POST /api/auth/login — Login with wallet address, receive JWT
GET /api/auth/me — Get current user

## Organizations
GET /api/organizations
POST /api/organizations
GET /api/organizations/:id
PATCH /api/organizations/:id

## Members
GET /api/members?organizationId=
POST /api/members
PATCH /api/members/:id
DELETE /api/members/:id

## Elections
GET /api/elections?status=&organizationId=
POST /api/elections
GET /api/elections/:id
PATCH /api/elections/:id
POST /api/elections/:id/vote
GET /api/elections/:id/has-voted?wallet=
POST /api/elections/:id/candidates

## Proposals
GET /api/proposals?status=&organizationId=
POST /api/proposals
GET /api/proposals/:id
PATCH /api/proposals/:id
POST /api/proposals/:id/vote

## Tenders
GET /api/tenders?status=&organizationId=
POST /api/tenders
GET /api/tenders/:id
PATCH /api/tenders/:id
POST /api/tenders/:id/commit
POST /api/tenders/:id/reveal
POST /api/tenders/:id/award

## AI
POST /api/ai/analyze-proposal
POST /api/ai/analyze-tender
POST /api/ai/chat

## Audit
GET /api/audit?module=&action=&actorWallet=&page=&limit=

## Analytics
GET /api/analytics
GET /api/analytics/elections/:id

## Documents
GET /api/documents
POST /api/documents (multipart/form-data)

## Reputation
GET /api/reputation?walletAddress=
POST /api/reputation

