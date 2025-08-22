# OmniLendZ (ZetaChain × Gemini hackathon prototype)

unified liquidity pool + cross-chain intents + AI-friendly hooks.

## what you get
- `contracts/OmniLendZ.sol`: core lending pool (deposit/borrow/repay/liq) on a single EVM chain (zEVM-like).
- `contracts/GatewayMock.sol`: stand-in for Zeta Gateway (emits events). Replace with real gateway for testnet.
- `contracts/adapters/ChainAdapterMock.sol`: placeholder connected-chain adapter.
- `frontend/`: Vite + React minimal UI: deposit, borrow (emits cross-chain message), repay.
- `bots/liquidator/`: listens to cross-chain intents; extend to implement liquidation logic & Gemini planning.

**not audited. demo only.**

## quickstart

```bash
# root
npm i
npm run build

# deploy locally (or point to a testnet in hardhat.config.ts)
cp .env.example .env
# set PRIVATE_KEY and RPCs if needed

npm run deploy
# note down OmniLendZ address

# run frontend
cd frontend
npm i
echo "VITE_OMNI_ADDRESS=0xYourOmniAddress" > .env
npm run dev
```

bots:
```bash
cd bots/liquidator
npm i
echo 'RPC=https://sepolia.infura.io/v3/...' > .env
echo 'PRIVATE_KEY=0x...' >> .env
echo 'OMNI_ADDRESS=0xYourOmniAddress' >> .env
npm run dev
```

## integrate ZetaChain
- replace `GatewayMock` with ZetaChain Gateway on zEVM, call `gateway.send(...)` with proper payload
- deploy Connected-Chain Adapters that call the Connected Chain Gateway and relay messages
- map real token addresses (ZRC-20) and set Pyth price ids
- harden `_isHealthy` by enumerating assets (maintain a list) or track per-user asset sets
- add revert handlers & compensation logic for atomicity

## notes
- price oracle here is mocked via `setPrice(pythId, pxE8)`. swap with Pyth contract in real integration.
- healthFactor implementation is conservative; for hackathon demo stick to one-collateral-one-debt per user.
