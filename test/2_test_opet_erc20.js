var OpetToken = artifacts.require("OpetToken");
var BigNumber = require('bignumber.js');

function getMaxUint256(){
    let x = BigNumber(2)
    return x.exponentiatedBy(256).minus(1)
}

contract('Opet - BaseToken - transfer cases ', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
        let canTransfer = await token.unpauseTransfer()
        if(!canTransfer){
            assert.isOk(false, 'cannot unpause transfer')
        }
    })

    it('[Func Test] transfer <conditions - normal address, normal amount>', async()=>{
        let account0Balance = await this.token.balanceOf(accounts[0])
        //console.log(account0Balance.toString())
        let account1Balance = await this.token.balanceOf(accounts[1])
        let result = await this.token.transfer(accounts[1], 1 * (10 ** 8))
        if(result){
            let account0BalanceAfter = await this.token.balanceOf(accounts[0])
            let account1BalanceAfter = await this.token.balanceOf(accounts[1])
            assert.equal(account0Balance - account0BalanceAfter, account1BalanceAfter - account1Balance, 'tranfer fail with not match tranfer amount')
        } else {
            assert.isOk(false, 'tranfer fail in regualer test')
        }
    });

    it('[Func Test] transfer <conditions - address(0), normal amount>', async()=>{
        try{
            let result = await this.token.transfer("0x0000000000000000000000000000000000000000", 1)
        }catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'address(0) is not set to exclude')
        }
    });

    it('[Func Test] transfer <conditions - normal address, equal total balance>', async()=>{
        let account0Balance = await this.token.balanceOf(accounts[0])
        //console.log(account0Balance.toString())
        let result = await this.token.transfer(accounts[1], account0Balance)
        if(!result){
            assert.isOk(false, 'transfer total balance of account fail')
        }
        let account1Balance = await this.token.balanceOf(accounts[1])
        //console.log(account1Balance.toString())
        assert.equal(account0Balance.toString(), account1Balance.toString(), 'transfer total balance of account fail, balance not equal')
    });

    it('[Func Test] transfer <conditions - normal address, more than balance>', async()=>{
        let account0Balance = await this.token.balanceOf(accounts[0])
        //console.log(account0Balance.toString())
        account0Balance = account0Balance.add(1)
        //console.log(account0Balance.toString())
        try{
            let result = await this.token.transfer(accounts[1], account0Balance)
        }catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'tranfer morethan balance failure')
        }
    });
    it('[Func Test] transfer <conditions - normal address, more than unit256>', async()=>{
        let maxUint256 = 2 ** 256
        try {
            await this.token.transfer(accounts[1], maxUint256)
            assert.isOk(false, 'case should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1 , 'transfer should be fail with morethan max unit256')
        }
    });
    it('[Func Test] tranfer <conditions - transfer to self', async()=>{
        let balance = await this.token.balanceOf(accounts[0])
        //console.log(balance.toString())
        let result = await this.token.transfer(accounts[0], 1)
        assert.isOk(result, 'case should be pass')
        let balanceAfter = await this.token.balanceOf(accounts[0])
        //console.log(balanceAfter.toString())
        assert.equal(balance.toString(), balanceAfter.toString(), 'transfer to self should be pass')
    })
});

contract('Opet - StandardToken - approve', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] approve <conditions - normal account, normal value', async()=>{
        let result = await this.token.approve(accounts[1], 1001)
        assert.isOk(result, 'case should be pass')
        let allow = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(1001, allow, 'approve not set the right amount')
    })
    it('[Func Test] approve <conditions - self account, normal value', async()=>{
        let result = await this.token.approve(accounts[0], 1001)
        assert.isOk(result, 'case should be pass')
        let allow = await this.token.allowance(accounts[0], accounts[0])
        assert.equal(1001, allow, 'approve not set the right amount')
    })
    it('[Func Test] approve <conditions - normal account, maxUint256', async()=>{
        let max = getMaxUint256()
        let result = await this.token.approve(accounts[1], max.toString())
        assert.isOk(result, 'case should be pass')
        let allow = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(max.toString(), allow.toString(), 'approve not set the right amount')
    })
});

