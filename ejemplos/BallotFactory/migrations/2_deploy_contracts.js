const Factory = artifacts.require("BallotFactory");


module.exports = function (deployer) {
  deployer.deploy(Factory);
};
