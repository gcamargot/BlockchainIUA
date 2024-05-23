# Transferencias hacia y desde contratos

## El contrato `Bank`

El contrato `Bank` modela un banco en el que es posible depositar, retirar y transferir fondos. Lo utilizaremos para ilustrar cómo se pueden realizar transferencias hacia y desde contratos, así como para introducir características de Solidity que no hemos utilizado hasta el momento.

### Representación del estado

```solidity
  struct Account {
      bool active;
      uint balance;
  }

  enum Status{Open, Closed}

  mapping (address => Account) public accounts;
  address public manager;
  Status public status;
```

La estructura `Account` modela una cuenta bancaria. Cada cuenta tiene un balance y un estado que indica si está activa o no. El estado inicial de una cuenta es `active = false` y `balance = 0`, y se activa al hacer el primer depósito. Las cuentas están almacenadas en el _mapping_ `accounts` que mapea direcciones a cuentas.

El contrato tiene un único administrador, que es el que crea el contrato. 

El contrato tiene un estado que indica si está abierto o cerrado. El estado inicial es `Open`, y se cierra al invocar la función `close`. Representamos el estado mediante un `enum`.

### Eventos
```solidity
event ContractCreated(address manager);
event Deposit(address account, uint amount);
event Withdraw(address account, uint amount);
event Transfer(address from, address to, uint amount);
event ContractTerminated(address recipient, uint amount);
```

Un evento en Solidity es una abstracción sobre el mecanismo de logs de EVM. Un evento se declara con la palabra clave `event` y tiene un nombre y una lista de parámetros. Los eventos se utilizan para notificar a los clientes de los cambios en el estado del contrato. En este caso, los eventos se utilizan para notificar a los clientes de las operaciones bancarias que se realizan en el contrato.

### Errores

```solidity
error InsufficientFunds(uint requested, uint available);
```

Un *error* permite asignar un nombre a un tipo de falla, y agregarle datos adicionales. En este caso, el error `InsufficientFunds` se utiliza para indicar que no hay fondos suficientes para realizar una operación bancaria. El error tiene dos parámetros: `requested` y `available`, que indican la cantidad de fondos solicitada y la cantidad de fondos disponibles, respectivamente.

### Modificadores de función

```solidity
modifier onlyManager() {
    require(msg.sender == manager, "only for managers");
    _;
}
```
Un *modificador de función* es una función que se ejecuta para alterar el comportamiento de la función a la que se aplica. En este caso, el modificador `onlyManager` se utiliza para restringir el acceso a las funciones que solo pueden ser invocadas por el administrador del contrato.

Un modificador puede recibir argumentos. En el siguiente ejemplo, el modificador `enoughFunds` recibe un argumento `amount` que indica la cantidad de fondos que se requieren para realizar la operación bancaria.

```solidity
modifier enoughFunds(uint amount){
    if (amount > accounts[msg.sender].balance) {
        revert InsufficientFunds({
            requested: amount,
            available: accounts[msg.sender].balance
        });
    }
    _;
}
```

En este caso, si la cantidad de fondos disponibles es menor que la cantidad de fondos requerida, el modificador lanza el error `InsufficientFunds` y la ejecución de la función se interrumpe. Si la cantidad de fondos disponibles es mayor o igual que la cantidad de fondos requerida, el modificador no hace nada y la función se ejecuta en el lugar donde se encuentra la expresión `_`.

### Constructor

El constructor simplemente designa como administrador del contrato a la dirección que crea el contrato, y emite el evento `ContractCreated`.

```solidity
    constructor() {
        manager = msg.sender;
        emit ContractCreated(manager);
    }
```

### Depósito

La función `deposit` permite depositar fondos en una cuenta bancaria. Si la cuenta no está activa, la activa. Si la cuenta ya está activa, simplemente incrementa el balance de la cuenta. La función `deposit` es un ejemplo de una función que no tiene modificador de función, por lo que puede ser invocada por cualquier cliente. 

Podemos ver que la función tiene el modificador `payable`. Esto se requiere para que la función pueda recibir fondos. Si la función no tiene el modificador `payable`, no se puede invocar con una transacción que incluya fondos.

Al finalizar la ejecución de la función, se emite el evento `Deposit`.

```solidity
function deposit() public payable {
    Account storage account = accounts[msg.sender];
    account.active = true;
    account.balance += msg.value;
    emit Deposit(msg.sender, msg.value);
}
```

