//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Ballot.sol";

contract BallotFactory is Registry {
    enum Status {
        None,
        Created,
        Running,
        Ended
    }
    struct BallotInfo {
        Status status;
        uint index;
        address creator;
    }

    mapping(address => BallotInfo) info;
    address[] public created;
    address[] public running;
    address[] public ended;
    mapping(address => address[]) public createdBy;

    modifier isBallot() {
        require(
            info[msg.sender].status != Status.None,
            unicode"El emisor del mensaje no es una votación creada por este registro"
        );
        _;
    }

    modifier notRunning() {
        require(
            info[msg.sender].status != Status.Running,
            unicode"La votación ya está en curso"
        );
        _;
    }

    modifier isRunning() {
        require(
            info[msg.sender].status == Status.Running,
            unicode"La votación no está en curso"
        );
        _;
    }

    modifier notEnded() {
        require(
            info[msg.sender].status != Status.Ended,
            unicode"La votación ya terminó"
        );
        _;
    }

    function create(string memory proposal) public returns (address ballot) {
        ballot = address((new Ballot)(proposal, msg.sender));
        info[ballot] = BallotInfo(Status.Created, created.length, msg.sender);
        created.push(ballot);
        createdBy[msg.sender].push(ballot);
    }

    function createdCount() public view returns (uint) {
        return created.length;
    }

    function runningCount() public view returns (uint) {
        return running.length;
    }

    function endedCount() public view returns (uint) {
        return ended.length;
    }

    function createdByCount(address creator) public view returns (uint) {
        return createdBy[creator].length;
    }

    function lastBy(address creator) public view returns (address ballot) {
        uint count = createdByCount(creator);
        require(count > 0, "No hay votaciones registradas para esa cuenta");
        ballot = createdBy[creator][count - 1];
    }

    function votingStarted() public isBallot notRunning notEnded {
        address ballot = msg.sender;
        info[ballot].status = Status.Running;
        deleteEntry(info[ballot].index, created);
        info[ballot].index = running.length;
        running.push(ballot);
    }

    function votingEnded() public isBallot isRunning {
        address ballot = msg.sender;
        info[ballot].status = Status.Ended;
        deleteEntry(info[ballot].index, running);
        info[ballot].index = ended.length;
        ended.push(ballot);
    }

    function deleteEntry(uint index, address[] storage array) private {
        uint last = array.length - 1;
        if (index < last) {
            array[index] = array[last];
            info[array[index]].index = index;
        }
        array.pop();
    }
}
