#!/usr/bin/env python3
"""Maqueta de servidor de API REST para el Trabajo Práctico 2"""
import os
import re
from os import listdir
from hashlib import sha256

from flask import Flask, json, jsonify, request

app = Flask(__name__)

HASH_PATTERN = re.compile(r"0x[0-9a-fA-F]{64}")

def is_valid_hash(string):
    """Valida que el string sea un hash válido"""
    return re.match(HASH_PATTERN, string)

class StamperException(Exception):
    """Excepción lanzada por métodos de Stamper"""
class Stamper:
    """Clase que implementa el registro de hashes. Debe ser reemplazda
    por una implementación que se comunique con un nodo de Ethereum"""
    def __init__(self, address):
        self.block_number = 0
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
        if hash_value in self.database:
            return self.database[hash_value]
        else:
            return None


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
        if stamped_data:
            response = jsonify(
                message="Hash is already stamped",
                signer=stamped_data["signer"],
                blockNumber=stamped_data["blockNumber"])
            response.status_code = 403
        else:
            try:
                transaction_hash = stamper.stamp(hash_value)
                response = jsonify(transaction=transaction_hash, blockNumber=stamper.block_number)
                response.status_code = 201
            except StamperException as exc:
                response = jsonify(message=str(exc))
                response.status_code = 400
    else:
        response = jsonify(message="Invalid hash format")
        response.status_code = 400
    return response


if __name__ == '__main__':
    keystore_dir = os.path.expanduser("~/.ethereum/keystore")
    keystore = list(map(lambda f: os.path.join(
        keystore_dir, f), sorted(listdir(keystore_dir))))
    with open(keystore[0], encoding="ascii") as f:
        sender = f"0x{json.load(f)['address']}"
    stamper = Stamper(sender)
    app.run(debug=True)
