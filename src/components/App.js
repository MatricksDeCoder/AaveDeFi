import AaveDeFi from '../abis/AaveDeFi.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

const fromWei = (str) => (+str / 10**18).toString()
const toWei = (str) => (+str * 10**18).toString()

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      web3: '',
      account: '',
      ethBalance: '0',
      daiBalance: '0',
      aTokenBalance: '0',
      totalETHDeposits: '0',
      totalDAIBorrows: '0',
      daiETHPrice: '0',
      ethDeposit: '0',
      aaveDeFi: '',
      dai: '',
      loading: false,
      miniABI: [ //Stripped ERC20 miniABI
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
      ]
    }
    this.handleChange = this.handleChange.bind(this);
    this.borrowDAI = this.borrowDAI.bind(this)
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    await this.loadETHBalance()
    await this.loadDAIBalance()
    await this.loadATokenBalance()
    await this.loadTotalEthDeposits()
    await this.loadTotalDaiBorrows()
    await this.loadDaiEthPrice()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
      this.setState({web3: window.web3})
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
      this.setState({web3: window.web3})
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = AaveDeFi.networks[networkId]
    if(networkData) {
      // set connection to contract in state
      const aaveDeFi = new web3.eth.Contract(AaveDeFi.abi, networkData.address)
      await this.setState({ aaveDeFi })
      // set loading false after getting from blockchain
      await this.setState({ loading: false})
    } else {
      window.alert('AaveDeFi contract not deployed to detected network.')
    }
  }

  async loadTotalEthDeposits() {
    let totalETHDeposits = await this.state.aaveDeFi.methods.totalETHDeposits(this.state.account).call()
    console.log(" TOTAL ETH DEPOSITS" + totalETHDeposits.toString())
    totalETHDeposits = fromWei(totalETHDeposits.toString())
    await this.setState(preveState => ({totalETHDeposits}))
  }

  async loadTotalDaiBorrows() {
    let totalDAIBorrows = await this.state.aaveDeFi.methods.totalDAIBorrows(this.state.account).call()
    // scaling in Smart Contract Code
    totalDAIBorrows = fromWei(totalDAIBorrows.toString())
    totalDAIBorrows = fromWei(totalDAIBorrows)
    await this.setState(prevState => ({totalDAIBorrows}))
  }

  async loadDaiEthPrice() {
    let daiETHPrice = await this.state.aaveDeFi.methods.daiEthprice().call()
    daiETHPrice = fromWei(daiETHPrice.toString())
    await this.setState(prevState => ({daiETHPrice}))
  }

  async loadETHBalance() {
    const web3 = this.state.web3
    let ethBalance  = await web3.eth.getBalance(this.state.account)
    ethBalance = fromWei(ethBalance.toString())
    await this.setState(prevState => ({ ethBalance }))
  }

  async loadDAIBalance() {

    const web3 = this.state.web3

    let daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    let contract = new web3.eth.Contract(this.state.miniABI,daiTokenAddress)
    // Load account DAI balance
    if(this.state.account) {
      let daiBalance = await contract.methods.balanceOf(this.state.account).call()
      daiBalance = fromWei(daiBalance.toString())
      this.setState(prevState => ({ daiBalance }))
    }

  }

  async loadATokenBalance() {

    const web3 = this.state.web3

    let aTokenAddress = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e" //aWETH address
    let contract = new web3.eth.Contract(this.state.miniABI,aTokenAddress)
    // Load account DAI balance
    if(this.state.account) {
      let aTokenBalance = await contract.methods.balanceOf(this.state.account).call()
      aTokenBalance = fromWei(aTokenBalance.toString())
      this.setState(prevState => ({ aTokenBalance }))
    }

  }

  async handleChange(event) {
    const ethDeposit = toWei(event.target.value)
    await this.setState({ethDeposit})
    console.log(` ETH DEPOSIT: ${this.state.ethDeposit}`)
  }

  async borrowDAI() {
    console.log('Starting process borrowing DAI from Aave')
    await this.setState({loading: true})
    this.state.aaveDeFi.methods.borrowDAIAgainstETH().send({ from: this.state.account, value: this.state.ethDeposit}).on('transactionHash', (hash) => {
      this.setState(preveState => ({loading:false}))
      window.location.reload();
    })
    console.log('Successfully completed borrowing DAI')
  }

  render() {

    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
            Aave DeFi: 
          </a>
          <a
              className="mr-5"
              href={`https://etherscan.io/address/${this.state.account}`}
              target="_blank"
              rel="noopener noreferrer"
          >
             Account: {this.state.account}
          </a>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mt-5 mr-auto ml-auto">
                <h1>Aave DEFI DAPP</h1>
                <p>
                  Borrow some DAI from Aave by depositing ETH!
                </p>
                <p>
                  To borrow DAI you have to deposit some collateral in this case, ETH!
                </p>
                <p>
                  When you click button below, Metamask will prompt you to choose amount of ETH to send before submititng transaction.
                </p>
                <div>
                  <label>
                    Amount ETH Deposit:
                    <input type="text" value={this.state.value} onChange={this.handleChange} />
                  </label>
                  <button
                    className="mt-5 btn btn-primary btn-lg"
                    onClick = {this.borrowDAI}
                  >
                    Borrow DAI
                  </button>
                </div>
                { this.state.loading ? 
                    <div> Loading....</div> :  
                    <>
                      <p className="mt-5">View your WALLET balances below!</p>
                      <div className="row justify-content-center">
                        <div className="col-auto">
                          <table className ="table table-responsive m-auto">
                            <thead>
                              <tr>
                                <th scope="col">ETH Balance</th>
                                <th scope="col">DAI Balance</th>
                                <th scope="col">aToken Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>{this.state.ethBalance}</td>
                                <td>{this.state.daiBalance}</td>
                                <td>{this.state.aTokenBalance}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>          
                      <hr/>
                      <p className="mt-5">View your TOTAL Deposits and TOTAL BORROWS on our AaveDeFi Contract!</p>
                      <div className="row justify-content-center">
                        <div className ="col-auto">
                          <table className ="table table-responsive m-auto">
                            <thead>
                              <tr>
                                <th scope="col">Total ETH Deposits</th>
                                <th scope="col">Total DAI Borrows</th>
                                <th scope="col">Latest DAI/ETH price used</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>{this.state.totalETHDeposits}</td>
                                <td>{this.state.totalDAIBorrows}</td>
                                <a 
                                  href="https://www.coingecko.com/en/coins/dai/eth" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                <td>{this.state.daiETHPrice}</td>
                                </a>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                    
                }
                <br/>
                <br/>
                <a
                  className="App-link"
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LEARN BLOCKCHAIN <u><b>NOW! </b></u>
                </a>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
