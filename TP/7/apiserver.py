import argparse
import json
import messages
import re

from web3 import Web3, HTTPProvider
from eth_account import Account
from eth_account.messages import encode_defunct
from datetime import datetime
from flask import Flask, request, jsonify
from os import urandom
from datetime import datetime
from pytz import timezone
from flask import make_response

app = Flask(__name__)
w3 = Web3(HTTPProvider('http://127.0.0.1:7545'))

CFPFactory_file = "../6/build/contracts/CFPFactory.json"
with open(CFPFactory_file) as f:
    cfp_factory = json.load(f)
    cfp_abi = cfp_factory['abi']
    cfp_address = cfp_factory['networks']['5777']['address']
    print("CFPFactory address: ", cfp_address)
    cfp_factory_contract = w3.eth.contract(address=cfp_address, abi=cfp_abi)



@app.post('/create')
def create():
    """
    Create a new call for proposals.
    
    This endpoint receives a JSON payload containing the necessary information to create a new call for proposals.
    The payload should include the following fields:
    - callId: The unique identifier for the call.
    - closingTime: The closing time for the call in ISO format.
    - signature: The signature of the message containing the callId and cfp_address.
    
    Returns:
    - If the request is successful, returns a JSON response with a success message and a status code of 201.
    - If the request is invalid or encounters an error, returns a JSON response with an error message and the appropriate status code.
    """
    
    if not is_valid_mimetype(request.mimetype):
        return jsonify({'message' : messages.INVALID_MIMETYPE}), 400, {"Content-Type": "application/json"}
    
    data = request.get_json()
    call_id = data['callId']
    closing_time = data['closingTime']
    signature = data['signature']
    
    if not (all(c in "0123456789abcdefABCDEF" for c in signature[2:]) and len(signature[2:]) == 130):
        return jsonify({'message': messages.INVALID_SIGNATURE}), 400, {"Content-Type": "application/json"}
    
    if not is_valid_call_id(call_id):
        return jsonify({'message': messages.INVALID_CALLID}), 400, {"Content-Type": "application/json"}
    

    try:
        closing_time = datetime.fromisoformat(closing_time)
    except ValueError:
        return jsonify({'message': messages.INVALID_TIME_FORMAT}), 400, {"Content-Type": "application/json"}
    
    message_bytes = w3.to_bytes(hexstr=cfp_address[2:] + call_id[2:])
    owner_address = w3.eth.account.recover_message(encode_defunct(message_bytes), signature=signature)
    owner_is_authorized = cfp_factory_contract.functions.isAuthorized(w3.to_checksum_address(owner_address.lower())).call()
    
    if not owner_is_authorized:
        return jsonify({'message': messages.UNAUTHORIZED}), 403, {"Content-Type": "application/json"}
    
    cfp = cfp_factory_contract.functions.calls(call_id).call()
    
    if (cfp[0] != "0x0000000000000000000000000000000000000000"):
        return jsonify({"message": messages.ALREADY_CREATED}), 403, {"Content-Type": "application/json"}

    if w3.eth.get_block("latest").timestamp >= closing_time.timestamp():
        return jsonify({'message': messages.INVALID_CLOSING_TIME}), 400, {"Content-Type": "application/json"}

    try:
        cfp_factory_contract.functions.createFor(call_id, int(closing_time.timestamp()), owner_address).transact({"from": owner.address})
    except Exception as e:
        return jsonify({"message": messages.INTERNAL_ERROR}), 500, {"Content-Type": "application/json"}

    return jsonify({"message": messages.OK}), 201, {"Content-Type": "application/json"}
    
@app.post('/register')
def register():
    """
    Register a user by validating their address and signature.

    Returns:
        A JSON response with a success message if the registration is successful,
        or an error message if there is an issue with the address, signature, or authorization process.
    """
    if not is_valid_mimetype(request.mimetype):
        return jsonify({"message": messages.INVALID_MIMETYPE}), 400, {"Content-Type": "application/json"}

    data = request.get_json()
    address = data['address']
    signature = data['signature']

    if not is_valid_address(address):
        return jsonify({"message": messages.INVALID_ADDRESS}), 400, {"Content-Type": "application/json"}

    if not (all(c in "0123456789abcdefABCDEF" for c in signature[2:]) and len(signature[2:])==130):
        return jsonify({"message": messages.INVALID_SIGNATURE}), 400, {"Content-Type": "application/json"}
    
    contract_address_bytes = w3.to_bytes(hexstr = cfp_address[2:])
    encoder = encode_defunct(contract_address_bytes)
    addressRecovered = w3.eth.account.recover_message(encoder, signature=signature)
    address = w3.to_checksum_address(address.lower())
    addressRecovered == address
    
    if addressRecovered != address:
        return jsonify({"message": messages.INVALID_SIGNATURE}), 400, {"Content-Type": "application/json"}
    
    is_authorized = cfp_factory_contract.functions.isAuthorized(w3.to_checksum_address(address.lower())).call()
    if is_authorized:
        return jsonify({"message": messages.ALREADY_AUTHORIZED}), 403, {"Content-Type": "application/json"}

    try:
        cfp_factory_contract.functions.authorize(w3.to_checksum_address(address)).transact({"from": owner.address})
    except Exception as e:
        return jsonify({"message": messages.INTERNAL_ERROR}), 500, {"Content-Type": "application/json"}

    return jsonify(message = messages.OK), 200, {"Content-Type": "application/json"}
    
