require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdtAddress = process.env.ASSET;

  if (!usdtAddress) {
    throw new Error("USDT token address (ASSET) not set in .env file");
  }

  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress);
  const amount = ethers.parseUnits("1000", 18); // e.g., mint 1000 USDT

  const tx = await usdt.mint(deployer.address, amount);
  await tx.wait();

  console.log(`Minted ${amount.toString()} USDT to ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
