import { ethers } from "hardhat";

async function main() {
  const MainContract = await ethers.getContractFactory("Main");
  const mainContract = await MainContract.deploy();

  await mainContract.deployed();

  // 0x9FB411cB4Fd20d6AEAC9E563625f815E6c9c0873
  console.log(`maincontract deployed to ${mainContract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
