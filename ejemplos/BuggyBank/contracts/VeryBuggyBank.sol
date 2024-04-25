pragma solidity >= 0.4.22;

import "./BuggyBank.sol";

contract VeryBuggyBank is BuggyBank{

    function withdraw(uint amount) public enoughFunds(amount) {
        msg.sender.call.value(amount)("");
        accounts[msg.sender].balance -= amount;
        emit Withdraw(msg.sender, amount);
    }
}