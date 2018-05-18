var OpetToken = artifacts.require("OpetToken");

module.exports = async function(deployer, network, accounts) {
    deployer.deploy(OpetToken);
};