// Chain reads through the read-only relay (POST /api/tc/rpc).
//
// The browser never talks to the RPC endpoint directly. Every read
// goes through the relay, which forwards read-only methods to Base
// Sepolia and refuses everything else. Nothing in this module sends
// a transaction. Writes go through the user's own wallet only.
//
// All reads carry a 30-second timeout with a retry (PRD section 6).
// Failures surface as RpcError with a plain message the UI shows
// beside the fix.

import { LOAD_TIMEOUT_MS, SELECTORS } from './tressConfig';

export class RpcError extends Error {
    constructor(message, code = null) {
        super(message);
        this.name = 'RpcError';
        this.code = code;
    }
}

function xsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

let requestId = 1;

export async function rpcCall(method, params = [], { timeoutMs = LOAD_TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    const token = xsrfToken();
    if (token) {
        headers['X-XSRF-TOKEN'] = token;
    }
    let response;
    try {
        response = await fetch('/api/tc/rpc', {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            signal: controller.signal,
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: requestId++,
                method,
                params,
            }),
        });
    } catch (err) {
        if (err && err.name === 'AbortError') {
            throw new RpcError('The chain read timed out after 30 seconds.', 'timeout');
        }
        throw new RpcError('The chain read failed. Check the network and try again.', 'network');
    } finally {
        clearTimeout(timer);
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        throw new RpcError('The chain read failed. Check the network and try again.', 'bad-response');
    }

    if (payload && payload.error) {
        throw new RpcError(
            typeof payload.error.message === 'string'
                ? payload.error.message
                : 'The chain read failed.',
            payload.error.code ?? null,
        );
    }
    if (!response.ok) {
        throw new RpcError('The chain read failed. Check the network and try again.', 'http');
    }
    return payload;
}

export async function ethCall(to, data, block = 'latest') {
    const payload = await rpcCall('eth_call', [{ to, data }, block]);
    return payload.result;
}

export async function ethChainId() {
    const payload = await rpcCall('eth_chainId', []);
    return Number(hexToBigInt(payload.result));
}

export async function ethBlockNumber() {
    const payload = await rpcCall('eth_blockNumber', []);
    return Number(hexToBigInt(payload.result));
}

export async function ethGetBalance(address, block = 'latest') {
    const payload = await rpcCall('eth_getBalance', [address, block]);
    return hexToBigInt(payload.result);
}

export async function ethGetCode(address, block = 'latest') {
    const payload = await rpcCall('eth_getCode', [address, block]);
    return payload.result;
}

export async function ethGetTransactionReceipt(hash) {
    const payload = await rpcCall('eth_getTransactionReceipt', [hash]);
    return payload.result;
}

export async function ethGetBlockByNumber(block, fullTx = false) {
    const tag = typeof block === 'number' ? `0x${block.toString(16)}` : block;
    const payload = await rpcCall('eth_getBlockByNumber', [tag, fullTx]);
    return payload.result;
}

export async function ethGasPrice() {
    const payload = await rpcCall('eth_gasPrice', []);
    return hexToBigInt(payload.result);
}

export async function ethEstimateGas(tx) {
    const payload = await rpcCall('eth_estimateGas', [tx]);
    return hexToBigInt(payload.result);
}

// Event scan with cursor paging. The relay walks at most 25 chunks of
// 200 blocks per request and returns tress.nextFromBlock while more
// range remains. The caller caps total pages so a scan can never run
// away; an incomplete scan says so instead of pretending it finished.
export async function ethGetLogs(filter, { maxPages = 10 } = {}) {
    const logs = [];
    let fromBlock = filter.fromBlock;
    let complete = true;
    for (let page = 0; page < maxPages; page++) {
        const payload = await rpcCall('eth_getLogs', [{ ...filter, fromBlock }]);
        logs.push(...(payload.result || []));
        if (payload.tress && payload.tress.complete === false) {
            fromBlock = payload.tress.nextFromBlock;
            complete = false;
            continue;
        }
        complete = true;
        break;
    }
    return { logs, complete };
}

// --- Decoding -------------------------------------------------------

export function hexToBigInt(hex) {
    if (hex === null || hex === undefined || hex === '0x') return 0n;
    return BigInt(hex);
}

export function wordAt(hex, index) {
    const body = hex.startsWith('0x') ? hex.slice(2) : hex;
    return `0x${body.slice(index * 64, index * 64 + 64)}`;
}

export function decodeUint256(hex) {
    return hexToBigInt(wordAt(hex, 0));
}

export function decodeBool(hex) {
    return hexToBigInt(wordAt(hex, 0)) !== 0n;
}

export function decodeAddress(hex) {
    const word = wordAt(hex, 0);
    return `0x${word.slice(26)}`.toLowerCase();
}

