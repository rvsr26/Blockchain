// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProposalContract
 * @notice Manages community/organization proposals with on-chain voting.
 */
contract ProposalContract is AccessControl, ReentrancyGuard {
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ProposalState { DRAFT, ACTIVE, SUCCEEDED, DEFEATED, EXECUTED, EXPIRED }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        string organizationId;
        address author;
        uint256 requestedBudget;
        uint256 votingDeadline;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        ProposalState state;
        string ipfsCid;
        string executionNotes;
        uint256 createdAt;
    }

    uint256 private _proposalCounter;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVotedOnProposal;
    mapping(uint256 => mapping(address => bool)) public eligibleProposalVoters;

    event ProposalCreated(uint256 indexed proposalId, string title, string organizationId, address indexed author);
    event ProposalVoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType);
    event ProposalFinalized(uint256 indexed proposalId, ProposalState state, uint256 yes, uint256 no);
    event ProposalExecuted(uint256 indexed proposalId, string notes);

    modifier proposalExists(uint256 proposalId) {
        require(proposals[proposalId].id != 0, "Proposal does not exist");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(COORDINATOR_ROLE, msg.sender);
    }

    function grantCoordinator(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(COORDINATOR_ROLE, account);
    }

    function createProposal(
        string calldata title,
        string calldata description,
        string calldata organizationId,
        uint256 requestedBudget,
        uint256 votingDeadline,
        string calldata ipfsCid
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(votingDeadline > block.timestamp, "Deadline must be in future");

        _proposalCounter++;
        uint256 proposalId = _proposalCounter;

        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            organizationId: organizationId,
            author: msg.sender,
            requestedBudget: requestedBudget,
            votingDeadline: votingDeadline,
            yesVotes: 0,
            noVotes: 0,
            abstainVotes: 0,
            state: ProposalState.DRAFT,
            ipfsCid: ipfsCid,
            executionNotes: "",
            createdAt: block.timestamp
        });

        emit ProposalCreated(proposalId, title, organizationId, msg.sender);
        return proposalId;
    }

    function activateProposal(uint256 proposalId)
        external onlyRole(COORDINATOR_ROLE) proposalExists(proposalId) {
        require(proposals[proposalId].state == ProposalState.DRAFT, "Must be in DRAFT state");
        proposals[proposalId].state = ProposalState.ACTIVE;
    }

    function registerProposalVoter(uint256 proposalId, address voter)
        external onlyRole(COORDINATOR_ROLE) proposalExists(proposalId) {
        eligibleProposalVoters[proposalId][voter] = true;
    }

    function registerProposalVoters(uint256 proposalId, address[] calldata voters)
        external onlyRole(COORDINATOR_ROLE) proposalExists(proposalId) {
        for (uint256 i = 0; i < voters.length; i++) {
            eligibleProposalVoters[proposalId][voters[i]] = true;
        }
    }

    // voteType: 0=YES, 1=NO, 2=ABSTAIN
    function voteProposal(uint256 proposalId, uint8 voteType)
        external nonReentrant proposalExists(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.ACTIVE, "Proposal not active");
        require(block.timestamp <= p.votingDeadline, "Voting deadline passed");
        require(eligibleProposalVoters[proposalId][msg.sender], "Not eligible");
        require(!hasVotedOnProposal[proposalId][msg.sender], "Already voted");
        require(voteType <= 2, "Invalid vote type");

        hasVotedOnProposal[proposalId][msg.sender] = true;
        if (voteType == 0) p.yesVotes++;
        else if (voteType == 1) p.noVotes++;
        else p.abstainVotes++;

        emit ProposalVoteCast(proposalId, msg.sender, voteType);
    }

    function finalizeProposal(uint256 proposalId)
        external onlyRole(COORDINATOR_ROLE) proposalExists(proposalId) {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.ACTIVE, "Proposal not active");
        require(block.timestamp > p.votingDeadline, "Voting still open");

        ProposalState newState = p.yesVotes > p.noVotes ? ProposalState.SUCCEEDED : ProposalState.DEFEATED;
        p.state = newState;

        emit ProposalFinalized(proposalId, newState, p.yesVotes, p.noVotes);
    }

    function executeProposal(uint256 proposalId, string calldata notes)
        external onlyRole(COORDINATOR_ROLE) proposalExists(proposalId) {
        require(proposals[proposalId].state == ProposalState.SUCCEEDED, "Proposal did not succeed");
        proposals[proposalId].state = ProposalState.EXECUTED;
        proposals[proposalId].executionNotes = notes;
        emit ProposalExecuted(proposalId, notes);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getProposalCount() external view returns (uint256) {
        return _proposalCounter;
    }

    function hasVotedOnProposalCheck(uint256 proposalId, address voter) external view returns (bool) {
        return hasVotedOnProposal[proposalId][voter];
    }
}
