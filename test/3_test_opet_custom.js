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
        let mint = await token.mint(accounts[0], 100000000 * (10 ** 8))
        if(!mint){
            assert.isOk(false, 'mint fail')
        }
    })
    it('[Func Test] paused transfer', async()=>{
        try{
            await this.token.transfer(accounts[1], 100)
            assert.isOk(false, 'should be fail')
        } catch(err){
            //console.log(err.message)
            assert.isAbove(err.message.search('revert'), -1, 'paused transfer should be fail')
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

contract('Opet - OpetToken - sendAirdrops', async(accounts)=>{
    beforeEach(async()=>{
        let token = await OpetToken.new()
        this.token = token
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
        let result = this.token.setMinter(accounts[1], true)
        assert.isOk(result, 'should be ok')
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
    it('[Func Test] sendAirdrops <conditions - without mint permssion>', async()=>{
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
    it('[Func Test] sendAirdrops <conditions - cannot mint>', async()=>{
        let result = this.token.finishMinting()
        assert.isOk(result, 'should be ok')
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        try{
            await this.token.sendAirdrops(addresses, amounts)
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
    it('[Func Test] sendAirdrops <conditions - out of max mint limit>', async()=>{
        let result = this.token.mint(accounts[0], 100000000 * (10 ** 8))
        assert.isOk(result, 'should be ok')
        let addresses = getRandomEthAddress(10)
        let amounts = getAmounts(10, 1)
        try{
            await this.token.sendAirdrops(addresses, amounts)
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