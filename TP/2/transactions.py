#!/usr/bin/env python3
"""Este programa muestra las transacciones ocurridas en un determinado rango de bloques,
eventualmente restringidas a las que corresponden a una o más direcciones.
Sólo deben considerarse las transacciones que implican transferencia de ether.
Los bloques analizados son todos aquellos comprendidos entre los argumentos first-block
y last-block, ambos incluidos.
Si se omite first-block, se comienza en el bloque 0.
Si se omite last-block, se continúa hasta el último bloque.
Se pueden especificar una o más direcciones para restringir la búsqueda a las transacciones
en las que dichas direcciones son origen o destino.
Si se especifica la opción add, cada vez que se encuentra una transacción que responde a
los criterios de búsqueda, se agregan las cuentas intervinientes a la lista de direcciones
a reportar.
La opción "--short" trunca las direcciones a los 8 primeros caracteres.
La salida debe producirse en al menos los dos formatos siguientes:
'plain': <origen> -> <destino>: <monto> (bloque)
'graphviz': Debe producir un grafo representable por graphviz. Ejemplo (con opcion --short)
digraph Transfers {
"8ffD013B" -> "9F4BA634" [label="1 Gwei (1194114)"]
"8ffD013B" -> "9F4BA634" [label="1 ether (1194207)"]
"9F4BA634" -> "8ffD013B" [label="1 wei (1194216)"]
"8ffD013B" -> "46e2a9e9" [label="2000 ether (1195554)"]
"8ffD013B" -> "8042435B" [label="1000 ether (1195572)"]
"8042435B" -> "8ffD013B" [label="1 ether (1195584)"]
"8ffD013B" -> "55C37a7E" [label="1000 ether (1195623)"]
"8ffD013B" -> "fD52f36a" [label="1000 ether (1195644)"]
}
"""
import argparse
from web3 import Web3, IPCProvider
from web3.middleware import geth_poa_middleware
from web3.exceptions import BlockNotFound

def address(x):
    """Verifica si su argumento tiene forma de direccion ethereum valida"""
    if x[:2] == '0x' or x[:2] == '0X':
        try:
            b = bytes.fromhex(x[2:])
            if len(b) == 20:
                return x
        except ValueError:
            pass
    raise argparse.ArgumentTypeError(f"Invalid address: '{x}'")

def format_address(address, short):
    """Formatea una direccion ethereum"""
    if short:
        return address[:10] + "..."
    else:
        return address

if __name__ == '__main__':
    DEFAULT_WEB3_URI = "~/blockchain-iua/devnet/node/geth.ipc"
    parser = argparse.ArgumentParser()
    parser.add_argument("addresses", metavar="ADDRESS", type=address, nargs='*', help="Direcciones a buscar")
    parser.add_argument("--add",help="Agrega las direcciones encontradas a la busqueda", action="store_true", default=False)
    parser.add_argument("--first-block", "-f", help="Primer bloque del rango en el cual buscar", type=int, default=0)
    parser.add_argument("--last-block", "-l", help="Ultimo bloque del rango en el cual buscar", type=int, default="latest")
    parser.add_argument("--format", help="Formato de salida", choices=["plain","graphviz"], default="plain")
    parser.add_argument("--short", help="Trunca las direcciones a los 8 primeros caracteres", action="store_true")
    parser.add_argument("--uri", help=f"URI para la conexion con geth",default=DEFAULT_WEB3_URI)
    args = parser.parse_args()

    w3 = Web3(IPCProvider(args.uri))
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)

    addresses = set(args.addresses)
    
    try:
        # Itero desde el primer bloque hasta (el ultimo bloque provisto por args (last_block) o el ultimo bloque existente)
        for block_number in range(args.first_block, w3.eth.block_number + 1 if args.last_block == "latest" else (args.last_block + 1 if args.last_block < w3.eth.block_number else w3.eth.block_number + 1)):
            block = w3.eth.get_block(block_number, full_transactions=True)
            for transaction in block.transactions:
                # Convierto el transaction['to'] a minusculas para que coincida con las direcciones en addresses
                if transaction['to'].lower() in addresses or transaction['from'].lower() in addresses or args.add:
                    if args.format == "plain":
                        print(f"{format_address(transaction['from'], args.short)} -> {format_address(transaction['to'], args.short)}: {w3.from_wei(transaction['value'], 'ether')} ether (bloque {block_number})")
                    elif args.format == "graphviz":
                        print(f'"{format_address(transaction["from"], args.short)}" -> "{format_address(transaction["to"], args.short)}" [label="{w3.from_wei(transaction["value"], "ether")} ether (bloque {block_number})"]')
                    if args.add:
                        addresses.add(transaction['from'])
                        addresses.add(transaction['to'])
    except BlockNotFound as e:
        print(f"Block not found: {e}")
    except Exception as e:
        print(f"There was an error: {e}")