# Pearls — Token Deployment Platform Concept v0.3

Date: 2026-10-06 · Status: concept only — no builds, nothing deployed

*Revision note: v0.2 added the revenue model. v0.3 locks the name and brand direction — his decision 2026-10-06.*

## Brand (locked)

- **Name:** Pearls
- **Tagline:** "There's power in Pearls."
- **Theme:** ocean — deep water, undersea wildlife.
- **Mark:** a clam adorning an iridescent pearl.
- **Palette** *(sparks, his call)*: abyssal ink (deep ocean blue-black), nacre gradient (the iridescent rose–aqua–violet shift of real pearl), sand, foam white.
- **Narrative** *(sparks)*: a pearl forms when an oyster coats an irritant in nacre, layer by layer — no shortcuts. Pressure makes pearls. Every launch on Pearls earns its pearl: the launch certificate *is* the pearl — the verifiable, layered record of a fair launch.
- **Voice:** plain-language, precise, oceanic without cheese. His register.

## 1. The idea in one paragraph

Pearls is a fair-launch token deployment platform on Base — fully configurable (supply, distribution, vesting, airdrops, lock duration, quote asset, fee tier, launch protections), every choice locked at deploy time and printed on a plain-language launch certificate: the pearl each launch earns. **Free to launch. Priced to win.** No platform cut until a project crosses $10M in cumulative volume — then a small, fixed, disclosed 0.3% per transaction. There's power in Pearls.

## 2. Why build it

- **Control, kept.** The manual deploy he's doing for SPINE becomes reusable infrastructure.
- **Differentiation.** His tokens don't use Bankr; Pearls doesn't copy OpenLaunch's fixed shape.
- **Trust as product.** Verifiable fairness you can check, not trust — with a revenue model that doesn't compromise it.
- **Decision 2026-10-12 (his): SPINE deploys manually, not dogfooded on Pearls.** Pearls gets built after SPINE's manual launch, and SPINE's manual deploy becomes the blueprint for Pearls' v1 contracts.

## 3. Design principles

1. **Configured at launch, immutable after.** Every parameter set in the single launch transaction. No admin keys, no setters, no upgrades.
2. **Every choice is public.** All parameters emitted as events; the frontend renders the launch certificate — the pearl.
3. **No hidden extraction.** Every fee fixed at launch, disclosed on the certificate, and **zero until the project crosses $10M in cumulative volume**.
4. **Boring contracts.** Minimal audited patterns in the money path; complexity in the frontend.
5. **Money-compatible defaults.** 0% transfer tax default; frictionless movement.

## 4. Architecture

**Contracts** (Solidity + Foundry):

- **LaunchFactory** — one `launch(params)` transaction. Deploys token, creates the Uniswap v4 pool *with the VolumeGate hook*, funds configured modules, locks the remainder. Permissionless.
- **LaunchToken** — ERC-20 + permit. No mint, no pause, no blacklist, no transfer tax. Immutable metadata.
- **LaunchLocker** — holds the LP position NFT. Forever (default) or timed, on-chain. No early path exists.
- **VestingVault** — optional creator/team allocation, transparent linear vesting + cliff, immutable. Unused = zero.
- **AirdropDistributor** — **paid add-on (flat fee)**. Merkle-root airdrops for participation rewards; root published at launch, claims trustless.
- **LaunchGuard / CoinGuard** — the protection product line:
  - *Launch-time guards* (configured at launch): per-wallet caps for first N blocks, max transaction size at open. Public parameters.
  - *CoinGuard ongoing support* (subscription): sniper/monitoring alerts, holder analytics, incident support. Recurring revenue, off-chain delivery.
- **VolumeGate hook** — minimal Uniswap v4 hook on the pool: tracks cumulative volume in quote-asset terms (no oracle); below $10M = 0% protocol fee, at/above = 0.3% of each swap to the platform treasury. Immutable, no admin.

**Frontend + indexer** (Next.js + Postgres):

- Guided launch flow with plain-language trust implications per choice, fee schedule shown before launch.
- **Launch certificate — the pearl.** Supply, distribution, lock terms, vesting, authorities renounced, fee tier, volume-gated fee schedule. Shareable, checkable.
- Holders & trust panel: holder count, top-10, creator holdings/sells, sniper activity, locked share, cumulative volume vs. the $10M gate.

## 5. The trust model — revenue without breaking trust

- The fee cannot be raised later, the threshold cannot move, both on the certificate.
- Clanker takes 1% from trade one, 60% to the protocol, forever. Pearls takes 0% until $10M, then 0.3%. Same sentence, no contest.
- Add-ons opt-in, priced upfront, never required to launch.
- Verified, open-source (MIT), no admin keys — plus third-party audit pre-mainnet.

## 6. What you get vs. OpenLaunch

| | OpenLaunch | Pearls |
|---|---|---|
| Distribution | 100% to pool, fixed | Configurable: vesting vault, merkle airdrops, or pure fair |
| Lock | Forever only | Forever (default) or timed, on-chain |
| Launch protections | None | Opt-in guards + CoinGuard ongoing support |
| Transparency | Facts panel | Launch certificate — the pearl |
| Platform fee | Zero, always | **Zero until $10M volume, then 0.3% (fixed, disclosed)** |
| Paid modules | None | Airdrop flat fee, CoinGuard tiers |
| Audit | Tests + Slither only | Third-party audit pre-mainnet |
| Admin keys | None | None |

## 7. Revenue model — three lines

1. **Add-on modules.** Airdrop campaigns (flat fee), CoinGuard support tiers (recurring). Optional, upfront.
2. **Volume-gated protocol fee.** 0.3% per transaction above $10M cumulative volume → platform treasury.
3. **Base launch: free, forever.** The top of the funnel. The platform only earns when its launches win.

## 8. Security posture

- Testnet first (Base Sepolia); mainnet only after third-party audit with published report. VolumeGate hook gets its own audit scope.
- Bug bounty from day one of mainnet.
- Slither + Foundry fuzz + adversarial fork tests as the floor.
- No admin keys anywhere.

## 9. v1 scope — and explicitly not v1

**v1:** factory, token, locker, vesting vault, airdrop module (paid), launch guards + CoinGuard, VolumeGate hook, certificate + trust panel, Base mainnet.
**Not v1:** bonding curves, presales/IDOs, cross-chain, governance modules, fiat on-ramps.

## 10. Regulatory posture (brief, honest)

Neutral infrastructure; creators own their launches' compliance. Plain-language disclosures, no endorsement, no custody. The operator can't intervene — that's the design. Get counsel's read on the treasury fee before mainnet.

## 11. Open decisions (his)

1. Airdrop flat fee: amount; per-campaign vs per-launch.
2. CoinGuard packaging and pricing.
3. Confirm the $10M gate definition (concept: cumulative quote-asset volume) and the 0.3% rate.
4. Fee recipient: platform treasury — multisig signers and threshold.
5. Timed locks: offer them, or forever-only?
6. Brand: palette lock, clam-and-pearl mark design (his eye, not mine).
7. Audit firm and budget before mainnet.
8. ~~Does SPINE launch on Pearls (dogfood), or stay fully manual with Pearls built after?~~ **Decided 2026-10-12: SPINE deploys manually; Pearls built after.**

## 12. What "done" looks like (concept phase)

- This concept reviewed and corrected by him.
- Then, only on his word: technical spec → testnet → audit → mainnet. Nothing deployed until he says so.
