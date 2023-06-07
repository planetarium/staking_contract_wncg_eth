const { expect } = require("chai");

describe("DepositToken", function () {
  let depositTokenContract;
  let owner, operator, userA;

  beforeEach(async function () {
    [owner, operator, userA, _] = await ethers.getSigners();
    DepositToken = await ethers.getContractFactory("DepositToken");
    depositTokenContract = await DepositToken.deploy(operator.address);
    await depositTokenContract.deployed();
  });

  describe("mint & burn are only only allowed for operator", function () {
    it("Should mint not work since the userA is not an operator", async function () {
      await expect(
          depositTokenContract.connect(userA).mint(userA.address, 100)
        ).to.be.revertedWith('!authorized');
    });

    it("Should burn not work since the userA is not an operator", async function () {
      await expect(
          depositTokenContract.connect(userA).burn(userA.address, 100)
        ).to.be.revertedWith('!authorized');
    });

    it("Should mint and burn 100 Token correctly", async function () {
      await depositTokenContract.connect(operator).mint(userA.address, 100);
      const balanceAfterMint = (await depositTokenContract.balanceOf(userA.address)).toString();
      expect(balanceAfterMint).to.equal('100');

      await depositTokenContract.connect(operator).burn(userA.address, 100);
      const balanceAfterBurn = (await depositTokenContract.balanceOf(userA.address)).toString();
      expect(balanceAfterBurn).to.equal('0');
    });

  });
});