@app.post('/register-proposal')
def register_proposal():
    """
    Register a proposal for a call.

    Returns:
        A JSON response indicating the success or failure of the registration.
    """
    if not is_valid_mimetype(request.mimetype):
        return jsonify({"message": messages.INVALID_MIMETYPE}), 400
    
    data = request.get_json()
    call_id = data['callId']
    proposal = data.get('proposal')
    
    if call_id is None:
        return jsonify({"message": messages.CALLID_NOT_FOUND}), 404
    
    if not is_valid_call_id(call_id):
        return jsonify({"message": messages.INVALID_CALLID}), 400
    
    cfp = cfp_factory_contract.functions.calls(call_id).call()

    if (cfp[0] == "0x0000000000000000000000000000000000000000"):
        return jsonify({"message": messages.CALLID_NOT_FOUND}), 404
    
    if not is_valid_call_id(proposal):
        return jsonify({"message": messages.INVALID_PROPOSAL}), 400
    
    with open("../6/build/contracts/CFP.json") as f:
        cfp_data = json.load(f)
        abi = cfp_data['abi']
        
        cfp_contract = w3.eth.contract(address=cfp[1], abi=abi)

    proposal_data = cfp_contract.functions.proposalData(proposal).call()
    
    if not was_cfp_created(proposal_data[0]):
        return jsonify({"message": messages.ALREADY_REGISTERED}), 403
    
    try:
        cfp_contract.functions.registerProposal(proposal).transact({"from": owner.address})
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    
    return jsonify({"message": messages.OK}), 201
    
@app.get('/authorized/<address>')
def authorized(address):
        if not is_valid_address(address):
                return make_response(jsonify({"message": messages.INVALID_ADDRESS}), 400)
        
        response_body = cfp_factory_contract.functions.isAuthorized(w3.to_checksum_address(address)).call()
        
        return make_response(jsonify({"authorized": response_body}), 200)

@app.post('/authorize/<address>')
def authorize(address):
        if not is_valid_address(address):
                return make_response(jsonify({"message": messages.INVALID_ADDRESS}), 400)
        
        is_authorized = cfp_factory_contract.functions.isAuthorized(w3.to_checksum_address(address)).call()
        if is_authorized:
                return make_response(jsonify({"message": messages.ALREADY_AUTHORIZED}), 403)
        
        try:
                cfp_factory_contract.functions.authorize(w3.to_checksum_address(address)).transact({"from": owner.address})
        except Exception as e:
                return make_response(jsonify({"message": str(e)}), 500)
        
        return make_response(jsonify({"message": messages.OK}), 200)

@app.get('/calls/<call_id>')
def get_call(call_id):
        if not is_valid_call_id(call_id):
                return make_response(jsonify({"message": messages.INVALID_CALLID}), 400)
        
        cfp = cfp_factory_contract.functions.calls(call_id).call()
        
        if (cfp[0] == "0x0000000000000000000000000000000000000000"):
                return make_response(jsonify({"message": messages.CALLID_NOT_FOUND}), 404)
        
        return make_response(jsonify({
                "creator": cfp[0],
                "cfp": cfp[1],
        }), 200)
        
@app.get('/closing-time/<call_id>')
def closing_time(call_id):
        if not is_valid_call_id(call_id):
                return make_response(jsonify({"message": messages.INVALID_CALLID}), 400)
        
        cfp = cfp_factory_contract.functions.calls(call_id).call()
        
        if (cfp[0] == "0x0000000000000000000000000000000000000000"):
                return make_response(jsonify({"message": messages.CALLID_NOT_FOUND}), 404)
        
        # Need to access the CFP contract to get more information
        with open("../6/build/contracts/CFP.json") as f:
                cfp_data = json.load(f)
                abi = cfp_data['abi']
                
                cfp_contract = w3.eth.contract(address=cfp[1], abi=abi)
                
        closing_time = cfp_contract.functions.closingTime().call()
        closing_time = datetime.fromtimestamp(closing_time, timezone("America/Argentina/Buenos_Aires"))
        
        return make_response(jsonify({"closingTime": closing_time.isoformat()}), 200)
        
