# Pearls — Token Deployment Platform Concept v0.7 (redline draft)

**Provenance:** v0.6 drafted with Gemini, pasted by D'Vaughn 2026-10-21 for Janine's evaluation; this v0.7 is Janine's redline draft (2026-10-21) applying that evaluation. Supersedes v0.3 (launchpad-concept.md) as the current concept text.
**What v0.7 changes:** (1) `Sovereign Gold` → `Abyssal Gold` throughout — "sovereign" is on his banned-language list for his brands; standing-rule fix, applied. (2) Decision 9 flagged — the SPINE-first sequence contradicts SPINE's parked status (2026-10-17); recommended resolution included, **needs his re-call**. (3) v1 scope split proposed — contract core now, Plus+/CoinGuard suite as fast-follow; **needs his approval**. (4) The Clanker comparison line flagged as perishable — refresh before any public use.

**Date:** 2026-10-21 · **Status:** redline draft — concept locked at v0.6; v0.7 locks on his word (no builds, nothing deployed)

**Revision note:** v0.2 added the revenue model. v0.3 locked the name and brand direction (2026-10-06). v0.4 unified `PearlHook` and locked Decisions 1–5. v0.5 locked the final brand palette (white, cream, gold, orange, black), the zero-cost audit strategy, the `0.0194 ETH` airdrop fee, and the `$7 / $27 / $97` CoinGuard tiers. v0.6 adds **Pearls Plus+** (Trader Pass + Creator Studio Upgrade) as the fourth revenue line (2026-10-21). v0.7 (this draft): banned-word fix + annotated judgment calls from Janine's evaluation.

---

### Brand (locked)

* **Name:** Pearls
* **Tagline:** *"There's power in Pearls."*
* **Theme:** ocean — deep water, undersea wildlife.
* **Mark:** a clam adorning an iridescent pearl.
* **Palette (his lock, 2026-10-21):**
* **Pearl White (`#FAF9F6`):** primary canvas, clean breathing room.
* **Nacre Cream (`#F5EFE6`):** the Launch Certificate surface — warm, organic pearl sheen.
* **Abyssal Gold (`#D4AF37`):** certificate seals, "Abyssal Lock" badges, Pearls Plus+ Studio marks.
* **Signal Orange (`#FF6B2B`):** primary action buttons, volume-gate progress bar, active alerts.
* **Abyssal Black (`#0D0E11`):** sharp typography, certificate framing, and structural contrast.

* **Narrative:** a pearl forms when an oyster coats an irritant in nacre, layer by layer — no shortcuts. Pressure makes pearls. Every launch on Pearls earns its pearl: the launch certificate is the pearl — the verifiable, layered record of a fair launch.
* **Voice:** plain-language, precise, oceanic without cheese. His register.

---

### 1. The idea in one paragraph

Pearls is a fair-launch token deployment platform on Base — fully configurable (supply, distribution, vesting, airdrops, lock duration, LP fee routing, quote asset, fee tier, launch protections), every choice locked at deploy time and printed on a plain-language launch certificate: the pearl each launch earns. Free to launch. Priced to win. No platform cut until a project crosses $10M in cumulative volume — then a small, fixed, disclosed 0.3% per transaction, taken strictly in the quote asset so Pearls never holds or sells a project's token. There's power in Pearls.

---

### 2. Why build it

* **Control, kept.** The manual deploy he's doing for SPINE becomes reusable infrastructure.
* **Differentiation.** His tokens don't use Bankr; Pearls doesn't copy OpenLaunch's fixed shape.
* **Trust as product.** Verifiable fairness you can check, not trust — with a revenue model that doesn't compromise it.
* **Decision 2026-10-12 (his):** SPINE deploys manually, not dogfooded on Pearls. Pearls gets built after SPINE's manual launch, and SPINE's manual deploy becomes the blueprint ("Pearl #0") for Pearls' v1 contracts and certificate UI.

---

### 3. Design principles

