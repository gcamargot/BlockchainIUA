# Ejemplo de uso de Metamask

Este ejemplo tiene tres componentes:

* Un contrato sencillo, `Stamper`, que se comporta como sello de tiempo y está implementado en el proyecto `truffle` que reside en el directorio `contracts`.
* Una API desarrollada en Python con el *framework* Flask, que se conecta con el contrato desplegado en la red y permite realizar verificaciones y sellados en forma anónima (el sellado se realiza con una cuenta propia de la API). Reside en el directorio `api`.
* Una aplicación web, residente en el directorio `ui`, desarrollada en Javascript utilizando el *framework* Vue, y que permite interactuar con el contrato de dos formas:
    * A través de la API
    * En forma directa, si el usuario tiene instalado Metamask y una cuenta con *ether* disponible.

Cabe destacar que podría haberse utilizado otra combinación de herramientas. La API podría haberse implementado utilizando Node.js o Go, por ejemplo, y el servidor de web podría haberse desarrollado en Python o en cualquier otro lenguaje.

## Despliegue y ejecución

Los distintos programas hacen ciertas suposiciones sobre su ubicación relativa y los puertos utilizados.

### Despliegue del contrato

1. Lanzar Ganache. Se asume que Ganache escucha en el puerto 7545, su `networkId` es 5777 y su `chainId` es 1337.
2. Desplegar el contrato en Ganache con `truffle deploy`.

### Despliegue de la API

1. Instalar las dependencias

        $ pip install -r requirements.txt


2. Lanzar el servidor. Se deberá proveer en la línea de comandos la frase semilla utilizada por Ganache. Por ejemplo, si dicha frase está en el archivo `mnemonic.txt`:


        $ python3 ./apiserver.py -mnemonic mnemonic.txt


### Despliegue de la aplicación web

1. Instalar las dependencias

        $ npm i

2. Lanzar el servidor

        $ npm run serve

### Conexión con Metamask

1. Establecer cuentas con Ether en Metamask. En este caso particular, la forma más sencilla es utlizar la misma frase semilla que Ganache.
2. Conectar Metamask con Ganache, usando los siguientes datos:
    * URL para RPC: `http://localhost:7545`
    * Chain Id: `1337`
