// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGateway {
    function send(bytes calldata message) external payable returns (bytes32);
}
