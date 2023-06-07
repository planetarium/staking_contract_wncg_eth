const { expect } = require("chai");
const { ethers, web3, waffle } = require("hardhat");
const { deployMockContract } = waffle
const IBalancerGauge = require('../../artifacts/contracts/interfaces/IBalancerGauge.sol/IBalancerGauge.json');
const IBalancerMinter = require('../../artifacts/contracts/interfaces/IBalancerMinter.sol/IBalancerMinter.json');

describe("BasicStakeUnstake", function () {
  let stakingRewardsContract;
  let stakeToken;
  let rewardToken;
  let BALToken;
  let depositToken;
  let balRewardPool;
  let balancerGauge;
  let balancerMinter;
  let owner, operator, rewardsVault, balOperationVault, userA, userB;
  let rewardsVault2,  balOperationVault2;
  let nullAddress = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    [owner, operator, rewardsVault, balOperationVault,
      rewardsVault2, balOperationVault2, userA, userB, _] = await ethers.getSigners();

    t1 = await ethers.getContractFactory("ERC20Token");
    stakeToken = await t1.deploy();
    await stakeToken.deployed();

    t2 = await ethers.getContractFactory("ERC20Token");
    rewardToken = await t2.deploy();
    await rewardToken.deployed();

    t3 = await ethers.getContractFactory("ERC20Token");
    BALToken = await t3.deploy();
    await BALToken.deployed();

    StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewardsContract = await StakingRewards.deploy();
    await stakingRewardsContract.deployed();

    balancerGauge = await deployMockContract(owner, IBalancerGauge.abi);
    await balancerGauge.mock.deposit.returns();
    await balancerGauge.mock.withdraw.returns();

    const mockBalancerMinter = await deployMockContract(owner, IBalancerMinter.abi);
    await mockBalancerMinter.mock.mint.returns();

    await stakingRewardsContract.initialize(
      stakeToken.address,
      rewardToken.address,
      operator.address,
      rewardsVault.address,
      balOperationVault.address,
      BALToken.address,
      mockBalancerMinter.address
    );

    t4 = await ethers.getContractFactory("DepositToken");
    depositToken = await t4.deploy(stakingRewardsContract.address);
    await depositToken.deployed();

    t5 = await ethers.getContractFactory("BALRewardPool");
    balRewardPool = await t5.deploy(
      depositToken.address, BALToken.address, stakingRewardsContract.address);
    await balRewardPool.deployed();

  });

  describe("Test initial values after Deployment", function () {

    it("Should only operator can call those functions", async function () {
      await expect(stakingRewardsContract.connect(userA)
        .configBalRewardPool(
          depositToken.address,
          balRewardPool.address,
          balancerGauge.address))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .configEmissionPerSecond(1))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .configCooldownSecondAndUnstakeWindow(1, 1))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .configFees(1, 1))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .changeOperator(userB.address))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .changeRewardsVault(userB.address))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .changeBalOperationVault(userB.address))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .changePauseStaking(true))
        .to.be.revertedWith('ONLY_OPERATOR');
      await expect(stakingRewardsContract.connect(userA)
        .changeUseBalRewardPool(true))
        .to.be.revertedWith('ONLY_OPERATOR');
    });

    it("Should configBalRewardPool work as expected", async function () {
      // initial value of DEPOSIT_TOKEN_ADDR and BAL_REWARD_POOL should be null address
      expect((await stakingRewardsContract.DEPOSIT_TOKEN_ADDR()).toString())
        .to.be.equal(nullAddress);
      expect((await stakingRewardsContract.BAL_REWARD_POOL()).toString())
        .to.be.equal(nullAddress);
      expect((await stakingRewardsContract.balancerGauge()).toString())
        .to.be.equal(nullAddress);

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, nullAddress, nullAddress);

      // should be updated as expected
      expect((await stakingRewardsContract.DEPOSIT_TOKEN_ADDR()).toString())
        .to.be.equal(depositToken.address);

      // USE_BAL_REWARD_POOL should be false
      expect((await stakingRewardsContract.USE_BAL_REWARD_POOL()).toString())
        .to.be.equal('false');

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(nullAddress, balRewardPool.address, nullAddress);

      // USE_BAL_REWARD_POOL should be true
      expect((await stakingRewardsContract.USE_BAL_REWARD_POOL()).toString())
        .to.be.equal('true');

      // should be updated as expected
      expect((await stakingRewardsContract.BAL_REWARD_POOL()).toString())
        .to.be.equal(balRewardPool.address);

      // config BAL Reward Pool with requirements
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address);

      // should be updated as expected
      expect((await stakingRewardsContract.DEPOSIT_TOKEN_ADDR()).toString())
        .to.be.equal(depositToken.address);
      expect((await stakingRewardsContract.BAL_REWARD_POOL()).toString())
        .to.be.equal(balRewardPool.address);
      expect((await stakingRewardsContract.balancerGauge()).toString())
        .to.be.equal(balancerGauge.address);

    });

    it("Should configEmissionPerSecond update WNCG EmissionPerSec", async function () {
      // initial value of emissionPerSecond should be 0
      expect((await stakingRewardsContract.getEmissionPerSec()).toString())
        .to.be.equal('0');

      // config emissionPerSec
      await stakingRewardsContract.connect(operator)
        .configEmissionPerSecond(100);

      // should be updated as expected
      expect((await stakingRewardsContract.getEmissionPerSec()).toString())
        .to.be.equal('100');
    });

    it("Should configCooldownSecondAndUnstakeWindow update cooldown second and unstake window", async function () {
      // initial value of COOLDOWN_SECONDS is TWO_WEEKS and UNSTAKE_WINDOW is THREE_DAYS
      expect((await stakingRewardsContract.COOLDOWN_SECONDS()).toString())
        .to.be.equal('1209600'); // 14 days as second
      expect((await stakingRewardsContract.UNSTAKE_WINDOW()).toString())
        .to.be.equal('259200'); // 3 days as second

      // COOLDOWN_SECONDS seconds should be > 0
      await expect(stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(0, 120))
        .to.be.revertedWith('!cooldownSeconds');

      // UNSTAKE_WINDOW seconds should be > 0
      await expect(stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(30, 0))
        .to.be.revertedWith('!unstakeWindow');

      // config COOLDOWN_SECONDS and UNSTAKE_WINDOW
      await stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(30, 120);

      // should be updated as expected
      expect((await stakingRewardsContract.COOLDOWN_SECONDS()).toString())
        .to.be.equal('30');
      expect((await stakingRewardsContract.UNSTAKE_WINDOW()).toString())
        .to.be.equal('120');

    });

    it("Should configFees update operation fee and earmark incentive", async function () {
      // initial value of earmarkIncentive and operationFee
      expect((await stakingRewardsContract.earmarkIncentive()).toString())
        .to.be.equal('100'); // initial value is 100 (1%)
      expect((await stakingRewardsContract.operationFee()).toString())
        .to.be.equal('1900'); // initial value is 1900 (19%)

      // should work as expected
      await stakingRewardsContract.connect(operator).configFees(0, 0);
      const earmarkIncentive = (await stakingRewardsContract.earmarkIncentive());
      const operationFee = (await stakingRewardsContract.operationFee());
      expect(earmarkIncentive.toString()).to.be.equal('0');
      expect(operationFee.toString()).to.be.equal('0');

      // should earmarkIncentive smaller than earmarkIncentiveMax
      const earmarkIncentiveMax = (await stakingRewardsContract.earmarkIncentiveMax());
      await expect(stakingRewardsContract.connect(operator)
        .configFees(earmarkIncentiveMax+1, 0))
        .to.be.revertedWith('!earmarkIncentive');

      // should operationFee smaller than operationFeeMax
      const operationFeeMax = (await stakingRewardsContract.operationFeeMax());
      await expect(stakingRewardsContract.connect(operator)
        .configFees(0, operationFeeMax+1))
        .to.be.revertedWith('!operationFee');
    });

    it("Should changeOperator update operator address", async function () {
      // if non-operator tries to change the operator, it should not work
      await expect(stakingRewardsContract.connect(userA)
        .changeOperator(userB.address))
        .to.be.revertedWith('ONLY_OPERATOR');
        
      // if the current operator tries to change the operator, it should work
      await stakingRewardsContract.connect(operator)
        .changeOperator(userA.address);
      expect(await stakingRewardsContract.OPERATOR())
        .to.be.equal(userA.address);

      // if the old operator tries to change the operator, now it should not work
      await expect(stakingRewardsContract.connect(operator)
        .changeOperator(userB.address))
        .to.be.revertedWith('ONLY_OPERATOR');

      // if the new operator tries to change the operator, now it should work
      await stakingRewardsContract.connect(userA)
        .changeOperator(userB.address);
      expect(await stakingRewardsContract.OPERATOR())
        .to.be.equal(userB.address);

      // operator can call config functions
      await stakingRewardsContract.connect(userB).configEmissionPerSecond(1);

      // non-operator can not call config functions
      await expect(stakingRewardsContract.connect(operator)
        .configEmissionPerSecond(1))
        .to.be.revertedWith('ONLY_OPERATOR');
    });

    it("Should changeRewardsVault update rewards vault address", async function () {
      // if non-operator tries to change the rewards vault, it should not work
      await expect(stakingRewardsContract.connect(userA)
        .changeRewardsVault(rewardsVault2.address))
        .to.be.revertedWith('ONLY_OPERATOR');

      // check the current rewards vault
      expect(await stakingRewardsContract.REWARDS_VAULT())
        .to.be.equal(rewardsVault.address);
        
      // if the operator tries to change the rewards vault, it should work
      await stakingRewardsContract.connect(operator)
        .changeRewardsVault(rewardsVault2.address);
      expect(await stakingRewardsContract.REWARDS_VAULT())
        .to.be.equal(rewardsVault2.address);
    });

    it("Should changeBalOperationVault update bal operation vault address", async function () {
      // if non-operator tries to change the bal operations vault, it should not work
      await expect(stakingRewardsContract.connect(userA)
        .changeBalOperationVault(balOperationVault2.address))
        .to.be.revertedWith('ONLY_OPERATOR');

      // check the current bal operations vault
      expect(await stakingRewardsContract.BAL_OPERATION_VAULT())
        .to.be.equal(balOperationVault.address);
        
      // if the operator tries to change the bal operations vault, it should work
      await stakingRewardsContract.connect(operator)
        .changeBalOperationVault(balOperationVault2.address);
      expect(await stakingRewardsContract.BAL_OPERATION_VAULT())
        .to.be.equal(balOperationVault2.address);
    });

    // Run test as follows:
    // 1. stake
    // 2. claim rewards
    // 3. withdraw
    it("Should stake/claim/withdraw work as expected", async function () {

      // ========== stake ==========
      const stakeAmount = 2;
      const withdrawAmount = 1; // withdraw half of stakeAmount, twice for this test

      // invalid zero amount
      await expect(stakingRewardsContract.connect(userA)
        .stake(0))
        .to.be.revertedWith('INVALID_ZERO_AMOUNT');

      // config emissionPerSec
      await stakingRewardsContract.connect(operator)
        .configEmissionPerSecond(1000);

      // config Bal Reward Pool correctly
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(
          depositToken.address,
          balRewardPool.address,
          balancerGauge.address);
      
      // mint token and approve the contract in order to give permission
      await stakeToken.connect(userA).mint(stakeAmount);
      await stakeToken.connect(userA).approve(stakingRewardsContract.address, stakeAmount) // 1.0

      // total staked should be zero at this moment
      expect(await stakingRewardsContract.totalStaked()).to.be.equal(0);

      // should earnedWNCG and earnedBALRewards be zero before stake
      expect(await stakingRewardsContract.earnedTokenRewards(userA.address))
        .to.be.equal(0);
      expect(await stakingRewardsContract.earnedBALRewards(userA.address))
        .to.be.equal(0);

      // stake
      await stakingRewardsContract.connect(userA).stake(stakeAmount);
    
      // now totalSupply should be same as stakeAmount
      expect(await stakingRewardsContract.totalStaked())
        .to.be.equal(stakeAmount);

      // and balance of staked user should be same as stakeAmount
      expect(await stakingRewardsContract.stakedTokenBalance(userA.address))
        .to.be.equal(stakeAmount);

      // ========== claim ==========
           
      // claimTokenRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .claimTokenRewards(1))
        .to.be.ok;

      // claimBALRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .claimBALRewards())
        .to.be.ok;

      // claimAllRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .claimAllRewards(1))
        .to.be.ok;

      // earmarkRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .earmarkRewards())
        .to.be.ok;

      // ========== withdraw ==========
      
      // invalid zero amount
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(0, false))
        .to.be.revertedWith('INVALID_ZERO_AMOUNT');

      // config COOLDOWN_SECONDS and UNSTAKE_WINDOW
      await stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(30, 120);

      // start cooldown
      await stakingRewardsContract.connect(userA).cooldown();

      // put evm time to future
      await network.provider.send("evm_increaseTime", [10])
      await network.provider.send("evm_mine")

      // not enough cooldown time
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, false))
        .to.be.revertedWith('INSUFFICIENT_COOLDOWN');

      // put evm time to future
      await network.provider.send("evm_increaseTime", [25])
      await network.provider.send("evm_mine")
      
      // withdraw (now cooldown should be done)
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, false))
        .to.be.ok;

      // second withdraw with isClaimAllRewards true
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, true))
        .to.be.ok;
    });

    // Run test as follows:
    // 1. stake without BAL REWARD POOL
    // 2. stake with BAL REWARD POOL
    // 3. transferStakedBalanceToBalRewardPool
    // 4. cooldown and withdraw
    it("Should stake/withdraw with/without Bal Reward Pool", async function () {
      // ========== configure ==========
     
      // config COOLDOWN_SECONDS and UNSTAKE_WINDOW
      await stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(10, 120);

      // config emissionPerSec
      await stakingRewardsContract.connect(operator)
        .configEmissionPerSecond(1000);

      // ========== stake ==========
      
      // withdraw when there's no staking
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(1, false))
        .to.be.revertedWith('NOT_ENOUGH_BALANCE');
      
      const stakeAmount = 1;
      const withdrawAmount = 1;

      // mint token and approve the contract in order to give permission
      await stakeToken.connect(userA).mint(stakeAmount);
      await stakeToken.connect(userA).approve(stakingRewardsContract.address, stakeAmount * 4);

      // withdraw without bal reward pool
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, false))
        .to.be.ok;

      // pause staking should be false
      expect((await stakingRewardsContract.PAUSE_STAKING()).toString())
        .to.be.equal("false");

      // stake => Total Staked: 1
      await stakingRewardsContract.connect(userA).stake(stakeAmount);

      // only operator can change pause staking
      await stakingRewardsContract.connect(operator).changePauseStaking(true);

      // pause staking should be true after change
      expect((await stakingRewardsContract.PAUSE_STAKING()).toString())
        .to.be.equal("true");

      // stake should be paused
      await expect(stakingRewardsContract.connect(userA).stake(stakeAmount))
        .to.be.revertedWith('STAKING_PAUSED');

      // only operator can change pause staking
      await stakingRewardsContract.connect(operator).changePauseStaking(false);
      
      // balance of staked user should be same as stakeAmount
      expect(await stakingRewardsContract.stakedTokenBalance(userA.address))
        .to.be.equal(stakeAmount);

      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(true);

      // config Bal Reward Pool incorrectly
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(nullAddress, nullAddress, nullAddress);

      // stake
      await expect(stakingRewardsContract.connect(userA).stake(stakeAmount))
        .to.be.revertedWith('INVALID_DEPOSIT_TOKEN_ADDR');

      // config Bal Reward Pool without balancer gauge
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, nullAddress, nullAddress);

      // stake
      await expect(stakingRewardsContract.connect(userA).stake(stakeAmount))
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config Bal Reward Pool without balancer gauge
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, nullAddress);

      // stake 
      await expect(stakingRewardsContract.connect(userA).stake(stakeAmount))
        .to.be.revertedWith('INVALID_BALANCER_GAUGE');

      // config Bal Reward Pool correctly
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      // stake => Total Staked: 2
      await stakingRewardsContract.connect(userA).stake(stakeAmount);

      // balance of staked user should be same as stakeAmount*2
      expect(await stakingRewardsContract.stakedTokenBalance(userA.address))
        .to.be.equal(stakeAmount*2);

      // ========== Transfer Staked Balance To Bal Reward Pool ==========
      await stakingRewardsContract.connect(userA).transferStakedBalanceToBalRewardPool();

      // ========== withdraw ==========

      // withdraw
      await expect(stakingRewardsContract.connect(userA).withdraw(withdrawAmount, false))
        .to.be.revertedWith('UNSTAKE_WINDOW_FINISHED');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(nullAddress, nullAddress, nullAddress);

      // withdraw
      await expect(stakingRewardsContract.connect(userA).withdraw(withdrawAmount, false))
        .to.be.revertedWith('INVALID_DEPOSIT_TOKEN_ADDR');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, nullAddress, nullAddress);

      // withdraw
      await expect(stakingRewardsContract.connect(userA).withdraw(withdrawAmount, false))
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, nullAddress);

      // withdraw
      await expect(stakingRewardsContract.connect(userA).withdraw(withdrawAmount, false))
        .to.be.revertedWith('INVALID_BALANCER_GAUGE');

      // start cooldown
      await stakingRewardsContract.connect(userA).cooldown();

      // put evm time to future
      await network.provider.send("evm_increaseTime", [20])
      await network.provider.send("evm_mine")

      // first withdraw with isClaimAllRewards false
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, false))
        .to.be.ok;

      // second withdraw with isClaimAllRewards true
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, true))
        .to.be.ok;
    });

    // Run test as follows:
    it("Should stake/withdraw with BAL Reward Pool from the beginning", async function () {
      // ========== configure ==========
     
      // config COOLDOWN_SECONDS and UNSTAKE_WINDOW
      await stakingRewardsContract.connect(operator)
        .configCooldownSecondAndUnstakeWindow(10, 120);

      // config emissionPerSec
      await stakingRewardsContract.connect(operator)
        .configEmissionPerSecond(1000);

      // ========== stake ==========
      
      const stakeAmount = 1;
      const withdrawAmount = 1;

      // mint token and approve the contract in order to give permission
      await stakeToken.connect(userA).mint(stakeAmount);
      await stakeToken.connect(userA).approve(stakingRewardsContract.address, stakeAmount * 1);

      // config Bal Reward Pool correctly
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      // stake => Total Staked: 1
      await stakingRewardsContract.connect(userA).stake(stakeAmount);

      // ========== withdraw ==========

      // withdraw
      await expect(stakingRewardsContract.connect(userA)
        .withdraw(withdrawAmount, true))
        .to.be.ok;
    });


    it("Should transferStakedBalanceToBalRewardPool be callbable", async function () {
      await expect(stakingRewardsContract.connect(userA)
        .transferStakedBalanceToBalRewardPool())
        .to.be.revertedWith('!BAL_REWARD_POOL');

      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(true);

      await expect(stakingRewardsContract.connect(userA)
        .transferStakedBalanceToBalRewardPool())
        .to.be.revertedWith('INVALID_DEPOSIT_TOKEN_ADDR');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, nullAddress, nullAddress);

      await expect(stakingRewardsContract.connect(userA)
        .transferStakedBalanceToBalRewardPool())
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, nullAddress);

      await expect(stakingRewardsContract.connect(userA)
        .transferStakedBalanceToBalRewardPool())
        .to.be.revertedWith('INVALID_BALANCER_GAUGE');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address);

      await expect(stakingRewardsContract.connect(userA)
        .transferStakedBalanceToBalRewardPool())
        .to.be.revertedWith('NOT_ENOUGH_BALANCE');
    });

    it("Should getNextCooldownTimestamp be callable", async function () {
      // get next cooldown timestamp
      const balancesOfUserA = await stakingRewardsContract.connect(userA)
        .stakedTokenBalance(userA.address);

      // getNextCooldownTimestamp should be callable 
      await expect(stakingRewardsContract.connect(userA)
        .getNextCooldownTimestamp(0, 1, userA.address, balancesOfUserA))
        .to.be.ok;
    });

    it("Should cooldown functions work as expected", async function () {
      // cooldown shuld be reverted with invalid balance since there's nothing staked
      await expect(stakingRewardsContract.connect(userA)
        .cooldown())
        .to.be.revertedWith('INVALID_BALANCE_ON_COOLDOWN');

      expect(await stakingRewardsContract.connect(operator)
        .getCooldownEndTimestamp(userA.address))
        .to.be.not.equal(0);

      expect(await stakingRewardsContract.connect(operator)
        .getWithdrawEndTimestamp(userA.address))
        .to.be.not.equal(0);
      
    });

    it("Should processIdleRewards be callable", async function () {
      await expect(stakingRewardsContract.processIdleRewards())
        .to.be.revertedWith('!BAL_REWARD_POOL');

      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(true);

      await expect(stakingRewardsContract.processIdleRewards())
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      expect(await stakingRewardsContract.processIdleRewards())
        .to.be.ok;
    });

    it("Should getBALRewardRate return 0", async function () {
      await expect(stakingRewardsContract.connect(operator)
        .getBALRewardRate())
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      expect(await stakingRewardsContract.connect(operator)
        .getBALRewardRate())
        .to.be.equal(0);
    });

    it("Should earmarkRewards be callable", async function () {
      await expect(stakingRewardsContract.earmarkRewards())
        .to.be.revertedWith('!BAL_REWARD_POOL');

      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(true);

      // config 
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, nullAddress, nullAddress);

      await expect(stakingRewardsContract.earmarkRewards())
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      // now earmarkRewards should be callable
      await expect(stakingRewardsContract.earmarkRewards())
        .to.be.ok;
    });

    it("Should claimTokenRewards be callable", async function () {
      // claimTokenRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .claimTokenRewards(1))
        .to.be.ok;
    });

    it("Should claimBALRewards be callable", async function () {
      await expect(stakingRewardsContract.claimBALRewards())
        .to.be.revertedWith('INVALID_BAL_REWARD_POOL');

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      // now claimBALRewards should be callable
      await expect(stakingRewardsContract.connect(userA)
        .claimBALRewards())
        .to.be.ok;
    });

    it("Should claimAllRewards be callable", async function () {
      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(false);

      // now claimAllRewards should be callable
      await expect(stakingRewardsContract.claimAllRewards())
        .to.be.ok;

      // config to use bal reward pool
      await stakingRewardsContract.connect(operator).changeUseBalRewardPool(true);

      // config BAL Reward Pool
      await stakingRewardsContract.connect(operator)
        .configBalRewardPool(depositToken.address, balRewardPool.address, balancerGauge.address)

      // now claimAllRewards should be callable
      await expect(stakingRewardsContract.claimAllRewards())
        .to.be.ok;
    });

    it("Should get current block timestamp", async function () {
      expect(await stakingRewardsContract.getCurrentBlockTimestamp())
        .to.be.not.equal(0);
    });

  });
});