### Retiro

La función `withdraw` permite retirar fondos de una cuenta bancaria. Tiene dos modificadores de función: `enoughFunds` y `nonZero`. El modificador `enoughFunds` se utiliza para verificar que la cuenta tenga fondos suficientes para realizar el retiro. El modificador `nonZero` se utiliza para verificar que la cantidad de fondos a retirar sea mayor que cero.

También tiene el modificador `virtual`, que indica que la función puede ser redefinida en un contrato derivado.

La primer línea de la función es un `assert` que verifica que el balance de la cuenta sea menor o igual que el balance del contrato. Esto no debería ocurrir nunca, y su ocurrencia indicaría un error de programación. El `assert` se utiliza para verificar exactamente eso. Si la condición del `assert` se cumple, la ejecución del contrato se interrumpe y se lanza un error.

La función actualiza el balance de la cuenta y realiza la transferencia de fondos. Al finalizar la ejecución de la función, se emite el evento `Withdraw`.

La transferencia se realiza mediante la función `transfer` del tipo `address payable`. Esta función es una función miembro de `address payable`, que es un tipo de dato que representa una dirección de Ethereum. El tipo `address payable` es un subtipo de `address`, y tiene la misma representación en memoria y en la pila de ejecución. La única diferencia es que `address payable` tiene una función miembro `transfer` que permite realizar transferencias de fondos.
Para poder invocarla, debemos convertir la dirección a `address payable` mediante la función `payable`.


```solidity
function withdraw(uint amount) public enoughFunds(amount) nonZero(amount) {
    assert(accounts[msg.sender].balance <= address(this).balance);
    accounts[msg.sender].balance -= amount;
    payable(msg.sender).transfer(amount);
    emit Withdraw(msg.sender, amount);
}
```

### Transferencia

La función `transfer` permite transferir fondos de una cuenta bancaria a otra. Tiene tres modificadores de función: `enoughFunds`, `activeAccount` y `nonZero`. El modificador `enoughFunds` se utiliza para verificar que la cuenta tenga fondos suficientes para realizar la transferencia. El modificador `activeAccount` verifica que la cuenta de destino esté activa. El modificador `nonZero` se utiliza para verificar que la cantidad de fondos a transferir sea mayor que cero.

```solidity
function transfer(
    address dest, 
    uint amount
) 
    public 
    enoughFunds(amount) 
    activeAccount(dest) 
    nonZero(amount) 
{
    accounts[dest].balance += amount;
    accounts[msg.sender].balance -= amount;
    emit Transfer(msg.sender, dest, amount);
}
```

La función simplemente decrementa el balance de la cuenta de origen y incrementa el balance de la cuenta de destino. Al finalizar la ejecución de la función, se emite el evento `Transfer`.

### La función `balance`

La función `balance` permite consultar el balance de una cuenta bancaria. Tiene el modificador `view`, que indica que la función no modifica el estado del contrato.

```solidity
function balance(address addr) public view returns (uint) {
    return accounts[addr].balance;
}
```

### Terminación del contrato

La función `close` permite terminar el contrato. Tiene el modificador `onlyManager`, que indica que la función solo puede ser invocada por el administrador del contrato. Sólo puede invocarse si el banco todavía está abierto.

```solidity
function close() public bankIsOpen onlyManager {
    status = Status.Closed;
    emit ContractTerminated(manager, address(this).balance);
    payable(manager).transfer(address(this).balance);
}
```

La función cambia el estado a `Closed`, emite el evento `ContractTerminated` y luego transfiere todos los fondos del contrato al administrador.

## Interacción con el contrato `Bank`

Veamos un ejemplo de interacción con el contrato `Bank` desde la consola creada al invocar `truffle develop`.

Primero desplegamos los contratos:

