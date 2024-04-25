//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

contract Bank {
    struct Account {
        bool active;
        uint balance;
    }

    enum Status {
        Open,
        Closed
    }

    mapping(address => Account) public accounts;
    address public manager;
    Status public status;

    event ContractCreated(address manager);
    event Deposit(address account, uint amount);
    event Withdraw(address account, uint amount);
    event Transfer(address from, address to, uint amount);
    event ContractTerminated(address recipient, uint amount);

    error InsufficientFunds(uint requested, uint available);

    modifier onlyManager() {
        require(msg.sender == manager, "only for managers");
        _;
    }

    modifier enoughFunds(uint amount) {
        if (accounts[msg.sender].balance < amount)
            revert InsufficientFunds({
                requested: amount,
                available: accounts[msg.sender].balance
            });
        _;
    }

    modifier activeAccount(address account) {
        require(accounts[account].active, "inactive account");
        _;
    }

    modifier nonZero(uint amount) {
        require(amount > 0, "amount is zero");
        _;
    }

    modifier bankIsOpen() {
        require(status == Status.Open, "bank is closed");
        _;
    }

    constructor() {
        manager = msg.sender;
        emit ContractCreated(manager);
    }

    function deposit() public payable bankIsOpen {
        Account storage account = accounts[msg.sender];
        account.active = true;
        account.balance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(
        uint amount
    ) public bankIsOpen enoughFunds(amount) nonZero(amount) {
        assert(accounts[msg.sender].balance <= address(this).balance);
        accounts[msg.sender].balance -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    function transfer(
        address dest,
        uint amount
    )
        public
        bankIsOpen
        enoughFunds(amount)
        activeAccount(dest)
        nonZero(amount)
    {
        accounts[dest].balance += amount;
        accounts[msg.sender].balance -= amount;
        emit Transfer(msg.sender, dest, amount);
    }

    function balance(address addr) public view returns (uint) {
        return accounts[addr].balance;
    }

    function close() public bankIsOpen onlyManager {
        status = Status.Closed;
        emit ContractTerminated(manager, address(this).balance);
        payable(manager).transfer(address(this).balance);
    }
}
