#!/usr/bin/env python3
"""Transfiere fondos de una cuenta de la que se dispone la clave privada a otra
cuenta arbitraria."""

import argparse
import sys
from getpass import getpass

import requests
from eth_account import Account
from web3 import Web3
from web3.exceptions import CannotHandleRequest
from web3.middleware import geth_poa_middleware

DEFAULT_WEB3_URI = "~/blockchain-iua/devnet/node/geth.ipc"


def ethereum_address(address: str) -> str:
    """Valida que la cadena de texto sea una dirección de Ethereum"""
    if Web3.is_address(address):
        return Web3.to_checksum_address(address)
    raise argparse.ArgumentTypeError("Invalid address")


def connect_to_node(uri: str) -> Web3:
    """Conecta a un nodo de Ethereum mediante IPC o HTTP"""
    # pylint: disable=invalid-name, redefined-outer-name
    provider = Web3.HTTPProvider if uri.startswith(
        "http://") else Web3.IPCProvider
    w3 = Web3(provider(uri))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    if w3.is_connected():
        return w3
    print("Falla al contactar el nodo", file=sys.stderr)
    sys.exit(1)


def get_private_key_from_file(filename: str) -> str:
    """Lee la clave privada de un archivo y la descifra con la contraseña ingresada"""
    try:
        with open(filename, encoding='ascii') as file:
            encrypted_key = file.read()
        return Account.decrypt(encrypted_key, getpass())
    except ValueError:
        print("Contraseña incorrecta", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as err:
        print(err, file=sys.stderr)
        sys.exit(1)

class EthAccount:
    """Clase que representa una cuenta de Ethereum"""
    def __init__(self, private_key: str, w3: Web3):
        self.private_key = private_key
        self.w3 = w3
        self.address = w3.eth.account.from_key(private_key).address

    def transfer(self, dst_address: str, amount: int, unit: str) -> None:
        """Transfiere fondos de una cuenta a otra"""
        amount = Web3.to_wei(amount, unit)

        transaction = {
            'from': self.address,
            'to': dst_address,
            'value': amount,
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.address),
            'chainId': self.w3.eth.chain_id
        }
        transaction['gas'] = self.w3.eth.estimate_gas(transaction)
        signed = self.w3.eth.account.sign_transaction(
            transaction, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt['status']:
            print(
                f'Transacción confirmada en el bloque {receipt.get("blockNumber")}')
        else:
            print('Transferencia fallida', file=sys.stderr)


def main() -> None:
    """Función principal"""
    parser = argparse.ArgumentParser(
        description=f"""Transfiere fondos de una cuenta de la que se dispone la clave privada a otra cuenta arbitraria. Por defecto, se conecta al nodo mediante '{DEFAULT_WEB3_URI}'.""")
    parser.add_argument(
        "--uri", help="URI para la conexión con geth", default=DEFAULT_WEB3_URI)
    parser.add_argument(
        "--private-key", help="Archivo con la clave privada de la cuenta de origen", required=True)
    parser.add_argument("--to", help="Cuenta de destino",
                        type=ethereum_address, required=True)
    parser.add_argument("--amount", help="Monto a transferir",
                        type=int, required=True)
    parser.add_argument("--unit", help="Unidades en las que está expresado el monto", choices=[
                        'wei', 'Kwei', 'Mwei', 'Gwei', 'microether', 'milliether', 'ether'], default='wei')
    args = parser.parse_args()
    try:
        w3 = connect_to_node(args.uri)
        private_key = get_private_key_from_file(args.private_key)
        account = EthAccount(private_key, w3)
        account.transfer(args.to, args.amount, args.unit)
    except (FileNotFoundError, requests.exceptions.ConnectionError, CannotHandleRequest):
        print(f"Falla al contactar el nodo en  '{args.uri}'", file=sys.stderr)
        sys.exit(1)
    except ValueError as err:
        print(err, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
