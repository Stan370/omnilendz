const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying OmniLendZ on ZetaChain Localnet...");

  // Get test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("📝 Test accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);

  // ============ LOCALNET CONFIGURATION ============
  console.log("\n🔗 ZetaChain Localnet Configuration...");
  
  // Real addresses from your localnet
  const ZETA_CHAIN_ID = 31337; // ZetaChain localnet
  const ZETA_GATEWAY = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"; // ZetaChain Gateway
  const ETHEREUM_GATEWAY = "0x59b670e9fA9D0A427751Af201D676719a970857b"; // Ethereum Gateway
  const ZRC20_USDC = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891"; // ZRC-20 USDC.ETH
  const ZRC20_ETH = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe"; // ZRC-20 ETH.ETH
  
  console.log("🌐 ZetaChain ID:", ZETA_CHAIN_ID);
  console.log("🔗 ZetaChain Gateway:", ZETA_GATEWAY);
  console.log("🌉 Ethereum Gateway:", ETHEREUM_GATEWAY);
  console.log("🪙 ZRC20 USDC:", ZRC20_USDC);
  console.log("🪙 ZRC20 ETH:", ZRC20_ETH);

  // ============ DEPLOY CONTRACTS ============
  console.log("\n🔗 Deploying contracts...");
  
  const OmniLendZ = await ethers.getContractFactory("OmniLendZ");
  const omniLendZ = await OmniLendZ.deploy(ZETA_GATEWAY);
  await omniLendZ.waitForDeployment();
  const omniLendZAddress = await omniLendZ.getAddress();
  console.log("✅ OmniLendZ Universal App deployed to:", omniLendZAddress);

  const OmniLendZClient = await ethers.getContractFactory("OmniLendZClient");
  const omniLendZClient = await OmniLendZClient.deploy(
    omniLendZAddress, // Universal App address on ZetaChain
    ZETA_CHAIN_ID,     // ZetaChain ID
    ETHEREUM_GATEWAY   // Gateway address on connected chain
  );
  await omniLendZClient.waitForDeployment();
  const omniLendZClientAddress = await omniLendZClient.getAddress();
  console.log("✅ OmniLendZClient deployed to:", omniLendZClientAddress);

  // ============ SETUP MARKETS ============
  console.log("\n🏪 Setting up markets...");
  
  try {
    await omniLendZ.listMarket(
      ZRC20_USDC,
      6, // decimals (USDC)
      7500, // LTV: 75%
      8000, // Liquidation threshold: 80%
      1000, // Reserve factor: 10%
      ethers.encodeBytes32String("USDC/USD") // Pyth price ID
    );
    console.log("✅ USDC market listed");
  } catch (error: any) {
    console.log("❌ Failed to list USDC market:", error.message);
  }

  try {
    await omniLendZ.listMarket(
      ZRC20_ETH,
      18, // decimals (ETH)
      8000, // LTV: 80%
      8500, // Liquidation threshold: 85%
      1000, // Reserve factor: 10%
      ethers.encodeBytes32String("ETH/USD") // Pyth price ID
    );
    console.log("✅ ETH market listed");
  } catch (error: any) {
    console.log("❌ Failed to list ETH market:", error.message);
  }

  // ============ SETUP CLIENT ============
  console.log("\n🔧 Setting up client...");
  
  try {
    await omniLendZClient.addSupportedAsset(ZRC20_USDC);
    console.log("✅ USDC added to supported assets");
  } catch (error: any) {
    console.log("❌ Failed to add USDC:", error.message);
  }

  try {
    await omniLendZClient.addSupportedAsset(ZRC20_ETH);
    console.log("✅ ETH added to supported assets");
  } catch (error: any) {
    console.log("❌ Failed to add ETH:", error.message);
  }

  // ============ TEST CROSS-CHAIN OPERATIONS ============
  console.log("\n🧪 Testing cross-chain operations...");
  
  // Test deposit operation
  try {
    console.log("Testing deposit operation...");
    const tx = await omniLendZClient.connect(user1).depositCrossChain(
      ZRC20_USDC,
      ethers.parseEther("1000")
    );
    await tx.wait();
    console.log("✅ Deposit operation completed");
  } catch (error: any) {
    console.log("❌ Deposit operation failed:", error.message);
  }

  // Test borrow operation
  try {
    console.log("Testing borrow operation...");
    const tx = await omniLendZClient.connect(user1).borrowCrossChain(
      ZRC20_USDC,
      ethers.parseEther("100")
    );
    await tx.wait();
    console.log("✅ Borrow operation completed");
  } catch (error: any) {
    console.log("❌ Borrow operation failed:", error.message);
  }

  // ============ CHECK OPERATION STATES ============
  console.log("\n📊 Checking operation states...");
  
  try {
    // Get user nonce
    const userNonce = await omniLendZClient.userNonces(user1.address);
    console.log("User1 nonce:", userNonce.toString());
    
    // Check if operations are completed
    for (let i = 1; i <= Number(userNonce); i++) {
      const operationHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "uint256"],
          [user1.address, i, Math.floor(Date.now() / 1000)]
        )
      );
      
      try {
        const operation = await omniLendZClient.getOperation(operationHash);
        if (operation.user !== ethers.ZeroAddress) {
          console.log(`Operation ${i}:`, {
            operation: operation.operation,
            asset: operation.asset,
            amount: ethers.formatEther(operation.amount),
            completed: operation.completed,
            success: operation.success,
            message: operation.resultMessage
          });
        }
      } catch (error: any) {
        console.log(`Operation ${i}: Not found yet`);
      }
    }
  } catch (error: any) {
    console.log("❌ Failed to check operation states:", error.message);
  }

  // ============ TEST SUMMARY ============
  console.log("\n🎯 Test Summary:");
  console.log("================================");
  console.log("🌐 OmniLendZ:", omniLendZAddress);
  console.log("🔗 OmniLendZClient:", omniLendZClientAddress);
  console.log("🧪 Cross-chain operations tested: 2");
  console.log("✅ All tests completed!");
  console.log("================================");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Test cross-chain operations using the deployed contracts");
  console.log("2. Monitor CCTX status using ZetaChain localnet explorer");
  console.log("3. Test borrow, repay, and withdraw operations");
  console.log("4. Check operation status using contract functions");
  
  console.log("\n🔍 To monitor operations:");
  console.log("- Check operation status: await omniClient.getOperation(operationHash)");
  console.log("- Monitor events: CrossChainOperationInitiated, CrossChainOperationCompleted");
  console.log("- Use localnet block explorer at http://localhost:8545");
  
  console.log("\n🚀 Localnet deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Testing failed:", error);
    process.exit(1);
  }); 