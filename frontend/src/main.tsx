import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { createPublicClient } from "viem";
import App from "./App";

const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http()
  }
});

const client = createPublicClient({
  chain: sepolia,
  transport: http()
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <App />
    </WagmiProvider>
  </React.StrictMode>
);
