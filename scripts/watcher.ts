import { ethers } from "ethers";
import axios from "axios";
import * as dotenv from "dotenv";
import AutoQuantJSON from "../artifacts/contracts/AutoQuant.sol/AutoQuant.json";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const autoQuantAddress = process.env.AUTOQUANT_ADDRESS!;
const autoQuant = new ethers.Contract(autoQuantAddress, AutoQuantJSON.abi, wallet);

// URL of your Python backend endpoint that returns the signal
const ORACLE_URL = "http://localhost:5000/signal"; // change as needed

async function tradeOnSignal() {
  try {
    const response = await axios.get(ORACLE_URL);
    const signal = response.data.signal?.toUpperCase();

    if (!["BUY", "SELL", "HOLD"].includes(signal)) {
      console.log("⚠️ Unknown signal:", signal);
      return;
    }

    console.log(`🧠 Oracle Signal: ${signal}`);
    const tx = await autoQuant.executeSignal(signal);
    await tx.wait();
    console.log(`✅ Executed ${signal}`);
  } catch (error) {
    console.error("❌ Error fetching or executing signal:", error);
  }
}

async function main() {
  console.log("🚀 AutoQuant Signal Watcher Started.");
  while (true) {
    await tradeOnSignal();
    await new Promise((resolve) => setTimeout(resolve, 20000)); // every 20s
  }
}

main();
