const { expect } = require("chai");

describe("Contracts Deployment", function () {
  let depositTokenContract;
  let owner, addr1, addr2;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment for StakingRewards", function () {
    it("Should set initial values correctly", async function () {
      StakingRewards = await ethers.getContractFactory("StakingRewards");
      stakingRewardsContract = await StakingRewards.deploy();
      await stakingRewardsContract.deployed();

      // totalStaked value should be 0
      const totalStaked = (await stakingRewardsContract.totalStaked()).toString();
      expect(totalStaked).to.equal('0');
    });
  });

  describe("Deployment for DepositToken", function () {
    it("Should the balance of deposit token 0", async function () {
      DepositToken = await ethers.getContractFactory("DepositToken");
      depositTokenContract = await DepositToken.deploy(addr1.address);
      await depositTokenContract.deployed();

      const balanceOf = await depositTokenContract.balanceOf(addr1.address);
      expect(balanceOf).to.equal('0');
    });
  });

  describe("Deployment for BALRewardPool", function () {
    it("Should set initial values correctly", async function () {
      BALRewardPool = await ethers.getContractFactory("BALRewardPool");
      balRewardPoolContract = await BALRewardPool.deploy(
        owner.address, owner.address, addr1.address); // temporary address 
      await balRewardPoolContract.deployed();

      const totalStaked = await balRewardPoolContract.totalSupply();
      expect(totalStaked).to.equal('0');
    });
  });

});