1. **Configured at launch, immutable after.** Every parameter set in the single launch transaction. No admin keys, no setters, no upgrades.
2. **Every choice is public.** All parameters emitted as events; the frontend renders the launch certificate — the pearl.
3. **No hidden extraction.** Every fee fixed at launch, disclosed on the certificate, and zero until the project crosses $10M in cumulative volume. When active, the 0.3% fee is taken strictly in the quote asset (WETH/USDC) — Pearls never dumps the launched token.
4. **Boring contracts.** Minimal audited patterns in the money path; zero swap-time oracle dependencies; complexity stays in the frontend.
5. **Money-compatible defaults.** 0% transfer tax default; frictionless movement.

---

### 4. Architecture

#### Contracts (Solidity + Foundry)

* **`LaunchFactory`** — one `launch(params)` transaction. Deploys `LaunchToken`, converts the $10M volume threshold into fixed quote-asset units at deploy time, creates the Uniswap v4 pool with the unified `PearlHook`, funds configured modules, and locks the LP position. Permissionless.
* **`LaunchToken`** — ERC-20 + permit. No mint, no pause, no blacklist, no transfer tax. Immutable metadata. Enforces optional launch-time **per-wallet holding caps** directly inside `_update(from, to, value)` for the first N blocks (where `to` is guaranteed to be the end-user wallet). Once `block.number > launchBlock + N`, the cap check becomes permanently inactive.
* **`LaunchLocker`** — holds the Uniswap v4 LP position NFT. **Forever ("Abyssal Lock", default)** or **Timed (180-day minimum floor)**, on-chain. No early withdrawal path exists for principal. Creator locks their choice for standard accrued LP fees at deploy: **Creator Claimable** (`collectFees()` only, principal stays locked) or **Dead / Compounded**.
* **`VestingVault`** — optional creator/team allocation, transparent linear vesting + cliff, immutable. Unused = zero.
* **`AirdropDistributor`** — paid add-on (`0.0194 ETH` flat fee per campaign — 3% below the `0.02 ETH` industry average; discounted/bundled for Pearls Plus+ Studio members). Merkle-root airdrops for participation rewards; can be deployed at launch or post-launch; claims trustless.
* **`LaunchGuard` / `CoinGuard`** — the project-level protection product line:
* **On-chain Launch Guards (free, configured at launch):** per-wallet holding caps for the first N blocks (in `LaunchToken`) and max swap size for the first N blocks (in `PearlHook`).
* **CoinGuard ongoing support ($7 / $27 / $97 monthly tiers per token):** Scout ($7/mo analytics & trust widget), Watchtower ($27/mo sniper/whale alerts & unlock countdowns), Citadel ($97/mo 24/7 monitoring, snapshot exports, incident support, and certificate badge).

* **`PearlHook` (unified `VolumeGate` + `LaunchGuard` hook)** — a single minimal, immutable Uniswap v4 hook attached to the pool:
* Enforces max transaction size for the first N blocks after launch.
* Tracks cumulative volume in the quote asset against a fixed integer threshold set at deploy time (zero oracle calls during swaps).
* Below threshold = 0% protocol fee; at/above threshold = 0.3% of each swap deducted strictly from the quote-asset side (WETH/USDC) and routed to the platform treasury Safe. Immutable, no admin keys.

#### Frontend, Indexer & Pearls Plus+ Suite (Next.js + Postgres)

* **Guided launch flow** in the Pearl White / Nacre Cream / Gold / Orange / Black palette, with plain-language trust implications per choice and full fee schedule shown before launch.
* **Launch certificate — the pearl.** Supply, distribution, lock terms (Abyssal Gold Seal vs. Timed + exact unlock timestamp), LP fee routing, vesting, authorities renounced, pool fee tier, and the exact quote-asset volume threshold. Shareable, checkable.
* **Holders & trust panel:** holder count, top-10, creator holdings/sells, sniper activity, locked share, and live cumulative volume progress toward the $10M gate.
* **Pearls Plus+ Portal:**
* **Base Pass (Traders & Collectors):** Platform-wide "Pure Pearl" launch feed, Airdrop Claim Radar (with one-click batch claiming across all Pearls Merkle roots), and cross-platform whale/unlock tracking.
* **Studio Upgrade (Creators):** No-code Merkle snapshot generator (filters out snipers/bots), bundled monthly `AirdropDistributor` fee credits, custom vanity certificate URLs, and Abyssal Gold social preview cards.

