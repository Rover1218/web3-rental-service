require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA = process.env.SEPOLIA || "";
const SECRET = process.env.SECRET || "";
const ETHERUM = process.env.ETHERUM || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERUM,
  },
  sourcify: {
    enabled: true
  }
};