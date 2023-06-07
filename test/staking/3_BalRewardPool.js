const { expect, use } = require("chai");
const { ethers, web3 } = require("hardhat");

describe("BALRewardPool", function () {
  let balRewardPoolContract;
  let token1;
  let token2;
  let owner, operator, userA;

  beforeEach(async function () {
    [owner, operator, userA, _] = await ethers.getSigners();

    Token1 = await ethers.getContractFactory("DepositToken");
    token1 = await Token1.deploy(operator.address);
    await token1.deployed();

    Token2 = await ethers.getContractFactory("DepositToken");
    token2 = await Token2.deploy(operator.address);
    await token2.deployed();

    BALRewardPool = await ethers.getContractFactory("BALRewardPool");
    balRewardPoolContract = await BALRewardPool.deploy(token1.address, token2.address, operator.address);
    await balRewardPoolContract.deployed();

  });

  describe("Test initial values after Deployment", function () {
    it("Should total supply be 0 after init", async function () {
      const totalSupply = (await balRewardPoolContract.totalSupply()).toString();
      expect(totalSupply).to.equal('0');
    });

    it("Should balance of accounts be 0 after init", async function () {
      const totalSupply = (await balRewardPoolContract.balanceOf(userA.address)).toString();
      expect(totalSupply).to.equal('0');
    });

    it("Should reward rate be 0 after init", async function () {
      const rewardRate = (await balRewardPoolContract.getRewardRate()).toString();
      expect(rewardRate).to.equal('0');
    });

    it("Should last time reward applicable 0", async function () {
      const timestamp = (await balRewardPoolContract.lastTimeRewardApplicable());
      expect(timestamp).to.equal(0);
    });
    
    it("Should rewardPerToken be 0", async function () {
      const rewardPerToken = (await balRewardPoolContract.rewardPerToken());
      expect(rewardPerToken).to.equal(0);
    });

    it("Should earned be 0", async function () {
      const earned = (await balRewardPoolContract.earned(userA.address));
      expect(earned).to.equal(0);
    });

    it("Should processIdleRewards be callable", async function () {
      await balRewardPoolContract.processIdleRewards();
    });

    it("Should getReward be callable", async function () {
      await balRewardPoolContract.connect(userA).getReward(userA.address);
    });

    it("Should queueNewRewards not be called since user is not an operator", async function () {
      expect(balRewardPoolContract.connect(userA).queueNewRewards(100))
        .to.be.revertedWith('!authorized');
    });

    it("Should queueNewRewards be callable", async function () {
      await balRewardPoolContract.connect(operator).queueNewRewards(100);
    });

    it("Should stakeFor and withdrawFor work as expected", async function () {
      // mint
      await token1.connect(operator).mint(operator.address, 1);

      // check token1 balance of user A
      const balanceAfterMint = (await token1.balanceOf(operator.address)).toString();
      expect(balanceAfterMint).to.equal('1');

      // approve
      await token1.connect(operator).approve(balRewardPoolContract.address, 1);

      // non-operator tries to stake for user A
      expect(balRewardPoolContract.connect(owner).stakeFor(userA.address, 1))
        .to.be.revertedWith('!authorized');

      // stake for user A (msg.sender: operator)
      await balRewardPoolContract.connect(operator).stakeFor(userA.address, 1);

      // check token1 balance of operator: should be 0
      const balanceBeforeWithdraw = (await token1.balanceOf(operator.address)).toString();
      expect(balanceBeforeWithdraw).to.equal('0');

      // balanceOf userA should equal to 1
      const balanceOfUser = (await balRewardPoolContract.balanceOf(userA.address)).toString();
      expect(balanceOfUser).to.equal('1');

      // balanceOf another user should equal to 0
      const balanceOfAnotherUser = (await balRewardPoolContract.balanceOf(owner.address)).toString();
      expect(balanceOfAnotherUser).to.equal('0');

      // should withdrawFor argument greater than 0
      expect(balRewardPoolContract.connect(operator).withdrawFor(userA.address, 0))
        .to.be.revertedWith('RewardPool : Cannot withdraw 0');

      // non-operator tries to withdraw for user A
      expect(balRewardPoolContract.connect(owner).withdrawFor(userA.address, 0))
        .to.be.revertedWith('!authorized');

      // withdraw for user A
      await balRewardPoolContract.connect(operator).withdrawFor(userA.address, 1);
      
      // check token1 balance of userA: should be 1
      const balanceAfterWithdraw = (await token1.balanceOf(operator.address)).toString();
      expect(balanceAfterWithdraw).to.equal('1');

      // balanceOf userA should equal to 0
      const balanceOfUserAfter = (await balRewardPoolContract.balanceOf(userA.address)).toString();
      expect(balanceOfUserAfter).to.equal('0');

      // balanceOf another user should equal to 0
      const balanceOfAnotherUserAfter = (await balRewardPoolContract.balanceOf(owner.address)).toString();
      expect(balanceOfAnotherUserAfter).to.equal('0');

    });

    it("Should rewardRate be > 0 when total supply is not zero and queueNewRewards was executed", async function () {
      // rewardRate should be 0
      const rewardRate = (await balRewardPoolContract.getRewardRate());
      expect(rewardRate).to.equal(0);

      // earned should be 0
      const earned = (await balRewardPoolContract.earned(userA.address));
      expect(earned).to.equal(0);

      // mint
      await token1.connect(operator).mint(operator.address, 1);

      // check token1 balance of user A
      const balanceAfterMint = (await token1.balanceOf(operator.address)).toString();
      expect(balanceAfterMint).to.equal('1');

      // approve
      await token1.connect(operator).approve(balRewardPoolContract.address, 1);

      // stake for user A (msg.sender: operator)
      await balRewardPoolContract.connect(operator).stakeFor(userA.address, 1);

      // totalSupply should be > 0
      const totalSupply = (await balRewardPoolContract.totalSupply()).toString();
      expect(totalSupply).to.not.equal('0');

      // queueNewRewards will update rewardRate
      await balRewardPoolContract.connect(operator).queueNewRewards(10000000);
 
      // rewardRate should be > 0
      const rewardRateAfter = (await balRewardPoolContract.getRewardRate());
      expect(rewardRateAfter).to.not.equal(0);

      // put evm time to future
      await network.provider.send("evm_increaseTime", [1 * 3600])
      await network.provider.send("evm_mine")

      // after some time, earned should not be 0
      const earnedAfter = (await balRewardPoolContract.earned(userA.address));
      expect(earnedAfter).to.not.equal(0);

      // put evm time to future
      await network.provider.send("evm_increaseTime", [10 * 3600])
      await network.provider.send("evm_mine")

      // queueNewRewards will update rewardRate (queuedRatio < newRewardRatio)
      await balRewardPoolContract.connect(operator).queueNewRewards(10000000);

      // put evm time to future
      await network.provider.send("evm_increaseTime", [20 * 3600])
      await network.provider.send("evm_mine")

      // queueNewRewards will update rewardRate (queuedRatio >= newRewardRatio)
      await balRewardPoolContract.connect(operator).queueNewRewards(10);
    });
  });
});