```
truffle(develop)> deploy

Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.


Starting migrations...
======================
> Network name:    'develop'
> Network id:      5777
> Block gas limit: 6721975 (0x6691b7)


1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0x4e9db781685c0d066217a4ff68ecfb29a41cced63fd59300cbcf2ba79cbbeeff
   > Blocks: 0            Seconds: 0
   > contract address:    0x7f1b2Fd07205548Bc64c76e777Bce17D860c7615
   > block number:        1
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.999074953
   > gas used:            274088 (0x42ea8)
   > gas price:           3.375 gwei
   > value sent:          0 ETH
   > total cost:          0.000925047 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:         0.000925047 ETH


2_bank_migration.js
===================

   Deploying 'Bank'
   ----------------
   > transaction hash:    0xb6ba93e6d9d587b713e4fa984382a11606f850c9fa320d61c3a838d11686e24d
   > Blocks: 0            Seconds: 0
   > contract address:    0x04590DD27b025D164040C910eF38bc70be59799f
   > block number:        3
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.99640545783439514
   > gas used:            792400 (0xc1750)
   > gas price:           3.179049676 gwei
   > value sent:          0 ETH
   > total cost:          0.0025190789632624 ETH


   Deploying 'BuggyBank'
   ---------------------
   > transaction hash:    0xd5b31030bd40bf2eefe616ff509002f2ace92f4b5db9af380c15b5201cfaa566
   > Blocks: 0            Seconds: 0
   > contract address:    0x3B09A95e72926464DDc1755418534C87389283aE
   > block number:        4
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.99399894378308182
   > gas used:            772760 (0xbca98)
   > gas price:           3.114180407 gwei
   > value sent:          0 ETH
   > total cost:          0.00240651405131332 ETH


   Deploying 'VeryBuggyBank'
   -------------------------
   > transaction hash:    0x8060683eba785e5e1324c2f72bd382b385057a90ad940e239faf3a525b5a77e6
   > Blocks: 0            Seconds: 0
   > contract address:    0x4aA086869C16461fAC1427769D7506b203b68FD3
   > block number:        5
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.99163811604713638
   > gas used:            772760 (0xbca98)
   > gas price:           3.055059444 gwei
   > value sent:          0 ETH
   > total cost:          0.00236082773594544 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:     0.00728642075052116 ETH


3_client_migration.js
=====================

   Deploying 'Client'
   ------------------
   > transaction hash:    0x3e0f2c98db6755eadd250e9b3bad6c12910816cd8d0fb817d5b83e476e7b1c73
   > Blocks: 0            Seconds: 0
   > contract address:    0x422e2F6aaD3250789f280Cb1ed738365Ca2751f6
   > block number:        7
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.989997404917260497
   > gas used:            528722 (0x81152)
   > gas price:           2.939463734 gwei
   > value sent:          0 ETH
   > total cost:          0.001554159144367948 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:     0.001554159144367948 ETH


4_thief_migration.js
====================

   Deploying 'Thief'
   -----------------
   > transaction hash:    0xc3491c3349cb54ab0e70bdef9f36dfc831d5d90e7f1e74dd134e9cceadd39dda
   > Blocks: 0            Seconds: 0
   > contract address:    0xEd3A4d847e5A5c947fFff5B0442b582c97c656CE
   > block number:        9
   > block timestamp:     1681330328
   > account:             0x709642f3eCBCA11258AbDe0de9b0d7a716c56cA5
   > balance:             99.987949425678352411
   > gas used:            690663 (0xa89e7)
   > gas price:           2.844447457 gwei
   > value sent:          0 ETH
   > total cost:          0.001964554613993991 ETH

   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:     0.001964554613993991 ETH

Summary
=======
> Total deployments:   6
> Final cost:          0.011730181508883099 ETH
```

A continuación obtenemos referencias al contrato `Bank` desplegado:

```javascript
truffle(develop)> var bank = await Bank.deployed()
undefined
truffle(develop)> bank.address
'0x04590DD27b025D164040C910eF38bc70be59799f'
```

Depositamos 100.000 wei desde `accounts[0]`:

```javascript
truffle(develop)> bank.deposit({value:100000, from:accounts[0]}) // Depositamos 100000 wei desde accounts[0]
{
  tx: '0xaf799c3571b872053aaab565d7ea3a97b2ca6c50b1d0c12671e837297fc05b47',
  receipt: {
    transactionHash: '0xaf799c3571b872053aaab565d7ea3a97b2ca6c50b1d0c12671e837297fc05b47',
    transactionIndex: 0,
    blockNumber: 11,
    blockHash: '0x9378e7a7f672a93ad9d49a41ad9a3fb51eba1dd34d12dc7bb576a1ca02008861',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 67420,
    gasUsed: 67420,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000008000000008000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000',
    status: true,
    effectiveGasPrice: 2771792063,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x9378e7a7f672a93ad9d49a41ad9a3fb51eba1dd34d12dc7bb576a1ca02008861',
      blockNumber: 11,
      logIndex: 0,
      removed: false,
      transactionHash: '0xaf799c3571b872053aaab565d7ea3a97b2ca6c50b1d0c12671e837297fc05b47',
      transactionIndex: 0,
      id: 'log_0575c377',
      event: 'Deposit',
      args: [Result]
    }
  ]
}
```

