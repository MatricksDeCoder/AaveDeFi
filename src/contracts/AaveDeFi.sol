// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './ILendingPoolAddressesProvider.sol';
import './ILendingPool.sol';

contract AaveDeFi {

    string public name = "MY Aave DeFi";
    
    // references to Aave LendingPoolProvider and LendingPool
    ILendingPoolAddressesProvider public provider;
    ILendingPool public lendingPool;

    /// @notice DepositBorrow event emitted on success
    event DepositBorrow(uint256 ethAmountDeposited, uint256 daiAmountBorrowed);

    constructor() {
        // Retrieve LendingPool address using Aave Lending Pool Provider V2
        provider = ILendingPoolAddressesProvider(address(0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5)); 
        lendingPool = ILendingPool(provider.getLendingPool());
    }

    /// @notice Function to deposit ETH into Aave and immediately borrow DAI against that ETH collateral 
    /// @dev DepositBorrow event emitted if successfully borrows 
    function borrowDAIAgainstETH() external payable {

        // Input variables 
        address daiAddress = address(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI mainnet address
        address ethAddress = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE); // ETH mock address
        uint16 referall = 0; // referralCode 
        uint256 variableRate = 2; // 1 is stable rate, 2 is variable rate
        // LoanToValue Ratio DAI is 0.75 ETH is 0.80 in v2 

        // function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
        // Deposit the ETH sent with msg.value
        address onBehalf = msg.sender;
        lendingPool.deposit(ethAddress, msg.value, onBehalf, referall);

        // Enable deposit to be used as collateral
        lendingPool.setUserUseReserveAsCollateral(ethAddress, true);


        // The maximum amount you can borrow depends on the value you have deposited and the available liquidity
        // determine the maximum amount of DAI that can be borrowed against the ETH collateral deposited 
        // function getUserAccountData(address user)
        (uint256 totalCollateralETH,
        uint256 totalDebtETH,
        uint256 availableBorrowsETH,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor) = lendingPool.getUserAccountData(onBehalf);

        // use availableBorrowsETH to determine max amount DAI to borrow
        // not sure (making assumptions here) e.g 
        // do we need to use Oracle? Is there functions to determine amount for each asset etc ???
        // do I just use the 0.8 LTV (loan to value for ETH to calculate ethValue DAI that can be borrowed???)
        uint _amountDAIBorrow = availableBorrowsETH * 3000; // simplify price ETH get amount DAI in wei 

        //function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)
        // Borrow DAI
        lendingPool.borrow(daiAddress, _amountDAIBorrow, variableRate, referall, onBehalf);

        emit DepositBorrow(msg.value, _amountDAIBorrow);
    }

}



 
