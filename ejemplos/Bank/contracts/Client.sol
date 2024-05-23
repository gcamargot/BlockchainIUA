//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./Bank.sol";

contract Client {
    address public client;

    event ClientContractCreated(address Client);
    event ClientDeposit(address bank, uint amount);
    event ClientWithdraw(address bank, uint amount);
    event ClientTransfer(address bank, address from, address to, uint amount);
    event ClientFundsReturned(address recipient, uint amount);
    event ClientTransferReceived(address sender, uint amount);


    modifier onlyClient() {
        require(msg.sender == client, "only Client");
        _;
    }

    constructor() {
        client = msg.sender;
        emit ClientContractCreated(msg.sender);
    }

    function deposit(address addr) public payable {
        Bank(addr).deposit{value: msg.value}();
        emit ClientDeposit(addr, msg.value);
    }

    function withdraw(address addr, uint amount) public onlyClient {
        Bank(addr).withdraw(amount);
        emit ClientWithdraw(addr, amount);
    }

    function transfer(address addr, address to, uint amount) public onlyClient{
        Bank(addr).transfer(to,amount);
        emit ClientTransfer(addr, address(this), to, amount);
    }

    receive() external payable {
        emit ClientTransferReceived(msg.sender, msg.value);
    }

    function returnFunds() public onlyClient {
        emit ClientFundsReturned(msg.sender, address(this).balance);
        payable(msg.sender).transfer(address(this).balance);
    }

}