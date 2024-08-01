//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ReverseRegistrar.sol";
import "./PublicResolver.sol";

contract CFP {
    // Evento que se emite cuando alguien registra una propuesta

    // Estructura que representa una propuesta
    struct ProposalData {
        address sender;
        uint256 blockNumber;
        uint256 timestamp;
    }

    event ProposalRegistered(
        bytes32 proposal,
        address sender,
        uint256 blockNumber
    );

    bytes32 private _callId;
    uint256 private _closingTime;
    address private _creator;

    ReverseRegistrar revRegistrar;
    PublicResolver pubResolver;

    mapping(bytes32 => ProposalData) public _proposalData; 
    bytes32[] public _proposals;

    // Devuelve los datos asociados con una propuesta
    function proposalData(bytes32 proposal) public view returns (ProposalData memory) {
        return _proposalData[proposal];
    }
    // Devuelve la propuesta que está en la posición `index` de la lista de propuestas registradas
    function proposals(uint index) public view returns (bytes32) {
        return _proposals[index];
    }

    // Timestamp del cierre de la recepción de propuestas
    function closingTime() public view returns (uint256) {
        return _closingTime;
    }

    // Identificador de este llamado
    function callId() public view returns (bytes32) {
        return _callId;
    }

    // Creador de este llamado
    function creator() public view returns (address) {
        return _creator;
    }

    /** Construye un llamado con un identificador y un tiempo de cierre.
     *  Si el `timestamp` del bloque actual es mayor o igual al tiempo de cierre especificado,
     *  revierte con el mensaje "El cierre de la convocatoria no puede estar en el pasado".
     */
    constructor(bytes32 _cId, uint256 _cTime, ReverseRegistrar revReg, PublicResolver pubRes) {
        if (block.timestamp >= _cTime) {
            revert("El cierre de la convocatoria no puede estar en el pasado");
        }
        _callId = _cId;
        _closingTime = _cTime;
        _creator = msg.sender;
        revRegistrar = revReg;
        pubResolver = pubRes;

    }

    // Devuelve la cantidad de propuestas presentadas
    function proposalCount() public view returns (uint256) {
        return _proposals.length;
    }

    /** Permite registrar una propuesta espec.
     *  Registra al emisor del mensaje como emisor de la propuesta.
     *  Si el timestamp del bloque actual es mayor que el del cierre del llamado,
     *  revierte con el error "Convocatoria cerrada"
     *  Si ya se ha registrado una propuesta igual, revierte con el mensaje
     *  "La propuesta ya ha sido registrada"
     *  Emite el evento `ProposalRegistered`
     */
    function registerProposal(bytes32 proposal) public {
        require(proposalTimestamp(proposal) == 0, "La propuesta ya ha sido registrada");
        if (block.timestamp > _closingTime) {
            revert("Convocatoria cerrada");
        }
        ProposalData memory pd = ProposalData(msg.sender, block.number, block.timestamp);
        _proposalData[proposal] = pd;
        _proposals.push(proposal);
        emit ProposalRegistered(proposal, msg.sender, block.number);
    }

    /** Permite registrar una propuesta especificando un emisor.
     *  Sólo puede ser ejecutada por el creador del llamado. Si no es así, revierte
     *  con el mensaje "Solo el creador puede hacer esta llamada"
     *  Si el timestamp del bloque actual es mayor que el del cierre del llamado,
     *  revierte con el error "Convocatoria cerrada"
     *  Si ya se ha registrado una propuesta igual, revierte con el mensaje
     *  "La propuesta ya ha sido registrada"
     *  Emite el evento `ProposalRegistered`
     */
    function registerProposalFor(bytes32 proposal, address sender) public {
        require(msg.sender == _creator, "Solo el creador puede hacer esta llamada");
        require(proposalTimestamp(proposal) == 0, "La propuesta ya ha sido registrada");
        ProposalData memory pd = ProposalData(sender, block.number, block.timestamp);
        _proposalData[proposal] = pd;
        _proposals.push(proposal);
        emit ProposalRegistered(proposal, sender, block.number);
    }

    /** Devuelve el timestamp en el que se ha registrado una propuesta.
     *  Si la propuesta no está registrada, devuelve cero.
     */
    function proposalTimestamp(
        bytes32 proposal
    ) public view returns (uint256) {
        return _proposalData[proposal].timestamp;
    }
    function setName(string memory name) public returns (bytes32) {
        return revRegistrar.setName(name);
    }

    function getName(bytes32 node) public view returns (string memory) {
        return pubResolver.name(node);
    }
}   

