// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock Asset Token (e.g., BTC or ETH)
/// @notice Simple ERC20 token to simulate an asset like BTC or ETH
contract MockAssetToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Mock Asset Token", "MATK") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mint new tokens (only owner can call)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
