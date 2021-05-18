// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract AaveDeFi {
    uint public version = 1;

    function setVersion (uint _version) public {
        version = _version;
    }
}