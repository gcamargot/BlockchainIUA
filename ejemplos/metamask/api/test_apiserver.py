"""Casos de prueba para el servidor de API de Stamper.sol"""
from os import urandom

import requests
from jsonschema import validate

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


def stamped_url(hsh):
    """ Devuelve la URL para obtener el sello de tiempo de un hash"""
    return f"{SERVER}/stamped/{hsh}"


stamp_url = f"{SERVER}/stamp"


def random_hash():
    """ Devuelve un hash aleatorio"""
    return f"0x{urandom(32).hex()}"


def test_invalid_mimetype():
    """Prueba que el servidor responda correctamente a un mensaje con un mimetype inválido"""
    response = requests.post(stamp_url, data={"hash": random_hash()}, timeout=10)
    assert response.status_code == 400


def test_stamped_invalid_hash():
    """Prueba que el servidor responda correctamente a un mensaje con un hash inválido"""
    response = requests.get(stamped_url(1234), timeout=3)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 400)
    validate(instance=response.json(), schema=error_4XX_schema)
    response = requests.get(stamped_url("aaaaa"), timeout=3)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 400)
    validate(instance=response.json(), schema=error_4XX_schema)
    response = requests.get(stamped_url("0x01"), timeout=3)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 400)
    validate(instance=response.json(), schema=error_4XX_schema)


def test_stamped_unstamped_hash():
    """Prueba que el servidor responda correctamente a un mensaje con un hash no sellado"""
    for _ in range(10):
        response = requests.get(stamped_url(random_hash()), timeout=3)
        assert (APPLICATION_JSON in response.headers['Content-type'])
        assert (response.status_code == 404)
        validate(instance=response.json(), schema=error_4XX_schema)


def test_stamp():
    """Prueba que el servidor responda correctamente a un mensaje de sellado"""
    hash_value = random_hash()
    response = requests.post(stamp_url, json={"hash": hash_value}, timeout=10)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 201)
    response_dict = response.json()
    validate(instance=response_dict, schema=stamp_201_schema)
    block_number = response_dict["blockNumber"]
    response = requests.get(stamped_url(hash_value), timeout=3)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 200)
    response_dict = response.json()
    validate(instance=response_dict, schema=stamped_200_schema)
    assert (response_dict["blockNumber"] == block_number)
    signer = response_dict["signer"]
    response = requests.post(stamp_url, json={"hash": hash_value}, timeout=10)
    assert (APPLICATION_JSON in response.headers['Content-type'])
    assert (response.status_code == 403)
    response_dict = response.json()
    validate(instance=response_dict, schema=stamp_403_schema)
    assert (response_dict["blockNumber"] == block_number)
    assert (response_dict["signer"] == signer)
