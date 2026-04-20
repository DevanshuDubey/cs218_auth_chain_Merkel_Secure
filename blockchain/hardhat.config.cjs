require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // Good for Gas Optimisation marks
      }
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    // coinmarketcap: "YOUR_API_KEY", // Optional: Get an API key from CoinMarketCap for USD values
  }
};