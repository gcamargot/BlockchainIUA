pragma solidity >= 0.4.22;

import "./BuggyBank.sol";

contract Client {
    address public client;

    event ClientContractCreated(address Client);
    event ClientDeposit(address bank, uint amount);
    event ClientWithdraw(address bank, uint amount);
    event ClientTransfer(address bank, address from, address to, uint amount);
    event ClientContractTerminated(address recipient, uint amount);
    event ClientTransferReceived(address sender, uint amount);


    modifier onlyClient() {
        require(msg.sender == client, "only Client");
        _;
    }

    constructor() public {
        client = msg.sender;
        emit ClientContractCreated(msg.sender);
    }

    function deposit(address addr) public payable {
        BuggyBank(addr).deposit.value(msg.value)();
        emit ClientDeposit(addr, msg.value);
    }

    function withdraw(address addr, uint amount) public onlyClient {
        BuggyBank(addr).withdraw(amount);
        emit ClientWithdraw(addr, amount);
    }

    function transfer(address addr, address to, uint amount) public onlyClient{
        BuggyBank(addr).transfer(to,amount);
        emit ClientTransfer(addr, address(this), to, amount);
    }

    function() external payable {
        emit ClientTransferReceived(msg.sender, msg.value);
        require(msg.value > 1000, "amount is too low");
    }

    function kill() public onlyClient {
        emit ClientContractTerminated(msg.sender, address(this).balance);
        selfdestruct(msg.sender);
    }

}