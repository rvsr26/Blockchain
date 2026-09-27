import { expect } from "chai";
import { ethers } from "hardhat";
import { ElectionContract, ProposalContract, TenderContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("ElectionContract", () => {
  let election: ElectionContract;
  let admin: SignerWithAddress;
  let coordinator: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  beforeEach(async () => {
    [admin, coordinator, voter1, voter2, voter3, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ElectionContract");
    election = await Factory.connect(admin).deploy();
    await election.waitForDeployment();
    await election.connect(admin).grantCoordinator(coordinator.address);
  });

  async function createAndOpenElection() {
    const now = await time.latest();
    const electionId = await election.connect(coordinator).createElection.staticCall(
      "CR Election 2026", "Test", "org1", "CR", now - 60, now + 3600, 50, 10, ""
    );
    await election.connect(coordinator).createElection(
      "CR Election 2026", "Test", "org1", "CR", now - 60, now + 3600, 50, 10, ""
    );
    await election.connect(coordinator).addCandidate(electionId, "Alice", "Candidate A", "");
    await election.connect(coordinator).addCandidate(electionId, "Bob", "Candidate B", "");
    await election.connect(coordinator).registerMembers(electionId, [voter1.address, voter2.address, voter3.address]);
    await election.connect(coordinator).openElection(electionId);
    return electionId;
  }

  it("should create an election", async () => {
    const now = await time.latest();
    const tx = await election.connect(coordinator).createElection(
      "Test Election", "Description", "org1", "CR", now, now + 3600, 50, 5, ""
    );
    await tx.wait();
    const el = await election.getElection(1);
    expect(el.title).to.equal("Test Election");
    expect(el.state).to.equal(0); // DRAFT
  });

  it("should revert election creation for unauthorized user", async () => {
    const now = await time.latest();
    await expect(
      election.connect(unauthorized).createElection("X", "Y", "org1", "CR", now, now + 3600, 50, 5, "")
    ).to.be.reverted;
  });

  it("should add candidates", async () => {
    const now = await time.latest();
    await election.connect(coordinator).createElection("E", "D", "org1", "CR", now, now + 3600, 50, 5, "");
    await election.connect(coordinator).addCandidate(1, "Alice", "A", "");
    await election.connect(coordinator).addCandidate(1, "Bob", "B", "");
    const candidates = await election.getCandidates(1);
    expect(candidates.length).to.equal(2);
    expect(candidates[0].name).to.equal("Alice");
  });

  it("should register members and allow voting", async () => {
    const electionId = await createAndOpenElection();
    await election.connect(voter1).castVote(electionId, 0);
    const el = await election.getElection(electionId);
    expect(el.totalVotesCast).to.equal(1n);
  });

  it("should prevent duplicate voting", async () => {
    const electionId = await createAndOpenElection();
    await election.connect(voter1).castVote(electionId, 0);
    await expect(election.connect(voter1).castVote(electionId, 0)).to.be.revertedWith("Already voted in this election");
  });

  it("should prevent unauthorized voter from casting vote", async () => {
    const electionId = await createAndOpenElection();
    await expect(election.connect(unauthorized).castVote(electionId, 0)).to.be.revertedWith("Not an eligible voter");
  });

  it("should reject vote after deadline", async () => {
    const now = await time.latest();
    await election.connect(coordinator).createElection("E", "D", "org1", "CR", now - 120, now + 10, 50, 5, "");
    await election.connect(coordinator).addCandidate(1, "A", "a", "");
    await election.connect(coordinator).addCandidate(1, "B", "b", "");
    await election.connect(coordinator).registerMember(1, voter1.address);
    await election.connect(coordinator).openElection(1);
    await time.increase(60);
    await expect(election.connect(voter1).castVote(1, 0)).to.be.revertedWith("Election has ended");
  });

  it("should finalize election and record winner", async () => {
    const electionId = await createAndOpenElection();
    await election.connect(voter1).castVote(electionId, 0);
    await election.connect(voter2).castVote(electionId, 0);
    await election.connect(voter3).castVote(electionId, 1);
    await time.increase(4000);
    await election.connect(coordinator).closeElection(electionId);
    await election.connect(coordinator).finalizeElection(electionId);
    const el = await election.getElection(electionId);
    expect(el.state).to.equal(3); // FINALIZED
    const candidates = await election.getCandidates(electionId);
    expect(candidates[0].voteCount).to.equal(2n);
  });

  it("should require at least 2 candidates to open", async () => {
    const now = await time.latest();
    await election.connect(coordinator).createElection("E", "D", "org1", "CR", now, now + 3600, 50, 5, "");
    await election.connect(coordinator).addCandidate(1, "Only Candidate", "solo", "");
    await expect(election.connect(coordinator).openElection(1)).to.be.revertedWith("At least 2 candidates required");
  });
});

describe("ProposalContract", () => {
  let proposal: ProposalContract;
  let admin: SignerWithAddress;
  let coordinator: SignerWithAddress;
  let member1: SignerWithAddress;
  let member2: SignerWithAddress;

  beforeEach(async () => {
    [admin, coordinator, member1, member2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProposalContract");
    proposal = await Factory.connect(admin).deploy();
    await proposal.waitForDeployment();
    await proposal.connect(admin).grantCoordinator(coordinator.address);
  });

  it("should create a proposal", async () => {
    const deadline = (await time.latest()) + 3600;
    await proposal.connect(member1).createProposal("Hackathon", "Annual hackathon", "org1", 20000, deadline, "");
    const p = await proposal.getProposal(1);
    expect(p.title).to.equal("Hackathon");
    expect(p.state).to.equal(0); // DRAFT
  });

  it("should activate and allow voting", async () => {
    const deadline = (await time.latest()) + 3600;
    await proposal.connect(member1).createProposal("Trip", "College trip", "org1", 5000, deadline, "");
    await proposal.connect(coordinator).activateProposal(1);
    await proposal.connect(coordinator).registerProposalVoters(1, [member1.address, member2.address]);
    await proposal.connect(member1).voteProposal(1, 0); // YES
    await proposal.connect(member2).voteProposal(1, 1); // NO
    const p = await proposal.getProposal(1);
    expect(p.yesVotes).to.equal(1n);
    expect(p.noVotes).to.equal(1n);
  });

  it("should prevent double voting on proposal", async () => {
    const deadline = (await time.latest()) + 3600;
    await proposal.connect(member1).createProposal("X", "Y", "org1", 100, deadline, "");
    await proposal.connect(coordinator).activateProposal(1);
    await proposal.connect(coordinator).registerProposalVoter(1, member1.address);
    await proposal.connect(member1).voteProposal(1, 0);
    await expect(proposal.connect(member1).voteProposal(1, 0)).to.be.revertedWith("Already voted");
  });

  it("should finalize as SUCCEEDED if yes > no", async () => {
    const deadline = (await time.latest()) + 10;
    await proposal.connect(member1).createProposal("X", "Y", "org1", 100, deadline, "");
    await proposal.connect(coordinator).activateProposal(1);
    await proposal.connect(coordinator).registerProposalVoters(1, [member1.address, member2.address]);
    await proposal.connect(member1).voteProposal(1, 0);
    await time.increase(20);
    await proposal.connect(coordinator).finalizeProposal(1);
    const p = await proposal.getProposal(1);
    expect(p.state).to.equal(2); // SUCCEEDED
  });
});

describe("TenderContract", () => {
  let tender: TenderContract;
  let admin: SignerWithAddress;
  let coordinator: SignerWithAddress;
  let reviewer: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  beforeEach(async () => {
    [admin, coordinator, reviewer, bidder1, bidder2, unauthorized] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TenderContract");
    tender = await Factory.connect(admin).deploy();
    await tender.waitForDeployment();
    await tender.connect(admin).grantCoordinator(coordinator.address);
    await tender.connect(admin).grantReviewer(reviewer.address);
  });

  async function setupTenderForBidding() {
    const now = await time.latest();
    const biddingDeadline = now + 3600;
    const revealDeadline = now + 7200;
    await tender.connect(coordinator).createTender("Network Equipment", "Desc", "org1", 500000, biddingDeadline, revealDeadline, "");
    await tender.connect(coordinator).authorizeBidders(1, [bidder1.address, bidder2.address]);
    await tender.connect(coordinator).publishTender(1);
    await tender.connect(coordinator).openBidding(1);
    return 1n;
  }

  it("should create a tender", async () => {
    const now = await time.latest();
    await tender.connect(coordinator).createTender("T1", "D1", "org1", 100000, now + 3600, now + 7200, "");
    const t = await tender.getTender(1);
    expect(t.title).to.equal("T1");
    expect(t.state).to.equal(0); // DRAFT
  });

  it("should commit bid and reveal correctly", async () => {
    const tenderId = await setupTenderForBidding();
    const amount = 480000n;
    const secret = "supersecret123";
    const commitment = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "string"], [amount, secret])
    );
    // Use solidityPackedKeccak256 to match contract
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [amount, secret]);
    await tender.connect(bidder1).submitCommitment(tenderId, commitHash);
    await time.increase(3700);
    await tender.connect(coordinator).closeBidding(tenderId);
    await tender.connect(bidder1).revealBid(tenderId, amount, secret);
    const commit = await tender.getBidCommitment(tenderId, bidder1.address);
    expect(commit.valid).to.equal(true);
    expect(commit.revealedAmount).to.equal(amount);
  });

  it("should reject incorrect reveal secret", async () => {
    const tenderId = await setupTenderForBidding();
    const amount = 480000n;
    const secret = "correctsecret";
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [amount, secret]);
    await tender.connect(bidder1).submitCommitment(tenderId, commitHash);
    await time.increase(3700);
    await tender.connect(coordinator).closeBidding(tenderId);
    await tender.connect(bidder1).revealBid(tenderId, amount, "wrongsecret");
    const commit = await tender.getBidCommitment(tenderId, bidder1.address);
    expect(commit.valid).to.equal(false);
  });

  it("should prevent duplicate bid commitment", async () => {
    const tenderId = await setupTenderForBidding();
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [400000n, "secret"]);
    await tender.connect(bidder1).submitCommitment(tenderId, commitHash);
    await expect(tender.connect(bidder1).submitCommitment(tenderId, commitHash)).to.be.revertedWith("Already committed");
  });

  it("should prevent duplicate reveal", async () => {
    const tenderId = await setupTenderForBidding();
    const amount = 460000n;
    const secret = "mysecret";
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [amount, secret]);
    await tender.connect(bidder1).submitCommitment(tenderId, commitHash);
    await time.increase(3700);
    await tender.connect(coordinator).closeBidding(tenderId);
    await tender.connect(bidder1).revealBid(tenderId, amount, secret);
    await expect(tender.connect(bidder1).revealBid(tenderId, amount, secret)).to.be.revertedWith("Already revealed");
  });

  it("should record award by authorized reviewer only", async () => {
    const tenderId = await setupTenderForBidding();
    const amount = 480000n;
    const secret = "awardsecret";
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [amount, secret]);
    await tender.connect(bidder1).submitCommitment(tenderId, commitHash);
    await time.increase(3700);
    await tender.connect(coordinator).closeBidding(tenderId);
    await tender.connect(bidder1).revealBid(tenderId, amount, secret);
    await tender.connect(coordinator).startEvaluation(tenderId);
    await tender.connect(reviewer).recordAward(tenderId, bidder1.address, amount, "Best bid");
    const t = await tender.getTender(tenderId);
    expect(t.state).to.equal(6); // AWARDED
    expect(t.awardedBidder).to.equal(bidder1.address);
  });

  it("should prevent unauthorized award", async () => {
    const tenderId = await setupTenderForBidding();
    await time.increase(3700);
    await tender.connect(coordinator).closeBidding(tenderId);
    await tender.connect(coordinator).startEvaluation(tenderId);
    await expect(
      tender.connect(unauthorized).recordAward(tenderId, bidder1.address, 400000n, "hack")
    ).to.be.reverted;
  });

  it("should prevent bidding after deadline", async () => {
    const tenderId = await setupTenderForBidding();
    await time.increase(3700);
    const commitHash = ethers.solidityPackedKeccak256(["uint256", "string"], [400000n, "late"]);
    await expect(tender.connect(bidder2).submitCommitment(tenderId, commitHash)).to.be.revertedWith("Bidding deadline passed");
  });
});