Vemos que el balance de `bank` es 100.000 wei:

```javascript
truffle(develop)> web3.eth.getBalance(bank.address)
'100000'
```

Vemos que para `bank`, el balance de `accounts[0]` es 100.000 wei:

```javascript
truffle(develop)> var b = await bank.balance(accounts[0])
undefined
truffle(develop)> b.toNumber()
100000
```

Retiramos 50.000 wei desde `accounts[0]`:

```javascript
truffle(develop)> bank.withdraw(50000, {from: accounts[0]})
{
  tx: '0x54d12159b16e52b0d4845462da178894f39ece52fabf002100705f62a2ef5119',
  receipt: {
    transactionHash: '0x54d12159b16e52b0d4845462da178894f39ece52fabf002100705f62a2ef5119',
    transactionIndex: 0,
    blockNumber: 12,
    blockHash: '0x6ad4c5ec63bf44a0cb9300f911a41e3f8512552780c15a899c0c6cd6fa3e1fb8',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 35911,
    gasUsed: 35911,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000008000000000000000000000000000000000000000000000000000000000000000000000000000084001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    status: true,
    effectiveGasPrice: 2738499560,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x6ad4c5ec63bf44a0cb9300f911a41e3f8512552780c15a899c0c6cd6fa3e1fb8',
      blockNumber: 12,
      logIndex: 0,
      removed: false,
      transactionHash: '0x54d12159b16e52b0d4845462da178894f39ece52fabf002100705f62a2ef5119',
      transactionIndex: 0,
      id: 'log_1e48cfbb',
      event: 'Withdraw',
      args: [Result]
    }
  ]
}
truffle(develop)> web3.eth.getBalance(bank.address)
'50000'
truffle(develop)> var b = await bank.balance(accounts[0])
undefined
truffle(develop)> b.toNumber()
50000
```

Veamos un ejemplo de transferencia de fondos entre dos cuentas:

```javascript
truffle(develop)> bank.transfer(accounts[1], 50000, {from:accounts[0]})
Uncaught:
Error: VM Exception while processing transaction: revert inactive account -- Reason given: inactive account.
    at evalmachine.<anonymous>
    at sigintHandlersWrap (node:vm:270:12)
    at Script.runInContext (node:vm:139:14)
    at runScript (/Users/miguel/.node_modules_global/lib/node_modules/truffle/build/webpack:/packages/core/lib/console.js:505:1)
    at Console.interpret (/Users/miguel/.node_modules_global/lib/node_modules/truffle/build/webpack:/packages/core/lib/console.js:520:1)
    at bound (node:domain:433:15)
    at REPLServer.runBound [as eval] (node:domain:444:12)
    at REPLServer.onLine (node:repl:902:10)
    at REPLServer.emit (node:events:513:28)
    at REPLServer.emit (node:domain:489:12)
    at REPLServer.[_onLine] [as _onLine] (node:internal/readline/interface:422:12)
    at REPLServer.[_line] [as _line] (node:internal/readline/interface:893:18)
    at REPLServer.[_ttyWrite] [as _ttyWrite] (node:internal/readline/interface:1271:22)
    at REPLServer.self._ttyWrite (node:repl:997:9)
    at ReadStream.onkeypress (node:internal/readline/interface:270:20)
    at ReadStream.emit (node:events:513:28)
    at ReadStream.emit (node:domain:489:12)
    at emitKeys (node:internal/readline/utils:357:14)
    at emitKeys.next (<anonymous>)
    at ReadStream.onData (node:internal/readline/emitKeypressEvents:64:36) {
  code: -32000,
  data: {
    hash: null,
    programCounter: 1491,
    result: '0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010696e616374697665206163636f756e7400000000000000000000000000000000',
    reason: 'inactive account',
    message: 'revert'
  },
  reason: 'inactive account',
  hijackedStack: 'Error: VM Exception while processing transaction: revert inactive account -- Reason given: inactive account.\n' +
    '    at /Users/miguel/.node_modules_global/lib/node_modules/truffle/build/webpack:/packages/provider/wrapper.js:25:1\n' +
    '    at /Users/miguel/.node_modules_global/lib/node_modules/truffle/build/webpack:/packages/provider/wrapper.js:165:1\n' +
    '    at /Users/miguel/.node_modules_global/lib/node_modules/truffle/build/webpack:/node_modules/web3-providers-http/lib/index.js:127:1\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)'
}
```

