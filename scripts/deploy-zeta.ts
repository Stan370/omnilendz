const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying OmniLendZ Cross-Chain Lending System...");
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // ============ ZETACHAIN CONFIGURATION ============
  console.log("\n🔗 ZetaChain Configuration...");
  
  // ZetaChain Athens Testnet addresses
  const ZETA_CHAIN_ID = 7001; // Athens testnet
  const ZETA_GATEWAY = "0x0c487a766110c85d301d96e33579c5b317fa4995"; // Replace with actual Gateway address
  
  // For Athens testnet, you'll need to get the actual Gateway address
  // You can find it in ZetaChain docs or by querying the network
  
  console.log("🌐 Target ZetaChain ID:", ZETA_CHAIN_ID);
  console.log("🔗 Gateway Address:", ZETA_GATEWAY);

  // ============ DEPLOY ZETACHAIN UNIVERSAL APP ============
  console.log("\n🔗 Deploying OmniLendZ Universal App on ZetaChain...");
  
  const OmniLendZ = await ethers.getContractFactory("OmniLendZ");
  const omniLendZ = await OmniLendZ.deploy(ZETA_GATEWAY);
  await omniLendZ.deployed();
  
  console.log("✅ OmniLendZ Universal App deployed to:", omniLendZ.address);

  // ============ DEPLOY CONNECTED CLIENT CONTRACTS ============
  console.log("\n🌉 Deploying OmniLendZClient contracts on connected chains...");
  
  const OmniLendZClient = await ethers.getContractFactory("OmniLendZClient");
  const omniLendZClient = await OmniLendZClient.deploy(
    omniLendZ.address, // Universal App address on ZetaChain
    ZETA_CHAIN_ID,     // ZetaChain ID
    ZETA_GATEWAY       // Gateway address
  );
  await omniLendZClient.deployed();
  
  console.log("✅ OmniLendZClient deployed to:", omniLendZClient.address);

  // ============ SETUP MARKETS ============
  console.log("\n🏪 Setting up lending markets...");
  
  // List some demo markets (replace with actual token addresses)
  const USDC_ADDRESS = "0x0000000000000000000000000000000000000001"; // Replace with actual
  const WETH_ADDRESS = "0x0000000000000000000000000000000000000002"; // Replace with actual
  
  try {
    await omniLendZ.listMarket(
      USDC_ADDRESS,
      6, // decimals
      7500, // LTV: 75%
      8000, // Liquidation threshold: 80%
      1000, // Reserve factor: 10%
      ethers.utils.formatBytes32String("USDC/USD") // Pyth price ID
    );
    console.log("✅ USDC market listed");
  } catch (error: any) {
    console.log("❌ Failed to list USDC market:", error.message);
  }

  try {
    await omniLendZ.listMarket(
      WETH_ADDRESS,
      18, // decimals
      8000, // LTV: 80%
      8500, // Liquidation threshold: 85%
      1000, // Reserve factor: 10%
      ethers.utils.formatBytes32String("ETH/USD") // Pyth price ID
    );
    console.log("✅ WETH market listed");
  } catch (error: any) {
    console.log("❌ Failed to list WETH market:", error.message);
  }

  // ============ SETUP CLIENT CONTRACT ============
  console.log("\n🔧 Setting up client contract...");
  
  try {
    await omniLendZClient.addSupportedAsset(USDC_ADDRESS);
    console.log("✅ USDC added to supported assets");
  } catch (error: any) {
    console.log("❌ Failed to add USDC:", error.message);
  }

  try {
    await omniLendZClient.addSupportedAsset(WETH_ADDRESS);
    console.log("✅ WETH added to supported assets");
  } catch (error: any) {
    console.log("❌ Failed to add WETH:", error.message);
  }

  // ============ DEPLOYMENT SUMMARY ============
  console.log("\n🎯 Deployment Summary:");
  console.log("================================");
  console.log("🌐 OmniLendZ Universal App:", omniLendZ.address);
  console.log("🔗 OmniLendZClient:", omniLendZClient.address);
  console.log("📊 USDC Market:", USDC_ADDRESS);
  console.log("📊 WETH Market:", WETH_ADDRESS);
  console.log("👤 Owner:", deployer.address);
  console.log("================================");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Get actual ZETA_GATEWAY address from ZetaChain docs");
  console.log("2. Deploy OmniLendZClient on each connected EVM chain");
  console.log("3. Update frontend with contract addresses");
  console.log("4. Test cross-chain operations");
  
  console.log("\n⚠️  IMPORTANT: Update ZETA_GATEWAY address before deploying!");
  console.log("🚀 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 