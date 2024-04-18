import argparse
import web3
from web3 import Web3
from sys import exit, stderr
from web3.middleware import geth_poa_middleware

DEFAULT_WEB3_URI = "~/blockchain-iua/devnet/node/geth.ipc"

# Generamos el provider por IPC
web3_instance = Web3(Web3.IPCProvider(DEFAULT_WEB3_URI))
web3_instance.middleware_onion.inject(geth_poa_middleware, layer=0)

def balance(account, unit):
    """Imprime el balance de una cuenta

    :param account: La dirección de la cuenta
    :param unit: Las unidades en las que se desea el resultado. (wei, Kwei, Mwei, Gwei, microether, milliether, ether)
    """
    balance_wei = web3_instance.eth.get_balance(account)
    balance_eth = web3_instance.from_wei(balance_wei, unit)
    
    print(f"Balance de la cuenta {account}: {balance_eth} {unit.upper()}")

def transfer(src, dst, amount, unit):
    """Transfiere ether de una cuenta a otra.

    :param src: La dirección de la cuenta de origen.
    :param dst: La dirección de la cuenta de destino.
    :param amount: Monto que se desea transferir.
    :param unit: Unidades en las que está expresado el monto.
    """
    # Convierte el monto a wei
    amount_wei = web3_instance.to_wei(amount, unit)
    
    transaction = {
        'from': src,
        'to': dst,
        'value': amount_wei,
    }
    
    try:
        tx_hash = web3_instance.eth.send_transaction(transaction)
        print(f"Transferencia exitosa. Hash de transacción: {tx_hash.hex()}")
        return tx_hash
    except Exception as e:
        print(f"Error en la transacción: {e}")
        exit(1)

def accounts():
    """Lista las cuentas asociadas con un nodo"""
    accounts = web3_instance.eth.accounts
    print(accounts)       

def address(x):
    """Verifica si su argumento tiene forma de dirección ethereum válida"""
    if x[:2] == '0x' or x[:2] == '0X':
        try:
            b = bytes.fromhex(x[2:])
            if len(b) == 20:
                return x
        except ValueError:
            pass
    raise argparse.ArgumentTypeError(f"Invalid address: '{x}'")
  
def get_latest_block():
  """Obtiene el último bloque de la cadena"""
  block = web3_instance.eth.get_block('latest')
  print("===== Último bloque =====")
  print(block)
my_account = "0xec5904d1823ff545df1bd565cc407afc3c386532"
ETHER_STRING = "ether"

balance(my_account, ETHER_STRING)

print("Transferencia de 1 ether a la cuenta 0xE73603DAEb818b1dC3E71F1e00d6a77F7d48e6a4")
balance("0xE73603DAEb818b1dC3E71F1e00d6a77F7d48e6a4", ETHER_STRING)
# transfer(my_account, "0xE73603DAEb818b1dC3E71F1e00d6a77F7d48e6a4", 1, ETHER_STRING)

print("======== Cuentas registradas en el nodo ========")
accounts()