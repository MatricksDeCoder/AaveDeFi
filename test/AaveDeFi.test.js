const AaveDeFi  = artifacts.require('./AaveDeFi')

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('AaveDeFi', ([_, borrower]) => {

  let aaveDeFI 
  let daiRef 
  let aWETHRef
  let aWETHAddress = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e" // aWETH address
  let daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" // DAI address
  let lendingPoolAddressesProvider = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
  let lendingPoolAddress = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"
  let priceOracleAddress = "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9"

  beforeEach(async () => {

    // Deploy AaveDeFI contract
    aaveDeFI  = await AaveDeFi.new()

    // Stripped ABI for ERC20 token
    let miniABI = [
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

    daiRef = new web3.eth.Contract(miniABI,daiTokenAddress)
    aWETHRef = new web3.eth.Contract(miniABI, aWETHAddress)

  })

  describe('deployment', () => {

    it('tracks the name of the contract', async () => {
      const name = "MY Aave DeFi"
      const result = await aaveDeFI.name()
      result.should.equal(name)
    })

    it('tracks the correct address LendingPoolAddressesProvider', async () => {
      const result = await aaveDeFI.provider()
      result.should.equal(lendingPoolAddressesProvider)
    })

    it('tracks the correct address LendingPool', async () => {
      const result = await aaveDeFI.lendingPool()
      result.should.equal(lendingPoolAddress)
    })

    it('tracks the correct address Price Oracle', async () => {
      const result = await aaveDeFI.priceOracle()
      result.should.equal(priceOracleAddress)
    })

  })
  
  describe('borrowDAIAgainstETH', () => {

    let ethBalance
    let daiBalance
    let aWETHBalance
    let ethDeposit = 1 // deposit 1 Ether
    let totalETHDeposits
    let totalDAIBorrows
    let safeMaxDAIBorrow
    let result
    
    beforeEach(async () => {

      // start Ether and DAI balance before deposit+borrow
      ethBalance = await web3.eth.getBalance(borrower) //BN
      console.log(`START ETH BALANCE: ${web3.utils.fromWei(ethBalance)}`)
      daiBalance = await daiRef.methods.balanceOf(borrower).call()
      console.log(`START DAI BALANCE: ${web3.utils.fromWei(daiBalance)}`)
      aWETHBalance = await aWETHRef.methods.balanceOf(borrower).call()
      console.log(`START aWETH BALANCE: ${web3.utils.fromWei(aWETHBalance)}`)
      // start totalETHDeposits and totalDAIBorrows using this contract
      totalETHDeposits = await aaveDeFI.totalETHDeposits(borrower, {from: borrower}) //BN
      console.log(`START TOTAL ETH DEPOSITS SHOULD BE ZERO: ${web3.utils.fromWei(totalETHDeposits.toString())}`)
      totalDAIBorrows = await aaveDeFI.totalDAIBorrows(borrower, {from:borrower}) //BN
      console.log(`START TOTAL DAI BORROWS SHOULD BE ZERO: ${web3.utils.fromWei(totalDAIBorrows.toString())}`)
      // deposit 1 ETH to borrow
      result = await aaveDeFI.borrowDAIAgainstETH({from: borrower, value: web3.utils.toWei(ethDeposit.toString(), "wei")})
      
    })

    it('emits a "DepositBorrow" event', () => {
      const log = result.logs[0]
      log.event.should.eq('DepositBorrow')
      const event = log.args
      event.ethAmountDeposited.toString().should.equal(ethDeposit.toString())
      // totalETHDeposits using contract should increase by amount ETH deposited
      event.totalETHDeposits.toString().should.equal((+totalETHDeposits.toString() + ethDeposit).toString())
      // priceDAI must exist and be greate than zero 
      expect(+event.priceDAI.toString()).to.be.at.least(0);
      console.log(`priceDAI from Oracle used in contract: ${web3.utils.fromWei(event.priceDAI.toString())}`)
      console.log(`compared price DAI/ETH at e.g https://www.coingecko.com/en/coins/dai/eth e.g 0.00035312`)
      // safeMAXDAIBorrows must exist
      expect(+event.safeMaxDAIBorrow.toString()).to.be.at.least(0);
      console.log(`SAFE MAX DAI Borrow Amount ${web3.utils.fromWei(event.safeMaxDAIBorrow.toString())}`)
      // totalDAIBorrows using contract should increase by amount safeMaxDAIBorrow
      event.totalDAIBorrows.toString().should.equal((+totalDAIBorrows.toString() + +event.safeMaxDAIBorrow.toString()).toString())
    })

    it('sucessfully withdraws ETH from user to Aave', async () => {
       // new ETH balance should decrease by approx ethADeposit
       // small discrepency may be due to fees
      const ethBalanceNew = await web3.eth.getBalance(borrower) //BN
      expect(+ethBalanceNew.toString()).to.be.lessThan(+ethBalance.toString() - ethDeposit)
      console.log(`${web3.utils.fromWei(ethBalance.toString())} is approx ${web3.utils.fromWei((+ethBalance.toString() - ethDeposit).toString())}`)
    })

    it('sucessfully deposits borrowed DAI from Aave to user wallet', async() => {
      const log = result.logs[0]
      const event = log.args
      // new balance DAI balance in USER Wallet should increase by safeMaxDAIBorrow
      const daiBalanceNew = await daiRef.methods.balanceOf(borrower).call()              
      daiBalanceNew.toString().should.equal((+daiBalance.toString() + +event.safeMaxDAIBorrow.toString()).toString())
    })
    
    it('sucessfully deposits aToken (aWETH) from Aave to user wallet', async() => {
      // new balance aToken (aWETH) balance in USER Wallet should at least increase 
      const aWETHBalanceNew = await aWETHRef.methods.balanceOf(borrower).call()      
      expect(+aWETHBalanceNew.toString()).to.be.at.least(+aWETHBalance.toString())    
      console.log(`New aToken ${web3.utils.fromWei(aWETHBalanceNew.toString())} balance is greater or equal old balance ${web3.utils.fromWei(aWETHBalance.toString())}`)       
    })

  })

})