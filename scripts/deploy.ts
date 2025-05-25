import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const stablecoin = process.env.STABLECOIN!;
  const asset = process.env.ASSET!;
  const pancakeRouter = process.env.PANCAKE_ROUTER!;

  if (!stablecoin || !asset || !pancakeRouter) {
    throw new Error("Missing .env configuration values");
  }

  const [deployer] = await ethers.getSigners(); // Get deployer address

  const AutoQuant = await ethers.getContractFactory("AutoQuant");
  const autoQuant = await AutoQuant.deploy(
    deployer.address, // initialOwner
    stablecoin,
    asset,
    pancakeRouter
  );
  await autoQuant.waitForDeployment();

  const deployedAddress = await autoQuant.getAddress();
  console.log(`AutoQuant deployed to: ${deployedAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
