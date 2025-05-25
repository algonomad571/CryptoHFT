import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "ethers";

// Fetch addresses and keys from .env
const autoQuantAddress = process.env.AUTOQUANT_ADDRESS!;
const usdtAddress = process.env.ASSET!;
const rpcUrl = process.env.RPC_URL!;
const privateKey = process.env.PRIVATE_KEY!;

// Connect provider and signer (Node.js, not browser)
const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);

const AutoQuantABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_stablecoin",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_asset",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_dexRouter",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Deposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "signal",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "stableAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "assetAmount",
          "type": "uint256"
        }
      ],
      "name": "TradeExecuted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "asset",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "deposit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "dexRouter",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "signal",
          "type": "string"
        }
      ],
      "name": "executeSignal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "newSlippage",
          "type": "uint256"
        }
      ],
      "name": "setSlippageTolerance",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "slippageTolerance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stablecoin",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "userStableBalances",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
   ];
const ERC20ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

// Contract instances
const autoQuant = new ethers.Contract(autoQuantAddress, AutoQuantABI, signer);
const usdt = new ethers.Contract(usdtAddress, ERC20ABI, signer);

async function depositStablecoin(amount: string | number) {
  const decimals = 18; // Change to 6 if your USDT uses 6 decimals
  const amountInWei = ethers.parseUnits(amount.toString(), decimals);

  // Approve AutoQuant contract to spend USDT on your behalf
  const approvalTx = await usdt.approve(autoQuantAddress, amountInWei);
  await approvalTx.wait();

  // Deposit stablecoins into AutoQuant contract
  const depositTx = await autoQuant.deposit(amountInWei);
  await depositTx.wait();

  console.log(`Deposited ${amount} USDT to AutoQuant contract`);
}

async function executeTrade(signal: string) {
  const tx = await autoQuant.executeSignal(signal);
  await tx.wait();
  console.log(`Executed trade signal: ${signal}`);
}

async function withdrawStablecoin(amount: string | number) {
  const decimals = 18; // Change to 6 if your USDT uses 6 decimals
  const amountInWei = ethers.parseUnits(amount.toString(), decimals);

  const tx = await autoQuant.withdraw(amountInWei);
  await tx.wait();

  console.log(`Withdrew ${amount} USDT from AutoQuant contract`);
}

// Example usage (uncomment to run)
 (async () => {
   await depositStablecoin(10);
   await executeTrade("BUY");
   await withdrawStablecoin(5);
 })();
 