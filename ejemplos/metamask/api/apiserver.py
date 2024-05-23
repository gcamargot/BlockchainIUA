"""Servidor de API que se conecta con un contrato de sello de tiempo"""
#!/usr/bin/env python3
import argparse
import getpass
import os
import re
import sys
import threading
from typing import Tuple

import eth_utils
from flask import Flask, json, jsonify, request
from flask_cors import CORS
from hexbytes.main import HexBytes
from web3 import Web3
from web3.middleware import geth_poa_middleware

app = Flask(__name__)
CORS(app)

DEFAULT_WEB3_URI = "http://localhost:7545"
NETWORK_ID = 5777
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
CONFIG_DIR = os.path.abspath(f"{SCRIPT_DIR}/../contracts/build/contracts")

HASH_PATTERN = re.compile(r"0x[0-9a-fA-F]{64}")


def is_valid_hash(string):
    """Valida que el hash sea una cadena hexadecimal de 32 bytes"""
    return re.match(HASH_PATTERN, string)


class Stamper:
    """Clase que se conecta con el contrato de sello de tiempo"""

    def __init__(self, provided_w3, provided_account, abi, address):
        self.web3 = provided_w3
        self.account = provided_account
        self.contract = self.web3.eth.contract(abi=abi, address=address)
        self.lock = threading.Lock()

    def get_nonce(self):
        """Obtiene el nonce para la próxima transacción"""
        return self.web3.eth.get_transaction_count(self.account.address)

    def get_error(self, receipt):
        """Obtiene el error de la transacción"""
        transaction_hash = self.web3.eth.get_transaction(
            receipt.transactionHash)
        transaction_hash = {k: v.hex() if isinstance(
            v, HexBytes) else v for (k, v) in transaction_hash.items()}
        transaction_hash['data'] = transaction_hash['input']
        try:
            self.web3.eth.call(transaction_hash, receipt.blockNumber)
            return None
        except Exception as exception:  # pylint: disable=broad-exception-caught
            return str(exception)

    def stamped(self, hash_value: str) -> Tuple[dict, str]:
        """Obtiene el sello de tiempo de un hash"""
        try:
            [signer, block_number] = self.contract.functions.stamped(
                hash_value).call()
            if block_number > 0:
                return ({"signer": signer, "blockNumber": block_number}, None)
            return (None, "Hash not found")
        except Exception as exception:  # pylint: disable=broad-exception-caught
            return (None, str(exception))

    def stamp(self, hash_value: str) -> Tuple[dict, str]:
        """Sella un hash"""
        try:
            with self.lock:
                nonce = self.get_nonce()
                transaction = self.contract.functions.stamp(hash_value).build_transaction({
                    'gas': 200000,
                    'gasPrice': w3.to_wei('1', 'gwei'),
                    'nonce': nonce,
                    'from': self.account.address,
                })
                gas = self.web3.eth.estimate_gas(transaction)
                transaction['gas'] = gas
                signed = self.account.sign_transaction(transaction)
                transaction_hash = self.web3.eth.send_raw_transaction(
                    signed.rawTransaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(
                transaction_hash)
            if receipt['status']:
                err = None
            else:
                err = self.get_error(receipt)
            return ({
                    'transaction': transaction_hash.hex(), 
                    'blockNumber': 
                    receipt.get('blockNumber')}, 
                err)
        except Exception as exception:  # pylint: disable=broad-exception-caught
            return (None, "Internal error: " + str(exception))


@app.get("/stamped/<hash_value>")
def stamped(hash_value):
    """Obtiene el sello de tiempo de un hash"""
    if is_valid_hash(hash_value):
        resp, err = stamper.stamped(hash_value)
        if not err:
            response = jsonify(resp)
            response.status_code = 200
        elif err == "Hash not found":
            response = jsonify(message=err)
            response.status_code = 404
        else:
            response = jsonify(message=err)
            response.status_code = 500
    else:
        response = jsonify(message="Invalid hash format")
        response.status_code = 400
    return response


@app.post("/stamp")
def stamp():
    """Sella un hash"""
    if request.mimetype != "application/json":
        response = jsonify(
            message=f"Invalid message mimetype: '{request.mimetype}'")
        response.status_code = 400
        return response
    req = request.json
    hash_value = req.get("hash")
    if not is_valid_hash(hash_value):
        response = jsonify(message="Invalid hash format")
        response.status_code = 400
        return response
    already_hashed, _ = stamper.stamped(hash_value)
    if already_hashed:
        response = jsonify(
            message="Hash is already stamped",
            hash=hash_value,
            signer=already_hashed["signer"],
            blockNumber=already_hashed["blockNumber"])
        response.status_code = 403
        return response
    resp, err = stamper.stamp(hash_value)
    if resp:
        if not err:
            response = jsonify(
                transaction=resp['transaction'], blockNumber=resp['blockNumber'])
            response.status_code = 201
            return response
        if "already stamped" in err:
            already_hashed, err = stamper.stamped(hash_value)
            if already_hashed:
                response = jsonify(
                    message="Hash is already stamped",
                    hash=hash_value,
                    signer=already_hashed["signer"],
                    blockNumber=already_hashed["blockNumber"])
                response.status_code = 403
                return response
        response = jsonify(
            transaction=resp['transaction'], blockNumber=resp['blockNumber'], message=err)
    else:
        response = jsonify(message=err)
    response.status_code = 500
    return response


@app.get("/contract")
def contract_address():
    """Obtiene la dirección del contrato"""
    return jsonify(address=stamper.contract.address)


class ConnectionException(Exception):
    """Excepción para cuando no se puede conectar al nodo"""


def web3_connect(uri: str) -> Web3:
    """Conecta con el nodo"""
    # pylint: disable=redefined-outer-name, invalid-name
    if uri.startswith("http://"):
        w3 = Web3(Web3.HTTPProvider(uri))
    else:
        w3 = Web3(Web3.IPCProvider(uri))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    if not w3.is_connected():
        raise ConnectionException(f"Cannot connect to {uri}")
    return w3


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Api para gestionar un sello de tiempo.")
    parser.add_argument(
        "--uri", help=f"URI para la conexión con el nodo. Default: {DEFAULT_WEB3_URI}", 
        default=DEFAULT_WEB3_URI)
    parser.add_argument("--mnemonic-file", "-p",
                        help="Archivo que contiene la frase mnemónica de genereción de cuentas")
    parser.add_argument(
        "--network-id", "-n", 
        help=f"Network Id de la red. Default: {NETWORK_ID}", 
        type=int,  
        default=NETWORK_ID)
    parser.add_argument(
        "--config-dir", "-c", 
        help=f"Directorio con información de los contratos. Default: {CONFIG_DIR}", 
        default=CONFIG_DIR)
    args = parser.parse_args()
    try:
        w3 = web3_connect(args.uri)
        if args.mnemonic_file:
            with open(args.mnemonic_file, encoding="ascii") as f:
                words = f.read().rstrip()
        else:
            words = getpass.getpass("Mnemonic: ")
        w3.eth.account.enable_unaudited_hdwallet_features()
        stamper_owner = w3.eth.account.from_mnemonic(words)
        with open(f"{args.config_dir}/Stamper.json", encoding="utf-8") as f:
            stamper_config = json.load(f)
        NETWORK_ID = str(args.network_id)
        stamper_address = stamper_config["networks"][NETWORK_ID]["address"]
        stamper_abi = stamper_config["abi"]
        deployed_hash = stamper_config["networks"][NETWORK_ID]["transactionHash"]
        if stamper_owner.address != w3.eth.get_transaction(deployed_hash)["from"]:
            sys.exit("La cuenta provista no coincide con la creadora de Stamper")
        stamper = Stamper(w3, stamper_owner, stamper_abi, stamper_address)
        app.run(debug=True)
    except eth_utils.exceptions.ValidationError:
        sys.exit("Frase inválida")
    except FileNotFoundError as e:
        sys.exit(f"{e.strerror}: '{e.filename}'")
