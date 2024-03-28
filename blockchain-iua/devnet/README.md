# Instalación de una red con un solo nodo
Es posible instalar una red con un solo nodo, a los efectos de testeo o desarrollo. En ese caso, el nodo debe actuar como sellador, para lo cual deberemos crear una al menos una cuenta.


## Creación de cuentas
Para crear una cuenta, utilizaremos el comando `geth account new`. Este no es el mecanismo recomendado en la actualidad, ya que se prefiere el uso de la aplicación `clef`. Sin embargo, lo utilizaremos por simplicidad.

`geth` nos pedirá una contraseña para proteger la clave privada. En un caso real deberíamos elegir una contraseña fuerte, pero en este caso podemos poner una contraseña vacía.

```
miguel@MP:~$ cd blockchain-iua/devnet/
miguel@MP:~/blockchain-iua/devnet$ geth -datadir node account new
INFO [03-15|22:54:16.630] Maximum peer count                       ETH=50 LES=0 total=50
INFO [03-15|22:54:16.630] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
Your new account is locked with a password. Please give a password. Do not forget this password.
Password: 
Repeat password: 

Your new key was generated

Public address of the key:   0x5211A5ec955E443710052ecc00107DE5A3123A81
Path of the secret key file: node/keystore/UTC--2023-03-16T01-54-26.122828550Z--5211a5ec955e443710052ecc00107de5a3123a81

- You can share your public address with anyone. Others need it to interact with you.
- You must NEVER share the secret key with anyone! The key controls access to your funds!
- You must BACKUP your key file! Without the key, it's impossible to access account funds!
- You must REMEMBER your password! Without the password, it's impossible to decrypt the key!

```

En este caso la dirección de la cuenta es `0x5211A5ec955E443710052ecc00107DE5A3123A81`. La dirección también puede obtenerse de la última parte del nombre del archivo correspondiente en el directorio `node/keystore/`. Puede observarse que la dirección de la cuenta está formada por 40 caracteres hexadecimales, los cuales equivalen a 20 bytes o 160 bits. Podemos ver que la cuenta está expresada en una combinación de letras mayúsculas y minúsculas. Esa particular combinación se deriva de un algoritmo de *checksum* que permite detectar errores en la transcripción de la cuenta.

```
miguel@MP:~$ ls node/keystore/
UTC--2023-03-16T01-54-26.122828550Z--5211a5ec955e443710052ecc00107de5a3123a81
```

En los ejemplos de los pasos siguientes, debe reemplazarse la dirección `0x5211A5ec955E443710052ecc00107DE5A3123A81` por la que se haya generado en el nodo a crear.

## Creación del bloque génesis e inicialización de la red

Para inicializar la red, debemos crear un archivo en formato JSON que nos especifique el bloque génesis. Si bien podemos crearlo a mano, utilizaremos el programa `puppeth`, que nos facilita la tarea.

En versiones anteriores del paquete `ethereum`, este programa estaba incluído, pero en la versión actual ya no lo está, por lo que deberemos instalarlo por separado.


