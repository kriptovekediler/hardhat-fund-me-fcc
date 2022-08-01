const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "localhost",
        entranceFee: ethers.utils.parseEther("0.01"),
    },
    4: {
        name: "rinkeby",
        entranceFee: ethers.utils.parseEther("0.01"),
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
