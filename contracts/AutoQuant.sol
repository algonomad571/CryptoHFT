// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AutoQuant: AI-Powered Onchain Trading Intelligence (Simplified for Hackathon)
/// @author Muskan
/// @notice Handles stablecoin deposits, signal-driven trading, and mock DEX integration

contract AutoQuant is Ownable {
    /// @notice ERC20 stablecoin (e.g., mock USDC or DAI)
    IERC20 public stablecoin;

    /// @notice Address of the asset being traded (e.g., mock BTC/ETH)
    IERC20 public asset;

    /// @notice Address of the mock DEX router
    address public dexRouter;

    /// @notice Slippage tolerance in BPS (e.g., 500 = 5%)
    uint256 public slippageTolerance = 500;

    /// @notice Mapping to track user balances in stablecoin
    mapping(address => uint256) public userStableBalances;

    /// @notice Event emitted when trade is executed
    event TradeExecuted(string signal, uint256 stableAmount, uint256 assetReceived);

    /// @notice Event emitted when user deposits stablecoins
    event Deposited(address indexed user, uint256 amount);

    /// @notice Event emitted when user withdraws stablecoins
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _stablecoin, address _asset, address _dexRouter) {
        stablecoin = IERC20(_stablecoin);
        asset = IERC20(_asset);
        dexRouter = _dexRouter;
    }

    /// @notice Allows users to deposit stablecoins into the contract
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        stablecoin.transferFrom(msg.sender, address(this), amount);
        userStableBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Allows users to withdraw their deposited stablecoins
    function withdraw(uint256 amount) external {
        require(userStableBalances[msg.sender] >= amount, "Insufficient balance");
        userStableBalances[msg.sender] -= amount;
        stablecoin.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Owner-triggered trading based on AI/Oracle signal
    /// @param signal Trading signal: "BUY", "SELL", or "HOLD"
    function executeSignal(string calldata signal) external onlyOwner {
        bytes32 sig = keccak256(bytes(signal));
        uint256 amountToUse = stablecoin.balanceOf(address(this)) / 2; // Use 50% of capital

        if (sig == keccak256("BUY")) {
            require(amountToUse > 0, "Nothing to trade");

            stablecoin.approve(dexRouter, amountToUse);

            uint256 minAmountOut = (amountToUse * (10000 - slippageTolerance)) / 10000;

            uint256 assetReceived = IDEXRouter(dexRouter).swapStableForAsset(
                address(stablecoin),
                address(asset),
                amountToUse,
                minAmountOut
            );

            emit TradeExecuted("BUY", amountToUse, assetReceived);
        } else if (sig == keccak256("SELL")) {
            uint256 assetBalance = asset.balanceOf(address(this));
            require(assetBalance > 0, "No asset to sell");

            asset.approve(dexRouter, assetBalance);

            uint256 minAmountOut = (assetBalance * (10000 - slippageTolerance)) / 10000;

            uint256 stableReceived = IDEXRouter(dexRouter).swapAssetForStable(
                address(asset),
                address(stablecoin),
                assetBalance,
                minAmountOut
            );

            emit TradeExecuted("SELL", stableReceived, assetBalance);
        } else if (sig == keccak256("HOLD")) {
            // Do nothing
            emit TradeExecuted("HOLD", 0, 0);
        } else {
            revert("Invalid signal");
        }
    }

    /// @notice Owner can set slippage (in BPS)
    function setSlippageTolerance(uint256 newSlippage) external onlyOwner {
        require(newSlippage <= 1000, "Too high"); // max 10%
        slippageTolerance = newSlippage;
    }
}

/// @notice Interface for the Mock DEX Router contract
interface IDEXRouter {
    function swapStableForAsset(
        address stable,
        address asset,
        uint256 amountIn,
        uint256 minOut
    ) external returns (uint256);

    function swapAssetForStable(
        address asset,
        address stable,
        uint256 amountIn,
        uint256 minOut
    ) external returns (uint256);
}
