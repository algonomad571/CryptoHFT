// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock Stablecoin (e.g., USDC or DAI)
/// @notice Simple ERC20 token to simulate stablecoin transfers
contract MockStablecoin is ERC20 {
    constructor(uint256 initialSupply) ERC20("Mock Stablecoin", "MSTB") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mint new tokens (only owner can call)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