Inicialmente intentamos de transferir desde `accounts[0]` a `accounts[1]` 50000, pero la transferencia fallo porque `accounts[1]` no estaba activa. 

Podemos activar `accounts[1]` haciendo un depósito (que incluso puede ser con un valor cero, pero eso no está prohibido).

```javascript
truffle(develop)> bank.deposit({from:accounts[1]})
{
  tx: '0xb9baac61dfa38098022c0612646af410f1077215f07a241d2114eb8a15ca609f',
  receipt: {
    transactionHash: '0xb9baac61dfa38098022c0612646af410f1077215f07a241d2114eb8a15ca609f',
    transactionIndex: 0,
    blockNumber: 13,
    blockHash: '0x66918bfbc5a2bb2785170463174482da3dc8d4f8b5d4c92e2a6386b8ef559cba',
    from: '0x311908bb1d4960fd5e08c001f536aba7eae44545',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 47520,
    gasUsed: 47520,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000008000000008000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000',
    status: true,
    effectiveGasPrice: 2709005651,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x66918bfbc5a2bb2785170463174482da3dc8d4f8b5d4c92e2a6386b8ef559cba',
      blockNumber: 13,
      logIndex: 0,
      removed: false,
      transactionHash: '0xb9baac61dfa38098022c0612646af410f1077215f07a241d2114eb8a15ca609f',
      transactionIndex: 0,
      id: 'log_acd6e0c1',
      event: 'Deposit',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.accounts(accounts[1])
Result {
  '0': true,
  '1': BN {
    negative: 0,
    words: [ 0, <1 empty item> ],
    length: 1,
    red: null
  },
  active: true,
  balance: BN {
    negative: 0,
    words: [ 0, <1 empty item> ],
    length: 1,
    red: null
  }
}
truffle(develop)> bank.transfer(accounts[1], 50000, {from:accounts[0]})
{
  tx: '0x7eda0478eeb823c86eb8c0d1835efc53f7000400a41d0fd9b1fad189d217398c',
  receipt: {
    transactionHash: '0x7eda0478eeb823c86eb8c0d1835efc53f7000400a41d0fd9b1fad189d217398c',
    transactionIndex: 0,
    blockNumber: 14,
    blockHash: '0xfbe94136a2788291865a2d976214d1a842a8a9ccc24c5234d6d3d6c01342d5ae',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 49669,
    gasUsed: 49669,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000200000000008000000000000000000000000000000000000000000000000000000000000000000000010000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    status: true,
    effectiveGasPrice: 2683249329,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0xfbe94136a2788291865a2d976214d1a842a8a9ccc24c5234d6d3d6c01342d5ae',
      blockNumber: 14,
      logIndex: 0,
      removed: false,
      transactionHash: '0x7eda0478eeb823c86eb8c0d1835efc53f7000400a41d0fd9b1fad189d217398c',
      transactionIndex: 0,
      id: 'log_77b20a2c',
      event: 'Transfer',
      args: [Result]
    }
  ]
}
truffle(develop)> (await bank.balance(accounts[0])).toNumber()
0
truffle(develop)> (await bank.balance(accounts[1])).toNumber()
50000
```


Ahora la transferencia fue exitosa, y podemos comprobar que `accounts[0]` tiene 0 y `accounts[1]` tiene 50.000.


## El contrato `Client`

El contrato `Client` modela un cliente del banco, que puede depositar, retirar y transferir fondos. Para poder interactuar con contrato `Bank` se incluye el contrato `Bank` en el archivo `Client.sol`.

```solidity
import "./Bank.sol";
```

Esto nos permite referenciar el contrato `Bank` en el contrato `Client`, siempre y cuando conozcamos la dirección en la que el primero está desplegado.

Las funciones `deposit`, `withdraw` y `transfer` reciben como primer argumento la dirección en la que está desplegado el contrato `Bank`, y luego invocan las funciones correspondientes de dicho contrato.

