const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Load ABIs
const AUTOQUANT_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/AutoQuant.sol/AutoQuant.json"))).abi;
const ERC20_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../artifacts/contracts/mockUSDT.sol/MockUSDT.json"))).abi;

// Env vars
if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is not set in your .env file!");
}
const PRIVATE_KEY = process.env.PRIVATE_KEY.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : "0x" + process.env.PRIVATE_KEY;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const AUTOQUANT_ADDRESS = process.env.AUTOQUANT_ADDRESS;
const USDT_ADDRESS = process.env.ASSET;

// Provider (BNB Testnet)
const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
const autoquant = new ethers.Contract(AUTOQUANT_ADDRESS, AUTOQUANT_ABI, wallet);

async function mintUSDT(to, amount) {
    console.log("🟨 Minting USDT to wallet...");
    try {
        const tx = await usdt.mint(to, amount);
        await tx.wait();
        console.log("✅ Minted USDT");
    } catch (e) {
        console.log("❌ Mint failed:", e.reason || e.message);
    }
}

async function approveUSDT(amount) {
    console.log("🟨 Approving USDT...");
    try {
        const tx = await usdt.approve(AUTOQUANT_ADDRESS, amount);
        await tx.wait();
        console.log("✅ Approved USDT");
    } catch (e) {
        console.log("❌ Approve failed:", e.reason || e.message);
    }
}

async function depositUSDT(amount) {
    console.log("🟨 Depositing to AutoQuant...");
    try {
        const tx = await autoquant.deposit(amount);
        await tx.wait();
        console.log("✅ Deposited to AutoQuant");
    } catch (e) {
        console.log("❌ Deposit failed:", e.reason || e.message);
    }
}

async function executeBuy() {
    console.log("🟨 Executing BUY signal...");
    try {
        const tx = await autoquant.executeSignal("BUY");
        await tx.wait();
        console.log("✅ BUY executed");
    } catch (e) {
        console.log("❌ BUY failed:", e.reason || e.message);
    }
}

async function getBalances() {
    try {
        const contractStableBalance = await usdt.balanceOf(AUTOQUANT_ADDRESS);
        const userBalance = await autoquant.userStableBalances(OWNER_ADDRESS);
        const allowance = await usdt.allowance(OWNER_ADDRESS, AUTOQUANT_ADDRESS);

        console.log(`🧾 Contract stablecoin balance: ${ethers.formatUnits(contractStableBalance, 18)} USDT`);
        console.log(`🧾 User balance in AutoQuant: ${ethers.formatUnits(userBalance, 18)} USDT`);
        console.log(`🧾 Allowance: ${ethers.formatUnits(allowance, 18)} USDT`);
    } catch (e) {
        console.log("❌ Failed to fetch balances:", e.reason || e.message);
    }
}

(async () => {
    const amount = ethers.parseUnits("1", 18); // 1 USDT

    await mintUSDT(OWNER_ADDRESS, amount);
    await new Promise(r => setTimeout(r, 5000));

    await approveUSDT(amount);
    await new Promise(r => setTimeout(r, 5000));

    await getBalances();
    await new Promise(r => setTimeout(r, 2000));

    await depositUSDT(amount);
    await new Promise(r => setTimeout(r, 5000));

    await getBalances();
    await new Promise(r => setTimeout(r, 2000));

    await executeBuy();
})();

console.log("PRIVATE_KEY loaded:", process.env.PRIVATE_KEY);