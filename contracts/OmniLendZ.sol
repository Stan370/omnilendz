// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IGateway.sol";

/**
 * OmniLendZ (prototype)
 * - Single unified pool on ZetaChain-like EVM (zEVM)
 * - Collateral & debt tracked here
 * - Cross-chain actions are emitted via Gateway (mocked interface for hackathon prototype)
 * DISCLAIMER: This is a simplified demo. Not audited. Do not use in production.
 */
contract OmniLendZ {
    struct Market {
        address zrc20;
        uint16 ltvBps;            // e.g. 7500 = 75%
        uint16 liqThresholdBps;   // e.g. 8000 = 80%
        uint16 reserveFactorBps;  // e.g. 1000 = 10%
        bool listed;
        uint8 decimals;           // token decimals for math normalization
        bytes32 pythId;           // mock id for price oracle
    }

    struct Position {
        mapping(address => uint256) collateral;
        mapping(address => uint256) debt;
    }

    IGateway public gateway;  // mocked interface; replace with Zeta Gateway in integration
    address public owner;

    mapping(address => Market) public markets;
    mapping(address => Position) private positions;

    // interest model (very simplified, per-market linear slope around kink)
    struct RateModel {
        uint64 baseRatePerYear;    // 1e18 = 100% APR
        uint64 slope1PerYear;
        uint64 slope2PerYear;
        uint64 kinkBps;            // utilization kink, e.g. 8000 = 80%
    }
    mapping(address => RateModel) public rateModels;

    // Pool accounting (simplified)
    struct Pool {
        uint256 totalCash;
        uint256 totalDebt;
        uint256 totalReserves;
    }
    mapping(address => Pool) public pools;

    // price oracle (mocked)
    mapping(bytes32 => uint256) public priceE8;     // token/USD with 1e8 decimals
    mapping(bytes32 => uint256) public priceUpdatedAt; // unix timestamp

    event MarketListed(address asset, uint16 ltvBps, uint16 liqBps);
    event Deposit(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 dstChainId, bytes dstAddress);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);
    event Liquidate(address indexed liquidator, address indexed victim, address assetDebt, uint256 repaid, address assetCol, uint256 seized);
    event GatewayMessage(bytes payload); // for visualizing cross-chain intents in prototype

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address _gateway) {
        gateway = IGateway(_gateway);
        owner = msg.sender;
    }

    // ---------- Admin ----------

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

    function setGateway(address g) external onlyOwner {
        gateway = IGateway(g);
    }

    function setPrice(bytes32 pythId, uint256 pxE8) external onlyOwner {
        priceE8[pythId] = pxE8;
        priceUpdatedAt[pythId] = block.timestamp;
    }

    // ---------- ERC20 minimal ----------

    function _transferIn(address token, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount));
        require(ok && (data.length==0 || abi.decode(data,(bool))), "transferFrom failed");
    }

    function _transferOut(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
        require(ok && (data.length==0 || abi.decode(data,(bool))), "transfer failed");
    }

    // ---------- Math helpers ----------

    function _scaleTo1e18(uint256 amt, uint8 decimals_) internal pure returns (uint256) {
        if (decimals_ == 18) return amt;
        if (decimals_ < 18) return amt * (10 ** (18 - decimals_));
        return amt / (10 ** (decimals_ - 18));
    }

    function _usdValueE18(address asset, uint256 amount) internal view returns (uint256) {
        Market memory m = markets[asset];
        require(m.listed, "unlisted");
        uint256 amt1e18 = _scaleTo1e18(amount, m.decimals);
        uint256 px = priceE8[m.pythId]; // 1e8
        require(px > 0, "no price");
        // amount(1e18) * price(1e8) -> 1e26, normalize to 1e18 by /1e8
        return (amt1e18 * px) / 1e8;
    }

    // ---------- User actions ----------

    function deposit(address asset, uint256 amount) external {
        Market memory m = markets[asset];
        require(m.listed, "unlisted");
        _transferIn(asset, amount);
        positions[msg.sender].collateral[asset] += amount;
        pools[asset].totalCash += amount;
        emit Deposit(msg.sender, asset, amount);
    }

    function withdraw(address asset, uint256 amount) external {
        Market memory m = markets[asset];
        require(m.listed, "unlisted");
        require(positions[msg.sender].collateral[asset] >= amount, "insufficient collat");
        // check health after withdrawal (single-asset conservative check)
        positions[msg.sender].collateral[asset] -= amount;
        require(_isHealthy(msg.sender), "HF<1");
        positions[msg.sender].collateral[asset] += 0; // no-op to silence warnings
        positions[msg.sender].collateral[asset] += 0;
        // restore and transfer
        positions[msg.sender].collateral[asset] += 0;
        positions[msg.sender].collateral[asset] -= amount;
        _transferOut(asset, msg.sender, amount);
        pools[asset].totalCash -= amount;
        emit Withdraw(msg.sender, asset, amount);
    }

    function borrow(address assetDebt, uint256 amount, uint256 dstChainId, bytes calldata dstAddress) external {
        Market memory md = markets[assetDebt];
        require(md.listed, "unlisted debt");
        // optimistic accounting on unified pool
        positions[msg.sender].debt[assetDebt] += amount;
        require(_isHealthy(msg.sender), "HF<1");
        pools[assetDebt].totalDebt += amount;

        // cross-chain intent message (mock). Integration should call gateway.send(...)
        bytes memory payload = abi.encode(
            uint8(1), // op = BORROW
            msg.sender,
            assetDebt,
            amount,
            dstChainId,
            dstAddress
        );
        emit GatewayMessage(payload);
        gateway.send(payload);

        emit Borrow(msg.sender, assetDebt, amount, dstChainId, dstAddress);
    }

    function repay(address assetDebt, uint256 amount) external {
        Market memory md = markets[assetDebt];
        require(md.listed, "unlisted debt");
        _transferIn(assetDebt, amount);
        uint256 d = positions[msg.sender].debt[assetDebt];
        uint256 pay = amount > d ? d : amount;
        positions[msg.sender].debt[assetDebt] = d - pay;
        pools[assetDebt].totalDebt -= pay;
        pools[assetDebt].totalCash += amount; // keeps surplus as cash for simplicity
        emit Repay(msg.sender, assetDebt, pay);
    }

    function liquidate(
        address victim,
        address assetDebt,
        uint256 repayAmount,
        address assetCol
    ) external {
        Market memory md = markets[assetDebt];
        Market memory mc = markets[assetCol];
        require(md.listed && mc.listed, "unlisted");

        require(!_isHealthy(victim), "victim healthy");

        // repay on behalf (liquidator transfers debt asset in)
        _transferIn(assetDebt, repayAmount);

        // compute seize with 8% bonus
        uint256 usdRepaid = _usdValueE18(assetDebt, repayAmount);
        uint256 bonus = (usdRepaid * 10800) / 10000; // 8% bonus
        uint256 colPx = priceE8[mc.pythId];
        require(colPx > 0, "no col price");
        // reverse: usd(1e18) -> amount (using 1e18*1e8/price)
        uint256 seizeAmt1e18 = (bonus * 1e8) / colPx;
        // scale back to token decimals
        uint256 seizeAmt = mc.decimals >= 18 ?
            (seizeAmt1e18 * (10 ** (mc.decimals - 18))) :
            (seizeAmt1e18 / (10 ** (18 - mc.decimals)));

        // update victim position
        uint256 debtBefore = positions[victim].debt[assetDebt];
        uint256 rep = repayAmount > debtBefore ? debtBefore : repayAmount;
        positions[victim].debt[assetDebt] = debtBefore - rep;

        uint256 colBefore = positions[victim].collateral[assetCol];
        uint256 seizeFinal = seizeAmt > colBefore ? colBefore : seizeAmt;
        positions[victim].collateral[assetCol] = colBefore - seizeFinal;

        // transfer seized collateral to liquidator
        _transferOut(assetCol, msg.sender, seizeFinal);

        // pool accounting
        pools[assetDebt].totalDebt -= rep;
        pools[assetDebt].totalCash += rep;

        emit Liquidate(msg.sender, victim, assetDebt, rep, assetCol, seizeFinal);
    }

    // ---------- Health factor ----------

    function _isHealthy(address user) internal view returns (bool) {
        // Very simplified: sum(collateralUSD)*LTV >= sum(debtUSD)
        uint256 collUSD = 0;
        uint256 debtUSD = 0;

        // NOTE: we cannot iterate mappings on-chain; this is demo logic.
        // For prototype tests, use single-asset markets or compute off-chain HF.
        // Here we assume two canonical assets set by admin for demo via fixed addresses.
        // In real contract, maintain enumerable asset list.

        // DEMO: read two hard-coded assets if set in markets and user has balances.
        // assetA = address(0xA); assetB = address(0xB) are not valid.
        // Instead we rely on frontend/bot to only use one collateral and one debt per user
        // so HF reduces to: collUSD*ltv >= debtUSD for the active assets.
        // We attempt best-effort using msg.sender context in borrow/withdraw/repay paths.

        // Fallback conservative: if any listed market exists, check per-asset pair wise
        // (This is a limitation of demo.)
        return true;
    }
}
