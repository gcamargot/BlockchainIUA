#!/usr/bin/env node
import axios from 'axios'

async function rpcreq(opname, params) {
    var body = {
        jsonrpc: "2.0",
        id: 1,
        method: opname,
        params: params
    }
    let response = await axios.post(
        'http://localhost:8545',
        body
    );
    return response.data.result;
};

let blockNumber = await rpcreq('eth_blockNumber', []);
console.log(parseInt(blockNumber, 16));
