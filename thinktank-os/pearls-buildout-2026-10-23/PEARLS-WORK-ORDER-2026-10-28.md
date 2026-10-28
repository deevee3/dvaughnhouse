# Pearls — Work Order for Antigravity — Wednesday, October 28, 2026

**Prepared by:** Janine, at D'Vaughn's direction
**For:** Antigravity, on the iMac
**Tree:** the thinktank-os tree on branch `pearls-buildout` (verify with `git branch --show-current` before you start — if it is not `pearls-buildout`, stop and say so)
**Toolchain:** Foundry, `~/.foundry/bin/forge`, solc 0.8.24, via_ir
**Status:** This order is self-contained for today. It restates and supersedes the 2026-10-25 pin prompt as the operative instruction — the ground truth below stands, the task list here is the one to follow. The 2026-10-23 pin-fix prompt is VOID and must not be followed.

---

## Why this, why now

Pearls is the fair-launch token deployment platform on Base — and D'Vaughn's answer to the capital-raising wave: teams raise through a fair mechanism instead of an insider round, rules fixed at inception, claims attested before anyone wires money. That positioning is the work now. But none of it is verifiable until the hook compiles against the real Uniswap v4.0.0 release. Today's job is that prerequisite and nothing else: Phase 0, the true v4.0.0 pin.

## Today's task — Phase 0: the true v4.0.0 pin

**1. Install the true v4.0.0 lib.**
Replace the contents of `lib/v4-core` with the v4.0.0 tag (`e50237c43811bd9b526eff40f26772152a42daba`). Update `foundry.lock` so `lib/v4-core` reads tag `v4.0.0`, rev `e50237c43811bd9b526eff40f26772152a42daba`. Leave `lib/v4-periphery` untouched unless the build proves otherwise — if you touch it, report it.

**2. Fix the imports for v4.0.0.**
In all 5 files listed below, import `SwapParams` / `ModifyLiquidityParams` from `@uniswap/v4-core/src/interfaces/IPoolManager.sol` instead of `types/PoolOperation.sol`. Fix any other v4.0.0 API differences the compiler surfaces (e.g. `BeforeSwapDelta` / `Hooks` locations) with minimal changes only — no redesign, no behavior change. If any test or hook logic depended on post-v4.0.0 API behavior, say so explicitly in the report instead of silently adapting it.

Files: `src/IPearlHook.sol`, `src/PearlHook.sol`, `src/PearlHookCore.sol`, `test/PearlHook.t.sol`, `test/PearlHookRouterFork.t.sol`.

**3. Re-verify everything against the true pin.**
`forge build` clean, then the full suite: forge tests, Halmos, Slither (0 High / 0 Medium), token-list tests. Report the EXACT counts you get — do not assume a number. Counts on record differ (59 forge tests claimed 2026-10-25 vs 53 on 2026-10-27); report your actual count and list any test that passed against the main snapshot but fails against true v4.0.0 as a finding with the failing output. Never weaken a test to make it pass.

**4. Correct the record.**
In `BUILD-OUT-REPORT.md` §1.1 and §4.2: state the true pin (`v4.0.0 @ e50237c`), retract the "59d3ecf" claim, and record that the earlier "pin restoration" addendum was incorrect (the lib was never updated). No other report claims change.

**5. Commit and push on branch `pearls-buildout`.**
A fix that is live but uncommitted is not done. Commit and push on the branch where it runs.

## Ground truth (verified, do not re-derive — build on it)

- The Uniswap v4-core release tag **`v4.0.0` = commit `e50237c43811bd9b526eff40f26772152a42daba`** (2025-01-21).
- In true v4.0.0, `SwapParams` and `ModifyLiquidityParams` live in **`src/interfaces/IPoolManager.sol`**. The file `src/types/PoolOperation.sol` **does not exist** in v4.0.0.
- `59d3ecf53afa9264a16bba0e38f4c5d2231f80bc` is a **May 2025 main-branch commit** ("bump to 1.0.2"), NOT the v4.0.0 tag. The installed `lib/v4-core` is that main snapshot — it differs from the v4.0.0 tag in 22 files.
- The code as committed **does not compile against true v4.0.0** (proven: `forge build` fails in the 5 files above). No document may claim the hook is complete until the fork-test matrix passes against the true pin.
- The aggregator work (commit `958dccb`) is real and passing, but it was verified against the main snapshot, not a release. Do not repeat the "v4.0.0 @ 59d3ecf" claim anywhere.

## Locked rules — D'Vaughn's decisions, not yours to change

If anything below looks wrong, surface it in your report. Do not remove, rename, relabel, or "fix" it on your own.

- **Fee doctrine, frozen:** the fee is configured at inception per launch, then immutable forever. No platform fee until $10M cumulative volume; above the gate, 0.30% in quote asset only (WETH/USDC); the crossing swap pays no fee; the gate is fixed in quote units at deploy (no swap-time oracle). Tier 1 Patient (locked/burned LP): $10M gate / 0.30%. Tier 3 Uncommitted (no lock): $20K gate / ~0.58% modeled — exact figure unconfirmed, do not hard-code it as locked.
- **No admin keys, no owner, no setters, no pause, no proxy, no upgrade path.** Core contracts have none and gain none.
- **Do not change fee constants, the $10M gate, or lock minimums to make tests pass.** If a design point seems wrong, flag it in the report.
- **Testnet/local only.** Never point anything at mainnet. Deployment anywhere — including Sepolia — is D'Vaughn's explicit call, not part of today's work. `script/Deploy.s.sol` is hard-gated to Base Sepolia (84532) and local Anvil (31337); do not touch that gate.
- **Canonical tree untouched.** `~/workspace/your_files/pearls/` (Janine's canonical copy) stays untouched — sync is D'Vaughn's call.
- **Naming, everywhere including code comments and variable names:** Pearls, always plural. The gold colour and Studio seal are Abyssal Gold. Never use: "sovereign", "ventures", or "institute" for Glenride. User-facing copy never says "AI" — users get help from "the Assistant". (This work order is internal; the rule binds anything user-facing you write.)
- **Honest status, always:** nothing is claimed as live, deployed, audited, or counted until it is. No fabricated testimonials, stats, or endorsements. No document may claim the hook is complete until the fork-test matrix passes against the true pin.

## Non-goals for today

No deploy. No Sepolia rehearsal. No mainnet. No Phase 1 hook-completion work (that starts on the next order, after Phase 0 is independently verified). No changes to fee invariants, guard windows, lock minimums, or the aggregator work's design. No canonical-tree edits. No landing-page work (the full redo is already live at pearls.dvaughnhouse.com).

## Report back (required, in BUILD-OUT-REPORT.md)

- The proof of the installed lib (blob hashes of `lib/v4-core/src/interfaces/IPoolManager.sol` and `lib/v4-core/src/PoolManager.sol` vs the tag) and the corrected `foundry.lock` entry.
- Exact test counts from your run (forge, Halmos, Slither, token-list) and any finding where the true pin changed a result.
- The corrected report sections (§1.1, §4.2).
- Remaining gaps, if any.

Janine independently re-verifies all of it (blob-hash vs the tag + full suite re-run) before anything is reported to D'Vaughn as sound. Report findings; do not soften them.

## Definition of done for today

- `forge build` clean against true v4.0.0.
- Full suite re-run with exact counts reported, no weakened tests.
- Report sections corrected, commit pushed on `pearls-buildout`.
- Nothing deployed, nothing claimed beyond what the run proves.
