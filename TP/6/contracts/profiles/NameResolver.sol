// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ResolverBase.sol";

abstract contract NameResolver is ResolverBase {
    bytes4 constant private NAME_INTERFACE_ID = 0x691f3431;

    event NameChanged(bytes32 indexed node, string name);

    mapping(bytes32=>string) names;

    /**
     * Sets the name associated with an ENS node, for reverse records.
     * May only be called by the owner of that node in the ENS registry.
     * @param node The node to update.
     * @param nodeName The name to set.
     */
    function setName(bytes32 node, string calldata nodeName) external authorised(node) {
        names[node] = nodeName;
        emit NameChanged(node, nodeName);
    }

    /**
     * Returns the name associated with an ENS node, for reverse records.
     * Defined in EIP181.
     * @param node The ENS node to query.
     * @return The associated name.
     */
    function name(bytes32 node) external view returns (string memory) {
        return names[node];
    }

    function getNames(bytes32[] calldata nodes) external view returns (string[] memory) {
        string[] memory result = new string[](nodes.length);
        for (uint256 i = 0; i < nodes.length; i++) {
            result[i] = names[nodes[i]];
        }
        return result;
    }

    function supportsInterface(bytes4 interfaceID) public pure virtual override returns(bool) {
        return interfaceID == NAME_INTERFACE_ID || super.supportsInterface(interfaceID);
    }
}
