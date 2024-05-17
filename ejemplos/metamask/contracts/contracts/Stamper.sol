// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.8.4;


contract Stamper {
    struct Stamped {
        address signer;
        uint blockNumber;
    }
    mapping(bytes32 => Stamped) public stamped;
    address payable owner;

    constructor() {
        owner = payable(msg.sender);
    }

    function stamp(bytes32 hash) public {
        require(stamped[hash].blockNumber == 0, "The hash is already stamped");
        stamped[hash].signer = msg.sender;
        stamped[hash].blockNumber = block.number;
    }


    function kill() public {
        require(msg.sender == owner, "Only the owner can kill this contract");
        selfdestruct(owner);
    }

}