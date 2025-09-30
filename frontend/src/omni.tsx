import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft, Zap, Shield, Globe, ChevronDown, Search, ExternalLink, Info } from 'lucide-react';
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function OmniLendZ() {
  const [activeTab, setActiveTab] = useState('lend');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const chains = [
    { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
    { id: 'base', name: 'Base', color: '#0052FF' },
    { id: 'solana', name: 'Solana', color: '#14F195' },
    { id: 'zeta', name: 'ZetaChain', color: '#00D4AA' },
    { id: 'bsc', name: 'BSC', color: '#F3BA2F' },
    { id: 'polygon', name: 'Polygon', color: '#8247E5' }
  ];

  const assets = [
    { 
      symbol: 'ETH', 
      name: 'Ethereum',
      icon: '⟠',
      supplyAPY: 2.34,
      borrowAPY: 3.89,
      totalSupplied: '$2.4B',
      totalBorrowed: '$1.8B',
      liquidity: '$600M',
      chains: ['ethereum', 'base', 'zeta']
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin',
      icon: '💵',
      supplyAPY: 4.12,
      borrowAPY: 5.67,
      totalSupplied: '$1.9B',
      totalBorrowed: '$1.5B',
      liquidity: '$400M',
      chains: ['ethereum', 'base', 'solana', 'zeta', 'bsc', 'polygon']
    },
    { 
      symbol: 'SOL', 
      name: 'Solana',
      icon: '◎',
      supplyAPY: 3.45,
      borrowAPY: 4.92,
      totalSupplied: '$890M',
      totalBorrowed: '$650M',
      liquidity: '$240M',
      chains: ['solana', 'zeta']
    },
    { 
      symbol: 'USDT', 
      name: 'Tether',
      icon: '₮',
      supplyAPY: 3.98,
      borrowAPY: 5.43,
      totalSupplied: '$1.6B',
      totalBorrowed: '$1.3B',
      liquidity: '$300M',
      chains: ['ethereum', 'base', 'bsc', 'polygon', 'zeta']
    },
    { 
      symbol: 'WBTC', 
      name: 'Wrapped Bitcoin',
      icon: '₿',
      supplyAPY: 1.89,
      borrowAPY: 3.21,
      totalSupplied: '$780M',
      totalBorrowed: '$580M',
      liquidity: '$200M',
      chains: ['ethereum', 'base', 'zeta']
    },
    { 
      symbol: 'ZETA', 
      name: 'ZetaChain',
      icon: '⟁',
      supplyAPY: 8.76,
      borrowAPY: 12.34,
      totalSupplied: '$124M',
      totalBorrowed: '$89M',
      liquidity: '$35M',
      chains: ['zeta', 'ethereum', 'base']
    }
  ];

  const [userPositions, setUserPositions] = useState({
    totalSupplied: 0,
    totalBorrowed: 0,
    netAPY: 0,
    healthFactor: 0,
    positions: []
  });

  const filteredAssets = assets.filter(asset => 
    asset.chains.includes(selectedChain) &&
    (asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
     asset.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConnect = () => {
    setIsConnected(true);
    setUserPositions({
      totalSupplied: 15420.50,
      totalBorrowed: 8234.20,
      netAPY: 2.14,
      healthFactor: 1.87,
      positions: [
        { asset: 'ETH', supplied: 5.5, value: 10450, apy: 2.34, chain: 'ethereum' },
        { asset: 'USDC', supplied: 5000, value: 5000, apy: 4.12, chain: 'base' },
        { asset: 'USDC', borrowed: 8000, value: 8000, apy: 5.67, chain: 'ethereum' }
      ]
    });
  };

  const handleTransaction = () => {
    if (!selectedAsset || !amount) return;
    
    const notification = document.createElement('div');
    notification.className = 'transaction-notification';
    notification.textContent = `${activeTab === 'lend' ? 'Lending' : 'Borrowing'} ${amount} ${selectedAsset.symbol} on ${chains.find(c => c.id === selectedChain).name}...`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);

    setAmount('');
  };

  return (
    <div className="app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #ffffff;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          position: relative;
          overflow-x: hidden;
        }

        .bg-animation {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 20s infinite;
        }

        .orb1 {
          width: 400px;
          height: 400px;
          background: #00D4AA;
          top: -100px;
          left: -100px;
        }

        .orb2 {
          width: 300px;
          height: 300px;
          background: #627EEA;
          bottom: -50px;
          right: -50px;
          animation-delay: -5s;
        }

        .orb3 {
          width: 250px;
          height: 250px;
          background: #14F195;
          top: 50%;
          left: 50%;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          margin-bottom: 40px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #00D4AA 0%, #14F195 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .chain-selector {
          position: relative;
        }

        .chain-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          font-weight: 500;
        }

        .chain-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .chain-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(26, 31, 58, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px;
          min-width: 200px;
          backdrop-filter: blur(20px);
          z-index: 100;
        }

        .chain-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chain-option:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .chain-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .connect-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #00D4AA 0%, #14F195 100%);
          border: none;
          border-radius: 12px;
          color: #0a0e27;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
        }

        .connect-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 212, 170, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(20px);
          transition: all 0.3s;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .stat-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          margin-top: 8px;
          color: #14F195;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
          margin-bottom: 40px;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        .markets-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .panel-title {
          font-size: 24px;
          font-weight: 700;
        }

        .tabs {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .tab {
          flex: 1;
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab.active {
          background: linear-gradient(135deg, #00D4AA 0%, #14F195 100%);
          color: #0a0e27;
        }

        .search-box {
          position: relative;
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
        }

        .search-input:focus {
          border-color: #00D4AA;
          background: rgba(255, 255, 255, 0.08);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
        }

        .assets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
        }

        .assets-list::-webkit-scrollbar {
          width: 6px;
        }

        .assets-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .assets-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .asset-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .asset-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }

        .asset-item.selected {
          background: rgba(0, 212, 170, 0.1);
          border-color: #00D4AA;
        }

        .asset-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .asset-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
        }

        .asset-details {
          display: flex;
          flex-direction: column;
        }

        .asset-symbol {
          font-weight: 600;
          font-size: 16px;
        }

        .asset-name {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .asset-metrics {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .metric-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #14F195;
        }

        .action-panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        .amount-input-container {
          margin-bottom: 24px;
        }

        .input-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 8px;
          display: block;
        }

        .amount-input-wrapper {
          position: relative;
        }

        .amount-input {
          width: 100%;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 24px;
          font-weight: 600;
          outline: none;
          transition: all 0.3s;
        }

        .amount-input:focus {
          border-color: #00D4AA;
          background: rgba(255, 255, 255, 0.08);
        }

        .max-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          padding: 6px 12px;
          background: rgba(0, 212, 170, 0.2);
          border: 1px solid #00D4AA;
          border-radius: 8px;
          color: #00D4AA;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .max-button:hover {
          background: rgba(0, 212, 170, 0.3);
        }

        .transaction-details {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }

        .detail-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .detail-value {
          font-weight: 600;
        }

        .action-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #00D4AA 0%, #14F195 100%);
          border: none;
          border-radius: 12px;
          color: #0a0e27;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 212, 170, 0.4);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 40px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(20px);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(20, 241, 149, 0.2) 100%);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .feature-description {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .transaction-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(26, 31, 58, 0.98);
          border: 1px solid #00D4AA;
          border-radius: 12px;
          padding: 16px 24px;
          color: white;
          font-weight: 500;
          backdrop-filter: blur(20px);
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s;
          z-index: 1000;
        }

        .transaction-notification.show {
          opacity: 1;
          transform: translateY(0);
        }

        .info-tooltip {
          display: inline-flex;
          align-items: center;
          cursor: help;
          opacity: 0.5;
        }
      `}</style>

      <div className="bg-animation">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      <div className="container">
        <div className="header">
          <div className="logo">
            <Globe size={32} />
            OmniLendZ
          </div>
          <div className="header-actions">
            <div className="chain-selector">
              <button 
                className="chain-button"
                onClick={() => setShowChainSelector(!showChainSelector)}
              >
                <div 
                  className="chain-indicator" 
                  style={{ background: chains.find(c => c.id === selectedChain)?.color }}
                />
                {chains.find(c => c.id === selectedChain)?.name}
                <ChevronDown size={16} />
              </button>
              {showChainSelector && (
                <div className="chain-dropdown">
                  {chains.map(chain => (
                    <div 
                      key={chain.id}
                      className="chain-option"
                      onClick={() => {
                        setSelectedChain(chain.id);
                        setShowChainSelector(false);
                      }}
                    >
                      <div className="chain-indicator" style={{ background: chain.color }} />
                      {chain.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="connect-button" onClick={handleConnect}>
              <Wallet size={18} />
              {isConnected ? '0x7a2f...9b3c' : 'Test Wallet'}
            </button>
            <ConnectButton />
          </div>
        </div>

        {isConnected && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">
                <TrendingUp size={16} />
                Total Supplied
              </div>
              <div className="stat-value">${userPositions.totalSupplied.toLocaleString()}</div>
              <div className="stat-change">
                <TrendingUp size={14} />
                +{userPositions.netAPY}% APY
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <TrendingDown size={16} />
                Total Borrowed
              </div>
              <div className="stat-value">${userPositions.totalBorrowed.toLocaleString()}</div>
              <div className="stat-change">
                <TrendingDown size={14} />
                5.67% APY
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">
                <Shield size={16} />
                Health Factor
              </div>
              <div className="stat-value">{userPositions.healthFactor}</div>
              <div className="stat-change" style={{ color: userPositions.healthFactor > 1.5 ? '#14F195' : '#FF6B6B' }}>
                {userPositions.healthFactor > 1.5 ? 'Safe' : 'At Risk'}
              </div>
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="markets-panel">
            <div className="panel-header">
              <h2 className="panel-title">Markets</h2>
            </div>

            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'lend' ? 'active' : ''}`}
                onClick={() => setActiveTab('lend')}
              >
                Lend
              </button>
              <button 
                className={`tab ${activeTab === 'borrow' ? 'active' : ''}`}
                onClick={() => setActiveTab('borrow')}
              >
                Borrow
              </button>
            </div>

            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text"
                className="search-input"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="assets-list">
              {filteredAssets.map(asset => (
                <div 
                  key={asset.symbol}
                  className={`asset-item ${selectedAsset?.symbol === asset.symbol ? 'selected' : ''}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="asset-info">
                    <div className="asset-icon">{asset.icon}</div>
                    <div className="asset-details">
                      <div className="asset-symbol">{asset.symbol}</div>
                      <div className="asset-name">{asset.name}</div>
                    </div>
                  </div>
                  <div className="asset-metrics">
                    <div className="metric">
                      <div className="metric-label">APY</div>
                      <div className="metric-value">
                        {activeTab === 'lend' ? asset.supplyAPY : asset.borrowAPY}%
                      </div>
                    </div>
                    <div className="metric">
                      <div className="metric-label">Liquidity</div>
                      <div className="metric-value" style={{ color: '#fff', fontSize: '12px' }}>
                        {asset.liquidity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="action-panel">
            <h3 className="panel-title" style={{ marginBottom: '24px' }}>
              {activeTab === 'lend' ? 'Supply Assets' : 'Borrow Assets'}
            </h3>

            {selectedAsset ? (
              <>
                <div className="amount-input-container">
                  <label className="input-label">Amount</label>
                  <div className="amount-input-wrapper">
                    <input 
                      type="number"
                      className="amount-input"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button className="max-button">MAX</button>
                  </div>
                </div>

                <div className="transaction-details">
                  <div className="detail-row">
                    <span className="detail-label">Selected Asset</span>
                    <span className="detail-value">{selectedAsset.symbol}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chain</span>
                    <span className="detail-value">{chains.find(c => c.id === selectedChain)?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{activeTab === 'lend' ? 'Supply APY' : 'Borrow APY'}</span>
                    <span className="detail-value" style={{ color: '#14F195' }}>
                      {activeTab === 'lend' ? selectedAsset.supplyAPY : selectedAsset.borrowAPY}%
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Available Liquidity</span>
                    <span className="detail-value">{selectedAsset.liquidity}</span>
                  </div>
                  {activeTab === 'borrow' && isConnected && (
                    <div className="detail-row">
                      <span className="detail-label">Borrow Limit</span>
                      <span className="detail-value">$5,240</span>
                    </div>
                  )}
                </div>

                <button 
                  className="action-button"
                  onClick={handleTransaction}
                  disabled={!amount || !isConnected}
                >
                  {!isConnected ? 'Test Wallet' : 
                   activeTab === 'lend' ? 'Supply' : 'Borrow'}
                  <ArrowRightLeft size={18} />
                </button>

                {activeTab === 'borrow' && isConnected && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Info size={14} />
                      <strong>Health Factor Warning</strong>
                    </div>
                    Borrowing will affect your health factor. Keep it above 1.0 to avoid liquidation.
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.5)' }}>
                <Globe size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>Select an asset from the markets to get started</p>
              </div>
            )}
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <Globe size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">Unified Liquidity Pool</div>
            <div className="feature-description">
              Access deep liquidity across multiple chains through a single unified pool. No fragmentation, maximum efficiency.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <ArrowRightLeft size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">Cross-Chain Intents</div>
            <div className="feature-description">
              Borrow on Ethereum, repay on Base. Lend on Solana, withdraw on Polygon. True omnichain flexibility powered by ZetaChain.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">AI-Friendly Hooks</div>
            <div className="feature-description">
              Built with AI agents in mind. Automated portfolio rebalancing, yield optimization, and risk management through smart hooks.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">Secure & Audited</div>
            <div className="feature-description">
              Battle-tested smart contracts with multiple security audits. Your assets are protected by industry-leading security standards.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">Optimized Yields</div>
            <div className="feature-description">
              Dynamic interest rate models that automatically adjust to market conditions, ensuring competitive APYs for lenders and borrowers.
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <ExternalLink size={24} style={{ color: '#00D4AA' }} />
            </div>
            <div className="feature-title">Instant Settlement</div>
            <div className="feature-description">
              Lightning-fast cross-chain transactions powered by ZetaChain's native interoperability. No bridges, no waiting, no hassle.
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', padding: '40px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '20px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '28px', marginBottom: '16px', background: 'linear-gradient(135deg, #00D4AA 0%, #14F195 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            One Protocol. Infinite Possibilities.
          </h3>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            OmniLendZ brings together the best of DeFi lending across Ethereum, Base, Solana, ZetaChain, and more. 
            Experience truly seamless cross-chain lending and borrowing with unified liquidity and AI-powered optimization.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="connect-button">
              <ExternalLink size={18} />
              Read Docs
            </button>
            <button className="connect-button" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
              Join Community
            </button>
          </div>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={24} style={{ color: '#00D4AA' }} />
            <span style={{ fontSize: '18px', fontWeight: '600' }}>OmniLendZ</span>
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Built on ZetaChain • Powered by Cross-Chain Innovation
          </div>
        </div>
      </div>
    </div>
  );
};