```
miguel@MP:~/blockchain-iua/devnet$ puppeth 
+-----------------------------------------------------------+
| Welcome to puppeth, your Ethereum private network manager |
|                                                           |
| This tool lets you create a new Ethereum network down to  |
| the genesis block, bootnodes, miners and ethstats servers |
| without the hassle that it would normally entail.         |
|                                                           |
| Puppeth uses SSH to dial in to remote servers, and builds |
| its network components out of Docker containers using the |
| docker-compose toolset.                                   |
+-----------------------------------------------------------+

Please specify a network name to administer (no spaces, hyphens or capital letters please)
> devnet

Sweet, you can set this via --network=devnet next time!

INFO [03-20|19:28:01.446] Administering Ethereum network           name=devnet
INFO [03-20|19:28:01.446] No remote machines to gather stats from 

What would you like to do? (default = stats)
 1. Show network stats
 2. Configure new genesis
 3. Track new remote server
 4. Deploy network components
> 2

What would you like to do? (default = create)
 1. Create new genesis from scratch
 2. Import already existing genesis
> 1

Which consensus engine to use? (default = clique)
 1. Ethash - proof-of-work
 2. Clique - proof-of-authority
> 2

How many seconds should blocks take? (default = 15)
>   

Which accounts are allowed to seal? (mandatory at least one)
> 0x5211A5ec955E443710052ecc00107DE5A3123A81      
> 0x

Which accounts should be pre-funded? (advisable at least one)
> 0x5211A5ec955E443710052ecc00107DE5A3123A81
> 0x

Should the precompile-addresses (0x1 .. 0xff) be pre-funded with 1 wei? (advisable yes)
> yes

Specify your chain/network ID if you want an explicit one (default = random)
> 123456
INFO [03-20|19:29:35.797] Configured new genesis block 

What would you like to do? (default = stats)
 1. Show network stats
 2. Manage existing genesis
 3. Track new remote server
 4. Deploy network components
> 2

 1. Modify existing configurations
 2. Export genesis configurations
 3. Remove genesis configuration
> 2

Which folder to save the genesis specs into? (default = current)
  Will create devnet.json, devnet-aleth.json, devnet-harmony.json, devnet-parity.json
> 
INFO [03-20|19:30:00.845] Saved native genesis chain spec          path=devnet.json
ERROR[03-20|19:30:00.845] Failed to create Aleth chain spec        err="unsupported consensus engine"
ERROR[03-20|19:30:00.845] Failed to create Parity chain spec       err="unsupported consensus engine"
INFO [03-20|19:30:00.847] Saved genesis chain spec                 client=harmony path=devnet-harmony.json

What would you like to do? (default = stats)
 1. Show network stats
 2. Manage existing genesis
 3. Track new remote server
 4. Deploy network components
>
```

Finalizado este paso, el archivo `devnet.json` (si se eligió ese nombre), tiene la información necesaria para inicializar la red:

```
miguel@MP:~/blockchain-iua/devnet$ geth --datadir node init devnet.json 
INFO [03-20|19:32:22.739] Maximum peer count                       ETH=50 LES=0 total=50
INFO [03-20|19:32:22.739] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
INFO [03-20|19:32:22.740] Allocated cache and file handles         database=/home/miguel/blockchain-iua/devnet/node/geth/chaindata cache=16.00MiB handles=16
INFO [03-20|19:32:22.756] Writing custom genesis block 
INFO [03-20|19:32:22.767] Persisted trie from memory database      nodes=356 size=50.51KiB time=950.927µs gcnodes=0 gcsize=0.00B gctime=0s livenodes=1 livesize=0.00B
INFO [03-20|19:32:22.767] Successfully wrote genesis state         database=chaindata hash=5cf795…b2df4f
INFO [03-20|19:32:22.767] Allocated cache and file handles         database=/home/miguel/blockchain-iua/devnet/node/geth/lightchaindata cache=16.00MiB handles=16
INFO [03-20|19:32:22.780] Writing custom genesis block 
INFO [03-20|19:32:22.797] Persisted trie from memory database      nodes=356 size=50.51KiB time=4.376048ms gcnodes=0 gcsize=0.00B gctime=0s livenodes=1 livesize=0.00B
INFO [03-20|19:32:22.797] Successfully wrote genesis state         database=lightchaindata hash=5cf795…b2df4f
```

## Lanzar el nodo

Para lanzar el nodo, debemos invocar geth con los siguientes argumentos:

* `-datadir`, para indicar el directorio donde estarán los datos del nodo.
* `-networkid`, con el valor que hemos declarado en `puppeth`.
* `-miner.etherbase`, con la dirección de la cuenta que va a sellar.
* `-unlock`, con la misma cuenta, para que se pueda operar con ella.
* `-password`, con el nombre del archivo que contiene la contraseña (o `/dev/null` si está vacía).
* `-mine`, para que comience a sellar.

