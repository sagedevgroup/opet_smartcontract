var Token = artifacts.require("OpetToken");
var BigNumber = require('bignumber.js');


contract('Opet Token constructor', async function (accounts) {
    it("test initial state", async function () {
        let token = await Token.deployed();
        let owner = accounts[0];
        let expectedInitialBalance = BigNumber(100000000).multipliedBy(BigNumber(10).exponentiatedBy(8));
        let actualInitialBalance = BigNumber(await token.balanceOf.call(owner));
        let actualTotalSupply = BigNumber(await token.totalSupply.call());

        assert.isTrue(actualInitialBalance.isEqualTo(expectedInitialBalance), "Wrong initial balance");
        assert.isTrue(actualTotalSupply.isEqualTo(expectedInitialBalance), "Wrong total supply");
    });

});


contract("Opet Token", async function(accounts) {
    it("test airdrop", async function () {
        let token = await Token.deployed();
        let airdropAccount = [accounts[1], accounts[2]];
        let airdropAmount = [1, 2];

        await token.sendAirdrops(airdropAccount, airdropAmount);
        let afterAirdropBalance0 = BigNumber(await token.balanceOf.call(airdropAccount[0])).toString();
        let afterAirdropBalance1 = BigNumber(await token.balanceOf.call(airdropAccount[1])).toString();
        assert.equal(afterAirdropBalance0, airdropAmount[0], 'Wrong address0 balance after token airdrop');
        assert.equal(afterAirdropBalance1, airdropAmount[1], 'Wrong address1 balance after token airdrop');
    });
});


contract("Opet Token", async function (accounts) {
    it("test transfer paused is paused by default and unpause function works", async function () {
        let token = await Token.deployed();
        let fromAccount = accounts[1];
        let transferDestination = accounts[2];

        await token.transfer(fromAccount, 2);

        try {
            await token.transfer(transferDestination, 1, {'from': fromAccount});
            assert.ifError('Error, transfer should be unable');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Transfer works before token transfer unpaused");
        }

        await token.approve(transferDestination, 1, {'from': fromAccount});
        try {
            await token.transferFrom(fromAccount, transferDestination, 1, {'from': transferDestination});
            assert.ifError('Error, transferFrom should be unable');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "transferFrom works before token unpaused");
        }

        await token.unpauseTransfer();
        await token.transfer(transferDestination, 1, {'from': fromAccount});
        let afterTransferBalance = BigNumber(await token.balanceOf(transferDestination));
        assert.equal(afterTransferBalance.toNumber(), 1, 'Wrong address balance after transfer');

        await token.transferFrom(fromAccount, transferDestination, 1, {'from': transferDestination});
        afterTransferBalance = BigNumber(await token.balanceOf(transferDestination));
        assert.equal(afterTransferBalance.toNumber(), 2, 'Wrong address balance after transferFrom');
    });

});

contract("Opet Token transfer whitelist", async function (accounts) {
   it('test whitelisting', async function() {
       let transferFrom = accounts[1];
       let transferTo = accounts[2];
       let token = await Token.deployed();
       await token.transfer(transferFrom, 100);

       await token.addWhitelistedTransfer(transferFrom);
       await token.transfer(transferTo, 10, {'from': transferFrom});
       await token.removeWhitelistedTransfer(transferFrom);
       try {
            await token.transfer(transferTo, 10, {'from': transferFrom});
            assert.ifError('Error, previous code must throw exception');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Error, transfer should be locked by default.");
        }
   });
});
