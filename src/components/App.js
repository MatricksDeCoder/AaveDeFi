import AaveDeFi from '../abis/AaveDeFi.json'
import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import { version } from 'ethers';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '0x0000000000000000000000000000000000000000',
      ethBalance: 0,
      daiBalance: 0,
      aaveDeFi: '',
      version: version,
      loading: true
    }
    this.borrowDAI = this.borrowDAI.bind(this)
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
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

  borrowDAI = () => {
    console.log('Starting process borrowing DAI from Aave')
    console.log('Successfully completed borrowing DAI')
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
      this.setState({ aaveDeFi })
      // set the current version in state
      const version = await aaveDeFi.methods.version().call().toString()
      this.setState({ version })
      // set loading false after getting from blockchain
      this.setState({ loading: false})
    } else {
      window.alert('AaveDeFi contract not deployed to detected network.')
    }
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
                          <th scope="col">Interest rates</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{this.state.ethBalance}</td>
                          <td>{this.state.daiBalance}</td>
                          <td>{this.state.ethBalance}</td>
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
