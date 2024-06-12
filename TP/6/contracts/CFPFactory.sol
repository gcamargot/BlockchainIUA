//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CFP.sol";

contract CFPFactory {
    // Evento que se emite cuando se crea un llamado a presentación de propuestas
    event CFPCreated(address creator, bytes32 callId, CFP cfp);

    // Estructura que representa un llamado
    struct CallForProposals {
        address creator;
        CFP cfp;
        bytes32 callId;
        uint256 timestamp;
    }
    enum status {
        Unregistered,
        Pending,
        Authorized,
        Unauthorized
    }

    address private factoryOwner;
    mapping(bytes32 => CallForProposals) private _calls;
    mapping(address => status) private _status;
    address[] private _creators;
    uint256 public activeCreators;
    mapping(address => bytes32[]) private _createdBy;
    CallForProposals[] private callsList;
    
    constructor() {
        factoryOwner = msg.sender;
        _status[factoryOwner] = status.Authorized;
    }

    // Dirección del dueño de la factoría
    function owner() public view returns (address) {
        return factoryOwner;
    }

    // Devuelve el llamado asociado con un callId
    function calls(
        bytes32 callId
    ) public view returns (CallForProposals memory) {
        return _calls[callId];
    }

    // Devuelve la dirección de un creador de la lista de creadores
    function creators(uint index) public view returns (address) {
        return _creators[index];
    }

    /** Crea un llamado, con un identificador y un tiempo de cierre
     *  Si ya existe un llamado con ese identificador, revierte con el mensaje de error "El llamado ya existe"
     *  Si el emisor no está autorizado a crear llamados, revierte con el mensaje "No autorizado"
     */
    function create(bytes32 callId, uint256 timestamp) public returns (CFP) {
        require(_status[msg.sender] == status.Authorized, "No autorizado");
        require(_calls[callId].creator == address(0), "El llamado ya existe");
        require(timestamp > block.timestamp, "El cierre de la convocatoria no puede estar en el pasado");
        CFP cfp = new CFP(callId, timestamp);
        _calls[callId] = CallForProposals(msg.sender, cfp, callId, timestamp);
        if (_createdBy[msg.sender].length == 0) {
            activeCreators += 1;
        }
        callsList.push(_calls[callId]);
        _createdBy[msg.sender].push(callId);
        emit CFPCreated(msg.sender, callId, cfp);
        return cfp;
       

    }

    /**
     * Crea un llamado, estableciendo a `creator` como creador del mismo.
     * Sólo puede ser invocada por el dueño de la factoría.
     * Se comporta en todos los demás aspectos como `createFor(bytes32 callId, uint timestamp)`
     */
    function createFor(
        bytes32 callId,
        uint timestamp,
        address creator
    ) public returns (CFP) {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        require(_status[creator] == status.Authorized, "No autorizado");
        require(_calls[callId].creator == address(0), "El llamado ya existe");
        require(timestamp > block.timestamp, "El cierre de la convocatoria no puede estar en el pasado");
        
        CFP cfp = new CFP(callId, timestamp);
        _calls[callId] = CallForProposals(creator, cfp, callId, timestamp);
        callsList.push(_calls[callId]);
        if (_createdBy[creator].length == 0) {
            activeCreators += 1;
        }
        _createdBy[creator].push(callId);
        emit CFPCreated(creator, callId, cfp);
        return cfp;
    }

    // Devuelve la cantidad de cuentas que han creado llamados.
    function creatorsCount() public view returns (uint256) {
        return activeCreators;
    }

    function getCreatorsList() public view returns (address[] memory) {
        return _creators;
    }

    function getCallsList() public view returns (CallForProposals[] memory) {     
        return callsList;
    }

    /// Devuelve el identificador del llamado que está en la posición `index` de la lista de llamados creados por `creator`
    function createdBy(
        address creator,
        uint256 index
    ) public view returns (bytes32) {
        return _createdBy[creator][index];
    }

    function callsByCreator(address creator) public view returns (bytes32[] memory) {
        
        return _createdBy[creator];
    }

    // Devuelve la cantidad de llamados creados por `creator`
    function createdByCount(address creator) public view returns (uint256) {
        return _createdBy[creator].length;
    }

    /** Permite a un usuario registrar una propuesta, para un llamado con identificador `callId`.
     *  Si el llamado no existe, revierte con el mensaje  "El llamado no existe".
     *  Registra la propuesta en el llamado asociado con `callId` y pasa como creador la dirección del emisor del mensaje.
     */
    function registerProposal(bytes32 callId, bytes32 proposal) public {
        require(proposal != bytes32(0), "La propuesta no puede ser vacia");
        require(_calls[callId].creator != address(0), "El llamado no existe");
        _calls[callId].cfp.registerProposalFor(proposal, msg.sender);
    }

    /** Permite que una cuenta se registre para poder crear llamados.
     *  El registro queda en estado pendiente hasta que el dueño de la factoría lo autorice.
     *  Si ya se ha registrado, revierte con el mensaje "Ya se ha registrado"
     */
    function register() public {
        require(_status[msg.sender] == status.Unregistered, "Ya se ha registrado");
        _status[msg.sender] = status.Pending;
        _creators.push(msg.sender);
    }

    /** Autoriza a una cuenta a crear llamados.
     *  Sólo puede ser ejecutada por el dueño de la factoría.
     *  En caso contrario revierte con el mensaje "Solo el creador puede hacer esta llamada".
     *  Si la cuenta se ha registrado y está pendiente, la quita de la lista de pendientes.
     */
    function authorize(address creator) public {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        _status[creator] = status.Authorized;
        _creators.push(creator);
        
    }

    /** Quita la autorización de una cuenta para crear llamados.
     *  Sólo puede ser ejecutada por el dueño de la factoría.
     *  En caso contrario revierte con el mensaje "Solo el creador puede hacer esta llamada".
     *  Si la cuenta se ha registrado y está pendiente, la quita de la lista de pendientes.
     */
    function unauthorize(address creator) public {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        _status[creator] = status.Pending;
    }

    // Devuelve la lista de todas las registraciones pendientes.
    // Sólo puede ser ejecutada por el dueño de la factoría
    // En caso contrario revierte con el mensaje "Solo el creador puede hacer esta llamada".
    function getAllPending() public view returns (address[] memory) {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        address[] memory pending = new address[](pendingCount());
        uint256 j = 0;
        for (uint256 i = 0; i < _creators.length; i++) {
            if (_status[_creators[i]] == status.Pending) {
                pending[j] = _creators[i];
                j++;
            }
        }
        return pending;

    }

    // Devuelve la registración pendiente con índice `index`
    // Sólo puede ser ejecutada por el dueño de la factoría
    // En caso contrario revierte con el mensaje "Solo el creador puede hacer esta llamada".
    function getPending(uint256 index) public view returns (address addr) {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        require(index < pendingCount(), "No hay mas pendientes");
        uint256 j = 0;
        for (uint256 i = 0; i < _creators.length; i++) {
            if (_status[_creators[i]] == status.Pending) {
                if (j == index) {
                    return _creators[i];
                }
                j++;
            }
        }

        // Revert no existen más pendientes
        
    }

    // Devuelve la cantidad de registraciones pendientes.
    // Sólo puede ser ejecutada por el dueño de la factoría
    // En caso contrario revierte con el mensaje "Solo el creador puede hacer esta llamada".
    function pendingCount() public view returns (uint256) 
    {
        require(msg.sender == factoryOwner, "Solo el creador puede hacer esta llamada");
        uint256 count = 0;
        for (uint256 i = 0; i < _creators.length; i++) {
            if (_status[_creators[i]] == status.Pending) {
                count++;
            }
        }
        return count;
    }

    // Devuelve verdadero si una cuenta se ha registrado, tanto si su estado es pendiente como si ya se la ha autorizado.
    function isRegistered(address account) public view returns (bool) {
        return _status[account] == status.Pending || _status[account] == status.Authorized;
    }

    // Devuelve verdadero si una cuenta está autorizada a crear llamados.
    function isAuthorized(address account) public view returns (bool) {
        return _status[account] == status.Authorized;
    }
}
