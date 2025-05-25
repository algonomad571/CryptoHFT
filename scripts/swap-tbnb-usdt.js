require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdtAddress = process.env.ASSET;
  const routerAddress = process.env.PANCAKE_ROUTER;
  const wbnbAddress = process.env.WBNB;

  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress);
  const router = await ethers.getContractAt("IPancakeRouter", routerAddress);

  const amountIn = ethers.parseUnits("10", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await usdt.approve(routerAddress, amountIn);
  console.log("Approved USDT");

  const tx = await router.swapExactTokensForTokens(
    amountIn,
    0,
    [usdtAddress, wbnbAddress],
    deployer.address,
    deadline
  );
  await tx.wait();

  console.log("Swapped 10 USDT for tBNB");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
