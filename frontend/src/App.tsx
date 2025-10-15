import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { abi } from "./lib/abi";

const client = createPublicClient({ chain: sepolia, transport: http() });

const OMNI_ADDRESS = import.meta.env.VITE_OMNI_ADDRESS as `0x${string}`;
const USDC = "0x0000000000000000000000000000000000000001"; // placeholder
const WETH = "0x0000000000000000000000000000000000000002"; // placeholder

export default function App() {
  const { address, isConnected } = useAccount();
  const [mockConnected, setMockConnected] = useState(false);
  const [mockAddress, setMockAddress] = useState("0x1234567890123456789012345678901234567890");
  useEffect(() => {
    (async () => {
      if (!address && !mockConnected) return;
      // For demo we don't have view to read mapping; skip
    })();
  }, [address, mockConnected]);

  async function deposit() {
    // In demo we assume USDC approve+transferFrom; for simplicity we skip approve via mock token, or let tx fail if real token not set.
    const amount = parseUnits("1000", 6);
    const currentAddress = address || mockAddress;
    
    if (mockConnected) {
      alert("Mock: Would deposit 1000 USDC to " + OMNI_ADDRESS);
      return;
    }
    
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: currentAddress,
        to: OMNI_ADDRESS,
        data: buildCalldata("deposit", [USDC, amount])
      }]
    });
  }

  async function borrow() {
    const amount = parseUnits("100", 6);
    const dstChainId = BigInt(11155111); // sepolia as target for demo
    const currentAddress = address || mockAddress;
    const dstAddr = currentAddress ? currentAddress : "0x0000000000000000000000000000000000000000";
    if (mockConnected) {
      alert("Mock: Would borrow 100 USDC cross-chain to " + dstAddr);
      return;
    }
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: currentAddress,
        to: OMNI_ADDRESS,
        data: buildCalldata("borrow", [USDC, amount, dstChainId, dstAddr])
      }]
    });
  }

  async function repay() {
    const amount = parseUnits("50", 6);
    const currentAddress = address || mockAddress;
    
    if (mockConnected) {
      alert("Mock: Would repay 50 USDC");
      return;
    }
    
    await window.ethereum?.request({
      method: "eth_sendTransaction",
      params: [{
        from: currentAddress,
        to: OMNI_ADDRESS,
        data: buildCalldata("repay", [USDC, amount])
      }]
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1>OmniLendZ (prototype)</h1>
      
      <div style={{ marginBottom: 24 }}>
        <ConnectButton />
        {/* Mock wallet for quick testing */}
        <div style={{ marginTop: 12 }}>
          <button 
            onClick={() => {
              if (mockConnected) {
                setMockConnected(false);
                setMockAddress("0x1234567890123456789012345678901234567890");
              } else {
                setMockConnected(true);
                setMockAddress("0x" + Math.random().toString(16).slice(2, 42));
              }
            }}
            style={{ 
              marginLeft: 8, 
              padding: "8px 16px",
              backgroundColor: mockConnected ? "#ef4444" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {mockConnected ? "Disconnect Mock" : "Connect Mock Wallet"}
          </button>
        </div>
      </div>

      {(isConnected || mockConnected) && (
        <div>
          <div>Account: {address || mockAddress}</div>
          {mockConnected && <div style={{ color: "#10b981", fontSize: "14px" }}>🔧 Mock Mode - No real transactions</div>}
          
          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button onClick={deposit}>Deposit 1000 USDC (demo)</button>
            <button onClick={borrow}>Borrow 100 USDC (cross-chain intent)</button>
            <button onClick={repay}>Repay 50 USDC</button>
          </div>
        </div>
      )}

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
