const BuggyBank = artifacts.require("BuggyBank");
const VeryBuggyBank = artifacts.require("VeryBuggyBank");

module.exports = function(deployer) {
  deployer.deploy(BuggyBank);
  deployer.deploy(VeryBuggyBank);
};