```solidity
function deposit(address addr) public payable {
    Bank(addr).deposit{value: msg.value}();
    emit ClientDeposit(addr, msg.value);
}

function withdraw(address addr, uint amount) public onlyClient {
    Bank(addr).withdraw(amount);
    emit ClientWithdraw(addr, amount);
}

function transfer(address addr, address to, uint amount) public onlyClient{
    Bank(addr).transfer(to,amount);
    emit ClientTransfer(addr, address(this), to, amount);
}
```

Cuando se invoca la función `deposit` del contrato `Client`, se invoca la función `deposit` del contrato `Bank` que está desplegado en la dirección `addr`. La función `deposit` del contrato `Client` no tiene modificador de función, por lo que puede ser invocada por cualquier cliente. El depósito en el banco quedará registrado con la dirección del contrato `Client` como la dirección del cliente. La sintaxis `{value: msg.value}` es una forma de pasar el valor de la transacción a la función `deposit` del contrato `Bank`.

En el caso de la función `withdraw`, se invoca la función `withdraw` del contrato `Bank` que está desplegado en la dirección `addr`. La función `withdraw` del contrato `Client` tiene el modificador `onlyClient`, por lo que solo puede ser invocada por el cliente que desplegó el contrato `Client`. El retiro del banco quedará registrado con la dirección del contrato `Client` como la dirección del cliente.

Ahora bien, esto implica que `Bank(addr)` realizará una transferencia a la dirección del contrato `Client`. Para que esto sea posible, el contrato `Client` debe tener una función `receive` que acepte la transferencia. Si no se define una función `receive`, la transferencia será rechazada. Obsérvese que `receive` no es una función de Solidity, sino que es una función especial que se invoca cuando se realiza una transferencia a un contrato.

```solidity
receive() external payable {
    emit ClientTransferReceived(msg.sender, msg.value);
}
```

`receive` podría estar vacía, pero en este caso se incluye un evento para registrar la transferencia.

La función `returnFunds` del contrato `Client` es una función auxiliar que permite recuperar los fondos que se hayan transferido al contrato `Client`. La función `returnFunds` es invocada por el cliente que desplegó el contrato `Client`.

```solidity
function returnFunds() public onlyClient {
    payable(msg.sender).transfer(address(this).balance);
    emit ClientFundsReturned(msg.sender, address(this).balance);
}
```

### Interacción con el contrato `Client`

Veamos la interacción entre el cliente y el banco.

Así como podemos interactuar con los contratos desplegados mediante los *scripts* de migración, también podemos desplegar nuevas instancias mediante la consola de Truffle.

```javascript
truffle(develop)> var bank = await Bank.new()
undefined
truffle(develop)> var client = await Client.new()
undefined
```

Ahora, podemos interactuar con el contrato `Client` mediante la consola de Truffle.

```javascript
truffle(develop)> client.deposit(bank.address, {value: 100000})
{
  tx: '0x28156f4c27434acc43a53bc53c0aed1c2a7e1198373de54dcc509047362196f9',
  receipt: {
    transactionHash: '0x28156f4c27434acc43a53bc53c0aed1c2a7e1198373de54dcc509047362196f9',
    transactionIndex: 0,
    blockNumber: 21,
    blockHash: '0x9634b4088d328f0027d10bd05c1dc64c96f402db586ffeeb422ecf7cee5f6dd1',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x86f60ad20a2d90bcb6d905a23f579ea454830e13',
    cumulativeGasUsed: 81659,
    gasUsed: 81659,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000800000000000000000000010000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000004000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000004000000000000000000000000100000000000000000000000000000000000000000020000000000000000400000000800000000',
    status: true,
    effectiveGasPrice: 2579674642,
    type: '0x2',
    rawLogs: [ [Object], [Object] ]
  },
  logs: [
    {
      address: '0x86f60AD20a2d90Bcb6D905A23f579EA454830e13',
      blockHash: '0x9634b4088d328f0027d10bd05c1dc64c96f402db586ffeeb422ecf7cee5f6dd1',
      blockNumber: 21,
      logIndex: 1,
      removed: false,
      transactionHash: '0x28156f4c27434acc43a53bc53c0aed1c2a7e1198373de54dcc509047362196f9',
      transactionIndex: 0,
      id: 'log_402bae71',
      event: 'ClientDeposit',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(client.address)
BN {
  negative: 0,
  words: [ 100000, <1 empty item> ],
  length: 1,
  red: null
}
truffle(develop)> web3.eth.getBalance(bank.address)
'100000'
```

