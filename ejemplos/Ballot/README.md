# Compilación y despliegue de contratos

Para poder interactuar con un contrato escrito en Solidity, es necesario compilarlo y desplegarlo en la red de Ethereum. 

Veremos primero como hacerlo manualmente, paso a paso, y luego mediante el uso de una herramienta llamada Truffle.

## Compilación manual

Para compilar un contrato, es necesario tener instalado el compilador de Solidity. En Ubuntu, se puede instalar mediante el siguiente comando:

    sudo apt install solc

Una vez instalado, podemos compilar el contrato con el siguiente comando:
    
    solc --bin --abi -o build/ contracts/Ballot.sol

El compilador genera dos archivos en el directorio `build/`: `Ballot.bin` y `Ballot.abi`. El primero contiene el bytecode del contrato, y el segundo contiene la interfaz ABI del contrato.

Ambos artefactos son necesarios para desplegar el contrato en la red de Ethereum. Veamos como desplegar el contacto en la red de prueba creada en clases anteriores.

```python
from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware
from os.path import expanduser
import json

# Conectamos a la red de Ethereum
geth_ipc_path = expanduser("~/blockchain-iua/devnet/node/geth.ipc")
w3 = Web3(Web3.IPCProvider(geth_ipc_path))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

# Cargamos el bytecode y la interfaz ABI del contrato
with open("build/Ballot.bin") as f:
    bytecode = f.read()
with open("build/Ballot.abi") as f:
    abi = json.load(f)

Ballot = w3.eth.contract(abi=abi, bytecode=bytecode)
```

`Ballot` es un objeto que nos permitirá invocar el constructor del contrato y luego interactuar con el contrato desplegado. Para desplegar el contrato, debemos invocar al método `constructor` del objeto `Ballot`. Como el arguento es del tipo `bytes32[]`, debemos ser capaces de convertir cadenas de texto en secuencias de bytes del tamaño adecuado. Para eso, definiremos un par de funciones auxiliares:


```python
def to_bytes32(s: str) -> bytes:
    return s.encode("utf-8").ljust(32, b"\0")[:32]
def from_bytes32(b: bytes) -> str:
    return b.decode("utf-8").rstrip("\0")
```

Ahora podemos desplegar el contrato:

```python
# Desplegamos el contrato
tx_hash = Ballot.constructor([to_bytes32("Alice"), to_bytes32("Bob"), to_bytes32("Carol")])
            .transact({'from': w3.eth.accounts[0]})
tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
contract_address = tx_receipt.contractAddress
```

Como resultado, `contract_address` contiene la dirección del contrato desplegado en la red de Ethereum. Ahora podemos utilizar esa dirección para conectarnos con el contrato e interactuar con el mismo:

```python   
# Conectamos con el contrato
ballot = w3.eth.contract(address=contract_address, abi=abi)
ballot.functions.numProposals().call() # 3
```

## Compilación y despliegue con Truffle

Truffle es una herramienta que nos permite compilar y desplegar contratos de forma automática. Para instalar Truffle, debemos tener instalado Node.js y NPM. En Ubuntu, se puede instalar mediante los siguientes comandos:

    sudo apt install nodejs npm

También es posible instalar Node.js mediante `snap`:
    
    sudo snap install node --classic 

Truffle se instala mediante NPM, y debe ser instalado de manera global. Para evitar la necesidad de hacerlo con privilegios de `root`, es posible instalarlo en un directorio sobre el que tenga permisos un usuario normal, como por ejemplo `~/.npm-global`:

    mkdir ~/.npm-global
    npm config set prefix '~/.npm-global'
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
    source ~/.bashrc

Ahora podemos instalar Truffle:
    npm install -g truffle

Una vez instalado, podemos crear un nuevo proyecto de Truffle:
    
        truffle init

Esto crea un nuevo directorio con la siguiente estructura:
    
        .
        ├── contracts
        ├── migrations
        ├── test
        └── truffle-config.js

El directorio `contracts/` contiene los contratos escritos en Solidity. El directorio `migrations/` contiene los scripts de despliegue. El directorio `test/` contiene los tests unitarios. El archivo `truffle-config.js` contiene la configuración de Truffle.

En nuestro caso, el proyecto ya está creado, y cuenta con un contrato llamado `Ballot.sol` en el directorio `contracts/`.


Para compilar los contratos, debemos ejecutar el siguiente comando:

    truffle compile

Esto genera los archivos `build/contracts/Ballot.json` y `build/contracts/Migrations.json`. El primero contiene el bytecode y la interfaz ABI del contrato, y el segundo contiene la interfaz ABI del contrato de migraciones.

Para desplegar el contrato, debemos ejecutar el siguiente comando:

    truffle migrate

o
    
    truffle deploy

Esto ejecuta los scripts de despliegue que se encuentran en el directorio `migrations/`. El script `1_initial_migration.js` es generado por defecto por Truffle, y se encarga de desplegar el contrato de migraciones. El script `2_deploy_contracts.js` es generado por nosotros, y se encarga de desplegar el contrato `Ballot`.

¿Donde se despliega el contrato? Depende de la configuración establecida en el archivo `truffle-config.js`. El *default* es en una red local de Ethereum, como por ejemplo, Ganache (https://trufflesuite.com/ganache/)

Para conectarnos con el contrato desplegado, podemos ejecutar el siguiente comando:

    truffle console

Esto nos conecta con la red de Ethereum, y nos permite interactuar con el contrato desplegado. Por ejemplo, podemos ejecutar el siguiente comando para obtener la cantidad de propuestas:
    
    Ballot.deployed().then(function(instance) { return instance.numProposals.call(); }).then(function(result) { console.log(result.toNumber()); });

También podemos ejecutar los tests unitarios con el siguiente comando:
    
    truffle test
