# ENS

Implementations for registrars and local resolvers for the Ethereum Name Service.

For documentation of the ENS system, see [docs.ens.domains](https://docs.ens.domains/).

To run unit tests, clone this repository, and run:

```console
$ npm install
...
$ npm test
```

## ENSRegistry.sol

Implementation of the ENS Registry, the central contract used to look up resolvers and owners for domains.

## FIFSRegistrar.sol

Implementation of a simple first-in-first-served registrar, which issues (sub-)domains to the first account to request them.

## PublicResolver.sol

Simple resolver implementation that allows the owner of any domain to configure how its name should resolve. One deployment of this contract allows any number of people to use it, by setting it as their resolver in the registry.

## ENS Registry interface

The ENS registry is a single central contract that provides a mapping from domain names to owners and resolvers, as described in [EIP 137](https://github.com/ethereum/EIPs/issues/137).

The ENS operates on 'nodes' instead of human-readable names; a human readable name is converted to a node using the namehash algorithm, which is as follows:

```python
def namehash(name):
    if name == '':
    return '\0' * 32
    else:
    label, _, remainder = name.partition('.')
    return sha3(namehash(remainder) + sha3(label))
```

The registry's interface is as follows:

### owner(bytes32 node) constant returns (address)

Returns the owner of the specified node.

### resolver(bytes32 node) constant returns (address)

Returns the resolver for the specified node.

### setOwner(bytes32 node, address owner)

Updates the owner of a node. Only the current owner may call this function.

### setSubnodeOwner(bytes32 node, bytes32 label, address owner)

Updates the owner of a subnode. For instance, the owner of "foo.com" may change the owner of "bar.foo.com" by calling `setSubnodeOwner(namehash("foo.com"), sha3("bar"), newowner)`. Only callable by the owner of `node`.

### setResolver(bytes32 node, address resolver)

Sets the resolver address for the specified node.

## Resolvers

Resolvers can be found in the resolver specific [repository](https://github.com/ensdomains/resolvers).