@app.get("/contract-address")
def contract_address():
        return make_response(jsonify({"address": cfp_address}), 200)
        
@app.get('/contract-owner')
def contract_owner():
        return make_response(jsonify({"address": owner.address}), 200)

@app.get('/proposal-data/<call_id>/<proposal>')
def proposal_data(call_id, proposal):
    """
    Retrieves data for a specific proposal.

    Parameters:
    - call_id (str): The call ID of the proposal.
    - proposal (str): The ID of the proposal.

    Returns:
    - response (dict): A JSON response containing the proposal data, including the timestamp, sender, and block number.

    Raises:
    - HTTPException: If the call ID or proposal is invalid or not found.
    """
    if not is_valid_call_id(call_id):
        return make_response(jsonify({"message": messages.INVALID_CALLID}), 400)
    
    cfp = cfp_factory_contract.functions.calls(call_id).call()
    
    if (cfp[0] == "0x0000000000000000000000000000000000000000"):
        return make_response(jsonify({"message": messages.CALLID_NOT_FOUND}), 404)
    
    if (not is_valid_call_id(proposal)):
        return make_response(jsonify({"message": messages.INVALID_PROPOSAL}), 400)
    
    # Connect to the CFP contract to retrieve the data
    with open("../6/build/contracts/CFP.json") as f:
        cfp_data = json.load(f)
        abi = cfp_data['abi']
        
        cfp_contract = w3.eth.contract(address=cfp[1], abi=abi)

    ## Call the internal function of the contract
    proposal_data = cfp_contract.functions.proposalData(proposal).call()

    # If the proposal does not exist, return a 404
    if (proposal_data[0] == "0x0000000000000000000000000000000000000000"):
        return make_response(jsonify({"message": messages.PROPOSAL_NOT_FOUND}), 404)
    
    closing_time = datetime.fromtimestamp(proposal_data[2], timezone("America/Argentina/Buenos_Aires"))             
    return make_response(jsonify({
        "timestamp": closing_time.isoformat(),
        "sender": str(proposal_data[0]),
        "blockNumber": proposal_data[1],
    }), 200)



def was_cfp_created(cfp):
        return cfp == "0x0000000000000000000000000000000000000000"

def is_valid_mimetype(mimetype):
    return mimetype == "application/json"

def is_valid_address(address):
    return re.match(r"^0x[a-fA-F0-9]{40}$", address)

def is_valid_call_id(call_id):
    # If it's not a string or doesn't start with 0x, it's not a valid hash
    if not isinstance(call_id, str) or not call_id.startswith("0x"):
        return False
    
    # If it doesn't match the regex (alphanumeric and 64 characters), it's not a valid hash
    return re.match(r'^0x[0-9a-fA-F]{64}$', call_id)

def is_valid_mnemonic(mnemonic):
    return len(mnemonic.split()) == 12  
    
def is_valid_signature(signature, hash):
    """Validates the signature"""
    r = w3.to_int(hexstr=signature[-130:-64])
    s = w3.to_int(hexstr=signature[-64:-2])
    v = w3.to_int(hexstr=signature[-2:])
    return v == 27 or v == 28 and w3.eth.account.recover_message(encode_defunct(text=hash), signature=signature) != ""

def random_hex(length: int) -> str:
    """Genera una string hexadecimal aleatoria de la longitud dada."""
    return f"0x{urandom(length).hex()}"

def random_hash() -> str:
    """Genera un hash aleatorio."""
    return random_hex(32)
  
def random_address() -> str:
  """Genera una dirección aleatoria."""
  return random_hex(20)

if __name__ == '__main__':
  mnemonic = "release beach soul flip danger report dove million embody vast net disorder"
  parser = argparse.ArgumentParser()
  parser.add_argument('--mnemonic', help = "Seed", default=mnemonic)
  args = parser.parse_args()
  

    
  try :
    if not is_valid_mnemonic(args.mnemonic):
      raise Exception("La semilla no es válida")
    Account.enable_unaudited_hdwallet_features()

    owner = Account.from_mnemonic(args.mnemonic, account_path="m/44'/60'/0'/0/0")
    print("Owner address: ", owner.address)

    app.run(debug = True)
    
    
  except Exception as error:
    print("Se ha producido un error", error)
  