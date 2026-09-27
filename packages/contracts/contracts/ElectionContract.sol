// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ElectionContract
 * @notice Manages elections for the governance platform.
 * @dev Blockchain enforces voting rules; AI is advisory only.
 *
 * PRIVACY NOTE: This is a public blockchain. Votes are linked to wallet addresses.
 * This provides auditability but NOT full ballot secrecy.
 * Privacy-preserving mechanisms (e.g., zk-SNARKs) are required for production secret-ballot use.
 */
contract ElectionContract is AccessControl, ReentrancyGuard {
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum ElectionState { DRAFT, OPEN, CLOSED, FINALIZED }

    struct Candidate {
        uint256 id;
        string name;
        string description;
        string ipfsCid;
        uint256 voteCount;
        bool active;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        string organizationId;
        string electionType;
        uint256 startTime;
        uint256 endTime;
        uint256 quorumPercent;
        uint256 totalEligibleVoters;
        uint256 totalVotesCast;
        ElectionState state;
        address creator;
        uint256 winnerId;
        string metadataCid;
        uint256 createdAt;
    }

    uint256 private _electionCounter;
    uint256 private _candidateCounter;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Candidate[]) public electionCandidates;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public eligibleVoters;

    event ElectionCreated(uint256 indexed electionId, string title, string organizationId, address indexed creator);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event MemberRegistered(uint256 indexed electionId, address indexed member);
    event VoteCast(uint256 indexed electionId, address indexed voter, uint256 indexed candidateId, uint256 blockNumber);
    event ElectionClosed(uint256 indexed electionId, uint256 totalVotes);
    event ElectionFinalized(uint256 indexed electionId, uint256 indexed winnerId, string winnerName, uint256 winnerVotes);

    modifier electionExists(uint256 electionId) {
        require(elections[electionId].id != 0, "Election does not exist");
        _;
    }

    modifier inState(uint256 electionId, ElectionState expectedState) {
        require(elections[electionId].state == expectedState, "Invalid election state for this action");
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

    function createElection(
        string calldata title,
        string calldata description,
        string calldata organizationId,
        string calldata electionType,
        uint256 startTime,
        uint256 endTime,
        uint256 quorumPercent,
        uint256 totalEligibleVoters,
        string calldata metadataCid
    ) external onlyRole(COORDINATOR_ROLE) returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(endTime > startTime, "End must be after start");
        require(quorumPercent <= 100, "Quorum cannot exceed 100%");

        _electionCounter++;
        uint256 electionId = _electionCounter;

        elections[electionId] = Election({
            id: electionId,
            title: title,
            description: description,
            organizationId: organizationId,
            electionType: electionType,
            startTime: startTime,
            endTime: endTime,
            quorumPercent: quorumPercent,
            totalEligibleVoters: totalEligibleVoters,
            totalVotesCast: 0,
            state: ElectionState.DRAFT,
            creator: msg.sender,
            winnerId: 0,
            metadataCid: metadataCid,
            createdAt: block.timestamp
        });

        emit ElectionCreated(electionId, title, organizationId, msg.sender);
        return electionId;
    }

    function addCandidate(
        uint256 electionId,
        string calldata name,
        string calldata description,
        string calldata ipfsCid
    ) external onlyRole(COORDINATOR_ROLE) electionExists(electionId) inState(electionId, ElectionState.DRAFT) {
        require(bytes(name).length > 0, "Candidate name required");
        _candidateCounter++;
        electionCandidates[electionId].push(Candidate({
            id: _candidateCounter,
            name: name,
            description: description,
            ipfsCid: ipfsCid,
            voteCount: 0,
            active: true
        }));
        emit CandidateAdded(electionId, _candidateCounter, name);
    }

    function registerMember(uint256 electionId, address member)
        external onlyRole(COORDINATOR_ROLE) electionExists(electionId) {
        require(!eligibleVoters[electionId][member], "Already registered");
        eligibleVoters[electionId][member] = true;
        emit MemberRegistered(electionId, member);
    }

    function registerMembers(uint256 electionId, address[] calldata members)
        external onlyRole(COORDINATOR_ROLE) electionExists(electionId) {
        for (uint256 i = 0; i < members.length; i++) {
            if (!eligibleVoters[electionId][members[i]]) {
                eligibleVoters[electionId][members[i]] = true;
                emit MemberRegistered(electionId, members[i]);
            }
        }
    }

    function openElection(uint256 electionId)
        external onlyRole(COORDINATOR_ROLE) electionExists(electionId) inState(electionId, ElectionState.DRAFT) {
        require(electionCandidates[electionId].length >= 2, "At least 2 candidates required");
        elections[electionId].state = ElectionState.OPEN;
    }

    function castVote(uint256 electionId, uint256 candidateIndex)
        external nonReentrant electionExists(electionId) inState(electionId, ElectionState.OPEN) {
        Election storage election = elections[electionId];
        require(block.timestamp >= election.startTime, "Election has not started");
        require(block.timestamp <= election.endTime, "Election has ended");
        require(eligibleVoters[electionId][msg.sender], "Not an eligible voter");
        require(!hasVoted[electionId][msg.sender], "Already voted in this election");
        require(candidateIndex < electionCandidates[electionId].length, "Invalid candidate");
        require(electionCandidates[electionId][candidateIndex].active, "Candidate inactive");

        hasVoted[electionId][msg.sender] = true;
        electionCandidates[electionId][candidateIndex].voteCount++;
        election.totalVotesCast++;

        emit VoteCast(electionId, msg.sender, electionCandidates[electionId][candidateIndex].id, block.number);
    }

    function closeElection(uint256 electionId)
        external onlyRole(COORDINATOR_ROLE) electionExists(electionId) inState(electionId, ElectionState.OPEN) {
        elections[electionId].state = ElectionState.CLOSED;
        emit ElectionClosed(electionId, elections[electionId].totalVotesCast);
    }

    function finalizeElection(uint256 electionId)
        external onlyRole(COORDINATOR_ROLE) electionExists(electionId) inState(electionId, ElectionState.CLOSED) {
        Candidate[] storage candidates = electionCandidates[electionId];
        require(candidates.length > 0, "No candidates");

        uint256 winnerIndex = 0;
        uint256 maxVotes = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }

        elections[electionId].state = ElectionState.FINALIZED;
        elections[electionId].winnerId = candidates[winnerIndex].id;

        emit ElectionFinalized(
            electionId,
            candidates[winnerIndex].id,
            candidates[winnerIndex].name,
            candidates[winnerIndex].voteCount
        );
    }

    function getElection(uint256 electionId) external view returns (Election memory) {
        return elections[electionId];
    }

    function getCandidates(uint256 electionId) external view returns (Candidate[] memory) {
        return electionCandidates[electionId];
    }

    function getElectionCount() external view returns (uint256) {
        return _electionCounter;
    }
}
