var OpetToken = artifacts.require("OpetToken");
var BigNumber = require('bignumber.js');
var ethers = require('ethers');
var utils = require('./utils.js')

function getMaxUint256(){
    let x = BigNumber(2)
    return x.exponentiatedBy(256).minus(1)
}

function getRandomEthAddress(count){
    let accounts = []
    let i = 0
    while(i<count){
        let wallet = ethers.Wallet.createRandom()
        accounts.push(wallet.address)
        i++
    }
    return accounts
}

function getAddressFromLargeList(count){
    if(count > 49070){
        throw Error('out of range')
    }
    let addresses = []
    let i=0
    while(i<count){
        addresses.push(utils.addressListLarge[i])
        i++
    }
    return addresses
}

function getAmounts(count, amount){
    let amounts = []
    let i = 0
    while(i<count){
        amounts.push(amount)
        i++
    }
    return amounts
}

contract('Opet - OpetToken - custom', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] paused transfer <conditions: - owner>', async()=>{
        let result = await this.token.transfer(accounts[1], 100)
        assert.isOk(result, 'should be ok')
    })
    it('[Func Test] paused transfer <conditions: - people in whitelist>', async()=>{
        await this.token.addWhitelistedTransfer(accounts[1])
        let result = await this.token.transfer(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        result = await this.token.transfer(accounts[2], 100, {from:accounts[1]})
        assert.isOk(result, 'should be ok')
        let balance = await this.token.balanceOf(accounts[2])
        assert.equal('100', balance.toString(), 'account balace not equal')
    })
    it('[Func Test] paused transfer <conditions - not owner, not in whitelist', async()=>{
        let result = await this.token.transfer(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        try{
            await this.token.transfer(accounts[2], 1, {from: accounts[1]})
        }catch(err) {
            assert.isAbove(err.message.search('revert'), -1, 'pased transferFrom should be fail')
        }
    })
    it('[Func Test] paused transfer from', async()=>{
        let result = await this.token.approve(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        try{
            await this.token.transferFrom(accounts[0], accounts[2], 100, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        }catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'pased transferFrom should be fail')
        }
    })
    it('[Func Tess] unpuased by not owner', async()=>{
        try{
            await this.token.unpauseTransfer({from: accounts[1]})
            assert.isOk(false, 'should be fail')
        }catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'unpuased should be fail by not owner')
        }
    })
})

contract('Opet - OpetToken - addWhitelistedTransfer', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] addWhitelistedTransfer <conditions - owner>', async()=>{
        let result = this.token.transfer(accounts[1], 100)
        try{
            result = await this.token.transfer(accounts[2], 100, {from:accounts[1]})
            assert.isOk(result == false, 'should be fail')
        } catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'without permssion should be fail')
        }
        await this.token.addWhitelistedTransfer(accounts[1])
        result = this.token.transfer(accounts[2], 10, {from:accounts[1]})
        assert.isOk(result, 'should be ok')
    })
    it('[Func Test] addWhitelistedTransfer <conditions - not owner>', async()=>{
        try {
            await this.token.addWhitelistedTransfer(accounts[1], {from:accounts[2]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'without permssion should be fail')
        }
    })
})

contract('Opet - OpetToken - removeWhitelistedTransfer', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Func Test] removeWhitelistedTransfer <conditions - owner>', async()=>{
        let result = this.token.transfer(accounts[1], 100)
        assert.isOk(result, 'should be ok')
        this.token.addWhitelistedTransfer(accounts[1])
        result = this.token.transfer(accounts[2], 10, {from:accounts[1]})
        assert.isOk(result, 'should be ok')
        await this.token.removeWhitelistedTransfer(accounts[1])
        try{
            result = await this.token.transfer(accounts[2], 10, {from:accounts[1]})
            assert.isOk(result == false, 'should be fail')
        } catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'without permssion should be fail')
        }
        assert.isOk(result, 'should be ok')
    })
    it('[Func Test] removeWhitelistedTransfer <conditions - not owner>', async()=>{
        try {
            await this.token.removeWhitelistedTransfer(accounts[1], {from:accounts[2]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'without permssion should be fail')
        }
    })
})

contract('Opet - OpetToken - sendAirdrops', async(accounts)=>{
    it('[Func Test] sendAirdrops <conditions - not transferable', async()=>{
        let token = await OpetToken.new()
        try {
            let addresses = getRandomEthAddress(10)
            let amounts = getAmounts(10, 1)
            await token.sendAirdrops(addresses, amounts, {from:accounts[1]})
        } catch(err){
            assert.isAbove(err.message.search('revert'), -1, 'without permssion should be fail')
        }
    })
})
contract('Opet - OpetToken - sendAirdrops', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
        await this.token.unpauseTransfer()
    })
    it('[Func Test] sendAirdrops <conditions - normal>', async()=>{
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        await this.token.sendAirdrops(addresses, amounts)
        assert.isOk(true, 'should be pass')
        for(let i=0; i<addresses.length; i++){
            let balance = await this.token.balanceOf(addresses[i])
            //console.log('check:%s amount:%s', addresses[i], balance)
            assert.equal(balance.toString(), '1', 'balance is not set to right value')
        }
    })
    it('[Func Test] sendAirdrops <conditions - not owner with permssion>', async()=>{
        let result = this.token.transfer(accounts[1], 10000)
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        await this.token.sendAirdrops(addresses, amounts,{from:accounts[1]})
        assert.isOk(true, 'should be pass')
        for(let i=0; i<addresses.length; i++){
            let balance = await this.token.balanceOf(addresses[i])
            //console.log('check:%s amount:%s', addresses[i], balance)
            assert.equal(balance.toString(), '1', 'balance is not set to right value')
        }
    })
    it('[Func Test] sendAirdrops <conditions - without  amount>', async()=>{
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        try{
            await this.token.sendAirdrops(addresses, amounts,{from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'without mint permssion should be fail')
        }
    })
    it('[Func Test] sendAirdrops <conditions - address length != amount length>', async()=>{
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(11, 1)
        try{
            await this.token.sendAirdrops(addresses, amounts)
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'without mint permssion should be fail')
        }
    })
    it('[Func Test] sendAirdrops <conditions - out of max amount>', async()=>{
        let result = this.token.transfer(accounts[1], 1)
        assert.isOk(result, 'should be ok')
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        try{
            await this.token.sendAirdrops(addresses, amounts, {from:accounts[1]})
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'without mint permssion should be fail')
        }
    })
})

contract('Opet - gas', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
    })
    it('[Sen Test] - aridrop gas', async()=>{
        //create airdrop list
        let addresses = getAddressFromLargeList(200)
        let amounts = getAmounts(200, 100)
        await this.token.sendAirdrops(addresses, amounts)
        //check airdrop result
        for(let i=0; i<addresses.length; i++){
            let balance = await this.token.balanceOf(addresses[i])
            //console.log('check:%s amount:%s', addresses[i], balance)
            assert.equal(balance.toString(), '100', 'balance is not set to right value')
        }
    })
})