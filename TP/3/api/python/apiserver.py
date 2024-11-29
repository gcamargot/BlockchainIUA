#!/usr/bin/env python3
"""Maqueta de servidor de API REST para el Trabajo Práctico 2"""
import os
import re
from os import listdir
from hashlib import sha256
from web3 import Web3, IPCProvider
from web3.middleware import geth_poa_middleware
from eth_account.messages import encode_defunct
from getpass import getpass
import sys
import json

from flask import Flask, jsonify, request

app = Flask(__name__)

HASH_PATTERN = re.compile(r"0x[0-9a-fA-F]{64}")

# Me conecto a la red Ethereum de bfatest
try:
    geth_ipc = os.path.expanduser("~/Blockchain/blockchain-iua/bfatest/node/geth.ipc")
    web3 = Web3(Web3.IPCProvider(geth_ipc))
    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
except:
    print("No se pudo conectar a la red Ethereum")
    web3 = None
    
# Construyo el contrato a partir del archivo Stamper.json
with open('Stamper.json') as f:
    config = json.load(f)
    abi = config['abi']
    address = config['networks']['55555000000']['address']

# Se crea la instancia del contrato con los datos leidos
contract = web3.eth.contract(address=address, abi=abi)

def is_valid_hash(string):
    """Valida que el string sea un hash válido"""
    return re.match(HASH_PATTERN, string)

def is_valid_signature(signature, hash):
    """Valida que la firma sea válida"""
    # A partir de la firma obtenemos los valores de r, s y v
    r = web3.to_int(hexstr=signature[-130:-64])
    s = web3.to_int(hexstr=signature[-64:-2])
    v = web3.to_int(hexstr=signature[-2:])

    # Verificamos que el valor de v sea valido (que sea igual a 27 o 28)
    if v != 27 and v != 28:
        return False
    
    encoder = encode_defunct(text=hash)
    # Recuperamos la address del firmante a partir de la firma y el mensaje firmado
    address = web3.eth.account.recover_message(encoder, signature=signature)
    if address != "":
        return True
    return False
    
class StamperException(Exception):
    """Excepción lanzada por métodos de Stamper"""
    def __init__(self, message=""):
        self.message = message
        super().__init__(self.message)
        
class Stamper:
    """Clase que implementa el registro de hashes. Debe ser reemplazda
    por una implementación que se comunique con un nodo de Ethereum"""
    def __init__(self, address):
        self.block_number = web3.eth.block_number
        self.database = {}
        self.address = address

    def stamp(self, hash_value):
        """Registra el hash en la base de datos"""
        self.block_number += 1
        if not is_valid_hash(hash_value):
            raise StamperException("Invalid hash format")
        if hash_value in self.database:
            raise StamperException("Hash is already stamped")
        self.database[hash_value] = {"signer": self.address, "blockNumber": self.block_number}
        return sha256(f"{self.address}{self.block_number}{hash_value}".encode()).hexdigest()

    def stamped(self, hash_value):
        """Devuelve el registro de un hash o None"""
        if (is_valid_hash(hash_value) == False):
            return None
        stamped_data = contract.functions.stamped(hash_value).call()

        if stamped_data[1] == 0:
            return None
        return {"signer":stamped_data[0],"blockNumber":stamped_data[1],"message":"Hash has already been stamped"}

@app.get("/stamped/<hash_value>")
def stamped(hash_value):
    """Devuelve el registro de un hash o un mensaje de error"""
    if is_valid_hash(hash_value):
        stamped_data = stamper.stamped(hash_value)
        if stamped_data:
            response = jsonify(stamped_data)
            response.status_code = 200
        else:
            response = jsonify(message="Hash not found")
            response.status_code = 404
    else:
        response = jsonify(message="Invalid hash format")
        response.status_code = 400
    return response


@app.post("/stamp")
def stamp():
    """Registra un hash en la base de datos"""
    if request.mimetype != "application/json":
        response = jsonify(
            message=f"Invalid message mimetype: '{request.mimetype}'")
        response.status_code = 400
        return response
    
    req = request.json
    hash_value = req.get("hash")
 
    if is_valid_hash(hash_value):
        stamped_data = stamper.stamped(hash_value)
        account = web3.eth.account.from_key(private_key).address
        
        transaction_build = {
            'gas': 234480,
            'gasPrice': web3.eth.gas_price,
            'nonce': web3.eth.get_transaction_count(account),
            'chainId': web3.eth.chain_id           
        }
        signature = req.get("signature")
        
        if stamped_data:
            # Significa que el hash ya fue registrado
            response = jsonify(stamped_data)
            response.status_code = 403
        else:
            try:
                # Si existe firma, trato de estampar con la firma
                if signature:
                    print("VIENE LA FIRMA")
                    # Valido que la firma sea valida
                    if (is_valid_signature(signature, hash_value)):
                        transaction = contract.functions.stampSigned(hash_value, signature).build_transaction(transaction_build)
                    else:
                        # Si la firma no es valida
                        response = jsonify(message="Invalid signature")
                        response.status_code = 400
                        return response
                else:
                    # No viene la firma y el hash no viene registrado
                    transaction = contract.functions.stamp(hash_value).build_transaction(transaction_build)
                
                # Ya con la transaction armada, firmo y envio
                signed_transaction = web3.eth.account.sign_transaction(transaction, private_key = private_key)
                transaction_hash = web3.eth.send_raw_transaction(signed_transaction.rawTransaction)
                tx = web3.eth.get_transaction(transaction_hash)
                transaction_receipt = web3.eth.wait_for_transaction_receipt(transaction_hash)
                
                if (transaction_receipt.status != 1):
                    # La transaccion fallo
                    raise StamperException("Transaction failed")
                else:
                    # La transaccion salio todo bien
                    jsonn = {'transaction':str(transaction_hash.hex()),'blockNumber':transaction_receipt.get("blockNumber")}
                    response = jsonify(jsonn)
                    response.status_code = 201
                    response.headers["Content-Type"] = "application/json; charset=utf-8"
            except StamperException as exc:
                # Si hay un error en el registro
                response = jsonify(message=str(exc))
                response.status_code = 400
    else:
        response = jsonify(message="Invalid hash format")
        response.status_code = 400
    
    return response


if __name__ == '__main__':
    keystore_dir = os.path.expanduser("~/Library/ethereum/keystore")
    keystore = list(map(lambda f: os.path.join(
        keystore_dir, f), sorted(listdir(keystore_dir))))
    with open(keystore[0], encoding="ascii") as f:
        sender = f"0x{json.load(f)['address']}"
        sender = web3.to_checksum_address(sender)
    
    print(sender)    
    # print('Ingrese la contraseña de la cuenta (Primer cuenta de la keystore): \n')
    # password = getpass()
    password = ''
    
    # Obtengo la private key
    with open(keystore[0]) as f:
        encripted_key = f.read()
    try:
        private_key = web3.eth.account.decrypt(encripted_key, password)
    except:
        print("Contraseña incorrecta")
        sys.exit(1)
        
    stamper = Stamper(sender)
    app.run(debug=False)
