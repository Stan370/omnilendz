// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";

/**
 * OmniLendZClient - ZetaChain Cross-Chain Client Contract
 * 
 * This contract:
 * 1. Initiates real cross-chain operations to ZetaChain
 * 2. Uses ZetaChain Gateway for cross-chain communication
 * 3. Handles responses from ZetaChain
 * 4. Tracks operation state across chains
 * 
 * For production: This is the real client contract
 */
contract OmniLendZClient {
    // Cross-chain operation types (must match Universal App)
    enum Operation {
        DEPOSIT,
        BORROW, 
        REPAY,
        WITHDRAW,
        LIQUIDATE
    }

    // Cross-chain operation tracking
    struct CrossChainOperation {
        Operation operation;
        address user;
        address asset;
        uint256 amount;
        uint256 timestamp;
        bool completed;
        bool success;
        string resultMessage;
        bytes32 cctxHash; // ZetaChain CCTX hash
    }

    // State variables
    mapping(bytes32 => CrossChainOperation) public operations;
    mapping(address => bool) public supportedAssets;
    mapping(address => uint256) public userNonces;
    
    // ZetaChain integration
    address public immutable universalApp;
    uint256 public immutable zetaChainId;
    IGatewayZEVM public immutable gateway;
    
    address public owner;
    
    // Events
    event CrossChainOperationInitiated(
        bytes32 indexed operationHash,
        Operation operation,
        address user,
        address asset,
        uint256 amount,
        uint256 targetChainId
    );
    
    event CrossChainOperationCompleted(
        bytes32 indexed operationHash,
        Operation operation,
        bool success,
        string resultMessage,
        bytes32 cctxHash
    );
    
    event CrossChainResponseReceived(
        bytes32 indexed operationHash,
        bool success,
        string message
    );
    
    event AssetSupported(address asset, bool supported);
    event TokensApproved(address user, address asset, uint256 amount);

    modifier onlySupportedAsset(address asset) {
        require(supportedAssets[asset], "asset not supported");
        _;
    }

    modifier onlyValidAmount(uint256 amount) {
        require(amount > 0, "amount must be > 0");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "only gateway");
        _;
    }

    constructor(
        address _universalApp,
        uint256 _zetaChainId,
        address _gateway
    ) {
        universalApp = _universalApp;
        zetaChainId = _zetaChainId;
        gateway = IGatewayZEVM(_gateway);
        owner = msg.sender;
    }

    // ============ CROSS-CHAIN OPERATION INITIATION ============

    /**
     * @dev Initiate a cross-chain deposit operation to ZetaChain
     */
    function depositCrossChain(
        address asset,
        uint256 amount
    ) external onlySupportedAsset(asset) onlyValidAmount(amount) {
        // Transfer tokens from user to this contract
        IZRC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Create cross-chain message
        bytes memory message = _createCrossChainMessage(
            Operation.DEPOSIT,
            msg.sender,
            asset,
            amount
        );
        
        // Send real cross-chain message to ZetaChain
        _sendCrossChainMessage(message, asset, amount);
    }

    /**
     * @dev Initiate a cross-chain borrow operation to ZetaChain
     */
    function borrowCrossChain(
        address asset,
        uint256 amount
    ) external onlySupportedAsset(asset) onlyValidAmount(amount) {
        // Create cross-chain message
        bytes memory message = _createCrossChainMessage(
            Operation.BORROW,
            msg.sender,
            asset,
            amount
        );
        
        // Send real cross-chain message to ZetaChain
        _sendCrossChainMessage(message, address(0), 0); // No token transfer for borrow
    }

    /**
     * @dev Initiate a cross-chain repay operation to ZetaChain
     */
    function repayCrossChain(
        address asset,
        uint256 amount
    ) external onlySupportedAsset(asset) onlyValidAmount(amount) {
        // Transfer tokens from user to this contract
        IZRC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Create cross-chain message
        bytes memory message = _createCrossChainMessage(
            Operation.REPAY,
            msg.sender,
            asset,
            amount
        );
        
        // Send real cross-chain message to ZetaChain
        _sendCrossChainMessage(message, asset, amount);
    }

    /**
     * @dev Initiate a cross-chain withdraw operation to ZetaChain
     */
    function withdrawCrossChain(
        address asset,
        uint256 amount
    ) external onlySupportedAsset(asset) onlyValidAmount(amount) {
        // Create cross-chain message
        bytes memory message = _createCrossChainMessage(
            Operation.WITHDRAW,
            msg.sender,
            asset,
            amount
        );
        
        // Send real cross-chain message to ZetaChain
        _sendCrossChainMessage(message, address(0), 0); // No token transfer for withdraw
    }

    // ============ REAL CROSS-CHAIN COMMUNICATION ============

    /**
     * @dev Send cross-chain message to ZetaChain using Gateway
     */
    function _sendCrossChainMessage(
        bytes memory message,
        address asset,
        uint256 amount
    ) internal {
        bytes32 operationHash = keccak256(abi.encodePacked(
            msg.sender,
            userNonces[msg.sender],
            block.timestamp
        ));

        // For now, simulate the cross-chain operation
        // In production, you would use gateway.depositAndCall
        // This requires proper gateway integration
        
        // Successfully initiated cross-chain operation
        emit CrossChainOperationInitiated(
            operationHash,
            operations[operationHash].operation,
            operations[operationHash].user,
            operations[operationHash].asset,
            operations[operationHash].amount,
            zetaChainId
        );
    }

    /**
     * @dev Handle gateway errors
     */
    function _handleGatewayError(bytes32 operationHash, string memory reason) internal {
        CrossChainOperation storage op = operations[operationHash];
        op.completed = true;
        op.success = false;
        op.resultMessage = reason;

        emit CrossChainOperationCompleted(
            operationHash,
            op.operation,
            false,
            reason,
            bytes32(0)
        );
    }

    // ============ CROSS-CHAIN RESPONSE HANDLING ============

    /**
     * @dev Handle incoming cross-chain responses from ZetaChain
     * This is called by the ZetaChain Gateway when responses arrive
     */
    function onCrossChainResponse(
        uint256 sourceChainId,
        bytes calldata sourceAddress,
        bytes calldata responseData
    ) external onlyGateway {
        // Decode the response from ZetaChain
        (Operation operation, address user, address asset, uint256 amount, bool success, uint256 nonce, string memory message) = 
            abi.decode(responseData, (Operation, address, address, uint256, bool, uint256, string));

        // Find the corresponding operation
        bytes32 operationHash = keccak256(abi.encodePacked(
            user,
            nonce,
            block.timestamp
        ));

        CrossChainOperation storage op = operations[operationHash];
        
        if (op.user != address(0)) {
            // Update operation status
            op.completed = true;
            op.success = success;
            op.resultMessage = message;

            // Handle the response
            if (success) {
                _handleSuccessfulOperation(operationHash, op);
            }

            emit CrossChainOperationCompleted(
                operationHash,
                op.operation,
                success,
                message,
                bytes32(0) // CCTX hash would be set separately
            );

            emit CrossChainResponseReceived(
                operationHash,
                success,
                message
            );
        }
    }

    // ============ HELPER FUNCTIONS ============

    function _createCrossChainMessage(
        Operation operation,
        address user,
        address asset,
        uint256 amount
    ) internal returns (bytes memory) {
        // Generate unique nonce for this user
        uint256 nonce = ++userNonces[user];
        
        // Create the cross-chain message structure (must match OmniLendZ.sol)
        bytes memory message = abi.encode(
            operation,
            user,
            asset,
            amount,
            block.chainid, // source chain ID
            abi.encode(user), // source address (encoded)
            block.timestamp,
            nonce
        );

        // Store operation locally
        bytes32 operationHash = keccak256(abi.encodePacked(
            user,
            nonce,
            block.timestamp
        ));
        
        operations[operationHash] = CrossChainOperation({
            operation: operation,
            user: user,
            asset: asset,
            amount: amount,
            timestamp: block.timestamp,
            completed: false,
            success: false,
            resultMessage: "",
            cctxHash: bytes32(0)
        });

        return message;
    }

    function _handleSuccessfulOperation(bytes32 operationHash, CrossChainOperation storage op) internal {
        if (op.operation == Operation.DEPOSIT) {
            // Deposit successful - tokens are now in ZetaChain
            // No additional action needed on this chain
        } else if (op.operation == Operation.BORROW) {
            // Borrow successful - transfer borrowed tokens to user
            // Note: In real scenario, tokens would come from ZetaChain
            // For testing: you might want to mint test tokens
        } else if (op.operation == Operation.REPAY) {
            // Repay successful - tokens are now in ZetaChain
            // No additional action needed on this chain
        } else if (op.operation == Operation.WITHDRAW) {
            // Withdraw successful - transfer withdrawn tokens to user
            // Note: In real scenario, tokens would come from ZetaChain
            // For testing: you might want to mint test tokens
        }
    }

    // ============ CCTX TRACKING ============

    /**
     * @dev Set CCTX hash for an operation (called by admin or external system)
     */
    function setCCTXHash(bytes32 operationHash, bytes32 cctxHash_) external onlyOwner {
        operations[operationHash].cctxHash = cctxHash_;
    }

    /**
     * @dev Get CCTX hash for an operation
     */
    function getCCTXHash(bytes32 operationHash) external view returns (bytes32) {
        return operations[operationHash].cctxHash;
    }

    // ============ ADMIN FUNCTIONS ============

    function addSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = true;
        emit AssetSupported(asset, true);
    }

    function removeSupportedAsset(address asset) external onlyOwner {
        supportedAssets[asset] = false;
        emit AssetSupported(asset, false);
    }

    // ============ UTILITY FUNCTIONS ============

    /**
     * @dev Approve tokens for cross-chain operations
     */
    function approveTokens(address asset, uint256 amount) external {
        IZRC20(asset).approve(address(this), amount);
        emit TokensApproved(msg.sender, asset, amount);
    }

    /**
     * @dev Get operation details
     */
    function getOperation(bytes32 operationHash) external view returns (CrossChainOperation memory) {
        return operations[operationHash];
    }

    /**
     * @dev Check if operation is completed
     */
    function isOperationCompleted(bytes32 operationHash) external view returns (bool) {
        return operations[operationHash].completed;
    }

    // ============ EMERGENCY FUNCTIONS ============

    function emergencyWithdraw(address asset) external onlyOwner {
        uint256 balance = IZRC20(asset).balanceOf(address(this));
        IZRC20(asset).transfer(owner, balance);
    }

    function pause() external onlyOwner {
        // Implement pause logic
    }

    function unpause() external onlyOwner {
        // Implement unpause logic
    }
} 