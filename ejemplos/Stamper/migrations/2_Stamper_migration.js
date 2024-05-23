const Stamper = artifacts.require("Stamper");

module.exports = function (deployer, network, accounts) {
  console.log(accounts);
  deployer.deploy(Stamper);
};
