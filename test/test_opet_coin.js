var Token = artifacts.require("OpetToken");
var BigNumber = require('bignumber.js');

contract("Opet Token", async function(accounts) {
    it("test token minting", async function () {
        let token = await Token.deployed();
        let owner = accounts[0];
        let mintDestination = accounts[1];
        let initialBalance = BigNumber(await token.balanceOf(mintDestination));
        assert.equal(initialBalance.toNumber(), 0, 'The initialBalance has a wrong value');
        try {
            await token.mint(mintDestination, 1, {'from': mintDestination});
            assert.ifError('Error, only owner and allowed addresses can mint new tokens');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the function from not owner");
        }
        await token.mint(mintDestination, 1, {'from': owner});
        let afterMintBalance = BigNumber(await token.balanceOf(mintDestination));
        assert.equal(afterMintBalance.toNumber(), 1, 'Wrong address balance after token mint');
    });

    it("test token set minter", async function () {
        let token = await Token.deployed();
        let mintDestination = accounts[2];
        try {
            await token.mint(mintDestination, 1, {'from': mintDestination});
            assert.ifError('Error, only owner and allowed addresses can mint new tokens');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the function from not owner");
        }
        await token.setMinter(mintDestination, true);
        await token.mint(mintDestination, 1, {'from': mintDestination});
        let afterMintBalance = BigNumber(await token.balanceOf(mintDestination));
        assert.equal(afterMintBalance.toNumber(), 1, 'Wrong address balance after token mint');
    });
});

contract("Opet Token", async function(accounts) {
    it("test max minting limit", async function () {
        let token = await Token.deployed();
        let mintDestination = accounts[1];
        let tokenDecimals = BigNumber(10).exponentiatedBy(BigNumber(await token.decimals()).toNumber());
        let maxMintLimit = BigNumber(100000000).multipliedBy(tokenDecimals);
        await token.mint(mintDestination, maxMintLimit.toString());
        let mintBalance = BigNumber(await token.balanceOf(mintDestination));
        assert.isOk(mintBalance.eq(maxMintLimit), "Wrong amount of mint at addresss");
        try {
            await token.mint(mintDestination, 1);
            assert.ifError("Error, too much tokens successfuly mint");
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the function from not owner");
        }
    });
});

contract("Opet Token", async function(accounts) {
    it("test send airdrop", async function () {
        let token = await Token.deployed();
        let airdropAccounts = [accounts[1], accounts[2]];
        let airdropAmounts = [1, 2];
        try {
            await token.sendAirdrops(airdropAccounts, airdropAmounts, {'from': airdropAccounts[0]});
            assert.ifError('Error, only owner and allowed addresses can airdrop tokens');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the airdrop from not owner");
        }
        try {
            await token.sendAirdrops(airdropAccounts,[airdropAmounts[0]]);
            assert.ifError('Error, wrong arrays leght should fail transaction');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error after try to use the airdrop with different arrays length");
        }
        await token.sendAirdrops(airdropAccounts, airdropAmounts);
        let afterAirdropBalance0 = BigNumber(await token.balanceOf(airdropAccounts[0]));
        let afterAirdropBalance1 = BigNumber(await token.balanceOf(airdropAccounts[1]));
        assert.equal(afterAirdropBalance0.toNumber(), airdropAmounts[0], 'Wrong address balance after token airdrop for address 0');
        assert.equal(afterAirdropBalance1.toNumber(), airdropAmounts[1], 'Wrong address balance after token airdrop for address 1');
    });

    it("test token set minter for airdrop", async function () {
        let token = await Token.deployed();
        let airdropAccounts = [accounts[3]];
        let airdropAmounts = [1];
        await token.setMinter(airdropAccounts[0], true);
        await token.sendAirdrops(airdropAccounts, airdropAmounts, {'from': airdropAccounts[0]});
        let afterAirdropBalance = BigNumber(await token.balanceOf(airdropAccounts[0]));
        assert.equal(afterAirdropBalance.toNumber(), 1, 'Wrong address balance after token mint');
    });
});

contract("Opet Token", async function(accounts) {
    it("test send max airdrop", async function () {
        let token = await Token.deployed();
        let airdropAccount = [accounts[1]];
        let airdropAmount = [BigNumber(await token.AIRDROP_SUPPLY()).toString()];

        assert.equal('586365000000000', airdropAmount[0], "Wrong amount of Airdrop supply");
        await token.sendAirdrops(airdropAccount, airdropAmount);
        let afterAirdropBalance = BigNumber(await token.balanceOf(airdropAccount[0])).toString();
        assert.equal(afterAirdropBalance, airdropAmount[0], 'Wrong address balance after token airdrop');

        try {
            await token.sendAirdrops(airdropAccount, [1]);
            assert.ifError('Error, too much tokens successfuly airdropped');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Wrong error too big amount of airdrop");
        }
    });
});


contract("Opet Token", async function (accounts) {
    it("test transfer unable to execute", async function () {
        let token = await Token.deployed();
        let mintDestination = accounts[1];
        let transferDestination = accounts[2];


        await token.mint(mintDestination, 2);
        try {
            await token.transfer(transferDestination, 1, {'from': mintDestination});
            assert.ifError('Error, transfer should be unable');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "Transfer works before token unpaused");
        }

        await token.approve(transferDestination, 1, {'from': mintDestination});
        try {
            await token.transferFrom(mintDestination, transferDestination, 1, {'from': transferDestination});
            assert.ifError('Error, transferFrom should be unable');
        } catch (err) {
            assert.equal(err, 'Error: VM Exception while processing transaction: revert', "transferFrom works before token unpaused");
        }

        await token.unpauseTransfer();
        await token.transfer(transferDestination, 1, {'from': mintDestination});
        let afterTransferBalance = BigNumber(await token.balanceOf(transferDestination));
        assert.equal(afterTransferBalance.toNumber(), 1, 'Wrong address balance after transfer');

        await token.transferFrom(mintDestination, transferDestination, 1, {'from': transferDestination});
        afterTransferBalance = BigNumber(await token.balanceOf(transferDestination));
        assert.equal(afterTransferBalance.toNumber(), 2, 'Wrong address balance after transferFrom');
    })

});