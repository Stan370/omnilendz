// Minimal ABI subset for UI demo
export const abi = [
  {"type":"function","name":"deposit","stateMutability":"nonpayable","inputs":[{"name":"asset","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[]},
  {"type":"function","name":"borrow","stateMutability":"nonpayable","inputs":[{"name":"assetDebt","type":"address"},{"name":"amount","type":"uint256"},{"name":"dstChainId","type":"uint256"},{"name":"dstAddress","type":"bytes"}],"outputs":[]},
  {"type":"function","name":"repay","stateMutability":"nonpayable","inputs":[{"name":"assetDebt","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[]}
] as const;
