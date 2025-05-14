// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

contract MockDEXRouter is IDEXRouter {
    // Simulating a very simple mock swap behavior

    function swapStableForAsset(
        address stable,
        address asset,
        uint256 amountIn,
        uint256 minOut
    ) external override returns (uint256) {
        // Here we simulate a 1:1 swap for simplicity
        return amountIn; // Amount out = Amount in (for simplicity in this mock)
    }

    function swapAssetForStable(
        address asset,
        address stable,
        uint256 amountIn,
        uint256 minOut
    ) external override returns (uint256) {
        // Here we simulate a 1:1 swap for simplicity
        return amountIn; // Amount out = Amount in (for simplicity in this mock)
    }
}
