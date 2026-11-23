// Minimal ABI encoding for the two factory calls, plus return decoding.
//
// No ABI library is installed (no installs without his tap), so the
// encoding is hand-rolled and verified byte-for-byte against
// `cast calldata` output for the same inputs. If this file changes,
// re-run that comparison before shipping.
//
// LaunchParams field order is the struct order in LaunchTypes.sol.
// The two string fields are dynamic: head slots hold offsets, data
// lives in the tail. Everything else is one 32-byte word per field.

import {
    DISTRIBUTION_FACTORY,
    HOOK_CERTIFICATE_FACTORY,
    SELECTORS,
} from './tressConfig';
import { rpcCall, wordAt, hexToBigInt } from './rpc';

function hexWord(big) {
    const v = BigInt(big);
    if (v < 0n) throw new Error('Negative value cannot be ABI encoded as unsigned.');
    return v.toString(16).padStart(64, '0');
}

function checkAddress(address, label) {
    if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error(`${label} must be a 0x address.`);
    }
    return address.toLowerCase().replace(/^0x/, '');
}

function encUint(value, label) {
    return hexWord(value);
}

function encSmallUint(value, bits, label) {
    const v = BigInt(value);
    const max = (1n << BigInt(bits)) - 1n;
    if (v < 0n || v > max) throw new Error(`${label} is out of range for uint${bits}.`);
    return hexWord(v);
}

function encAddress(address, label) {
    return checkAddress(address, label).padStart(64, '0');
}

function encBool(value) {
    return hexWord(value ? 1n : 0n);
}

function encBytes32(hex, label) {
    if (typeof hex !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(hex)) {
        throw new Error(`${label} must be 32 bytes of hex.`);
    }
    return hex.replace(/^0x/, '').toLowerCase();
}

function encString(value, label) {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${label} must not be empty.`);
    }
    const bytes = new TextEncoder().encode(value);
    const length = hexWord(BigInt(bytes.length));
    let data = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const remainder = data.length % 64;
    if (remainder !== 0) data += '0'.repeat(64 - remainder);
    return { length, data };
}

// The tuple encoding: 24 head slots, then the string tails.
export function encodeLaunchParams(p) {
    const name = encString(p.name, 'Name');
    const symbol = encString(p.symbol, 'Symbol');
    const headBytes = 24 * 32;
    const nameOffset = headBytes;
    const symbolOffset = headBytes + 32 + name.data.length / 2;

    const head = [
        hexWord(BigInt(nameOffset)),
        hexWord(BigInt(symbolOffset)),
        encUint(p.totalSupply, 'Total supply'),
        encAddress(p.creator, 'Creator'),
        encAddress(p.quoteAsset, 'Quote asset'),
        encSmallUint(p.poolFeeTier, 24, 'Pool fee tier'),
        encUint(p.volumeThresholdQuote, 'Volume threshold'),
        encUint(p.usdGate, 'USD gate'),
        encSmallUint(p.lockMode, 8, 'Lock mode'),
        encUint(p.lockDurationSeconds, 'Lock duration'),
        encSmallUint(p.lpFeeMode, 8, 'LP fee mode'),
        encSmallUint(p.vestingBps, 16, 'Vesting share'),
        encSmallUint(p.airdropBps, 16, 'Airdrop share'),
        encSmallUint(p.liquidityBps, 16, 'Liquidity share'),
        encAddress(p.vestingBeneficiary, 'Vesting beneficiary'),
        encUint(p.vestingCliffSeconds, 'Vesting cliff'),
        encUint(p.vestingDurationSeconds, 'Vesting duration'),
        encBytes32(p.airdropMerkleRoot, 'Airdrop Merkle root'),
        encAddress(p.liquidityAllocation, 'Liquidity allocation'),
        encBool(p.quoteIsCurrency0),
        encUint(p.walletCapAmount, 'Wallet cap amount'),
        encUint(p.walletCapBlocks, 'Wallet cap window'),
        encUint(p.maxSwapQuoteAmount, 'Max swap amount'),
        encUint(p.maxSwapBlocks, 'Max swap window'),
    ];

    return (
        head.join('') +
        name.length +
        name.data +
        symbol.length +
        symbol.data
    );
}

export function encodeDeployCalldata(params) {
    return SELECTORS.deploy + hexWord(32n) + encodeLaunchParams(params);
}

export function encodeLaunchCalldata(part1Address, params) {
    return (
        SELECTORS.launch +
        encAddress(part1Address, 'Part 1 factory') +
        hexWord(64n) +
        encodeLaunchParams(params)
    );
}

// DistributionResult: token, locker, vestingVault, airdropDistributor.
export function decodeDistributionResult(hex) {
    const a = (i) => `0x${wordAt(hex, i).slice(26)}`.toLowerCase();
    return { token: a(0), locker: a(1), vestingVault: a(2), airdropDistributor: a(3) };
}

// LaunchResult: token, locker, vestingVault, airdropDistributor,
// hookCore, hook, certificateId, poolId.
export function decodeLaunchResult(hex) {
    const a = (i) => `0x${wordAt(hex, i).slice(26)}`.toLowerCase();
    return {
        token: a(0),
        locker: a(1),
        vestingVault: a(2),
        airdropDistributor: a(3),
        hookCore: a(4),
        hook: a(5),
        certificateId: hexToBigInt(wordAt(hex, 6)),
        poolId: wordAt(hex, 7),
    };
}

// Dry runs: eth_call the exact transaction before the wallet signs.
// A revert here means the params would fail on chain, so the user
// learns it before paying gas. No state changes. No broadcast.
export async function dryRunDeploy(params, from, valueWei) {
    const data = encodeDeployCalldata(params);
    const payload = await rpcCall('eth_call', [
        { to: DISTRIBUTION_FACTORY, from, data, value: `0x${BigInt(valueWei).toString(16)}` },
        'latest',
    ]);
    return decodeDistributionResult(payload.result);
}

export async function dryRunLaunch(part1Address, params, from) {
    const data = encodeLaunchCalldata(part1Address, params);
    const payload = await rpcCall('eth_call', [
        { to: HOOK_CERTIFICATE_FACTORY, from, data },
        'latest',
    ]);
    return decodeLaunchResult(payload.result);
}
