// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Mock Connected-Chain Adapter
 * In real integration use ZetaChain Connected Chain Gateway contracts.
 */
contract ChainAdapterMock {
    event MessageToZeta(bytes payload);
    function sendMessage(bytes calldata payload) external payable {
        emit MessageToZeta(payload);
    }
}
