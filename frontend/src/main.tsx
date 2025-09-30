import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App'
import './index.css'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, base, baseSepolia],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'OmniLendZ',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains
})

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