contract('Opet - StandardToken - increaseApproval', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] increaseApproval <conditions - normal amount>', async()=>{
        let result = await this.token.increaseApproval(accounts[1], '10000')
        assert.isOk(result, 'case should be success')
        let balance = await this.token.allowance(accounts[0], accounts[1])
        //console.log(balance.toString())
        assert.equal('10000', balance.toString(), 'increaseApproval amount is not set to right value')
    })
    it('[Func Test] increaseApproval <conditions - max uint>', async()=>{
        let max = getMaxUint256()
        let result = await this.token.increaseApproval(accounts[1], max.toString())
        assert.isOk(result, 'case should be success')
        let balance = await this.token.allowance(accounts[0], accounts[1])
        //console.log(balance.toString())
        assert.equal(max.toString(), balance.toString(), 'increaseApproval amount is not set to right value')
    })
    it('[Func Test] increaseApproval <conditions - more than max uint', async()=>{
        let max = getMaxUint256().plus(1)
        try{
            await this.token.increaseApproval(accounts[1], max.toString())
            assert.isOk(false, 'case should be fail')
        }catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'increaseApproval amount out of max uint should raise revert')
        }
    })
    it('[Func Test] increaseApproval <conditions - allowed add out of max uint', async()=>{
        let max = getMaxUint256()
        let result = await this.token.approve(accounts[1], max.toString())
        assert.isOk(result, 'case should be ok')
        try{
            await this.token.increaseApproval(accounts[1], 1)
            assert.isOk(false, 'case should be fail')
        }catch(err){
            //console.log('!!!!!!!' + err.message)
            assert.isAbove(err.message.search('invalid opcode'), -1, 'increaseApproval add amount out of max uint should be fail')
        }
    })
});

contract('Opet - StandardToken - decreaseApproval', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] decreaseApproval <conditions - normal amount>', async()=>{
        let result = await this.token.approve(accounts[1], 1000)
        assert.isOk(result, 'should be ok')
        result = await this.token.decreaseApproval(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        let balance = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(balance.toString(), '900', 'decreaseApproval with not right amount')
    })
    it('[Func Test] decreaseApproval <conditions - more than amount', async()=>{
        let result = await this.token.approve(accounts[1], 1000)
        assert.isOk(result, 'should be ok')
        result = await this.token.decreaseApproval(accounts[1], 1100)
        assert.isOk(result, 'should be ok')
        let balance = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(balance.toString(), '0', 'decreaseApproval with not right amount')
    })
    it('[Func Test] decreaseApproval <conditions - no balance decreaseApproval', async()=>{
        result = await this.token.decreaseApproval(accounts[1], 1100)
        assert.isOk(result, 'should be ok')
        let balance = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(balance.toString(), '0', 'decreaseApproval with not right amount')
    })
});

contract('Opet - StandardToken - transferFrom', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
        let canTransfer = await token.unpauseTransfer()
        if(!canTransfer){
            assert.isOk(false, 'cannot unpause transfer')
        }
    })
    it('[Func Test] transferFrom - <conditions - normal account, normal amount>', async()=>{
        originBalance = await this.token.balanceOf(accounts[0])
        result = await this.token.approve(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        result = await this.token.transferFrom(accounts[0], accounts[2], 10, {from:accounts[1]})
        assert.isOk(result, 'should be ok')
        let balance = await this.token.balanceOf(accounts[2])
        assert.equal(balance.toString(), '10', 'transferFrom amount is not right')
        balance = await this.token.balanceOf(accounts[0])
        assert.equal((originBalance - balance).toString(), '10', 'balance of from acount is not right')
        balance = await this.token.allowance(accounts[0], accounts[1])
        assert.equal(balance.toString(), '90', 'allowance is not right')
    })
    it('[Func Test] transferFrom - <conditions - address 0, normal amount>', async()=>{
        result = await this.token.approve(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        try{
            result = await this.token.transferFrom(accounts[0], '0x0000000000000000000000000000000000000000', 10, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'address 0 can not be transferFrom to address')
        }
      
    })
    it('[Func Test] transferFrom - <conditions - from account has not enough amount, normal amount>', async()=>{
        result = await this.token.approve(accounts[1], 10000)
        assert.isOk(result, 'should be ok')
        try{
            result = await this.token.transferFrom(accounts[0], accounts[1], 10001, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'transfer amount should be less than balance')
        }
    })
    it('[Func Test] transferFrom - <conditions - from not authroized account', async()=>{
        try{
            result = await this.token.transferFrom(accounts[0], accounts[1], 101, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'transfer amount should be less than balance')
        }
    })
    it('[Func Test] transferFrom - <conditions - allowance has not enogh amount, normal amount>', async()=>{
        result = await this.token.approve(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        try{
            result = await this.token.transferFrom(accounts[0], accounts[1], 101, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'transfer amount should be less than balance')
        }
    })
});