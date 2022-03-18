// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Faucet {
    
    uint public numOfFunders;
    mapping(address => bool) public funders;
    mapping(uint => address) public lutFunders;
    address public owner;

    constructor () {
        owner = msg.sender;
    }

    modifier limitWithDraw(uint withdrawAmount) {
        require(
        withdrawAmount >= 1000000000000000,
         "Can't withdraw less than 0.001 ETH"
         );       
         _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner allowed to do it"
        );
        _;
    }

    receive() external payable {}

    function addFunds() external payable{
        address funder = msg.sender;

        if (!funders[funder]) {
            uint index = numOfFunders++;
            lutFunders[index] = funder;
            funders[funder] = true;
        }
    }

    function getAllFunders() external view returns(address[] memory) {
        address[] memory _funders = new address[](numOfFunders);
        for (uint i = 0; i<numOfFunders; i++) {
            _funders[i] = lutFunders[i];
        }
        return _funders;
    }

    function withdraw(uint withdrawAmount) external limitWithDraw(withdrawAmount) {
        payable(msg.sender).transfer(withdrawAmount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }


}