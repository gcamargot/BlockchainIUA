# Uso de claves privadas locales y firma de transacciones

Cuando trabajamos en la consola de `geth`, podemos enviar ether de una cuenta a otra con el método `eth.sendTransaction()`:

```js
> eth.sendTransaction({from: eth.accounts[0], to: eth.accounts[1], value: 1})
"0xc30ae3650b64877a6df01ca84471814bd39736a549635077faa6c067e91d4456"
```

En este ejemplo estamos transfiriendo entre dos cuentas *alojadas en el nodo*. Las correspondientes claves privadas están en el *keystore*. 

La cuenta de destino puede no estar en el nodo, pero la de origen debe estar disponible:

```js
> eth.sendTransaction({from: eth.accounts[0], to: "b3a34d94be07edb67454dcfe767881a686f8b5f7", value: web3.toWei(1,"ether")})
"0xdb3cb65b7235e66585b365dee34c7aefaaf64bde4f8e42b4dc33b12b565b20f2"
> eth.getBalance("b3a34d94be07edb67454dcfe767881a686f8b5f7")
1000000000000000000
> eth.sendTransaction({from: "b3a34d94be07edb67454dcfe767881a686f8b5f7", to: eth.accounts[1], value: web3.toWei(1,"ether")})
Error: unknown account
	at web3.js:6365:9(39)
	at send (web3.js:5099:62(29))
	at <eval>:1:20(16)
```

Además, antes de poder utilizarla es necesario hacer un *unlock* de la cuenta:

```js
> eth.getBalance(eth.accounts[2])
999978999000000000
> eth.sendTransaction({from: eth.accounts[2], to: eth.accounts[0], value: 1000})
Error: authentication needed: password or unlock
	at web3.js:6365:9(39)
	at send (web3.js:5099:62(29))
	at <eval>:1:20(15)
> personal.unlockAccount(eth.accounts[2])
Unlock account 0x56e62e963b329bf10d5b4e9da8cc70d02c834aa5
Passphrase: 
true
> eth.sendTransaction({from: eth.accounts[2], to: eth.accounts[0], value: 1000})
"0xcc5fabe9cc6661ca26100f06e5d7bea2b3b024c5f4acb491676544ebab73af84"
```

Este procedimiento puede ser adecuado si tenemos un nodo local, completamente bajo nuestro control. Pero si utilizamos un nodo controlado por alguien más, no es factible, ya que si colocamos nuestras claves en el nodo, quien lo controla tiene también control sobre nuestras claves.

En ese caso, debemos trabajar con *claves privadas locales*. Las claves no están en el nodo, sino en nuestro poder, y las utilizamos para firmar transacciones, las cuales son enviadas posteriormente a un nodo.

Los pasos son:

1. Contar con la clave privada
2. Construir una transacción
3. Firmar la transacción con nuestra clave privada
4. Enviar la transacción

## Extracción de la clave privada de un archivo de geth

Existen distintas forma de crear y almacenar una clave privada, pero veremos la forma de obtener, desde Python con `web3`, la clave privada almacenada en un archivo creado por `geth account new`.

```python
filename = 'UTC--...a45f2e9'
password = '...'
with open(filename) as f:
  encrypted_key = f.read()
private_key = w3.eth.account.decrypt(encrypted_key, password)
```

## Construcción de la transacción

Cuando usamos `eth.sendTransaction()` en la consola, le pasamos como argumento un objeto que tiene sólo tres campos: `from`, `to` y `value`, y el método provee los valores restantes. Sin embargo, cuando armamos una transacción para firmar, debemos proveer todos los valores necesarios:

* `from`: La cuenta de origen
* `to`: La cuenta de destino
* `value`: El monto que queremos transferir
* `gas`: La cantidad de gas que estamos dispuestos a gastar. Si la transacción es simplemente una transferencia de ether, 21000 es un valor adecuado.
* `gasPrice`: El precio que estamos dispuestos a pagar por el gas. Como este es un valor dinámico, existen distintas estrategias posibles para calcularlo. Una estrategia posible es preguntarle al nodo (`w3.eth.gas_price`).
* `nonce`: Un valor único para cada transacción, que corresponde a las transacciones ya realizadas por la cuenta de origen. Podemos obtenerlo con `w3.eth.get_transaction_count(address)`.
* `chainId`: Este valor se requiere para que no se pueda reutilizar la transacción firmada en una cadena distinta. Podemos obtenerlo con `w3.eth.chain_id`.

Ejemplo:

```python
transaction = {
    'from': address,
    'to': to,
    'value': amount,
    'gas': 21000,
    'gasPrice': w3.eth.gas_price,
    'nonce': w3.eth.get_transaction_count(address),
    'chainId': w3.eth.chain_id
}
```

## Firma de la transacción
Podemos firmar la transacción con la clave privada obtenida anteriormente de la siguiente manera:

```python
signed = w3.eth.account.sign_transaction(transaction, private_key = private_key)
```

## Envío de la transacción
Para enviar la transacción, utilizamos `send_raw_transaction()`:

```python
tx = w3.eth.send_raw_transaction(signed.rawTransaction)
receipt = w3.eth.wait_for_transaction_receipt(tx)
if receipt['status']:
    print(f'Transacción confirmada en el bloque {receipt.get("blockNumber")}')
else:
    print('Transferencia fallida', file=stderr)
```