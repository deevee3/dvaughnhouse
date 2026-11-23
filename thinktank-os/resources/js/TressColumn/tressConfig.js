// Canonical constants for the Tress Column logged-in build.
//
// One source for the new code. This module never imports the older
// resources/js/TressColumn/contracts.js, so a clean checkout of the
// branch builds. Addresses and selectors below were verified live
// against Base Sepolia on Nov 17, 2026 (cast call / cast sig against
// the deployed sources in pearls-buildout-2026-10-23).
//
// No color values live here. Colors live only in tress-tokens.css.
// The dropped modeled-LP figure appears nowhere in this build.

export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';
export const CHAIN_HEX = '0x14a34';
export const EXPLORER_BASE = 'https://sepolia.basescan.org';

export const DISTRIBUTION_FACTORY =
    '0x458CfD3df75Af034C1218412E8F2489F9e9C9289';
export const HOOK_CERTIFICATE_FACTORY =
    '0x41422D19640660fb85739394b110C02622b397F9';
export const LAUNCH_CERTIFICATE =
    '0xD32F1F5B18B6419CeeEe0eEDE2f74DbbF035dC84';
export const TREASURY_SAFE =
    '0xC0132b5782F129c6d552c6aB725D2341349a084d';
export const POOL_MANAGER =
    '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';
export const DEPLOY_BLOCK = 56205845;

