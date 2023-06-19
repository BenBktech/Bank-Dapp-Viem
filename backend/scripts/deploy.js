const hre = require("hardhat");

async function main() {

  const bank = await ethers.deployContract("Bank")
  await bank.waitForDeployment();

  console.log(
    `Bank deployed to ${bank.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
