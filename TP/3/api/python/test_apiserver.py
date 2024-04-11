"""Pruebas para el servidor de la API"""
from os import urandom
from typing import Tuple

import requests
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_keys.exceptions import BadSignature
from jsonschema import validate
from web3 import Web3

stamped_200_schema = {
    "type": "object",
    "properties": {
        "signer": {"type": "string"},
        "blockNumber": {
            "anyOf": [
                {"type": "number"},
                {"type": "string"}
            ]
        },
    },
    "required": ["signer", "blockNumber"]
}

stamp_201_schema = {
    "type": "object",
    "properties": {
        "transaction": {"type": "string"},
        "blockNumber": {
            "anyOf": [
                {"type": "number"},
                {"type": "string"}
            ]
        },
    },
    "required": ["transaction", "blockNumber"]
}

stamp_403_schema = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "signer": {"type": "string"},
        "blockNumber": {
            "anyOf": [
                {"type": "number"},
                {"type": "string"}
            ]
        },
    },
    "required": ["signer", "blockNumber", "message"]
}

error_4XX_schema = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
    },
    "required": ["message"]
}


SERVER = "http://127.0.0.1:5000"
APPLICATION_JSON = "application/json"


def stamped(hsh: str) -> str:
    """Devuelve la URL para consultar el estado de un hash"""
    return f"{SERVER}/stamped/{hsh}"


stamp = f"{SERVER}/stamp"


def random_hash():
    """Devuelve un hash aleatorio"""
    return f"0x{urandom(32).hex()}"


def random_invalid_hash_and_signature() -> Tuple[bytes, str]:
    """Devuelve un hash y una firma inválidos"""
    hsh = random_hash()
    message = encode_defunct(hexstr=hsh)
    while True:
        signature = urandom(65)
        if signature[-1] == b'\x1b' or signature[-1] == b'\x1c':
            continue
        try:
            Account.recover_message(message, signature = signature)
        except (ValueError, BadSignature):
            return (hsh, f"0x{signature.hex()}")

def test_invalid_mimetype():
    """Prueba que el servidor rechaza solicitudes con un Content-Type inválido"""
    response = requests.post(stamp, data={"hash": random_hash()}, timeout=2)
    assert response.status_code == 400


def test_stamped_invalid_hash():
    """Prueba que el servidor rechaza solicitudes con un hash inválido"""
    response = requests.get(stamped(1234), timeout=2)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 400
    validate(instance=response.json(), schema=error_4XX_schema)
    response = requests.get(stamped("aaaaa"), timeout=2)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 400
    validate(instance=response.json(), schema=error_4XX_schema)
    response = requests.get(stamped("0x01"), timeout=2)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 400
    validate(instance=response.json(), schema=error_4XX_schema)


def test_stamped_unstamped_hash():
    """Prueba que el servidor responde correctamente a hashes no sellados"""
    for _ in range(10):
        response = requests.get(stamped(random_hash()), timeout=2)
        assert APPLICATION_JSON in response.headers.get('Content-type')
        assert response.status_code == 404
        validate(instance=response.json(), schema=error_4XX_schema)


def test_stamped_known_hash():
    """Prueba que el servidor responde correctamente a hashes sellados conocidos"""
    hashes = [
        ('0x836a97e0ff6a85dd2746a39ed71171595759c02beda2d45d0280e0cd19ba3c34',
         '0xe694177c2576f6644Cbd0b24bE32a323f88A08D5', 10297664),
        ('0xc2b9b625616ee8d3c0b54c417dd691647d07582c92f3f9c8caf7d594915086d6',
         '0x03c1AC114AE78F3a1edFAE95E4BDE984dE69Ae2b', 10297687),
        ('0x04924fbda3a29383422efde5dfa0e03914e18080767e13935b6e130ebc847275',
         '0x313901c1B3cacbDc19D6f67D4845Bf01540Ee9A6', 10297728)
    ]
    for hash_value, signer, block_number in hashes:
        response = requests.get(stamped(hash_value), timeout=2)
        assert APPLICATION_JSON in response.headers.get('Content-type')
        assert response.status_code == 200
        response_json = response.json()
        validate(instance=response_json, schema=stamped_200_schema)
        assert response_json["signer"] == signer
        assert response_json["blockNumber"] == block_number


def test_stamp():
    """Prueba que el servidor responde correctamente a solicitudes de sellado"""
    hash_value = random_hash()
    response = requests.post(stamp, json={"hash": hash_value}, timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 201
    response_json = response.json()
    validate(instance=response_json, schema=stamp_201_schema)
    block_number = response_json["blockNumber"]
    response = requests.get(stamped(hash_value), timeout=2)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 200
    response_json = response.json()
    validate(instance=response_json, schema=stamped_200_schema)
    assert response_json["blockNumber"] == block_number
    signer = response_json["signer"]
    response = requests.post(stamp, json={"hash": hash_value}, timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 403
    response_json = response.json()
    validate(instance=response_json, schema=stamp_403_schema)
    assert response_json["blockNumber"] == block_number
    assert response_json["signer"] == signer


def test_stamp_signed():
    """Prueba que el servidor responde correctamente a solicitudes de sellado firmadas"""
    acct = Account.create(urandom(16))
    hash_value = random_hash()
    msg = encode_defunct(hexstr=hash_value)
    signed = acct.sign_message(msg)
    signature = signed.signature.hex()
    response = requests.post(
        stamp,
        json={"hash": hash_value, "signature": signature},
        timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 201
    response_json = response.json()
    validate(instance=response_json, schema=stamp_201_schema)
    block_number = response_json["blockNumber"]
    response = requests.get(stamped(hash_value), timeout=2)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 200
    response_json = response.json()
    validate(instance=response_json, schema=stamped_200_schema)
    assert response_json["signer"] == acct.address and response_json["blockNumber"] == block_number
    response = requests.post(stamp, json={"hash": hash_value}, timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 403
    validate(instance=response.json(), schema=stamp_403_schema)
    response = requests.post(
        stamp, json={"hash": hash_value, "signature": signature}, timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 403
    validate(instance=response.json(), schema=stamp_403_schema)



def test_invalid_signature():
    """Prueba que el servidor responde correctamente a firmas inválidas"""
    hash_value, signature = random_invalid_hash_and_signature()
    response = requests.post(
        stamp,
        json={"hash": hash_value, "signature": signature},
        timeout=10)
    assert APPLICATION_JSON in response.headers.get('Content-type')
    assert response.status_code == 400
    validate(instance=response.json(), schema=error_4XX_schema)
