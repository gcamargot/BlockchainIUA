# Configuración de nodos de una red *Ethereum*
Los nodos de una red *Ethereum* tienen distintos requerimientos según sea el *mecanismo de consenso* utilizado.
Cuando se utiliza *Proof-of-Work* (PoW), como fue el caso de la red principal hasta 2022, o *Proof-of-Authority* (PoA), se requiere la instalación de un único programa cliente. En cambio, cuando se usa *Proof-of-Stake*, como es el caso de la red principal en la actualidad, se requieren **dos** clientes: un *cliente de ejecución* y un *cliente de consenso*.

En nuestro caso trabajaremos con redes que usan prueba de autoridad, por lo que sólo necesitamos utilizar un cliente. Si bien existen distintas posibilidades, utilizaremos la implementación oficial escrita en lenguaje Go, llamada [`geth`](https://geth.ethereum.org).

Conectaremos, por un lado, un nodo a la red de prueba de la *Blockchain Federal Argentina* (BFA), y por otro lado, armaremos una red privada formada por un único nodo sellador.

Loa pasos necesarios para instalar y conectar un nodo a una red son: 

1. Instalar el cliente `geth`
2. Inicializar la cadena con el bloque _génesis_ de la red que corresponda.
3. Lanzar el cliente para que sincronice con la red

## Instalación del cliente `geth`

Pueden encontrarse instrucciones para instalar `geth` en distintos sistemas operativos en https://geth.ethereum.org/docs/getting-started/installing-geth

En Ubuntu, por ejemplo, puede instalarse con la siguiente secuencia de instrucciones:

```
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt update
sudo apt install ethereum
```

Esto instala `geth` y algunas herramientas adicionales.


## Estructura de directorios

`geth` requiere la existencia de un directorio en el que descargará la cadena y creará ciertos archivos necesarios para su ejecución. La ubicación de ese directorio es arbitraria, pero a los efectos de esta materia asumiremos la existencia de una estructura de directorios predefinida, y el uso de una máquina con Linux.

Es posible utilizar otra estructura, pero en ese caso deberán adaptarse las instrucciones a cada estructura particular. 

La base de la estructura será un directorio llamado `blockchain-iua`, situado en el *home directory* del usuario.
En ese directorio existirán distintos subdirectorios, destinados a albergar los nodos de distintas redes. Por ejemplo, `bfatest` contendrá los archivos correspondietes a la red de prueba de la BFA, y `devnet` contendrá los de una red de desarrollo compuesta por un único nodo.

En esos subdirectorios, a su vez, existirá un directorio llamado `node`, que tendrá los archivos propios del nodo.

La forma más sencilla de crear esta estructura consiste en copiar el directorio `blockchain-iua` de este repositorio en el *home directory*.

Una vez que se hayan configurado los nodos, nos quedará una estructura similar a la siguiente:


```
~
└── blockchain-iua
    ├── bfatest
    │   └── node
    │       ├── geth
    │       │   ├── chaindata
    │       │   │   └── ancient
    │       │   ├── lightchaindata
    │       │   │   └── ancient
    │       │   ├── nodes
    │       │   └── triecache
    │       └── keystore
    └── devnet
        └── node
            ├── geth
            │   ├── chaindata
            │   │   └── ancient
            │   ├── lightchaindata
            │   │   └── ancient
            │   ├── nodes
            │   └── triecache
            └── keystore
```

## Configuración del nodo y ejecución del cliente

* Nodo de la BFA: Ver las instrucciones en el [README](bfatest/README.md) del directorio `bfatest`.
* Red privada: Ver las instrucciones en el [README](devnet/README.md) del directorio `devnet`