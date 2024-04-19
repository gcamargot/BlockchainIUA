//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.16;


contract Stamper {
    struct Stamped {
        address signer;
        uint blockNumber;
    }
    mapping(bytes32 => Stamped) public stamped;
    address payable owner;

    constructor() public {
        owner = msg.sender;
    }

    function stamp(bytes32 hash) public {
        require(stamped[hash].blockNumber == 0, "The hash is already stamped");
        stamped[hash].signer = msg.sender;
        stamped[hash].blockNumber = block.number;
    }

    function stampSigned(bytes32 hash, bytes memory signature) public {
        require(stamped[hash].blockNumber == 0, "The hash is already stamped");
        address signer = recoverSigner(hash, signature);
        stamped[hash].signer = signer;
        stamped[hash].blockNumber = block.number;
    }

    function kill() public {
        require(msg.sender == owner, "Only the owner can kill this contract");
        selfdestruct(owner);
    }

    /// signature methods.
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 hash, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 message = keccak256(abi.encodePacked(prefix, hash));

        return ecrecover(message, v, r, s);
    }


}