// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './ILendingPoolAddressesProvider.sol';
import './ILendingPool.sol';

contract AaveDeFi {

    // name our contract 
    string public name = "MY Aave DeFi";
    
    // references to Aave LendingPoolProvider and LendingPool
    ILendingPoolAddressesProvider public provider;
    ILendingPool public lendingPool;

    /// @notice DepositBorrow event emitted
    event DepositBorrow(uint256 ethAmountDeposited, uint256 daiAmountBorrowed);

    constructor() {
        // Retrieve LendingPool address using Aave Lending Pool Provider V1
        provider = LendingPoolAddressesProvider(address(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8)); 
        lendingPool = ILendingPool(provider.getLendingPool());
    }

    /// @notice Function to deposit ETH into Aave and immediately borrow DAI against that ETH collateral 
    /// @dev DepositBorrow event emitted if successfully borrows 
    function borrowDAIAgainstETH() external payable {

        // Input variables 
        address daiAddress = address(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI mainnet address
        address ethAddress = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE); // ETH mock address
        uint256 referall = 0; // referralCode 
        uint256 variableRate = 2; // 1 is stable rate, 2 is variable rate

        // Approve LendingPool contract to move your DAI
        IERC20(daiAddress).approve(provider.getLendingPoolCore(), _amountDAIBorrow);
        // Deposit the ETH sent with msg.value
        lendingPool.deposit(ethAddress, msg.value, msg.sender, referral);
        // determine the maximum amount of DAI that cna be borrowed against the collateral value 
        uint256 a = 12;
        // Borrow DAI
        lendingPool.borrow(daiAddress, _amountDAIBorrow, variableRate, referral, msg.sender);

        emit DepositBorrow(msg.value, _amountDAIBorrow);
    }

}