// Quote assets, verified live Nov 17, 2026: name, symbol, and decimals
// read from each contract on Base Sepolia.
export const WETH_SEPOLIA = '0x4200000000000000000000000000000000000006';
export const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const QUOTE_ASSETS = [
    { address: WETH_SEPOLIA, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    { address: USDC_SEPOLIA, symbol: 'USDC', name: 'USDC', decimals: 6 },
];

// Quoter and router: canonical Base Sepolia deployments, proven on a
// fork across all four direction cases (BUILD-OUT-REPORT section 1.3
// and 5.3). NOT WIRED. No pool exists to quote against, so no quote
// code runs. Recorded here so the wiring step starts from the verified
// addresses instead of a fresh search.
export const V4_QUOTER = '0x4A6513c898fe1B2d0E78d3b0e0A4a151589B1cBa';
export const UNIVERSAL_ROUTER = '0x8702463e73f74d0b6765aBceb314Ef07aCb92650';
export const QUOTE_SOURCE_WIRED = false;

// Fee rule, locked at inception. Pre-gate 0 bps, post-gate 30 bps,
// quote asset only. The crossing swap pays no fee.
export const PRE_GATE_FEE_BPS = 0;
export const POST_GATE_FEE_BPS = 30;
export const VOLUME_GATE_USD = 10_000_000;
export const USD_GATE_UNITS = 10000000n * 1000000n; // 10,000,000e6, display anchor
export const MIN_TIMED_LOCK_DAYS = 180;
export const MIN_TIMED_LOCK_SECONDS = 180 * 24 * 3600;
export const AIRDROP_CAMPAIGN_FEE_WEI = 19400000000000000n; // 0.0194 ETH flat

// Routing markup, non-Tress-Column swaps only. Locked Nov 15, 2026
// at 5 bps (0.05%). No hardcoded fee value anywhere in the
// swap path: the ticket reads this constant. No swap executes yet
// (no quote source is wired), so nothing is charged today; the
// rate is disclosed here and in the ticket before any execution.
export const ROUTING_MARKUP_BPS = 5;

export const TC_HOOK_FLAGS = '0x00CC';
export const LOAD_TIMEOUT_MS = 30000;
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%
export const DEFAULT_DEADLINE_MINUTES = 20;

// Fee tiers the factory accepts, with canonical tick spacing
// (LaunchValidation.tickSpacing). Any other tier reverts on chain.
export const FEE_TIERS = [
    { fee: 100, tickSpacing: 1 },
    { fee: 500, tickSpacing: 10 },
    { fee: 3000, tickSpacing: 60 },
    { fee: 10000, tickSpacing: 200 },
];

// Function selectors, verified with cast sig Nov 17, 2026.
export const SELECTORS = {
    deployed: '0xf905c15a',
    distributed: '0xf84b903e',
    treasury: '0x61d027b3',
    certificate: '0x2dbf7b98',
    nextLaunchId: '0x979bd9cc',
    factory: '0xc45a0155',
    recordOf: '0x55d742e4',
    launched: '0xd03915b2',
    cumulativeVolumeQuote: '0x6383d3a4',
    volumeThresholdQuote: '0xdcfe1815',
    feeActive: '0xe39e165a',
    feeBps: '0x24a9d853',
    totalFeesQuote: '0x0edf49b8',
    quoteFee: '0xd765642d',
    ownerOf: '0x6352211e',
    getThreshold: '0xe75235b8',
    deploy: '0x0a9aa91e',
    launch: '0xc8203287',
    name: '0x06fdde03',
    symbol: '0x95d89b41',
    decimals: '0x313ce567',
    balanceOf: '0x70a08231',
    totalSupply: '0x18160ddd',
    part1Token: '0xfc0c546a',
    part1Locker: '0xd7b96d4e',
    part1VestingVault: '0xa5917baf',
    part1AirdropDistributor: '0xd0a93173',
    part1DeployTimestamp: '0x607ad0d7',
    part1LiquidityAllocation: '0xabd653d7',
    walletCapAmount: '0xb26651ce',
    walletCapBlocks: '0xa4a65ed1',
    capActive: '0xad8d8dd2',
    maxSwapQuoteAmount: '0x42e4a067',
    maxSwapBlocks: '0xb45ce354',
    hasPosition: '0x75a6a7a9',
    positionCollection: '0xe6c86638',
    positionTokenId: '0xceefe5d1',
    vaultBeneficiary: '0x38af3eed',
    vaultCliffSeconds: '0x8341ee72',
    vaultDurationSeconds: '0x9acba2af',
    vaultStartTime: '0x78e97925',
    vaultTotalAllocation: '0x79203dc4',
    distributorMerkleRoot: '0x2eb4a7ab',
};

// Event topics (topic 0), verified with cast sig-event Nov 17, 2026.
export const TOPICS = {
    launched: '0x632da754a73d699c5a33ebb173ea51f9876c433765e987d45a48599083c52f11',
    certificateMinted: '0xcf2d740e03191b52dbb7ff9bde5d62fe2455c2fd34f432f402e27951dd6d26e7',
    distributed: '0xf334dc3327c53a5f7fd39f983cbad4306ff127f0ecdadf23c6f361eca5358c32',
    swapRecorded: '0x3a36a823b0a9ffbff20b293bc8495722201f2c1ddb5c36008caae3b20b2facef',
    gateCrossed: '0x5defa7e739d6b44a882be0b077e3ebad08c61483d04ee6bf8bd0e60b1a2441f5',
    poolSwap: '0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f',
};

// Plus+ tiers, locked. Copied verbatim from the committed
// resources/js/TressColumn/contracts.js (HEAD), the locked source.
// Monthly only. Passes buy tools, sight, and time. Nothing a pass
// unlocks touches a contract, a lock, a fee, or anyone else's launch.
export const PLUS_TIERS = {
    SAPPHIRE: {
        name: 'Sapphire',
        priceMonthly: 7,
        target: 'Trader',
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        features: [
            'Pure Tress Column market feed',
            'Airdrop Claim Radar & batch claimer',
            'Whale & LP lock tracking alerts',
        ],
    },
    EMERALD: {
        name: 'Emerald',
        priceMonthly: 27,
        target: 'Creator',
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        features: [
            'Creator workbench & launch staging',
            'No-code Merkle airdrop snapshot builder',
            'Scout analytics & live trust widget',
            'Watchtower alerts & lock countdowns',
            'Vanity certificate URLs',
        ],
    },
    RUBY: {
        name: 'Ruby',
        priceMonthly: 97,
        target: 'Studio',
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        features: [
            '1 free AirdropDistributor deploy/month (via rebate)',
            'Citadel 24/7 automated monitoring',
            'Full historical snapshot exports',
            'Priority incident response support',
            'Abyssal Gold Studio verification seal',
        ],
    },
};

// PROVISIONAL freshness windows. NOT DECIDED. His approval is pending
// (PRD Q4 residuals, Nov 17). One config spot on purpose: when he
// picks the windows, they change here and nowhere else. Any figure
// older than its window carries a stale label with its as-of time.
// Do not present these values as decided.
export const FRESHNESS_WINDOWS_MS = {
    gateProgress: 60000,
    launchList: 120000,
    safeBalance: 120000,
    activity: 120000,
    tokenMeta: 300000,
    part1Status: 60000,
};

export function explorerAddress(address) {
    return `${EXPLORER_BASE}/address/${address}`;
}

export function explorerTx(hash) {
    return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerToken(address) {
    return `${EXPLORER_BASE}/token/${address}`;
}
