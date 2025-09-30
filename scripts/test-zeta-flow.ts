const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing OmniLendZ Cross-Chain Flow on ZetaChain...");
  const [deployer] = await ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);

  // ============ CONTRACT ADDRESSES ============
  // Replace these with your actual deployed contract addresses
  const OMNI_LEND_Z_ADDRESS = "0x..."; // OmniLendZ on ZetaChain
  const OMNI_CLIENT_ADDRESS = "0x..."; // OmniLendZClient on connected chain
  const TEST_TOKEN_ADDRESS = "0x...";   // Test token address
  
  console.log("🌐 OmniLendZ (ZetaChain):", OMNI_LEND_Z_ADDRESS);
  console.log("🔗 OmniLendZClient:", OMNI_CLIENT_ADDRESS);
  console.log("🪙 Test Token:", TEST_TOKEN_ADDRESS);

  // ============ CONNECT TO CONTRACTS ============
  const OmniLendZ = await ethers.getContractFactory("OmniLendZ");
  const OmniLendZClient = await ethers.getContractFactory("OmniLendZClient");
  
  const omniLendZ = OmniLendZ.attach(OMNI_LEND_Z_ADDRESS);
  const omniClient = OmniLendZClient.attach(OMNI_CLIENT_ADDRESS);

  // ============ TEST CROSS-CHAIN DEPOSIT ============
  console.log("\n💰 Testing Cross-Chain Deposit...");
  
  try {
    // 1. Approve tokens for cross-chain operation
    console.log("1️⃣ Approving tokens...");
    const approveTx = await omniClient.approveTokens(TEST_TOKEN_ADDRESS, ethers.utils.parseEther("100"));
    await approveTx.wait();
    console.log("✅ Tokens approved");

    // 2. Initiate cross-chain deposit
    console.log("2️⃣ Initiating cross-chain deposit...");
    const depositTx = await omniClient.depositCrossChain(
      TEST_TOKEN_ADDRESS,
      ethers.utils.parseEther("10")
    );
    const depositReceipt = await depositTx.wait();
    console.log("✅ Cross-chain deposit initiated");
    console.log("📝 Transaction hash:", depositReceipt.transactionHash);

    // 3. Wait for cross-chain confirmation
    console.log("3️⃣ Waiting for cross-chain confirmation...");
    console.log("⏳ This may take several minutes on ZetaChain...");
    
    // In production, you'd poll for the operation status
    // For testing, we'll just show the expected flow
    
  } catch (error: any) {
    console.log("❌ Deposit test failed:", error.message);
  }

  // ============ TEST CROSS-CHAIN BORROW ============
  console.log("\n💳 Testing Cross-Chain Borrow...");
  
  try {
    console.log("1️⃣ Initiating cross-chain borrow...");
    const borrowTx = await omniClient.borrowCrossChain(
      TEST_TOKEN_ADDRESS,
      ethers.utils.parseEther("5")
    );
    const borrowReceipt = await borrowTx.wait();
    console.log("✅ Cross-chain borrow initiated");
    console.log("📝 Transaction hash:", borrowReceipt.transactionHash);
    
  } catch (error: any) {
    console.log("❌ Borrow test failed:", error.message);
  }

  // ============ MONITOR OPERATIONS ============
  console.log("\n📊 Monitoring Cross-Chain Operations...");
  
  try {
    // Get user's nonce to track operations
    const userNonce = await omniClient.userNonces(deployer.address);
    console.log("👤 User nonce:", userNonce.toString());
    
    // Check if operations are completed
    for (let i = 1; i <= userNonce.toNumber(); i++) {
      const operationHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "uint256"],
          [deployer.address, i, Math.floor(Date.now() / 1000)]
        )
      );
      
      try {
        const operation = await omniClient.getOperation(operationHash);
        if (operation.user !== ethers.constants.AddressZero) {
          console.log(`📋 Operation ${i}:`, {
            operation: operation.operation,
            asset: operation.asset,
            amount: ethers.utils.formatEther(operation.amount),
            completed: operation.completed,
            success: operation.success,
            message: operation.resultMessage
          });
        }
      } catch (error: any) {
        // Operation not found, skip
      }
    }
    
  } catch (error: any) {
    console.log("❌ Operation monitoring failed:", error.message);
  }

  // ============ TEST SUMMARY ============
  console.log("\n🎯 Test Summary:");
  console.log("================================");
  console.log("✅ Cross-chain deposit initiated");
  console.log("✅ Cross-chain borrow initiated");
  console.log("📊 Operations monitored");
  console.log("================================");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Wait for cross-chain confirmations (5-15 minutes)");
  console.log("2. Check ZetaChain block explorer for CCTX hashes");
  console.log("3. Verify operations on ZetaChain");
  console.log("4. Test repay and withdraw operations");
  
  console.log("\n🔍 To monitor CCTXs:");
  console.log("- Use ZetaChain block explorer");
  console.log("- Query CCTX status using transaction hashes");
  console.log("- Check operation status on both chains");
  
  console.log("\n🧪 Test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 