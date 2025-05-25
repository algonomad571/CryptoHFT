require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const usdtAddress = process.env.ASSET;
  const routerAddress = process.env.PANCAKE_ROUTER;
  const wbnbAddress = process.env.WBNB;

  const router = await ethers.getContractAt("IPancakeRouter", routerAddress);
  const usdt = await ethers.getContractAt("MockUSDT", usdtAddress);
  const wbnb = await ethers.getContractAt("IERC20", wbnbAddress);

  const usdtAmount = ethers.parseUnits("100", 18);
  const wbnbAmount = ethers.parseUnits("0.2", 18);

  // 1. Approve both tokens for the router
  await usdt.approve(routerAddress, usdtAmount);
  await wbnb.approve(routerAddress, wbnbAmount);
  console.log("Approved USDT and WBNB");
    
  // 2. Add liquidity
  await router.addLiquidity(
    usdtAddress,
    wbnbAddress,
    usdtAmount,
    wbnbAmount,
    0, // min USDT
    0, // min WBNB
    deployer.address,
    Math.floor(Date.now() / 1000) + 60 * 10 // deadline
  );
  console.log("Liquidity added");

  // 3. Swap USDT → WBNB
  const swapAmount = ethers.parseUnits("10", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await usdt.approve(routerAddress, swapAmount);

  // Optional: Use getAmountsOut to estimate output
  const amounts = await router.getAmountsOut(swapAmount, [usdtAddress, wbnbAddress]);
  console.log("Estimated output WBNB:", ethers.formatUnits(amounts[1], 18));

  const tx = await router.swapExactTokensForTokens(
    swapAmount,
    1, // minimum amountOut (set to 1 wei for demo, use slippage in production)
    [usdtAddress, wbnbAddress],
    deployer.address,
    deadline
  );
  await tx.wait();

  console.log("Swapped USDT for WBNB");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
