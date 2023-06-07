const { ethers, upgrades } = require("hardhat");
require("dotenv").config({ path: "./.env" })

// for GOERLI
const StakedToken = "0x16faF9f73748013155B7bC116a3008b57332D1e6";
const RewardToken = "0xa488533be3018a0720C4c0647F407F3b41e6Cb82";
const operator = "0x5aFDEB6f53C5F9BAf2ff1E9932540Cd6dc45F07e"; // ARY
const rewardsVault = "0x5aFDEB6f53C5F9BAf2ff1E9932540Cd6dc45F07e";
const balOperationVault = "0x5aFDEB6f53C5F9BAf2ff1E9932540Cd6dc45F07e";
const BALToken = "0xfA8449189744799aD2AcE7e0EBAC8BB7575eff47";
const BalancerMinter = "0xdf0399539A72E2689B8B2DD53C3C2A0883879fDd";

async function main() {  
  console.log("=== TEST Network Deployment ===");
  const StakingRewards = await ethers.getContractFactory("StakingRewards");
  console.log("Deploying StakingRewards...");
  const s = await upgrades.deployProxy(StakingRewards,
    [
      StakedToken,       // _stakedToken
      RewardToken,       // _rewardToken
      operator,          // _operator
      rewardsVault,      // _rewardsVault
      balOperationVault, // _balOperationVault
      BALToken,          // _balToken
      BalancerMinter     // _balancerMinter
    ],
    {
      initializer: "initialize",
    }
  );

  await s.deployed();
  console.log("StakingRewards deployed to:", s.address);

  const DepositToken = await ethers.getContractFactory("DepositToken");
  const dt = await DepositToken.deploy(s.address);
  await dt.deployed();
  console.log("DepositToken deployed to:", dt.address);

  const BALRewardPool = await ethers.getContractFactory("BALRewardPool");
  const bp = await BALRewardPool.deploy(dt.address, BALToken, s.address);
  await bp.deployed();
  console.log("BALRewardPool deployed to:", bp.address);

  const BalancerGauge = "0xf0f572ad66baacDd07d8c7ea3e0E5EFA56a76081";
  console.log("Goerli BalancerGauge: ", BalancerGauge);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
