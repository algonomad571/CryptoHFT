// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPancakeRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract AutoQuant is Ownable {
    uint256 public slippageTolerance = 500; // 5% in basis points

    mapping(address => uint256) public userStableBalances;

    event TradeExecuted(string signal, uint256 stableAmount, uint256 assetAmount);
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    IERC20 public stablecoin;
    IERC20 public asset;
    address public dexRouter;

    constructor(
        address initialOwner,
        address _stablecoin,
        address _asset,
        address _dexRouter
    ) Ownable(initialOwner) {
        stablecoin = IERC20(_stablecoin);
        asset = IERC20(_asset);
        dexRouter = _dexRouter;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        stablecoin.transferFrom(msg.sender, address(this), amount);

        userStableBalances[msg.sender] += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(userStableBalances[msg.sender] >= amount, "Insufficient balance");

        userStableBalances[msg.sender] -= amount;

        stablecoin.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function executeSignal(string calldata signal) external onlyOwner {
        bytes32 sig = keccak256(bytes(signal));
        uint256 amountToUse = stablecoin.balanceOf(address(this)) / 2;

        if (sig == keccak256(bytes("BUY"))) {
            require(amountToUse > 0, "Nothing to trade");

            stablecoin.approve(dexRouter, 0);
            stablecoin.approve(dexRouter, amountToUse);

            uint256 minOut = (amountToUse * (10000 - slippageTolerance)) / 10000;

            address[] memory path = new address[](2); 
            path[0] = address(stablecoin);
            path[1] = address(asset);

            uint[] memory amounts = IPancakeRouter(dexRouter).swapExactTokensForTokens(
                amountToUse,
                minOut,
                path,
                address(this),
                block.timestamp
            );

            emit TradeExecuted("BUY", amountToUse, amounts[1]);

        } else if (sig == keccak256(bytes("SELL"))) {
            uint256 assetBalance = asset.balanceOf(address(this));
            require(assetBalance > 0, "No asset to sell");

            asset.approve(dexRouter, 0);
            asset.approve(dexRouter, assetBalance);

            uint256 minOut = (assetBalance * (10000 - slippageTolerance)) / 10000;

            address[] memory path = new address[](2) ;
            path[0] = address(asset);
            path[1] = address(stablecoin);

            uint[] memory amounts = IPancakeRouter(dexRouter).swapExactTokensForTokens(
                assetBalance,
                minOut,
                path,
                address(this),
                block.timestamp
            );

            emit TradeExecuted("SELL", amounts[1], assetBalance);

        } else if (sig == keccak256(bytes("HOLD"))) {
            emit TradeExecuted("HOLD", 0, 0);
        } else {
            revert("Invalid signal");
        }
    }

    function setSlippageTolerance(uint256 newSlippage) external onlyOwner {
        require(newSlippage <= 1000, "Too high"); // Max 10%
        slippageTolerance = newSlippage;
    }

    function stablecoinAllowance(address owner) external view returns (uint256) {
        return stablecoin.allowance(owner, address(this));
    }
}
