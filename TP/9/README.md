# Trabajo Práctico 9

Este trabajo implica una modificación y extensión de los trabajos prácticos 6, 7 y 8.
El proyecto debe incluir tres componentes principales:

* Un conjunto de *smart contracts*, ubicados en el subdirectorio `contracts`. Dicho subdirectorio debe tener la estructura de un proyecto `truffle` y debe ser posible desplegar todos los contratos relevantes ejecutando simplemente `truffle deploy`. Los contratos deben satisfacer como mínimo las especificaciones del Práctico 6 y pasar todos los casos de prueba.
* API REST, que satisfaga las especificaciones del práctico 7, y situada en el directorio `api`.
Deben proveerse las instrucciones necesarias para desplegar y ejecutar el servidor que provee la API.

* Interface web, en el directorio `ui`. Deben proveerse las instrucciones para desplegar y ejecutar el servidor que provee esta interface.

Puede usarse una estructura de directorios diferente si las herramientas utilizadas así lo requieren. En este caso se deberá indicar claramente en qué directorio se encuentra cada uno de los tres componentes.

## Descripción general

Debe proveerse un sistema de gestión de llamados a presentación de propuestas, con los criterios utilizados en los prácticos 6, 7 y 8.
Pueden modificarse tanto los contratos como la API para proveer las funcionalidades requeridas. Si se agregan nuevos métodos o *endpoints* se deberá proveer lo siguiente:

* Documentación que especifique funcionalidad, argumentos, valores devueltos y condiciones de error, ya sea como comentarios en el código o en el `README.md` correspondiente.
* Casos de prueba

### Funcionalidades mínimas requeridas

La interface web deberá permitir:

* Listar los llamado correspondientes a un cierto creador.
* Presentar propuestas en forma anónima.
* Verificar el registro de una propuesta

Además, si el usuario cuenta con Metamask, y está conectado a la red en la que están desplegados los contratos, este usuario debe poder:

* Registrarse para crear llamados.
* Presentar propuestas asociadas a su cuenta.

Si el usuario con Metamask es el dueño de la factoría, debe poder:

* Listar los pedidos de registro
* Autorizar los pedidos de registro

Un usuario con Metamask que está registrado debe poder:

* Crear llamados

Puede encontrarse un ejemplo del uso de Metamask en la carpeta [`ejemplos/metamask`](../../ejemplos/metamask/) del repositorio.