---

### 5. The trust model — revenue without breaking trust

* The fee cannot be raised later, the threshold cannot move, and both are printed on the certificate.
* **Pearls never sells your token.** Because the 0.3% fee after $10M volume is collected strictly in the quote asset (WETH/USDC), the platform never accumulates or sells a project's token on its chart.
* **Pearls Plus+ never compromises fairness.** Membership unlocks off-chain intelligence, discovery, Merkle tooling, and airdrop fee discounts — never on-chain privileges, lock bypasses, or hidden controls.
* Clanker takes 1% from trade one, 60% to the protocol, forever. Pearls takes 0% until $10M, then 0.3% in quote asset only. Same sentence, no contest. **[Perishable — verified 2026-10-21; Clanker's v4 has since moved to configurable fees, so refresh this line before any public use.]**
* On-chain launch guards are free; paid add-ons (`0.0194 ETH` Merkle airdrops, `$7/$27/$97` CoinGuard tiers, and `$17/$47` Pearls Plus+ memberships) are opt-in, priced upfront, and never required to launch.
* Verified, open-source (MIT), no admin keys — backed by formal verification, fuzzing, and grant/community-funded security reviews pre-mainnet.

---

### 6. What you get vs. OpenLaunch

| Feature | OpenLaunch | Pearls |
| --- | --- | --- |
| **Distribution** | 100% to pool, fixed | Configurable: vesting vault, Merkle airdrops, or pure fair |
| **Liquidity Lock** | Forever only | Forever ("Abyssal Lock", default) or Timed (180-day min floor), on-chain |
| **LP Fee Routing** | Fixed | Configurable at launch: Creator Claimable or Dead/Compounded |
| **Launch Protections** | None | Free on-chain Launch Guards + CoinGuard ($7 / $27 / $97 tiers) |
| **Transparency** | Facts panel | Launch certificate — the pearl |
| **Platform Fee** | Zero, always | Zero until $10M volume, then 0.3% in quote asset (fixed, disclosed) |
| **Paid Modules & SaaS** | None | Airdrops (`0.0194 ETH`), CoinGuard (`$7/$27/$97`), **Pearls Plus+** (`$17` Base / `$47` Studio Upgrade) |
| **Security Verification** | Tests + Slither only | Slither + Aderyn + Halmos formal verification + Superchain Grant / Community Audit |
| **Admin Keys** | None | None |

---

### 7. Revenue model — four lines

1. **Add-on modules (per project / campaign).** Merkle airdrop campaigns (`0.0194 ETH` flat fee per campaign — 3% below industry average) and CoinGuard off-chain monitoring tiers (`$7/mo` Scout, `$27/mo` Watchtower, `$97/mo` Citadel). Optional, upfront.
2. **Pearls Plus+ (two-tier platform membership):**
* **Pearls Plus+ Base (Trader & Collector Pass — `$17/mo`):** Platform-wide Airdrop Claim Radar + batch claimer, real-time "Pure Pearl" filtered launch alerts, and cross-token whale/unlock tracking.
* **Pearls Plus+ Studio (Creator Upgrade — `$47/mo`):** Everything in Base + **1 free `AirdropDistributor` deploy per month** (50% off additional deploys), no-code Merkle snapshot builder (auto-filtering snipers), vanity certificate URLs, and the Gold Studio seal.
3. **Volume-gated protocol fee.** 0.3% per transaction above $10M cumulative volume, taken strictly in the quote asset → platform treasury Safe.
4. **Base launch & on-chain guards: free, forever.** The top of the funnel. The platform only earns on trade flow when its launches win.

---

### 8. Security posture ($0 out-of-pocket blueprint)

* **In-house automated & formal verification floor:** Slither + Aderyn static analysis, Foundry stateful fuzzing, and **Halmos symbolic formal verification** proving lock and fee invariants mathematically.
* **Grant & community audits pre-mainnet:** Apply for **OP Atlas / Superchain Audit Grants** and **Base Builder Grants** once deployed on Base Sepolia testnet, paired with a public community security review (e.g., CodeHawks First Flights / open-source bug hunt).
* **Dedicated `PearlHook` scope** and public security report published prior to mainnet.
* **No admin keys anywhere.**

---

### 9. v1 scope — and explicitly not v1

* **v1 (as locked in v0.6):** `LaunchFactory`, `LaunchToken`, `LaunchLocker`, `VestingVault`, `AirdropDistributor` (`0.0194 ETH`), `PearlHook`, CoinGuard (`$7/$27/$97`), Pearls Plus+ (`$17` Base / `$47` Studio Upgrade), certificate + trust panel, Base mainnet.
* **PROPOSED (needs his approval):** split v1 into **v1a contract core** — `LaunchFactory`, `LaunchToken`, `LaunchLocker`, `VestingVault`, `AirdropDistributor`, `PearlHook`, launch certificate + trust panel, Base Sepolia → mainnet — and **v1b fast-follow** — the CoinGuard off-chain tiers and the Pearls Plus+ portal (indexer, whale/unlock radar, batch claimer, snapshot engine). Rationale: the Plus+/CoinGuard suite is a second product that only has customers once launches exist; the $10M gate means protocol-fee revenue is ~zero by design, so Plus+ must follow proven launches, not precede them.
* **Not v1:** standalone L1 / appchain (reserved for future expansion once Base volume is established), bonding curves, presales/IDOs, cross-chain, governance modules, fiat on-ramps.

---

### 10. Regulatory posture (brief, honest)

Neutral infrastructure; creators own their launches' compliance. Plain-language disclosures, no endorsement, no custody. The operator can't intervene — that's the design. Get counsel's read on the treasury fee before mainnet.

---

### 11. All Decisions Locked (v0.6 Complete Log)

1. **Airdrop flat fee (Locked 2026-10-21):** **`0.0194 ETH` per campaign (Merkle root)** — 3% below the `0.02 ETH` L2 industry average (or 1 free/mo + 50% off via Pearls Plus+ Studio).
2. **CoinGuard packaging & pricing (Locked 2026-10-21):** On-chain Launch Guards = **Free**. Off-chain CoinGuard tiers = **$7/mo (Scout)**, **$27/mo (Watchtower)**, and **$97/mo (Citadel)**.
3. **Pearls Plus+ membership (Locked 2026-10-21):** Two-tier ecosystem subscription: **Base Trader/Airdrop Pass (`$17/mo`)** and **Creator Studio Upgrade (`$47/mo`)**.
4. **$10M gate & 0.3% rate mechanics (Locked 2026-10-21):** Converted to fixed quote-asset units at deploy time (zero swap-time oracle); 0.3% deducted strictly in the quote asset.
5. **Fee recipient / treasury (Locked 2026-10-21):** Safe Multisig on Base (internal signer rotation without hook admin keys).
6. **Timed vs. Forever locks (Locked 2026-10-21):** Forever ("Abyssal Lock") default; Timed Locks require a 180-day minimum floor.
7. **Brand palette (Locked 2026-10-21):** White (`#FAF9F6`), Cream (`#F5EFE6`), Gold (`#D4AF37`), Orange (`#FF6B2B`), and Black (`#0D0E11`) accents.
8. **Audit path (Locked 2026-10-21):** Zero-cost stack: Slither + Aderyn + Foundry Fuzz + Halmos formal verification, followed by Superchain/Base Audit Grants and community competitive review on Base Sepolia.
9. **SPINE execution sequence (Locked 2026-10-12):** SPINE deploys manually first ("Pearl #0"); Pearls is built afterward from SPINE's blueprint. **[RE-CALL NEEDED 2026-10-21: SPINE is parked since 2026-10-17, so this sequence no longer holds. Recommended resolution: Pearl #0 becomes a throwaway Base Sepolia testnet launch (his own contract core proving the pipeline end-to-end), and SPINE stays parked until he unparks it. If he approves, nothing else in v1 changes; if he declines, he names the new Pearl #0.]**

---

### 12. What "done" looks like (concept phase complete)

* All open concept decisions are now locked in **v0.6**.
* Next phase, only on his word: **Technical Specification → Base Sepolia Testnet → Security Review → Base Mainnet.**
