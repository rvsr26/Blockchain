// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TenderContract
 * @notice Manages procurement tenders with commit-reveal bidding.
 * @dev Commit-reveal prevents bid-front-running but does NOT hide bidder identity on a public chain.
 *
 * AI analysis is ADVISORY ONLY. Award MUST be authorized by a human/committee.
 */
contract TenderContract is AccessControl, ReentrancyGuard {
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    enum TenderState { DRAFT, PUBLISHED, BIDDING_OPEN, CLOSED, EVALUATION, AWARDED, CANCELLED }

    struct Tender {
        uint256 id;
        string title;
        string description;
        string organizationId;
        uint256 estimatedBudget;
        uint256 publicationTime;
        uint256 biddingDeadline;
        uint256 revealDeadline;
        TenderState state;
        address creator;
        string ipfsCid;
        address awardedBidder;
        uint256 awardedAmount;
        string awardNotes;
        address awardedBy;
        uint256 awardedAt;
        uint256 createdAt;
    }

    struct BidCommitment {
        bytes32 commitmentHash;
        uint256 committedAt;
        bool revealed;
        uint256 revealedAmount;
        string revealedSecret;
        bool valid;
    }

    uint256 private _tenderCounter;

    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => mapping(address => BidCommitment)) public bidCommitments;
    mapping(uint256 => address[]) public tenderBidders;
    mapping(uint256 => mapping(address => bool)) public authorizedBidders;

    event TenderCreated(uint256 indexed tenderId, string title, string organizationId, address indexed creator);
    event TenderPublished(uint256 indexed tenderId);
    event BiddingOpened(uint256 indexed tenderId);
    event BidCommitted(uint256 indexed tenderId, address indexed bidder, bytes32 commitmentHash);
    event BidRevealed(uint256 indexed tenderId, address indexed bidder, uint256 amount, bool valid);
    event TenderClosed(uint256 indexed tenderId);
    event TenderEvaluation(uint256 indexed tenderId);
    event AwardRecorded(uint256 indexed tenderId, address indexed awardedBidder, uint256 amount, address indexed authorizedBy);
    event TenderCancelled(uint256 indexed tenderId, string reason);

    modifier tenderExists(uint256 tenderId) {
        require(tenders[tenderId].id != 0, "Tender does not exist");
        _;
    }

    modifier inState(uint256 tenderId, TenderState expectedState) {
        require(tenders[tenderId].state == expectedState, "Invalid tender state");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(COORDINATOR_ROLE, msg.sender);
        _grantRole(REVIEWER_ROLE, msg.sender);
    }

    function grantCoordinator(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(COORDINATOR_ROLE, account);
    }

    function grantReviewer(address account) external onlyRole(ADMIN_ROLE) {
        _grantRole(REVIEWER_ROLE, account);
    }

    function createTender(
        string calldata title,
        string calldata description,
        string calldata organizationId,
        uint256 estimatedBudget,
        uint256 biddingDeadline,
        uint256 revealDeadline,
        string calldata ipfsCid
    ) external onlyRole(COORDINATOR_ROLE) returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(biddingDeadline > block.timestamp, "Bidding deadline must be in future");
        require(revealDeadline > biddingDeadline, "Reveal deadline must be after bidding deadline");

        _tenderCounter++;
        uint256 tenderId = _tenderCounter;

        tenders[tenderId] = Tender({
            id: tenderId,
            title: title,
            description: description,
            organizationId: organizationId,
            estimatedBudget: estimatedBudget,
            publicationTime: 0,
            biddingDeadline: biddingDeadline,
            revealDeadline: revealDeadline,
            state: TenderState.DRAFT,
            creator: msg.sender,
            ipfsCid: ipfsCid,
            awardedBidder: address(0),
            awardedAmount: 0,
            awardNotes: "",
            awardedBy: address(0),
            awardedAt: 0,
            createdAt: block.timestamp
        });

        emit TenderCreated(tenderId, title, organizationId, msg.sender);
        return tenderId;
    }

    function authorizeBidder(uint256 tenderId, address bidder)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) {
        authorizedBidders[tenderId][bidder] = true;
    }

    function authorizeBidders(uint256 tenderId, address[] calldata bidders)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) {
        for (uint256 i = 0; i < bidders.length; i++) {
            authorizedBidders[tenderId][bidders[i]] = true;
        }
    }

    function publishTender(uint256 tenderId)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) inState(tenderId, TenderState.DRAFT) {
        tenders[tenderId].state = TenderState.PUBLISHED;
        tenders[tenderId].publicationTime = block.timestamp;
        emit TenderPublished(tenderId);
    }

    function openBidding(uint256 tenderId)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) inState(tenderId, TenderState.PUBLISHED) {
        tenders[tenderId].state = TenderState.BIDDING_OPEN;
        emit BiddingOpened(tenderId);
    }

    /**
     * @notice Submit a bid commitment.
     * @dev commitmentHash = keccak256(abi.encodePacked(bidAmount, secret))
     *      The bidder sends only the hash. Amount stays hidden until reveal.
     */
    function submitCommitment(uint256 tenderId, bytes32 commitmentHash)
        external nonReentrant tenderExists(tenderId) inState(tenderId, TenderState.BIDDING_OPEN) {
        require(block.timestamp <= tenders[tenderId].biddingDeadline, "Bidding deadline passed");
        require(authorizedBidders[tenderId][msg.sender], "Not an authorized bidder");
        require(bidCommitments[tenderId][msg.sender].committedAt == 0, "Already committed");

        bidCommitments[tenderId][msg.sender] = BidCommitment({
            commitmentHash: commitmentHash,
            committedAt: block.timestamp,
            revealed: false,
            revealedAmount: 0,
            revealedSecret: "",
            valid: false
        });

        tenderBidders[tenderId].push(msg.sender);
        emit BidCommitted(tenderId, msg.sender, commitmentHash);
    }

    function closeBidding(uint256 tenderId)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) inState(tenderId, TenderState.BIDDING_OPEN) {
        tenders[tenderId].state = TenderState.CLOSED;
        emit TenderClosed(tenderId);
    }

    /**
     * @notice Reveal bid after bidding is closed.
     * @dev Contract recomputes keccak256(abi.encodePacked(amount, secret)) and validates.
     */
    function revealBid(uint256 tenderId, uint256 amount, string calldata secret)
        external nonReentrant tenderExists(tenderId) inState(tenderId, TenderState.CLOSED) {
        require(block.timestamp <= tenders[tenderId].revealDeadline, "Reveal deadline passed");
        BidCommitment storage commitment = bidCommitments[tenderId][msg.sender];
        require(commitment.committedAt != 0, "No commitment found");
        require(!commitment.revealed, "Already revealed");

        bytes32 recomputed = keccak256(abi.encodePacked(amount, secret));
        bool valid = (recomputed == commitment.commitmentHash);

        commitment.revealed = true;
        commitment.revealedAmount = amount;
        commitment.revealedSecret = secret;
        commitment.valid = valid;

        emit BidRevealed(tenderId, msg.sender, amount, valid);
    }

    function startEvaluation(uint256 tenderId)
        external onlyRole(COORDINATOR_ROLE) tenderExists(tenderId) inState(tenderId, TenderState.CLOSED) {
        tenders[tenderId].state = TenderState.EVALUATION;
        emit TenderEvaluation(tenderId);
    }

    /**
     * @notice Record award decision. MUST be authorized by a human reviewer/coordinator.
     * @dev AI analysis must NOT call this function. Only authorized humans can.
     */
    function recordAward(
        uint256 tenderId,
        address awardedBidder,
        uint256 awardedAmount,
        string calldata notes
    ) external onlyRole(REVIEWER_ROLE) tenderExists(tenderId) inState(tenderId, TenderState.EVALUATION) {
        require(awardedBidder != address(0), "Invalid bidder");
        require(bidCommitments[tenderId][awardedBidder].valid, "Bidder reveal was invalid");

        tenders[tenderId].state = TenderState.AWARDED;
        tenders[tenderId].awardedBidder = awardedBidder;
        tenders[tenderId].awardedAmount = awardedAmount;
        tenders[tenderId].awardNotes = notes;
        tenders[tenderId].awardedBy = msg.sender;
        tenders[tenderId].awardedAt = block.timestamp;

        emit AwardRecorded(tenderId, awardedBidder, awardedAmount, msg.sender);
    }

    function cancelTender(uint256 tenderId, string calldata reason)
        external onlyRole(ADMIN_ROLE) tenderExists(tenderId) {
        TenderState current = tenders[tenderId].state;
        require(current != TenderState.AWARDED, "Cannot cancel awarded tender");
        tenders[tenderId].state = TenderState.CANCELLED;
        emit TenderCancelled(tenderId, reason);
    }

    function getTender(uint256 tenderId) external view returns (Tender memory) {
        return tenders[tenderId];
    }

    function getBidders(uint256 tenderId) external view returns (address[] memory) {
        return tenderBidders[tenderId];
    }

    function getBidCommitment(uint256 tenderId, address bidder) external view returns (BidCommitment memory) {
        return bidCommitments[tenderId][bidder];
    }

    function getTenderCount() external view returns (uint256) {
        return _tenderCounter;
    }
}
