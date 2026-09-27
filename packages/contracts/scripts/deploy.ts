import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy ElectionContract
  const ElectionFactory = await ethers.getContractFactory("ElectionContract");
  const election = await ElectionFactory.deploy();
  await election.waitForDeployment();
  const electionAddr = await election.getAddress();
  console.log("ElectionContract deployed to:", electionAddr);

  // Deploy ProposalContract
  const ProposalFactory = await ethers.getContractFactory("ProposalContract");
  const proposal = await ProposalFactory.deploy();
  await proposal.waitForDeployment();
  const proposalAddr = await proposal.getAddress();
  console.log("ProposalContract deployed to:", proposalAddr);

  // Deploy TenderContract
  const TenderFactory = await ethers.getContractFactory("TenderContract");
  const tender = await TenderFactory.deploy();
  await tender.waitForDeployment();
  const tenderAddr = await tender.getAddress();
  console.log("TenderContract deployed to:", tenderAddr);

  // Save addresses to a JSON file for the frontend/backend
  const addresses = {
    ElectionContract: electionAddr,
    ProposalContract: proposalAddr,
    TenderContract: tenderAddr,
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../artifacts/deployments.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("Deployment addresses saved to artifacts/deployments.json");

  // Also write .env snippet
  console.log("\nAdd these to your .env file:");
  console.log(`ELECTION_CONTRACT_ADDRESS=${electionAddr}`);
  console.log(`PROPOSAL_CONTRACT_ADDRESS=${proposalAddr}`);
  console.log(`TENDER_CONTRACT_ADDRESS=${tenderAddr}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
