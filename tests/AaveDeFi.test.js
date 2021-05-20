// Run tests seperate eg truffle test ./test/AaveDeFi.test.js
// Running all tests eg truffle test 
const AaveDeFi  = artifacts.require('./AaveDeFi')

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('AaveDeFi', ([deployer, account]) => {

  let aaveDeFI
  let daiRef
  let daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

  beforeEach(async () => {
    // Deploy AaveDeFI contract
    aaveDeFI  = await AaveDeFi.new()
    // Stripped ABI for ERC20 token
    let minABI = [
      // balanceOf
      {
        "constant":true,
        "inputs":[{"name":"_owner","type":"address"}],
        "name":"balanceOf",
        "outputs":[{"name":"balance","type":"uint256"}],
        "type":"function"
      },
      // decimals
      {
        "constant":true,
        "inputs":[],
        "name":"decimals",
        "outputs":[{"name":"","type":"uint8"}],
        "type":"function"
      }
    ];

    daiRef = new web3.eth.Contract(minABI,daiTokenAddress);

  })

  describe('deployment', () => {
    it('tracks the name of the contract', async () => {
      const name = "MY Aave DeFi"
      const result = await aaveDeFI.name()
      result.should.equal(name)
    })
  })

  describe('borrowDAIAgainstETH', () => {
    let result
    let ethAmountDeposited
    let daiAmountBorrowed
    let ethBalance
    let daiBalance

    beforeEach(async () => {
      // To simplify we deposit 10 ETH 
      
      // start Ether and DAI balance before deposit+borrow
      ethBalance = await web3.eth.getBalance(account)
      daiBalance = await daiRef.methods.balanceOf(account)
      // deposit 10 ETH to borrow
      ethAmountDeposited = web3.utils.toWei(10)

      result = await aaveDeFI.borrowDAIAgainstETH({ from: account, value: ethAmountDeposited })
    })

    it('emits a "DepositBorrow" event', () => {
      const log = result.logs[0]
      log.event.should.eq('DepositBorrow')
      const event = log.args
      event.ethAmountDeposited.toString().should.equal(ethAmountDeposited.toString())
      //max amount DAI borrowed need some calculations here to determine
      //daiAmountBorrowed = event.daiAmountBorrowed;
      //event.daiAmountBorrowed.toString().should.equal(daiAmountBorrowed.toString())
    })

    it('sucessfully withdraws ETH from user to Aave', async () => {
       // new ETH balance should decrease by approx ethAmountDeposited
       // small discrepency may be due to fees

      const ethBalanceNew = await web3.eth.getBalance(account)
      
      expect(ethBalanceNew).to.be.lt(ethBalance.sub(ethAmountDeposited).toString())

      console.log(`${ethBalanceNew.toString()} is approx ${(ethBalance.sub(ethAmountDeposited)).toString()}`)

    })

    it('sucessfully deposits borrowed DAI from Aave to user wallet', async() => {
      // new balance DAI balance should increase by daiAmountBorrowed
      const daiBalanceNew = await daiRef.methods.balanceOf(account)                  
      daiBalanceNew.toString().should.equal(daiBalance.add(daiAmountBorrowed).toString())
    })

  })

})