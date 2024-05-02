# Ballot

El contrato `BallotFactory`  implementa la interface `Registry` definida en `Ballot.sol`, permite crear instancias del contrato `Ballot` provisto, y brinda cierta información sobre los contratos creados.

## Contratos

### El contrato `Ballot`

Este contrato modela el proceso de votación de una propuesta. La propuesta se expresa como una `string` que se pasa como parámetro del constructor. El constructor recibe además un segundo parámetro que corresponde a la dirección del _organizador_ de la votación.

Los votantes pueden votar a favor o en contra de esa propuesta mediante el método `vote`, que recibe un único argumento de tipo `bool`. Invocar el método con el valor `true` equivale a votar a favor de la propuesta, y hacerlo con el valor `false` equivale a votar en contra.

#### Eventos

##### `event VotingStarted(uint blockNumber, uint numVoters)`

Se lanza cuando el organizador habilita el comienzo de la votación. Reporta el número de bloque en el que comenzó la votación, y la cantidad de votantes habilitados.

##### `event VotingEnded(uint blockNumber, uint yes, uint no)`

Se lanza cuando finaliza el período de votación, de acuerdo con las condiciones estipuladas en cada contrato.

#### Métodos

##### `function proposal() public view returns (string memory)`

Devuelve una `string` que representa la propuesta provista en el constructor.

##### `function numVoters() public view returns (uint)`

Devuelve la cantidad de votantes habilitados para votar.

##### `function voterAddress(uint index) public view returns (address)`

Devuelve la dirección de un votante habilitado, con 0 <= _index_ < `numVoters()`. El orden de los votantes es aquel en el que fueron habilitados por el organizador mediante el método `giveRightToVote()`.

##### `function register() public`

Permite que un votante manifieste su intención de votar, y lo registra.

* Sólo puede ser invocada por votantes no registrados.
* Sólo se puede invocar antes de que comience la votación.

##### `function giveRightToVote(address voter) public`

Habilita a un votante ya registrado a votar.

* Sólo puede ser invocada por el organizador.
* Sólo se puede invocar antes de que comience la votación.
* Sólo se puede habilitar a votantes registrados.

##### `function canVote(address voter) public view returns (bool)`

Devuelve verdadero si la dirección corresponde a un votante habilitado y falso en caso contrario.

##### `function start() public`

Habilita el comienzo de la votación.

* Sólo puede ser invocada por el organizador.
* Sólo puede ser llamada una vez.
* Invoca el método `votingStarted()` de la factoría que creó esta votación. Esto significa que si el contrato no fue creado por una factoría que implemente la interface `Registry`, el método va a fallar.

##### `function started() public view returns (bool)`

Devuelve verdadero si la votación ha comenzado, y falso en caso contrario.

##### `function end() public`

Cierra la votación.

* Sólo puede ser invocada por el organizador.
* Sólo puede ser invocada si la votación ya ha comenzado.
* Sólo puede ser llamada una vez.
* Invoca el método `votingEnded()` de la factoría que creó esta votación. Esto significa que si el contrato no fue creado por una factoría que implemente la interface `Registry`, el método va a fallar.

##### `function ended() public view returns (bool)`

Devuelve verdadero si la votación ha terminado, y falso en caso contrario.

##### `function vote(bool option) public`

Emite un voto. Para votar a favor de la propuesta se pasa el argumento `true`, y un voto en contra se indica con el argumento `false`.

* Sólo pueden votar los votantes habilitados.
* Sólo se puede votar una vez.
* Sólo se puede votar después del comienzo de la votación y antes de la finalización.

##### `function hasVoted(address voter) public view returns (bool)`

Devuelve verdadero si el votante ya ha votado y falso en caso contrario.

##### `function hasRegistered(address voter) public view returns (bool)`

Devuelve verdadero si el votante se ha registrado y falso en caso contrario.

##### `function votedFor(address voter) public view returns (bool)`

Devuelve verdadero si el votante votó en forma positiva, y falso en caso contrario.

* Sólo se puede llamar si el votante ya ha votado.

##### `function result() public view returns (uint yes, uint no)`

