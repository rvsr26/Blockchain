# Security Considerations

| Threat | Mitigation |
|--------|-----------|
| Duplicate voting | Smart-contract hasVoted mapping + DB unique constraint |
| Unauthorized election creation | OpenZeppelin AccessControl COORDINATOR_ROLE |
| Fake membership | Organization membership verification |
| Bid spying | Commit-reveal: hash submitted first, amount revealed after deadline |
| Document tampering | IPFS content addressing (CID is hash of content) |
| AI prompt injection | Treat all input as untrusted; structured JSON output |
| AI hallucination | Show as advisory; require human verification |
| Smart-contract bugs | Comprehensive test suite covering all edge cases |
| Key compromise | Never store private keys in source; .env only |
| Sybil accounts | Wallet identity alone does not guarantee real-world identity |
| Database manipulation | Blockchain is source of truth; DB is cache/index |
| Invalid workflow state | Smart-contract state machines reject invalid transitions |
| Private vote exposure | Known limitation — privacy-preserving mechanisms needed for production |

## Important Limitations

This is an academic prototype. It does NOT:
- Provide perfect ballot secrecy (public blockchain reveals wallet associations)
- Replace real identity verification
- Guarantee freedom from all smart contract vulnerabilities
- Provide production-level sybil resistance

