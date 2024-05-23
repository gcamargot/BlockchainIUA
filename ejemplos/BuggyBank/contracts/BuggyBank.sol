//SPDX-License-Identifier: UNLICENSED
pragma solidity >= 0.4.22;


contract  BuggyBank {
    struct Account {
        bool active;
        uint balance;
    }

    event ContractCreated(address manager);
    event Deposit(address account, uint amount);
    event Withdraw(address account, uint amount);
    event Transfer(address from, address to, uint amount);
    event ContractTerminated(address recipient, uint amount);
    mapping (address => Account) public accounts;
    address public manager;

    modifier onlyManager() {
        require(msg.sender == manager, "only for managers");
        _;
    }

    modifier enoughFunds(uint amount){
        require(amount <= accounts[msg.sender].balance, "insufficient funds");
        _;
    }

    modifier activeAccount(address account){
        require(accounts[account].active, "inactive account");
        _;
    }

    modifier nonZero(uint amount){
        require(amount > 0, "amount is zero");
        _;
    }

    constructor() public{
        manager = msg.sender;
        emit ContractCreated(manager);
    }

    function deposit() public payable {
        Account storage account = accounts[msg.sender];
        account.active = true;
        account.balance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint amount) public enoughFunds(amount) {
        accounts[msg.sender].balance -= amount;
        msg.sender.call.value(amount)("");
        emit Withdraw(msg.sender, amount);
    }

    function transfer(address dest, uint amount) public enoughFunds(amount) activeAccount(dest) nonZero(amount) {
        accounts[dest].balance += amount;
        accounts[msg.sender].balance -= amount;
        emit Transfer(msg.sender, dest, amount);
    }

    function balance(address addr) public view returns (uint) {
        return accounts[addr].balance;
    }

    function kill() public onlyManager{
        emit ContractTerminated(msg.sender, address(this).balance);
        selfdestruct(msg.sender);
    }
}