import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "@wagmi/connectors";
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { abi } from "./lib/abi";

const client = createPublicClient({ chain: sepolia, transport: http() });

const OMNI_ADDRESS = import.meta.env.VITE_OMNI_ADDRESS as `0x${string}`;
const USDC = "0x0000000000000000000000000000000000000001"; // placeholder
const WETH = "0x0000000000000000000000000000000000000002"; // placeholder

export default function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: injected() });
  const { disconnect } = useDisconnect();
  const [collat, setCollat] = useState("0");
  const [debt, setDebt] = useState("0");

  const omni = useMemo(() => ({
    address: OMNI_ADDRESS,
    abi
  }), []);

  useEffect(() => {
    (async () => {
      if (!address) return;
      // For demo we don't have view to read mapping; skip
    })();
  }, [address]);

  async function deposit() {
    // In demo we assume USDC approve+transferFrom; for simplicity we skip approve via mock token, or let tx fail if real token not set.
    const amount = parseUnits("1000", 6);
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: address,
        to: OMNI_ADDRESS,
        data: buildCalldata("deposit", [USDC, amount])
      }]
    });
  }

  async function borrow() {
    const amount = parseUnits("100", 6);
    const dstChainId = BigInt(11155111); // sepolia as target for demo
    const dstAddr = address ? address : "0x0000000000000000000000000000000000000000";
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: address,
        to: OMNI_ADDRESS,
        data: buildCalldata("borrow", [USDC, amount, dstChainId, dstAddr])
      }]
    });
  }

  async function repay() {
    const amount = parseUnits("50", 6);
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: address,
        to: OMNI_ADDRESS,
        data: buildCalldata("repay", [USDC, amount])
      }]
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>OmniLendZ (prototype)</h1>
      {!isConnected ? (
        <button onClick={() => connect()}>Connect</button>
      ) : (
        <div>
          <div>Account: {address}</div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button onClick={deposit}>Deposit 1000 USDC (demo)</button>
        <button onClick={borrow}>Borrow 100 USDC (cross-chain intent)</button>
        <button onClick={repay}>Repay 50 USDC</button>
      </div>

      <p style={{ marginTop: 24 }}>
        This is a minimal UI wired to the core contract's deposit/borrow/repay for demo purposes.
        Replace token addresses and OMNI_ADDRESS in .env to run against your deployment.
      </p>
    </div>
  );
}

function buildCalldata(fn: string, args: any[]) {
  const iface = new (window as any).ethers.utils.Interface(abi as any);
  return iface.encodeFunctionData(fn, args);
}
