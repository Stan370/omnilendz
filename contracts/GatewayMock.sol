// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GatewayMock {
    event Sent(bytes payload);
    function send(bytes calldata message) external payable returns (bytes32) {
        emit Sent(message);
        return keccak256(message);
    }
}
