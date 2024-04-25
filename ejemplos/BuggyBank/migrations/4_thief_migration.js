const Thief = artifacts.require("Thief");

module.exports = function (deployer) {
  deployer.deploy(Thief);
};