```
miguel@MP:~/blockchain-iua/devnet$ geth -datadir node -networkid 123456 -unlock 5211A5ec955E443710052ecc00107DE5A3123A81 -mine -password /dev/null -miner.etherbase 5211A5ec955E443710052ecc00107DE5A3123A81
INFO [03-15|23:33:45.517] Maximum peer count                       ETH=50 LES=0 total=50
INFO [03-15|23:33:45.518] Smartcard socket not found, disabling    err="stat /run/pcscd/pcscd.comm: no such file or directory"
INFO [03-15|23:33:45.522] Set global gas cap                       cap=50,000,000
INFO [03-15|23:33:45.523] Allocated trie memory caches             clean=154.00MiB dirty=256.00MiB
INFO [03-15|23:33:45.523] Using leveldb as the backing database 
INFO [03-15|23:33:45.523] Allocated cache and file handles         database=/home/miguel/blockchain-iua/devnet/node/geth/chaindata cache=512.00MiB handles=524,288
INFO [03-15|23:33:45.546] Using LevelDB as the backing database 
INFO [03-15|23:33:45.547] Opened ancient database                  database=/home/migue/blockchain-iua/devnet/node/geth/chaindata/ancient/chain readonly=false
INFO [03-15|23:33:45.547] Initialising Ethereum protocol           network=123,456 dbversion=8
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] --------------------------------------------------------------------------------------------------------------------------------------------------------- 
INFO [03-15|23:33:45.548] Chain ID:  123456 (unknown) 
INFO [03-15|23:33:45.548] Consensus: Clique (proof-of-authority) 
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] Pre-Merge hard forks (block based): 
INFO [03-15|23:33:45.548]  - Homestead:                   #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/homestead.md) 
INFO [03-15|23:33:45.548]  - Tangerine Whistle (EIP 150): #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/tangerine-whistle.md) 
INFO [03-15|23:33:45.548]  - Spurious Dragon/1 (EIP 155): #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/spurious-dragon.md) 
INFO [03-15|23:33:45.548]  - Spurious Dragon/2 (EIP 158): #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/spurious-dragon.md) 
INFO [03-15|23:33:45.548]  - Byzantium:                   #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/byzantium.md) 
INFO [03-15|23:33:45.548]  - Constantinople:              #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/constantinople.md) 
INFO [03-15|23:33:45.548]  - Petersburg:                  #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/petersburg.md) 
INFO [03-15|23:33:45.548]  - Istanbul:                    #0        (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/istanbul.md) 
INFO [03-15|23:33:45.548]  - Berlin:                      #<nil> (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/berlin.md) 
INFO [03-15|23:33:45.548]  - London:                      #<nil> (https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/london.md) 
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] The Merge is not yet available for this network! 
INFO [03-15|23:33:45.548]  - Hard-fork specification: https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades/paris.md 
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] Post-Merge hard forks (timestamp based): 
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] --------------------------------------------------------------------------------------------------------------------------------------------------------- 
INFO [03-15|23:33:45.548]  
INFO [03-15|23:33:45.548] Loaded most recent local block           number=8 hash=b0bbfe..2e4428 td=17 age=45s
INFO [03-15|23:33:45.549] Loaded local transaction journal         transactions=0 dropped=0
INFO [03-15|23:33:45.549] Regenerated local transaction journal    transactions=0 accounts=0
WARN [03-15|23:33:45.549] Switch sync mode from snap sync to full sync 
INFO [03-15|23:33:45.550] Gasprice oracle is ignoring threshold set threshold=2
WARN [03-15|23:33:45.550] Unclean shutdown detected                booted=2023-03-15T23:26:18-0300 age=7m27s
WARN [03-15|23:33:45.550] Unclean shutdown detected                booted=2023-03-15T23:26:42-0300 age=7m3s
WARN [03-15|23:33:45.550] Engine API enabled                       protocol=eth
WARN [03-15|23:33:45.550] Engine API started but chain not configured for merge yet 
INFO [03-15|23:33:45.550] Starting peer-to-peer node               instance=Geth/v1.11.3-stable-5ed08c47/linux-arm64/go1.20.2
INFO [03-15|23:33:45.566] New local node record                    seq=1,678,933,578,114 id=c8f500b533529cbc ip=127.0.0.1 udp=30303 tcp=30303
INFO [03-15|23:33:45.566] IPC endpoint opened                      url=/home/miguel/blockchain-iua/devnet/node/geth.ipc
INFO [03-15|23:33:45.566] Loaded JWT secret file                   path=/home/miguel/blockchain-iua/devnet/node/geth/jwtsecret crc32=0x9e024fd2
INFO [03-15|23:33:45.567] WebSocket enabled                        url=ws://127.0.0.1:8551
INFO [03-15|23:33:45.567] HTTP server started                      endpoint=127.0.0.1:8551 auth=true prefix= cors=localhost vhosts=localhost
INFO [03-15|23:33:45.578] Started P2P networking                   self=enode://67f758f1486b7276b5447113affcc6f34fb3c4917075225adecbec8dddbef7bab83f5428801f778fde188f36b71a9d2974bde398ee5ba986b2935ca16b9388a1@127.0.0.1:30303
INFO [03-15|23:33:46.051] Unlocked account                         address=0x5211A5ec955E443710052ecc00107DE5A3123A81
INFO [03-15|23:33:46.051] Transaction pool price threshold updated price=0
INFO [03-15|23:33:46.051] Updated mining threads                   threads=0
INFO [03-15|23:33:46.051] Transaction pool price threshold updated price=1,000,000,000
INFO [03-15|23:33:46.051] Commit new sealing work                  number=9 sealhash=f8a29f..86307b uncles=0 txs=0 gas=0 fees=0 elapsed="58.878µs"
INFO [03-15|23:33:46.052] Commit new sealing work                  number=9 sealhash=f8a29f..86307b uncles=0 txs=0 gas=0 fees=0 elapsed="182.258µs"
INFO [03-15|23:33:46.052] Successfully sealed new block            number=9 sealhash=f8a29f..86307b hash=e0f432..8a0f79 elapsed="267.595µs"
INFO [03-15|23:33:46.052] 🔨 mined potential block                number=9 hash=e0f432..8a0f79
INFO [03-15|23:33:46.052] Commit new sealing work                  number=10 sealhash=327f0a..423ad9 uncles=0 txs=0 gas=0 fees=0 elapsed="109.505µs"
INFO [03-15|23:33:46.052] Commit new sealing work                  number=10 sealhash=327f0a..423ad9 uncles=0 txs=0 gas=0 fees=0 elapsed="197.592µs"
INFO [03-15|23:33:52.607] New local node record                    seq=1,678,933,578,115 id=c8f500b533529cbc ip=186.141.231.199 udp=24568 tcp=30303
INFO [03-15|23:33:55.572] Looking for peers                        peercount=0 tried=41 static=0
INFO [03-15|23:33:59.918] New local node record                    seq=1,678,933,578,116 id=c8f500b533529cbc ip=186.141.226.52  udp=45931 tcp=30303
INFO [03-15|23:34:00.260] New local node record                    seq=1,678,933,578,117 id=c8f500b533529cbc ip=186.141.231.199 udp=24568 tcp=30303
INFO [03-15|23:34:01.005] Successfully sealed new block            number=10 sealhash=327f0a..423ad9 hash=725ec2..5dd79e elapsed=14.953s
INFO [03-15|23:34:01.005] 🔨 mined potential block                number=10 hash=725ec2..5dd79e
INFO [03-15|23:34:01.006] Commit new sealing work                  number=11 sealhash=51e098..9f2abd uncles=0 txs=0 gas=0 fees=0 elapsed="817.348µs"
INFO [03-15|23:34:01.007] Commit new sealing work                  number=11 sealhash=51e098..9f2abd uncles=0 txs=0 gas=0 fees=0 elapsed=1.306ms
INFO [03-15|23:34:01.703] New local node record                    seq=1,678,933,578,118 id=c8f500b533529cbc ip=186.141.226.52  udp=45931 tcp=30303
INFO [03-15|23:34:01.799] New local node record                    seq=1,678,933,578,119 id=c8f500b533529cbc ip=186.141.231.199 udp=24568 tcp=30303
INFO [03-15|23:34:02.415] New local node record                    seq=1,678,933,578,120 id=c8f500b533529cbc ip=186.141.226.52  udp=45931 tcp=30303
```

## Conexión al nodo mediante IPC

```
miguel@MP:~/blockchain-iua/devnet$ geth attach node/geth.ipc
Welcome to the Geth JavaScript console!

instance: Geth/v1.11.3-stable-5ed08c47/linux-arm64/go1.20.2
coinbase: 0x5211a5ec955e443710052ecc00107de5a3123a81
at block: 11 (Wed Mar 15 2023 23:43:38 GMT-0300 (-03))
 datadir: /home/miguel/blockchain-iua/devnet/node
 modules: admin:1.0 clique:1.0 debug:1.0 engine:1.0 eth:1.0 miner:1.0 net:1.0 rpc:1.0 txpool:1.0 web3:1.0

To exit, press ctrl-d or type exit
> eth.blockNumber
12
> eth.accounts
["0x5211a5ec955e443710052ecc00107de5a3123a81"]
> eth.getBalance(eth.accounts[0])
9.04625697166532776746648320380374280103671755200316906558262375061821325312e+74
> 

```