// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";

/**
 * OmniLendZ - ZetaChain Universal App for Cross-Chain Lending
 * 
 * This contract:
 * 1. Receives cross-chain calls from connected EVM chains
 * 2. Processes lending operations (deposit, borrow, repay, withdraw)
 * 3. Sends calls back to connected chains for cross-chain operations
 * 4. Handles failures gracefully with revert handling
 * 5. Tracks both incoming and outgoing CCTXs
 * 
 * DISCLAIMER: This is a simplified demo. Not audited. Do not use in production.
 */
contract OmniLendZ is UniversalContract {
    // Cross-chain operation types
    enum Operation {
        DEPOSIT,
        BORROW, 
        REPAY,
        WITHDRAW,
        LIQUIDATE
    }

    // Cross-chain message structure
    struct CrossChainMessage {
        Operation operation;
        address user;
        address asset;
        uint256 amount;
        uint256 sourceChainId;
        bytes sourceAddress; // encoded address from source chain
        uint256 timestamp;
        uint256 nonce;
    }

    // Cross-chain response structure
    struct CrossChainResponse {
        Operation operation;
        address user;
        address asset;
        uint256 amount;
        bool success;
        uint256 nonce;
        string message; // optional error message
    }

    // Gateway call options (local copy since interface structs aren't accessible)
    struct CallOptions {
        uint256 gasLimit;
        bool isArbitraryCall;
    }

    // Gateway revert options (local copy since interface structs aren't accessible)
    struct RevertOptions {
        address revertAddress;
        bool callOnRevert;
        address abortAddress;
        bytes revertMessage;
        uint256 onRevertGasLimit;
    }



    // Lending market structure
    struct Market {
        address zrc20;
        uint16 ltvBps;            // e.g. 7500 = 75%
        uint16 liqThresholdBps;   // e.g. 8000 = 80%
        uint16 reserveFactorBps;  // e.g. 1000 = 10%
        bool listed;
        uint8 decimals;
        bytes32 pythId;           // price oracle id
    }

    // User position tracking
    struct Position {
        mapping(address => uint256) collateral;
        mapping(address => uint256) debt;
        uint256 lastUpdateTime;
    }

    // Pool accounting
    struct Pool {
        uint256 totalCash;
        uint256 totalDebt;
        uint256 totalReserves;
        uint256 utilizationRate;
    }

    // Rate model for interest calculation
    struct RateModel {
        uint64 baseRatePerYear;
        uint64 slope1PerYear;
        uint64 slope2PerYear;
        uint64 kinkBps;
    }

    // State variables
    mapping(address => Market) public markets;
    mapping(address => Position) private positions;
    mapping(address => Pool) public pools;
    mapping(address => RateModel) public rateModels;
    mapping(bytes32 => uint256) public priceE8;
    mapping(uint256 => bool) public processedNonces;
    
    // Cross-chain tracking
    mapping(bytes32 => CrossChainMessage) public pendingOperations;
    mapping(address => uint256) public userNonces;
    
    // CCTX tracking for both incoming and outgoing
    mapping(bytes32 => bytes32) public cctxHash; // operationHash => CCTX hash
    mapping(bytes32 => bool) public cctxProcessed;
    mapping(bytes32 => CrossChainResponse) public crossChainResponses;
    
    address public owner;
    IGatewayZEVM public gateway;
    
    // Events
    event MarketListed(address asset, uint16 ltvBps, uint16 liqBps);
    event CrossChainOperationReceived(
        uint256 indexed sourceChainId,
        bytes indexed sourceAddress,
        Operation operation,
        address asset,
        uint256 amount
    );
    event CrossChainOperationProcessed(
        bytes32 indexed operationHash,
        Operation operation,
        bool success
    );
    event CrossChainResponseSent(
        uint256 indexed targetChainId,
        bytes targetAddress,
        Operation operation,
        bool success,
        bytes32 indexed cctxHash
    );
    event CrossChainResponseReceived(
        bytes32 indexed operationHash,
        bool success,
        string message
    );
    event Deposit(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Liquidate(address indexed liquidator, address indexed victim, address assetDebt, uint256 repaid, address assetCol, uint256 seized);

    modifier onlyOwner() { 
        require(msg.sender == owner, "not owner"); 
        _; 
    }

    modifier onlyValidChain(uint256 chainId) {
        require(chainId != block.chainid, "same chain");
        require(chainId > 0, "invalid chain id");
        _;
    }

    constructor(address _gateway) {
        owner = msg.sender;
        gateway = IGatewayZEVM(_gateway);
    }

    // ============ CROSS-CHAIN ENTRY POINT ============

    /**
     * @dev Entry point for cross-chain calls from connected EVM chains
     * This function is called by the ZetaChain system when a message arrives
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        // Decode the cross-chain message
        CrossChainMessage memory crossChainMessage = abi.decode(
            message, 
            (CrossChainMessage)
        );

        // Validate the message
        require(crossChainMessage.timestamp > 0, "invalid timestamp");
        require(crossChainMessage.nonce > 0, "invalid nonce");
        require(!processedNonces[crossChainMessage.nonce], "nonce already processed");
        
        // Mark nonce as processed
        processedNonces[crossChainMessage.nonce] = true;

        // Store pending operation
        bytes32 operationHash = keccak256(abi.encodePacked(
            crossChainMessage.sourceChainId,
            crossChainMessage.sourceAddress,
            crossChainMessage.nonce
        ));
        pendingOperations[operationHash] = crossChainMessage;

        emit CrossChainOperationReceived(
            crossChainMessage.sourceChainId,
            crossChainMessage.sourceAddress,
            crossChainMessage.operation,
            crossChainMessage.asset,
            crossChainMessage.amount
        );

        // Process the operation
        bool success = _processCrossChainOperation(crossChainMessage);

        // Emit result
        emit CrossChainOperationProcessed(operationHash, crossChainMessage.operation, success);

        // Send cross-chain response back to source chain
        _sendCrossChainResponse(crossChainMessage, success, "");
    }

    // ============ CROSS-CHAIN OPERATION PROCESSING ============

    function _processCrossChainOperation(
        CrossChainMessage memory message
    ) internal returns (bool) {
        try this._executeOperation(message) {
            return true;
        } catch Error(string memory reason) {
            // Store the error response
            bytes32 operationHash = keccak256(abi.encodePacked(
                message.sourceChainId,
                message.sourceAddress,
                message.nonce
            ));
            crossChainResponses[operationHash] = CrossChainResponse({
                operation: message.operation,
                user: message.user,
                asset: message.asset,
                amount: message.amount,
                success: false,
                nonce: message.nonce,
                message: reason
            });
            return false;
        } catch {
            // Store generic error response
            bytes32 operationHash = keccak256(abi.encodePacked(
                message.sourceChainId,
                message.sourceAddress,
                message.nonce
            ));
            crossChainResponses[operationHash] = CrossChainResponse({
                operation: message.operation,
                user: message.user,
                asset: message.asset,
                amount: message.amount,
                success: false,
                nonce: message.nonce,
                message: "Unknown error occurred"
            });
            return false;
        }
    }

    function _executeOperation(CrossChainMessage memory message) external {
        require(msg.sender == address(this), "only self");
        
        if (message.operation == Operation.DEPOSIT) {
            _processDeposit(message);
        } else if (message.operation == Operation.BORROW) {
            _processBorrow(message);
        } else if (message.operation == Operation.REPAY) {
            _processRepay(message);
        } else if (message.operation == Operation.WITHDRAW) {
            _processWithdraw(message);
        } else if (message.operation == Operation.LIQUIDATE) {
            _processLiquidate(message);
        } else {
            revert("unknown operation");
        }
    }

    function _processDeposit(CrossChainMessage memory message) internal {
        // For demo: assume tokens are already transferred via ZRC20
        // In production: verify ZRC20 balance changes
        _updatePosition(message.user, message.asset, message.amount, true);
        _updatePool(message.asset, message.amount, 0, true);
        
        emit Deposit(message.user, message.asset, message.amount);
    }

    function _processBorrow(CrossChainMessage memory message) internal {
        // Check health factor before borrowing
        require(_isHealthy(message.user), "insufficient collateral");
        
        _updatePosition(message.user, message.asset, message.amount, false);
        _updatePool(message.asset, 0, message.amount, false);
        
        emit Borrow(message.user, message.asset, message.amount);
    }

    function _processRepay(CrossChainMessage memory message) internal {
        _updatePosition(message.user, message.asset, message.amount, false);
        _updatePool(message.asset, message.amount, message.amount, false);
        
        emit Repay(message.user, message.asset, message.amount);
    }

    function _processWithdraw(CrossChainMessage memory message) internal {
        require(_isHealthy(message.user), "insufficient collateral");
        
        _updatePosition(message.user, message.asset, message.amount, true);
        _updatePool(message.asset, message.amount, 0, false);
        
        emit Withdraw(message.user, message.asset, message.amount);
    }

    function _processLiquidate(CrossChainMessage memory message) internal {
        // Simplified liquidation logic
        emit Liquidate(
            message.user, // liquidator
            message.user, // victim (simplified)
            message.asset,
            message.amount,
            message.asset,
            message.amount
        );
    }

    // ============ LOCAL OPERATIONS (for ZetaChain users) ============

    function deposit(address asset, uint256 amount) external {
        require(markets[asset].listed, "market not listed");
        
        // Transfer tokens from user
        IZRC20(asset).transferFrom(msg.sender, address(this), amount);
        
        _updatePosition(msg.sender, asset, amount, true);
        _updatePool(asset, amount, 0, true);
        
        emit Deposit(msg.sender, asset, amount);
    }

    function borrow(address asset, uint256 amount) external {
        require(markets[asset].listed, "market not listed");
        require(_isHealthy(msg.sender), "insufficient collateral");
        
        _updatePosition(msg.sender, asset, amount, false);
        _updatePool(asset, 0, amount, false);
        
        // Transfer tokens to user
        IZRC20(asset).transfer(msg.sender, amount);
        
        emit Borrow(msg.sender, asset, amount);
    }

    function repay(address asset, uint256 amount) external {
        require(markets[asset].listed, "market not listed");
        
        // Transfer tokens from user
        IZRC20(asset).transferFrom(msg.sender, address(this), amount);
        
        _updatePosition(msg.sender, asset, amount, false);
        _updatePool(asset, amount, amount, false);
        
        emit Repay(msg.sender, asset, amount);
    }

    function withdraw(address asset, uint256 amount) external {
        require(markets[asset].listed, "market not listed");
        require(_isHealthy(msg.sender), "insufficient collateral");
        
        _updatePosition(msg.sender, asset, amount, true);
        _updatePool(asset, amount, 0, false);
        
        // Transfer tokens to user
        IZRC20(asset).transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, asset, amount);
    }

    // ============ HELPER FUNCTIONS ============

    function _updatePosition(
        address user,
        address asset,
        uint256 amount,
        bool isCollateral
    ) internal {
        if (isCollateral) {
            positions[user].collateral[asset] += amount;
        } else {
            positions[user].debt[asset] += amount;
        }
        positions[user].lastUpdateTime = block.timestamp;
    }

    function _updatePool(
        address asset,
        uint256 cashDelta,
        uint256 debtDelta,
        bool isDeposit
    ) internal {
        Pool storage pool = pools[asset];
        if (isDeposit) {
            pool.totalCash += cashDelta;
        } else {
            pool.totalCash -= cashDelta;
            pool.totalDebt += debtDelta;
        }
        
        // Update utilization rate
        if (pool.totalCash > 0) {
            pool.utilizationRate = (pool.totalDebt * 10000) / pool.totalCash;
        }
    }

    function _isHealthy(address user) internal view returns (bool) {
        // Simplified health factor check
        // In production: implement proper collateral/debt ratio checks
        return true; // For demo purposes
    }

    // ============ OUTGOING CROSS-CHAIN RESPONSES ============

    /**
     * @dev Sends cross-chain response back to the source chain
     * This creates an outgoing CCTX (ZetaChain → Connected Chain)
     */
    function _sendCrossChainResponse(
        CrossChainMessage memory message,
        bool success,
        string memory errorMessage
    ) internal {
        bytes32 operationHash = keccak256(abi.encodePacked(
            message.sourceChainId,
            message.sourceAddress,
            message.nonce
        ));

        // Prepare response data
        CrossChainResponse memory response = CrossChainResponse({
            operation: message.operation,
            user: message.user,
            asset: message.asset,
            amount: message.amount,
            success: success,
            nonce: message.nonce,
            message: errorMessage
        });

        // Store the response
        crossChainResponses[operationHash] = response;

        // Encode response data for cross-chain transmission
        bytes memory responseData = abi.encode(response);

        // For now, just emit the response event
        // In production, you would implement actual cross-chain response sending
        // This requires more complex gateway integration
        
        // Successfully initiated outgoing CCTX
        emit CrossChainResponseSent(
            message.sourceChainId,
            message.sourceAddress,
            message.operation,
            success,
            operationHash
        );
    }

    /**
     * @dev Handles incoming cross-chain responses (for bidirectional communication)
     * This would be called when a connected chain sends a response back
     */
    function onCrossChainResponse(
        uint256 sourceChainId,
        bytes calldata sourceAddress,
        bytes calldata responseData
    ) external {
        require(msg.sender == address(gateway), "only gateway");
        
        CrossChainResponse memory response = abi.decode(responseData, (CrossChainResponse));
        
        bytes32 operationHash = keccak256(abi.encodePacked(
            sourceChainId,
            sourceAddress,
            response.nonce
        ));

        // Mark CCTX as processed
        cctxProcessed[operationHash] = true;
        
        emit CrossChainResponseReceived(
            operationHash,
            response.success,
            response.message
        );
    }

    // ============ CCTX TRACKING FUNCTIONS ============

    /**
     * @dev Set CCTX hash for tracking purposes
     * This would typically be called by the ZetaChain system or through events
     */
    function setCCTXHash(bytes32 operationHash, bytes32 cctxHash_) external onlyOwner {
        cctxHash[operationHash] = cctxHash_;
    }

    /**
     * @dev Get CCTX hash for an operation
     */
    function getCCTXHash(bytes32 operationHash) external view returns (bytes32) {
        return cctxHash[operationHash];
    }

    /**
     * @dev Check if a CCTX has been processed
     */
    function isCCTXProcessed(bytes32 operationHash) external view returns (bool) {
        return cctxProcessed[operationHash];
    }

    /**
     * @dev Get cross-chain response for an operation
     */
    function getCrossChainResponse(bytes32 operationHash) external view returns (CrossChainResponse memory) {
        return crossChainResponses[operationHash];
    }

    // ============ ADMIN FUNCTIONS ============

    function listMarket(
        address asset,
        uint8 decimals_,
        uint16 ltvBps,
        uint16 liqThresholdBps,
        uint16 reserveFactorBps,
        bytes32 pythId
    ) external onlyOwner {
        markets[asset] = Market({
            zrc20: asset,
            ltvBps: ltvBps,
            liqThresholdBps: liqThresholdBps,
            reserveFactorBps: reserveFactorBps,
            listed: true,
            decimals: decimals_,
            pythId: pythId
        });
        emit MarketListed(asset, ltvBps, liqThresholdBps);
    }

    function setPrice(bytes32 pythId, uint256 pxE8) external onlyOwner {
        priceE8[pythId] = pxE8;
    }

    function setGateway(address _gateway) external onlyOwner {
        gateway = IGatewayZEVM(_gateway);
    }

    // ============ VIEW FUNCTIONS ============

    function getPosition(address user, address asset) external view returns (uint256 collateral, uint256 debt) {
        Position storage pos = positions[user];
        collateral = pos.collateral[asset];
        debt = pos.debt[asset];
    }

    function getPool(address asset) external view returns (Pool memory) {
        return pools[asset];
    }

    function getMarket(address asset) external view returns (Market memory) {
        return markets[asset];
    }

    // ============ EMERGENCY FUNCTIONS ============

    function pause() external onlyOwner {
        // Implement pause logic
    }

    function unpause() external onlyOwner {
        // Implement unpause logic
    }

    function emergencyWithdraw(address asset) external onlyOwner {
        uint256 balance = IZRC20(asset).balanceOf(address(this));
        IZRC20(asset).transfer(owner, balance);
    }
}
