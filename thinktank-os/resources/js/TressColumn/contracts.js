// Tress Column — Canonical Contract Addresses & Protocol Parameters
// Network: Base Sepolia (Chain ID 84532) & Local Anvil (Chain ID 31337)

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const ANVIL_CHAIN_ID = 31337;
export const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';
export const FORK_VERIFICATION_BLOCK = 49_250_000;

// Canonical Uniswap v4 PoolManager on Base Sepolia (84532)
export const POOL_MANAGER_ADDRESS = '0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408';

// Deployed Base Sepolia Split Factories & LaunchCertificate (Block 56205845, 2026-11-08)
export const DISTRIBUTION_FACTORY_ADDRESS = '0x458CfD3df75Af034C1218412E8F2489F9e9C9289'; // Part 1 (17,984 bytes)
export const HOOK_CERTIFICATE_FACTORY_ADDRESS = '0x41422D19640660fb85739394b110C02622b397F9'; // Part 2 (17,798 bytes)
export const LAUNCH_CERTIFICATE_ADDRESS = '0xD32F1F5B18B6419CeeEe0eEDE2f74DbbF035dC84'; // ERC-721 (4,870 bytes)

// TCHook permission flags: BEFORE_SWAP | AFTER_SWAP | BEFORE_SWAP_RETURNS_DELTA | AFTER_SWAP_RETURNS_DELTA
export const TC_HOOK_FLAGS = '0x00CC';

// Real Test Safe on Base Sepolia (created in Block 53833347, tx 0x66649425ab7aef19881364c7fce79728820894a003f64bcaf65c5ee213e8b0c0)
// Verified Test Safe Treasury on Base Sepolia (deployed & verified 2026-11-03).
// This is the treasury the Sepolia test factories use.
export const TEST_SAFE_TREASURY_ADDRESS = '0xC0132b5782F129c6d552c6aB725D2341349a084d';
export const TEST_SAFE_STATUS_LABEL =
    'Verified Test Safe Treasury on Base Sepolia (deployed & verified 2026-11-03)';

// Protocol Fee & Gate Parameters (Configured at inception, then immutable)
export const VOLUME_GATE_USD = 10_000_000; // $10M cumulative volume threshold (Platinum locked tier)
export const POST_GATE_FEE_BPS = 30; // 0.30% in quote asset only
export const PRE_GATE_FEE_BPS = 0; // 0.00% below gate
export const CROSSING_SWAP_FEE_BPS = 0; // 0.00% on the swap that crosses the gate
export const TC_POOL_TERMINAL_EXTRA_FEE_BPS = 0; // 0.00% — no additional Tress Column fee on Tress Column pools
export const MIN_TIMED_LOCK_DAYS = 180;
export const AIRDROP_CAMPAIGN_FEE_ETH = '0.0194'; // Flat per campaign (locked 2026-10-25)

// Non-Tress Column Base Token Routing Fee — LOCKED Nov 15, 2026:
// 5 bps (0.05%) on non-Tress Column Base swaps only. Single
// deliberate switch; the rate is disclosed in the ticket and on
// the terminal, never buried in a quote. No swap executes yet
// (no quote source is wired), so nothing is charged today.
export const NON_TC_ROUTING_FEE_ENABLED = true;
export const NON_TC_ROUTING_FEE_BPS = 5;
export const NON_TC_ROUTING_FEE_PROPOSED_LABEL = '0.05% (5 bps, LOCKED Nov 15, 2026 — non-Tress Column Base swaps only)';

