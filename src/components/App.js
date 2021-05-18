import AaveDeFi from '../abis/AaveDeFi.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      web3: '',
      account: '',
      ethBalance: 0,
      daiBalance: 0,
      aaveDeFi: '',
      dai: '',
      loading: true
    }
    this.borrowDAI = this.borrowDAI.bind(this)
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    await this.loadDAIBalance()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
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
    // Load account ETH balance
    if(this.state.account) {
      let ethBalance = await web3.eth.getBalance(this.state.account)
      this.setState({ ethBalance })
    }
    // Load DAI balance 
    if(this.state.account) {
      let ethBalance = await web3.eth.getBalance(this.state.account)
      this.setState({ ethBalance })
    }
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = AaveDeFi.networks[networkId]
    if(networkData) {
      // set connection to contract in state
      const aaveDeFi = new web3.eth.Contract(AaveDeFi.abi, networkData.address)
      this.setState({ aaveDeFi })
      // set loading false after getting from blockchain
      this.setState({ loading: false})
    } else {
      window.alert('AaveDeFi contract not deployed to detected network.')
    }
  }

  async loadDAIBalance() {

    const web3 = window.web3

    let daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
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

    let contract = new web3.eth.Contract(minABI,daiTokenAddress);
    // Load account DAI balance
    if(this.state.account) {
      let daiBalance = await contract.methods.balanceOf(this.state.account).call()
      daiBalance = daiBalance.toString()
      this.setState({ daiBalance })
    }

  }

  borrowDAI = () => {
    console.log('Starting process borrowing DAI from Aave')
    this.setState({ loading: true })
    this.state.aaveDeFi.methods.borrowDAIAgainstETH().send({ from: this.state.account }).on('transactionHash', (hash) => {
      console.log(hash)
      this.setState({ loading: false })
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
                <button
                  className="mt-5 btn btn-primary btn-lg"
                  onClick={this.borrowDAI}
                >
                  Borrow DAI
                </button>
                <p className="mt-5">View your balances below!</p>
                <div class="row justify-content-center">
                  <div class="col-auto">
                    <table className ="table table-responsive m-auto">
                      <thead>
                        <tr>
                          <th scope="col">ETH Balance</th>
                          <th scope="col">DAI Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{this.state.ethBalance}</td>
                          <td>{this.state.daiBalance}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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