export function decodeString(hex) {
    const body = hex.startsWith('0x') ? hex.slice(2) : hex;
    const offset = Number(BigInt(`0x${body.slice(0, 64)}`)) * 2;
    const length = Number(BigInt(`0x${body.slice(offset, offset + 64)}`));
    const data = body.slice(offset + 64, offset + 64 + length * 2);
    const bytes = new Uint8Array(data.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
}

// recordOf(uint256) returns the 19-field CertificateRecord, all static
// types, one 32-byte word per field, in struct order.
export function decodeCertificateRecord(hex) {
    const u = (i) => hexToBigInt(wordAt(hex, i));
    const a = (i) => `0x${wordAt(hex, i).slice(26)}`.toLowerCase();
    return {
        token: a(0),
        creator: a(1),
        quoteAsset: a(2),
        totalSupply: u(3),
        poolFeeTier: Number(u(4)),
        volumeThresholdQuote: u(5),
        usdGate: u(6),
        lockMode: Number(u(7)),
        unlockTime: u(8),
        lpFeeMode: Number(u(9)),
        vestingBps: Number(u(10)),
        airdropBps: Number(u(11)),
        liquidityBps: Number(u(12)),
        locker: a(13),
        vestingVault: a(14),
        airdropDistributor: a(15),
        hookCore: a(16),
        launchBlock: u(17),
        chainId: u(18),
    };
}

// Launched event: topics [sig, certificateId, token, creator], data
// holds the 11 non-indexed fields in order.
export function decodeLaunchedLog(log) {
    const data = log.data || '0x';
    const u = (i) => hexToBigInt(wordAt(data, i));
    const a = (i) => `0x${wordAt(data, i).slice(26)}`.toLowerCase();
    return {
        certificateId: hexToBigInt(log.topics[1]),
        token: `0x${log.topics[2].slice(26)}`.toLowerCase(),
        creator: `0x${log.topics[3].slice(26)}`.toLowerCase(),
        locker: a(0),
        vestingVault: a(1),
        airdropDistributor: a(2),
        hookCore: a(3),
        hook: a(4),
        quoteAsset: a(5),
        totalSupply: u(6),
        volumeThresholdQuote: u(7),
        poolFeeTier: Number(u(8)),
        tickSpacing: Number(BigInt.asIntN(256, u(9))),
        poolId: wordAt(data, 10),
        blockNumber: hexToBigInt(log.blockNumber),
        transactionHash: log.transactionHash,
    };
}

// SwapRecorded(quoteAmount, fee, cumulativeVolumeAfter), all in data.
export function decodeSwapRecordedLog(log) {
    const data = log.data || '0x';
    return {
        quoteAmount: hexToBigInt(wordAt(data, 0)),
        fee: hexToBigInt(wordAt(data, 1)),
        cumulativeVolumeAfter: hexToBigInt(wordAt(data, 2)),
        blockNumber: hexToBigInt(log.blockNumber),
        transactionHash: log.transactionHash,
    };
}

// PoolManager Swap event: topics [sig, poolId, sender], data holds
// amount0, amount1, sqrtPriceX96, liquidity, tick, fee.
export function decodePoolSwapLog(log) {
    const data = log.data || '0x';
    const signed = (i) => BigInt.asIntN(256, hexToBigInt(wordAt(data, i)));
    return {
        poolId: log.topics[1],
        sender: `0x${log.topics[2].slice(26)}`.toLowerCase(),
        amount0: signed(0),
        amount1: signed(1),
        sqrtPriceX96: hexToBigInt(wordAt(data, 2)),
        liquidity: hexToBigInt(wordAt(data, 3)),
        tick: Number(signed(4)),
        fee: Number(hexToBigInt(wordAt(data, 5))),
        blockNumber: hexToBigInt(log.blockNumber),
        transactionHash: log.transactionHash,
    };
}

// --- Convenience reads ----------------------------------------------

export async function readUint(to, selector, argData = '') {
    return decodeUint256(await ethCall(to, selector + argData));
}

export async function readBool(to, selector, argData = '') {
    return decodeBool(await ethCall(to, selector + argData));
}

export async function readAddress(to, selector, argData = '') {
    return decodeAddress(await ethCall(to, selector + argData));
}

export function encodeUintArg(value) {
    return BigInt(value).toString(16).padStart(64, '0');
}

export function encodeAddressArg(address) {
    return address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

export async function readTokenMeta(address) {
    const [nameHex, symbolHex, decimalsHex] = await Promise.all([
        ethCall(address, SELECTORS.name),
        ethCall(address, SELECTORS.symbol),
        ethCall(address, SELECTORS.decimals),
    ]);
    return {
        name: decodeString(nameHex),
        symbol: decodeString(symbolHex),
        decimals: Number(decodeUint256(decimalsHex)),
    };
}