Devuelve dos enteros, con la cantidad de votos a favor (`yes`) y la cantidad de votos en contra (`no`).

#### Errores

Los contratos producen los siguientes errores:

* Cuando alguien que no es el organizador intenta realizar una actividad reservada al mismo:
  * `"Solo el organizador puede llamar a esta función"`
* Cuando se realiza una acción que requiere que la votación haya comenzado y eso no ha ocurrido:
  * `"La votación no ha comenzado"`
* Cuando se realiza una acción que requiere que la votación no haya comenzado, y eso ya ha ocurrido:
  * `"La votación ya ha comenzado"`
* Cuando se realiza una acción que requiere que la votación no haya terminado, y eso ya ha ocurrido:
  * `"La votación ya ha terminado"`
* Cuando se realiza una acción que requiere que el votante no esté habilitado, y ya lo está:
  * `"El votante ya podía votar"`
* Cuando se realiza una acción que requiere que el votante esté habilitado, y no lo está:
  * `"No tiene derecho a votar"`
* Cuando se realiza una acción que requiere que el votante no haya votado, y ya lo hizo:
  * `"El votante ya votó"`
* Cuando se realiza una acción que requiere que el votante haya votado, y no lo hizo:
  * `"El votante aún no ha votado"`
* Cuando se realiza una acción que requiere que el votante no se haya registrado, y ya lo hizo:
  * `"El votante ya se ha registrado"`
* Cuando se realiza una acción que requiere que el votante se haya registrado, y no lo hizo:
  * `"El votante no se ha registrado"`

### La interface `Registry`

Esta interface requiere que se implementen los siguientes métodos:

#### `function votingStarted() external`

Esta función es invocada por el contrato `Ballot` para indicar que la votación ha comenzado.

#### `function votingEnded() external`

Esta función es invocada por el contrato `Ballot` para indicar que la votación ha finalizado.

### El contrato `BallotFactory`

La factoría crea instancias del contrato `Ballot` y almacena información sobre su estado. Se asume que el contrato puede estar en uno de tres estados:

* `created`:
  * El contrato ha sido creado, pero la votación no ha comenzado.
  * Se pueden registrar votantes.
  * El organizador puede dar derecho a votar a votantes registrados.
* `running`:
  * La votación ha comenzado.
  * Los votantes registrados pueden votar.
* `ended`:
  * La votación ha terminado.
  * Sólo se pueden consultar resultados.

#### Métodos

##### `function create(string memory proposal) public returns (address ballot)`

Esta función crea una votación (es decir una instancia del contrato `Ballot`) pasándole la propuesta `proposal` y el emisor del mensaje como argumentos del constructor. Devuelve la dirección del contrato creado.

##### `function createdCount() public view returns (uint)`

Devuelve la cantidad de contratos creados por la factoría que están en el estado `created`.

##### `function created(uint index) public view returns (address ballot)`

Devuelve el contrato que está en la posición `index` de la lista de contratos creados.

##### `function runningCount() public view returns (uint)`

Devuelve la cantidad de contratos creados por la factoría que están en el estado `running`.

##### `function running(uint index) public view returns (address ballot)`

Devuelve el contrato que está en la posición `index` de la lista de contratos que han comenzado y no han terminado.

##### `function endedCount() public view returns (uint)`

Devuelve la cantidad de contratos creados por la factoría que han finalizado.

##### `function ended(uint index) public view returns (address ballot)`

Devuelve el contrato que está en la posición `index` de la lista de contratos que han terminado.

##### `function createdByCount(address creator) public view returns (uint)`

Devuelve la cantidad de contratos creados por la factoría en representación de `creator` (en cualquier estado).

##### `function createdBy(address creator, uint index) public view returns (address ballot)`

Devuelve el contrato que está en la posición `index` de la lista de contratos creados en representación de `creator` (en cualquier estado).

##### `function lastBy(address creator) public view returns (address ballot)`

Devuelve el último contrato creado en representación de `creator`. Es equivalente a llamar a `createdBy(creator, index)` con `index` igual a `createdByCount(creator) - 1`.
