# Trabajo práctico 8

## Consigna

Implemente una interface web para la API realizada en el trabajo práctico anterior. Deben implementarse al menos las siguientes funcionalides:

* Listado de llamados vigentes.
* Registro de propuestas en un llamado.
* Verificación de la existencia de un registro en un llamado.

La interface puede desarrollarse utilizando cualquier herramienta o lenguaje, pero debe permitir un despliegue sencillo.

### Listado de llamados vigentes

Deberán listarse los llamados existentes, según sean provistos por la API, y permitirse la selección de un llamado para registro y verificación de propuestas.

No es necesario implementar la gestión de llamados, puede asumirse que los mismos fueron creados previamente por algún otro medio.

### Registro de propuestas

Debe permitirse el registro de propuestas en un llamado. El usuario debe poder subir un archivo, al cual se le debe calcular el hash SHA-256. Ese hash debe ser registrado como propuesta en el llamado.

La interface sugerida es similar al mecanismo de [sello de tiempo de la BFA](https://bfa.ar/sello2#/). Para ello puede analizarse el código existente en el [repositorio](https://gitlab.bfa.ar/blockchain/tsa2)

Deben manejarse adecuadamente todos los errores devueltos por la API.

### Verificación de propuestas

Debe permitirse la verificación de propuestas en un llamado. El usuario debe poder subir un archivo, al cual se le debe calcular el hash SHA-256. Ese hash se utilizará para determinar si la propuesta ha sido registrada.

Al igual que en el punto anterior, se sugiere utilizar una interface similar a la usada en el sello de tiempo de la BFA.

Deben manejarse adecuadamente todos los errores devueltos por la API.
