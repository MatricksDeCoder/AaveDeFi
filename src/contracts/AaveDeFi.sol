// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './ILendingPoolAddressesProvider.sol';
import './ILendingPool.sol';
import './IWETHGateway.sol';
import './IPriceOracle.sol';

contract AaveDeFi {

    string public name = "MY Aave DeFi";

    // Keep track balances contract
    mapping(address => uint256) public totalETHDeposits;
    mapping(address => uint256) public totalDAIBorrows;

    // Keep track latest DAI/ETH price
    uint256 public daiEthprice;
    
    // references to Aave LendingPoolProvider and LendingPool
    ILendingPoolAddressesProvider public provider;
    ILendingPool public lendingPool;
    address addressLendingPool;
    
    // WETH Gateway to handle ETH deposits into protocol
    IWETHGateway public wethGateway; 

    // Price Oracle to get asset prices 
    IPriceOracle public priceOracle;

    /// @notice DepositBorrow event emitted on success
    event DepositBorrow(
        uint256 ethAmountDeposited, 
        uint256 totalETHDeposits,
        uint256 priceDAI, 
        uint256 safeMaxDAIBorrow, 
        uint256 totalDAIBorrows
        );

    constructor() {
        // Retrieve LendingPoolAddressesProvider & LendingPool using Aave Protocol V2
        provider = ILendingPoolAddressesProvider(address(0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5)); 
        addressLendingPool = provider.getLendingPool();
        lendingPool = ILendingPool(address(addressLendingPool));
        // Retrieve WETH Gateway
        wethGateway = IWETHGateway(address(0xcc9a0B7c43DC2a5F023Bb9b738E45B0Ef6B06E04));
        // Retrieve Price Oracle
        priceOracle = IPriceOracle(address(0xA50ba011c48153De246E5192C8f9258A2ba79Ca9));
    }

    
    receive() external payable {
    }

    /// @notice Function to deposit ETH collateral into Aave and immediately borrow maximum safe amount of DAI  
    /// @dev DepositBorrow event emitted if successfully borrows 
    function borrowDAIAgainstETH() external payable {

        // Update ethDepositBalances
        totalETHDeposits[msg.sender] = totalETHDeposits[msg.sender] + msg.value;

        // Input variables 
        address daiAddress = address(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI mainnet address
        uint16 referralCode = 0; // referralCode 0 is like none
        uint256 variableRate = 2; // 1 is stable rate, 2 is variable rate. We will make use of variable rates
        uint ltv = 80; // The maximum Loan To Value (LTV) Ratio for the deposited asset/ETH = 0.8
        address onBehalfOf = msg.sender; 
        address wethAddress = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

        // Deposit the ETH sent with msg.value transfering aWETH to onBehalfOf who accrues the respective deposit power
        // function depositETH(address lendingPool, address onBehalfOf, uint16 referralCode)
        wethGateway.depositETH{value: msg.value}(addressLendingPool,address(this), referralCode);
        //require(IERC20(wethAddress).transfer(msg.sender, msg.value)); // ? risk profile is contract or individual
    
        // Use Oracle to DAI price in wei (ETH value)
        // function getAssetPrice(address asset) external view returns (uint256);
        // check result if it around value from https://www.coingecko.com/en/coins/dai/eth 
        uint priceDAI = priceOracle.getAssetPrice(daiAddress);
        daiEthprice = priceDAI;

        // Calculate the maximum safe DAI value you can borrow
        assert(priceDAI != 0);
        uint safeMaxDAIBorrow = ltv * msg.value * 10**18 / (priceDAI * 100); // remember scaling in front end

        // Borrow the safeMaxDAIBorrow amount from protocol
        // function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
        lendingPool.borrow(daiAddress, safeMaxDAIBorrow, variableRate, referralCode, address(this));

        // Send the borrowed DAI to borrower
        require(IERC20(daiAddress).transfer(msg.sender, safeMaxDAIBorrow));
        //require(IERC20(daiAddress).transferFrom(address(this), msg.sender,safeMaxDAIBorrow));

        // Update daiBorrowBalances
        totalDAIBorrows[msg.sender] = totalDAIBorrows[msg.sender] + safeMaxDAIBorrow;

        emit DepositBorrow(
            msg.value, 
            totalETHDeposits[msg.sender],
            priceDAI, 
            safeMaxDAIBorrow, 
            totalDAIBorrows[msg.sender]
        );
    }

}


 
