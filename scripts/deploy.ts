import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Gateway = await ethers.getContractFactory("GatewayMock");
  const gateway = await Gateway.deploy();
  await gateway.waitForDeployment();
  console.log("GatewayMock:", await gateway.getAddress());

  const Omni = await ethers.getContractFactory("OmniLendZ");
  const omni = await Omni.deploy();
  await omni.waitForDeployment();
  console.log("OmniLendZ:", await omni.getAddress());

  // List demo markets (fill token addresses with ERC20 test tokens you deploy)
  // For UI demo you can reuse the same ERC20 on local network.
  const usdc = "0x0000000000000000000000000000000000000001"; // placeholder
  const weth = "0x0000000000000000000000000000000000000002"; // placeholder

  // list with fake pythIds
  await (await omni.listMarket(usdc, 6, 8000, 8500, 1000, ethers.encodeBytes32String("USDC"))).wait();
  await (await omni.listMarket(weth, 18, 7500, 8000, 1000, ethers.encodeBytes32String("WETH"))).wait();

  // set mock prices
  await (await omni.setPrice(ethers.encodeBytes32String("USDC"), 100_000000)).wait(); // $1
  await (await omni.setPrice(ethers.encodeBytes32String("WETH"), 3000_00000000)).wait(); // $3000

  console.log("Listed markets and mock prices set.");
}

main().catch((e) => { console.error(e); process.exit(1); });
