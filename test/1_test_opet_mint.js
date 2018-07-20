var OpetToken = artifacts.require("OpetToken");
var BigNumber = require('bignumber.js');

function getMaxUint256(){
    let x = BigNumber(2)
    return x.exponentiatedBy(256).minus(1)
}

contract("Opet - MintableToken - mint unit cases", async (accounts)=> {
    it("[Initial Value Test] maxMintLimit value", async function() {
        let token = await OpetToken.new();
        let maxMint = BigNumber(100000000 * (10** (await token.decimals())));
        let tokenMaxiMint = BigNumber((await token.maxMintLimit()));
        assert.isOk(maxMint.isEqualTo(tokenMaxiMint), "initial maxMintLimit with incorrect value");
    }); 

    var testSetMinterCases = [
        {
            name: '[Func Test] setMinter <conditions - set owner, hasMintPermission with owner permission>',
            account: accounts[0],
            hasMintPermission: true,
            setAccount: accounts[0],
            expectResult: 'success'
        },
        {
            name: '[Func Test] setMinter <conditions - set not owner, hasMintPermission with owner permission>',
            account: accounts[0],
            hasMintPermission: true,
            setAccount: accounts[1],
            expectResult: 'success'
        },
        {
            name: '[Func Test] setMinter <conditions - set owner, hasMintPermission with no owner permission',
            account: accounts[1],
            hasMintPermission: true,
            setAccount: accounts[1],
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] setMinter <conditions - set no owner, hasMintPermission with no owner permission',
            account: accounts[1],
            setAccount: accounts[1],
            hasMintPermission: true,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] setMinter <conditions - set owner with no mintPermission with owner permission',
            account: accounts[0],
            setAccount: accounts[0],
            hasMintPermission: false,
            expectResult:'success'
        },
        {
            name: '[Func Test] setMinter <conditions - set no owner with no mintPermission with owner permission',
            account: accounts[0],
            setAccount: accounts[1],
            hasMintPermission: false,
            expectResult: 'success'
        }
    ]
    testSetMinterCases.forEach((tc)=>{
        it(tc.name, async ()=>{
            let token = await OpetToken.new();
            let error = null;
            try {
                await token.setMinter(tc.setAccount, tc.hasMintPermission, {from: tc.account})
            }catch(err){
                error = err;
            }
            if(tc.expectResult == 'fail'){
                assert.notEqual(error, null, 'error should not be null');
                assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
            }else {
                assert.equal(error, null, 'error should be null');
                let error2 = null;
                try{
                    await token.mint(accounts[2], 10000, {from:tc.setAccount});
                }catch(err2){
                    //console.log(err2)
                    error2 = err2;
                }
                if(tc.hasMintPermission){
                    assert.ifError(error2);
                } else {
                    if(tc.account == accounts[0] && tc.setAccount == accounts[0]){
                        assert.ifError(error2);
                    } else {
                        assert.notEqual(error2, null, 'error should not be null');
                        assert.isAbove(error2.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
                    }
                } 
            }
        });
    });

    it("[Func Test] setMinter <conditions - set no owner with permssion, mint then disable permission, check mint>", async ()=>{
        let token = await OpetToken.new();
        let testAccount = accounts[1];
        await token.setMinter(testAccount, true);
        try{
           await token.mint(accounts[2], 100, {from: testAccount})
        }catch(error){
            assert.ifError(error);
        }
        await token.setMinter(testAccount, false);
        let error = null;
        try {
            await token.mint(accounts[2], 100, {from: testAccount})
        }catch(err){
            error = err;
        }
        assert.notEqual(error, null, 'error cannot be null');
        assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
    });

    it("[Func Test] finishMinting <conditions - owner permission>", async ()=>{
        let token = await OpetToken.new();
        await token.finishMinting();
        let error = null;
        try {
            await token.mint(accounts[1], 100);
        }catch(err){
            error = err;
        }
        assert.notEqual(error, null, 'error cannot be null');
        assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
    });

    it("[Func Test] finishMinting <conditions - no owner permission>", async ()=>{
        let token = await OpetToken.new();
        let error = null;
        try {
            await token.finishMinting({from: accounts[1]});
        }catch(err){
            error = err;
        }
        //console.log(error.message);
        assert.notEqual(error, null, 'error cannot be null');
        assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
    });

    it("[Func Test] finishMinting <conditions - owner permission without canMint>", async ()=>{
        let token = await OpetToken.new();
        await token.finishMinting();
        let error = null;
        try {
            await token.finishMinting();
        }catch(err){
            error = err;
        }
        assert.notEqual(error, null, 'error cannot be null');
        assert.isAbove(error.message.search('VM Exception while processing transaction: revert'), -1, 'error format is not right');
    });

    var testMintFuzzingCases = [
        {
            name: '[Func Test] mint <conditions -  owner, has mintPermission, can mint, normal amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: true,
            amount: 10000,
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions -  not owner, has mintPermission, can mint, normal amount',
            account: accounts[1],
            hasMintPermission: true,
            canMint: true,
            amount: 10000,
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions - owner, no mintPermission, can mint, normal amount',
            account: accounts[0],
            hasMintPermission: false,
            canMint: true,
            amount: 10000,
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions - not owner, no mintPermission, can mint, normal amount',
            account: accounts[1],
            hasMintPermission: false,
            canMint: true,
            amount: 10000,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions - owner, has mintPermission, can not mint, normal amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: false,
            amount: 10000,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions - not owner, has mintPermission, can not mint, normal amount>',
            account: accounts[1],
            hasMintPermission: true,
            canMint: false,
            amount: 10000,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions - owner, no mintPermission, can not mint, normal amount>',
            account: accounts[0],
            hasMintPermission: false,
            canMint: false,
            amount: 10000,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions - not owner, no mintPermission, can not mint, normal amount>',
            account: accounts[1],
            hasMintPermission: false,
            canMint: false,
            amount: 10000,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions -  owner, has mintPermission, can mint, maxMintLimit amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: true,
            amount: BigNumber(100000000 * (10 ** 8)),
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions -  not owner, has mintPermission, can mint, maxMintLimit amount>',
            account: accounts[1],
            hasMintPermission: true,
            canMint: true,
            amount: BigNumber(100000000 * (10 ** 8)),
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions -  owner, has mintPermission, can mint, maxMintLimit + 1 amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: true,
            amount: BigNumber(100000000 * (10 ** 8)).plus(1),
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions -  not owner, has mintPermission, can mint, maxMintLimit + 1 amount>',
            account: accounts[1],
            hasMintPermission: true,
            canMint: true,
            amount: BigNumber(100000000 * (10 ** 8)).plus(1),
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions -  owner, has mintPermission, can mint, miniMintLimit amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: true,
            amount: 0,
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions -  not owner, has mintPermission, can mint, miniMintLimit amount>',
            account: accounts[1],
            hasMintPermission: true,
            canMint: true,
            amount: 0,
            expectResult: 'success'
        },
        {
            name: '[Func Test] mint <conditions -  owner, has mintPermission, can mint, miniMintLimit - 1 amount>',
            account: accounts[0],
            hasMintPermission: true,
            canMint: true,
            amount: -1,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        },
        {
            name: '[Func Test] mint <conditions -  not owner, has mintPermission, can mint, miniMintLimit - 1 amount>',
            account: accounts[1],
            hasMintPermission: true,
            canMint: true,
            amount: -1,
            expectResult: 'fail',
            expectMessage: 'VM Exception while processing transaction: revert'
        }
    ];
    testMintFuzzingCases.forEach((tc)=>{
        it(tc.name, async()=>{
            let token = await OpetToken.new();
            if(tc.hasMintPermission){
                await token.setMinter(tc.account, tc.hasMintPermission);
            }
            if(!tc.canMint){
                token.finishMinting()
            }
            let error = null;
            let totalSupply = await token.totalSupply();
            let balance = await token.balanceOf(tc.account);
            try {
                //console.log(tc.account, tc.amount.toString());
                await token.mint(tc.account, tc.amount.toString(), {from: tc.account});
            } catch(err){
                //console.log(err.message);
                error = err;
            }
            if(tc.expectResult == 'success'){
                assert.equal(error, null, 'error is not null');
                let totalSupplyAfter = await token.totalSupply();
                let balanceAfter = await token.balanceOf(tc.account);
                //console.log(totalSupply.toString(), tc.amount, totalSupplyAfter.toString(), totalSupply.plus(tc.amount).toString());
                assert.equal(totalSupply.plus(tc.amount).toString(), totalSupplyAfter.toString(), 'totalSupply is not set to right value');
                assert.equal(balance.plus(tc.amount).toString(), balanceAfter.toString(), 'balance is not set to right value');
            } else {
                assert.notEqual(error, null, 'mint without error, shoud be error');
                assert.isAbove(error.message.search(tc.expectMessage), -1, 'Error message is not set to right message');
            }
        });
    });
    it('[Func Test] mint <conditions -  owner, has mintPermission, can mint, morethan unit256 amount>', async()=>{
        let token = await OpetToken.new()
        let maxUint256 = getMaxUint256().plus(1)
        try {
            //console.log(maxUint256.toString())
            await token.mint(accounts[0], maxUint256.toString())
            //let balance = await token.balanceOf(accounts[0])
            //console.log('balance:' + balance.toString())
            assert.isOk(false, 'case should be fail')
        } catch(err){
            console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1 , 'send max unit256 shoud be fail')
        }
    })
    it('[Sen Test] mint <conditions - owner, hasMintPermission, canMint, already has maxMintLimit, send mint again>', async()=>{
        let token = await OpetToken.new()
        let maxMintLimit = await token.maxMintLimit()
        await token.mint(accounts[0], maxMintLimit)
        try{
            await token.mint(accounts[0], 1)
            assert.isOk(false, 'case should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'send more after maxMintLimit should be fail')
        }
    })
    it('[Sen Test] mint <conditions - owner, hasMintPermission, canMint, already has maxMintLimit, send mint with another account>', async()=>{
        let token = await OpetToken.new()
        let maxMintLimit = await token.maxMintLimit()
        await token.mint(accounts[0], maxMintLimit)
        try{
            await token.mint(accounts[1], 1)
            assert.isOk(false, 'case should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'send more after maxMintLimit should be fail')
        }
    })
});