// Launch Tier Doctrine (Platinum LOCKED 2026-11-02; Gold LOCKED 2026-11-20;
// Silver DECIDED 2026-11-20: $20K gate, ~0.58% (58 bps), no lock or burn.
// Silver was dropped from live copy per Q3 (H7) and restored on his tap
// "Add silver" 2026-11-20, which supersedes the Q3 drop rule. The map
// below renders all three tiers on the terminal and Tress Column pages.
//
// Display copy follows the Brand Guidelines PDF 2026-11-20 (canonical):
// fee immutability, exemption gate, and certificate per tier. The DECIDED
// NUMBERS below are unchanged: Platinum $10M / 0.30%, Gold $250K / 0.45%,
// Silver $20K / ~0.58%. Where the PDF matrix differs from the decided
// record, the decided record wins in display and the conflict is flagged
// for his ruling (see CONFLICTS in the rebrand report, 2026-11-20):
//   1. PDF Gold lock "24-Month Hard Lock" vs decided "Short timed lock".
//   2. PDF Silver gate "Standard fee applies from block 0" vs decided
//      $20K exemption gate.
//   3. PDF Platinum lock "Permanent / Owner Burned" vs the accepted rule
//      "Abyssal (permanent) or Timed lock >= 180 days".
// Do NOT change a gate, a rate, or a lock term here without his tap.
export const LAUNCH_TIERS = {
    PLATINUM: {
        name: 'Platinum',
        status: 'LOCKED (2026-11-02)',
        lpRequirement: 'Abyssal (permanent) or Timed lock >= 180 days',
        volumeGateUsd: 10_000_000,
        postGateFeeLabel: '0.30% in quote asset only',
        feeImmutability: 'LOCKED AT LAUNCH',
        feeExemption: 'Zero fee until $10M volume',
        certificate: 'Platinum Holographic Badge',
        isLocked: true,
    },
    GOLD: {
        name: 'Gold',
        status: 'LOCKED (2026-11-20)',
        lpRequirement: 'Short timed lock',
        volumeGateUsd: 250_000,
        postGateFeeLabel: '0.45% in quote asset only',
        feeImmutability: 'LOCKED AT LAUNCH',
        feeExemption: 'Zero fee until $250K volume',
        certificate: 'Gold Standard Certificate',
        isLocked: true,
    },
    SILVER: {
        name: 'Silver',
        status: 'DECIDED (2026-11-20)',
        lpRequirement: 'No lock or burn',
        volumeGateUsd: 20000,
        postGateFeeLabel: '~0.58% in quote asset only',
        feeImmutability: 'DECIDED AT LAUNCH',
        feeExemption: 'Zero fee until $20K volume',
        certificate: 'Basic Verification Record',
        isLocked: true,
    },
};

// Plus+ SaaS Subscription Tiers (Locked 2026-11-02, Monthly only — SaaS / Off-Chain State)
export const PLUS_TIERS = {
    SAPPHIRE: {
        name: 'Sapphire',
        priceMonthly: 7,
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        target: 'Trader',
        features: [
            'Pure Tress Column feed',
            'Airdrop Claim Radar + batch claimer',
            'Whale & LP unlock tracking',
        ],
    },
    EMERALD: {
        name: 'Emerald',
        priceMonthly: 27,
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        target: 'Creator',
        features: [
            'Creator workbench',
            'No-code Merkle snapshot builder',
            'Scout analytics + live trust widget',
            'Watchtower alerts + unlock countdowns',
            'Vanity certificate URLs',
        ],
    },
    RUBY: {
        name: 'Ruby',
        priceMonthly: 97,
        billingCycle: 'Monthly only',
        stateType: 'SaaS / Off-Chain State',
        target: 'Studio',
        features: [
            '1 free AirdropDistributor deploy/month via off-chain rebate',
            'Citadel 24/7 monitoring',
            'Full historical snapshot exports',
            'Priority incident support',
            'Abyssal Gold Studio seal',
        ],
    },
};

// Surface Hosting & Subdomain Architecture
export const APP_SURFACES = {
    LAUNCHPAD: {
        name: 'Tress Column Launchpad',
        domain: 'tc.dvaughnhouse.com',
        stagingPath: '/staging/tress-column',
    },
    TRADING_TERMINAL: {
        name: 'Trading Terminal',
        domain: 'trade.dvaughnhouse.com',
        stagingPath: '/staging/terminal',
        deploymentStatus: 'Preview ready — public deploy held for D\'Vaughn\'s approval',
    },
    OPS_CONSOLE: {
        name: 'Back Office Ops Console',
        domain: 'ops.dvaughnhouse.com',
        stagingPath: '/staging/ops-console',
        deploymentStatus: 'Preview ready behind staging gate — staff deploy held for D\'Vaughn\'s auth + preview approval',
    },
};
