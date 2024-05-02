// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface Registry {
    function votingStarted() external;

    function votingEnded() external;
}

contract Ballot {
    event VotingStarted(uint blockNumber, uint numVoters);
    event VotingEnded(uint blockNumber, uint yes, uint no);
    // Esta estructura representa a un votante
    struct Voter {
        bool registered; // verdadero si el votante se registró
        bool canVote; // si es verdadero, la persona puede votar
        bool voted; // si es verdadero, la persona ya votó
        bool vote; // sentido del voto.
    }
    string proposal_;
    uint numVoters_;
    uint yes_;
    uint no_;

    // Variable de estado con los votantes
    mapping(address => Voter) public voters;
    address[] voterAddresses;
    address[] public requests;
    mapping(address => uint) requestIndex;

    Registry registry;
    address public chairperson;
    bool public started_;
    bool public ended_;

    modifier onlyChairperson() {
        require(
            msg.sender == chairperson,
            unicode"Solo el organizador puede realizar esta acción"
        );
        _;
    }

    modifier hasStarted() {
        require(started_, unicode"La votación no ha comenzado");
        _;
    }

    modifier notStarted() {
        require(!started_, unicode"La votación ya ha comenzado");
        _;
    }

    modifier notEnded() {
        require(!ended_, unicode"La votación ya ha terminado");
        _;
    }

    modifier registered(address voter) {
        require(voters[voter].registered, "El votante no se ha registrado");
        _;
    }

    modifier notRegistered(address voter) {
        require(!voters[voter].registered, "El votante ya se ha registrado");
        _;
    }

    modifier authorized(address voter) {
        require(voters[voter].canVote, "No tiene derecho a votar");
        _;
    }

    modifier notAuthorized(address voter) {
        require(!voters[voter].canVote, unicode"El votante ya podía votar");
        _;
    }

    constructor(string memory prop, address chair) {
        registry = Registry(msg.sender);
        chairperson = chair;
        proposal_ = prop;
    }

    function proposal() external view returns (string memory) {
        return proposal_;
    }

    function register() public notRegistered(msg.sender) {
        address voter = msg.sender;
        voters[voter].registered = true;
        requestIndex[voter] = requests.length;
        requests.push(voter);
    }

    // Le da a `voter` el derecho a votar.
    function giveRightToVote(
        address voter
    ) public onlyChairperson notStarted registered(voter) notAuthorized(voter) {
        // Solamente puede ser ejecutado por `chairperson`.
        // No se puede hacer si
        //  * El votante ya puede votar
        //  * La votación ya comenzó
        // Actualiza numVoters_
        voters[voter].canVote = true;
        voterAddresses.push(voter);
        numVoters_++;
        uint index = requestIndex[voter];
        uint last = requests.length - 1;
        if (index < last) {
            requests[index] = requests[last];
            requestIndex[requests[index]] = index;
        }
        requests.pop();
    }

    function isRegistered(address voter) external view returns (bool) {
        return voters[voter].registered;
    }

    function canVote(address voter) external view returns (bool) {
        return voters[voter].canVote;
    }

    function numVoters() external view returns (uint) {
        return numVoters_;
    }

    function numPending() public view returns (uint) {
        return requests.length;
    }

    function voterAddress(uint index) external view returns (address) {
        return voterAddresses[index];
    }

    // Habilita el comienzo de la votación
    function start() public onlyChairperson notStarted {
        // Solo puede ser invocada por `chairperson`
        // No puede ser invocada una vez que la votación ha comenzado
        started_ = true;
        registry.votingStarted();
        emit VotingStarted(block.number, numVoters_);
    }

    function started() external view returns (bool) {
        return started_;
    }

    // Finaliza la votación
    function end() public onlyChairperson hasStarted notEnded {
        // Solo puede ser invocada por `chairperson`
        // Solo puede ser invocada una vez que la votación ha comenzado
        // No puede ser invocada una vez que la votación ha finalizado
        ended_ = true;
        registry.votingEnded();
        emit VotingEnded(block.number, yes_, no_);
    }

    function ended() external view returns (bool) {
        return ended_;
    }

    // Vota por la propuesta .
    function vote(bool option) public hasStarted notEnded {
        // Requiere que la votación haya comenzado y no haya terminado
        // Si `proposal` está fuera de rango, lanza
        // una excepción y revierte los cambios.
        // El votante tiene que estar habilitado
        // No se puede votar dos veces
        Voter storage sender = voters[msg.sender];
        require(sender.canVote, "No tiene derecho a votar");
        require(!sender.voted, unicode"El votante ya votó");
        sender.voted = true;
        sender.vote = option;
        if (option) {
            yes_++;
        } else {
            no_++;
        }
    }

    function hasVoted(address voter) external view returns (bool) {
        return voters[voter].voted;
    }

    function votedFor(address voter) external view returns (bool) {
        require(voters[voter].voted, unicode"El votante aún no ha votado");
        return voters[voter].vote;
    }

    function result() external view returns (uint yes, uint no) {
        return (yes_, no_);
    }
}
