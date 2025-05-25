import os
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
if not PRIVATE_KEY:
    raise Exception("PRIVATE_KEY not found in environment!")

# Connect to BNB Testnet
w3 = Web3(Web3.HTTPProvider('https://data-seed-prebsc-1-s1.binance.org:8545'))
assert w3.is_connected(), "Connection failed!"

# Wallet details
account = w3.eth.account.from_key(PRIVATE_KEY)
address = account.address
print("Using address:", address)

# WBNB contract address (BNB Testnet)
wbnb_address = Web3.to_checksum_address("0xae13d989dac2f0debff460ac112a837c89baa7cd")

# Minimal ABI to interact with WBNB
wbnb_abi = [
    { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{"internalType": "address", "name": "","type": "address"}],
      "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view", "type": "function" }
]

# Contract instance
wbnb = w3.eth.contract(address=wbnb_address, abi=wbnb_abi)

# Amount to wrap (0.1 tBNB)
wrap_amount = w3.to_wei(0.1, 'ether')

# Build transaction
tx = wbnb.functions.deposit().build_transaction({
    'from': address,
    'value': wrap_amount,
    'gas': 100000,
    'gasPrice': w3.to_wei(5, 'gwei'),
    'nonce': w3.eth.get_transaction_count(address),
})

# Sign and send transaction
signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
print("Wrapping... TX Hash:", tx_hash.hex())

# Wait for confirmation
receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Successfully wrapped 0.1 tBNB into WBNB")

# Optional: Show WBNB balance
balance = wbnb.functions.balanceOf(address).call()
print("Current WBNB Balance:", w3.from_wei(balance, 'ether'))