Como se puede observar, el cliente depositó 100.000 wei en el banco. El banco registró el depósito con la dirección del contrato `Client` como la dirección del cliente. El monto también se ve registrado en el balance del banco en la red Ethereum.

Ahora, vamos a intentar retirar los fondos del banco.

```javascript
truffle(develop)> client.withdraw(bank.address, 40000)
{
  tx: '0xe4aed498f1618cbe4c8bcce63aeb708acbeadb682d6d583685709950836e9d64',
  receipt: {
    transactionHash: '0xe4aed498f1618cbe4c8bcce63aeb708acbeadb682d6d583685709950836e9d64',
    transactionIndex: 0,
    blockNumber: 22,
    blockHash: '0x13aab5aa0a717f752e99ff44530e809a7be67610d0e541f38996044f26759ef8',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x86f60ad20a2d90bcb6d905a23f579ea454830e13',
    cumulativeGasUsed: 47659,
    gasUsed: 47659,
    contractAddress: null,
    logs: [ [Object], [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000100000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000040080004001000000000000000000000000000200000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000100000000000000000001000000000000000000000020000000000000002000000000800000000',
    status: true,
    effectiveGasPrice: 2569957286,
    type: '0x2',
    rawLogs: [ [Object], [Object], [Object] ]
  },
  logs: [
    {
      address: '0x86f60AD20a2d90Bcb6D905A23f579EA454830e13',
      blockHash: '0x13aab5aa0a717f752e99ff44530e809a7be67610d0e541f38996044f26759ef8',
      blockNumber: 22,
      logIndex: 0,
      removed: false,
      transactionHash: '0xe4aed498f1618cbe4c8bcce63aeb708acbeadb682d6d583685709950836e9d64',
      transactionIndex: 0,
      id: 'log_0f9548ba',
      event: 'ClientTransferReceived',
      args: [Result]
    },
    {
      address: '0x86f60AD20a2d90Bcb6D905A23f579EA454830e13',
      blockHash: '0x13aab5aa0a717f752e99ff44530e809a7be67610d0e541f38996044f26759ef8',
      blockNumber: 22,
      logIndex: 2,
      removed: false,
      transactionHash: '0xe4aed498f1618cbe4c8bcce63aeb708acbeadb682d6d583685709950836e9d64',
      transactionIndex: 0,
      id: 'log_a601c678',
      event: 'ClientWithdraw',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(client.address)
BN {
  negative: 0,
  words: [ 60000, <1 empty item> ],
  length: 1,
  red: null
}
truffle(develop)> web3.eth.getBalance(client.address)
'40000'
```

Como se puede observar, el cliente retiró 40.000 wei del banco. El banco registró el retiro con la dirección del contrato `Client` como la dirección del cliente. El monto también se ve registrado en el balance del cliente en la red Ethereum.

De la misma forma podríamos realizar una transferencia desde la cuenta del cliente a otra cuenta en el banco.

Y podemos retirar los fondos que están en el contrato `Client` con la función `returnFunds`.


```javascript
truffle(develop)> client.returnFunds()
{
  tx: '0x3a08524b8ac93154561542c3ea2bcf2b091f35e5170b88a8ad17ad0d37b516cc',
  receipt: {
    transactionHash: '0x3a08524b8ac93154561542c3ea2bcf2b091f35e5170b88a8ad17ad0d37b516cc',
    transactionIndex: 0,
    blockNumber: 23,
    blockHash: '0x8e371950fd1057c656b26adefb74501e3eb6432acb54ccc0c30105039bfc41d5',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x86f60ad20a2d90bcb6d905a23f579ea454830e13',
    cumulativeGasUsed: 31880,
    gasUsed: 31880,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000008000000000000000000000000000',
    status: true,
    effectiveGasPrice: 2561336626,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x86f60AD20a2d90Bcb6D905A23f579EA454830e13',
      blockHash: '0x8e371950fd1057c656b26adefb74501e3eb6432acb54ccc0c30105039bfc41d5',
      blockNumber: 23,
      logIndex: 0,
      removed: false,
      transactionHash: '0x3a08524b8ac93154561542c3ea2bcf2b091f35e5170b88a8ad17ad0d37b516cc',
      transactionIndex: 0,
      id: 'log_760a726b',
      event: 'ClientFundsReturned',
      args: [Result]
    }
  ]
}
truffle(develop)> web3.eth.getBalance(client.address)
'0'
```
