const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", function () {
              it("sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
              describe("withdraw", function () {
                  beforeEach(async function () {
                      await fundMe.fund({ value: sendValue })
                  })
                  it("Withdraw ETH from a single funder", async function () {
                      //Arrange
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      // Act
                      const transactionResponse = await fundMe.withdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )
                      const { effectiveGasPrice, gasUsed } = transactionReceipt
                      const gasCost = effectiveGasPrice.mul(gasUsed)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      // Assert
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                  })
                  it("Withdraw ETH from a single funder - cheaper version", async function () {
                      //Arrange
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      // Act
                      const transactionResponse = await fundMe.cheaperWithdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )
                      const { effectiveGasPrice, gasUsed } = transactionReceipt
                      const gasCost = effectiveGasPrice.mul(gasUsed)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      // Assert
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                  })
                  it("Allows us to withdraw with multiple getFunder", async function () {
                      const accounts = await ethers.getSigners()
                      for (let i; i < 6; i++) {
                          const fundMeConnectedContract =
                              fundMe.provider.connect(accounts[i])
                          await fundMeConnectedContract.fund({
                              value: sendValue,
                          })
                      }
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      const transactionResponse = await fundMe.cheaperWithdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )
                      const { effectiveGasPrice, gasUsed } = transactionReceipt
                      const gasCost = effectiveGasPrice.mul(gasUsed)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                      // Make sure that the getFunder are reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted
                      // Let's make sure if all getFunder balance is zero
                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          )
                      }
                  })
                  it("Only allows owner to withdraw", async function () {
                      const accounts = await ethers.getSigners()
                      const attacker = accounts[1]
                      const attackerConnectedContract = await fundMe.connect(
                          attacker
                      )
                      await expect(
                          attackerConnectedContract.withdraw()
                      ).to.be.revertedWith("FundMe__NotOwner")
                  })

                  it("Cheaper withdraw testing", async function () {
                      const accounts = await ethers.getSigners()
                      for (let i; i < 6; i++) {
                          const fundMeConnectedContract =
                              fundMe.provider.connect(accounts[i])
                          await fundMeConnectedContract.fund({
                              value: sendValue,
                          })
                      }
                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      const transactionResponse = await fundMe.withdraw()
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      )
                      const { effectiveGasPrice, gasUsed } = transactionReceipt
                      const gasCost = effectiveGasPrice.mul(gasUsed)

                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address)
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer)
                      assert.equal(endingFundMeBalance, 0)
                      assert.equal(
                          startingDeployerBalance
                              .add(startingFundMeBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      )
                      // Make sure that the getFunder are reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted
                      // Let's make sure if all getFunder balance is zero
                      for (i = 1; i < 6; i++) {
                          assert.equal(
                              await fundMe.getAddressToAmountFunded(
                                  accounts[i].address
                              ),
                              0
                          )
                      }
                  })
              })
          })
      })
