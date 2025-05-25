from web3 import Web3
import json
import time
import os
from dotenv import load_dotenv
from web3.middleware import geth_poa_middleware

# Load environment variables
load_dotenv()

PRIVATE_KEY = os.getenv('PRIVATE_KEY')
OWNER_ADDRESS = Web3.to_checksum_address(os.getenv('OWNER_ADDRESS'))
AUTOQUANT_ADDRESS = Web3.to_checksum_address(os.getenv('AUTOQUANT_ADDRESS'))
USDT_ADDRESS = Web3.to_checksum_address(os.getenv('ASSET'))

# Web3 provider (BNB Testnet)
w3 = Web3(Web3.HTTPProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

if not w3.is_connected():
    raise Exception("Failed to connect to Web3 provider")

# Load ABI files
with open('../artifacts/contracts/AutoQuant.sol/AutoQuant.json') as f:
    AUTOQUANT_ABI = json.load(f)['abi']

with open('../artifacts/contracts/mockUSDT.sol/MockUSDT.json') as f:
    ERC20_ABI = json.load(f)['abi']

# Instantiate contracts
usdt = w3.eth.contract(address=USDT_ADDRESS, abi=ERC20_ABI)
autoquant = w3.eth.contract(address=AUTOQUANT_ADDRESS, abi=AUTOQUANT_ABI)

def send_tx(tx):
    try:
        tx['nonce'] = w3.eth.get_transaction_count(OWNER_ADDRESS)
        tx['gasPrice'] = w3.eth.gas_price  # dynamic gas price

        signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"Sent tx: {tx_hash.hex()}")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print("✅ Confirmed in block", receipt.blockNumber)
        return receipt
    except Exception as e:
        print(f"❌ Transaction failed: {str(e)}")
        return None

def mint_usdt(to_address, amount_wei):
    print("🟨 Minting USDT to wallet...")
    try:
        tx = usdt.functions.mint(to_address, amount_wei).build_transaction({
            'from': OWNER_ADDRESS,
            'gas': 200000,
        })
        return send_tx(tx)
    except Exception as e:
        print(f"❌ Mint failed: {str(e)}")

def approve_usdt(amount_wei):
    print("🟨 Approving USDT...")
    try:
        tx = usdt.functions.approve(AUTOQUANT_ADDRESS, amount_wei).build_transaction({
            'from': OWNER_ADDRESS,
            'gas': 100000,
        })
        return send_tx(tx)
    except Exception as e:
        print(f"❌ Approve failed: {str(e)}")

def deposit_usdt(amount_wei):
    print("🟨 Depositing to AutoQuant...")
    try:
        tx = autoquant.functions.deposit(amount_wei).build_transaction({
            'from': OWNER_ADDRESS,
            'gas': 200000,
        })
        return send_tx(tx)
    except Exception as e:
        print(f"❌ Deposit failed: {str(e)}")

def execute_buy():
    print("🟨 Executing BUY signal...")
    try:
        tx = autoquant.functions.executeSignal("BUY").build_transaction({
            'from': OWNER_ADDRESS,
            'gas': 400000,
        })
        return send_tx(tx)
    except Exception as e:
        print(f"❌ BUY failed: {str(e)}")

def get_contract_balances():
    try:
        contract_stable_balance = usdt.functions.balanceOf(AUTOQUANT_ADDRESS).call()
        user_balance = autoquant.functions.userStableBalances(OWNER_ADDRESS).call()
        allowance = usdt.functions.allowance(OWNER_ADDRESS, AUTOQUANT_ADDRESS).call()

        print(f"🧾 Contract stablecoin balance: {w3.from_wei(contract_stable_balance, 'ether')} USDT")
        print(f"🧾 User balance in AutoQuant: {w3.from_wei(user_balance, 'ether')} USDT")
        print(f"🧾 Allowance: {w3.from_wei(allowance, 'ether')} USDT")
    except Exception as e:
        print(f"❌ Failed to fetch balances: {str(e)}")

if __name__ == "__main__":
    # Assuming your mockUSDT uses 18 decimals as per your contract, so 1 USDT = 1e18 wei
    amount = w3.to_wei(1, 'ether')  # 1 USDT

    mint_usdt(OWNER_ADDRESS, amount)
    time.sleep(5)  # wait for mint tx confirmation

    approve_usdt(amount)
    time.sleep(5)  # wait for approval

    get_contract_balances()
    time.sleep(2)

    deposit_usdt(amount)
    time.sleep(5)

    get_contract_balances()
    time.sleep(2)

    execute_buy()
