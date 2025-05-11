# AutoQuant
AutoQuant is an AI-powered onchain trading bot that analyzes market trends and autonomously executes token swaps on BNB Chain using verifiable and transparent strategies.

## Overview

Modern crypto traders often rely on opaque AI tools or centralized funds. AutoQuant bridges that gap by offering a transparent, onchain, and intelligent trading system. It integrates a machine learning model for real-time decision-making and executes token swaps through a smart contract on the BNB Smart Chain.

Built for the BNB AI Hack at IIT Delhi, AutoQuant demonstrates how AI and DeFi can combine to create the future of decentralized asset management.

## Architecture
### 1. Smart Contract (Solidity)
- Deployed on BNB Smart Chain testnet
- Accepts stablecoins (e.g., USDT)
- Performs swaps using PancakeSwap Router
- Restricts trading access to a trusted executor bot
- Emits onchain events for every trade (timestamp, asset, direction, amount)

### 2. AI Model (Python)
- Collects market data from CoinGecko or Binance APIs
- Computes technical indicators (e.g., RSI, MACD)
- Generates buy/sell/hold signals based on market trends
- Provides reasoning for each decision to ensure explainability

### 3. Executor Bot (Node.js or Python)
- Periodically fetches AI-generated signal
- If the signal is actionable (buy/sell), triggers onchain executeTrade()
- Ensures trades only happen when confidence > threshold
- Publishes trade logs for auditability

### 4. Frontend Dashboard (Optional)
- Connect wallet to interact with smart contract
- Display current balance, latest AI decision, trade history
- Toggle AI execution on/off
- Includes disclaimers about testnet and experimental nature

## Key Features
- Fully autonomous trading system on BNB Chain
- Transparent and verifiable trade logic
- Explainable AI decisions
- Live trade execution via PancakeSwap
- Simple and secure smart contract with access controls
- Extensible architecture for future strategy improvements

## Risk Management
### Smart Contract Risks
- Contract implements access control and pausability
- Uses only audited PancakeSwap Router interfaces
- Withdrawal function enables user exit at any time

### AI/Model Risks
- Model decisions logged with reasoning for transparency
- Confidence threshold prevents low-certainty trades
- Optional fallback to rule-based strategies if ML fails

### Swap Risks
- Trades use amountOutMin to protect from slippage
- Testnet deployment used to avoid real losses during development
- Swap sizes capped to limit exposure

### User Protection
- All contracts deployed on testnet
- Disclaimers in frontend
- Users can withdraw at any time

## Demo Video
Coming Soon!

## Tech Stack
- BNB Smart Chain (Testnet)
- PancakeSwap Router
- Solidity (Smart Contract)
- Python (AI Model + Bot)
- Hardhat (Deployment)
- React (Frontend)

## Future Plans
- Integrate more advanced ML models (LSTM, transformers)
- Add real-time volatility and risk monitoring
- Expand support for additional tokens and strategies
- Deploy on mainnet with audited contracts
