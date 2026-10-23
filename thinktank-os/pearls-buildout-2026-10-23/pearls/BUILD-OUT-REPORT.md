# Pearls — Build-Out Report

**Date:** 2026-10-23  
**Scope:** Priority 1 (`PearlHook` Uniswap v4 Integration + Spec §7.3 Base Sepolia Fork-Test Matrix) and Priority 2 (Slither + Aderyn + Halmos Verification & Triage).  
**Status:** Complete. All 50 Foundry tests (43 unit/fuzz + 7 Base Sepolia fork matrix) and all 5 Halmos symbolic proofs pass with 0 failures against the canonical `@uniswap/v4-core` `v4.0.0` release (`59d3ecf53afa9264a16bba0e38f4c5d2231f80bc`). Nothing has been deployed to any network.

---

## 1. What Was Built & Changed

### 1.1 Pinned Uniswap v4 Dependencies (`foundry.toml`, `foundry.lock`, `lib/`)
- **`lib/v4-core`**: Pinned to canonical Uniswap v4 release tag `v4.0.0` (commit `59d3ecf53afa9264a16bba0e38f4c5d2231f80bc`).
- **`lib/v4-periphery`**: Pinned to commit `3779387e5d296f39df543d23524b050f89a62917`.
- Added explicit remappings in [`foundry.toml`](./foundry.toml) (`@uniswap/v4-core/=lib/v4-core/`, `v4-core/=lib/v4-core/src/`, `v4-periphery/=lib/v4-periphery/`) and locked both commits in [`foundry.lock`](./foundry.lock).
- **Addendum (2026-10-23 — True `v4.0.0` Pin Restoration & `PoolOperation.sol` Type Alignment):**
  The initial shallow clone of `lib/v4-core` had checked out the upstream `main` branch tip (`e50237c43811bd9b526eff40f26772152a42daba`, a pre-release snapshot where `SwapParams` and `ModifyLiquidityParams` were nested inside `IPoolManager`). On 2026-10-23, `lib/v4-core` was fetched and checked out to the exact `v4.0.0` tag commit `59d3ecf53afa9264a16bba0e38f4c5d2231f80bc` (`lib/v4-periphery` confirmed at `3779387e5d296f39df543d23524b050f89a62917`), all `IPoolManager.SwapParams` / `IPoolManager.ModifyLiquidityParams` references across `src/IPearlHook.sol`, `src/PearlHook.sol`, `src/PearlHookCore.sol`, and `test/PearlHook.t.sol` were updated to import `SwapParams` and `ModifyLiquidityParams` from `@uniswap/v4-core/src/types/PoolOperation.sol`, and the entire build, unit/fuzz suite (43/43), Base Sepolia fork suite (7/7), Halmos symbolic suite (5/5), and Slither/Aderyn static analysis passes were re-verified against `59d3ecf53afa9264a16bba0e38f4c5d2231f80bc`.

### 1.2 CREATE2 Hook Permission Mining ([`src/HookMiner.sol`](./src/HookMiner.sol), [`src/PearlsConstants.sol`](./src/PearlsConstants.sol))
- Created [`src/HookMiner.sol`](./src/HookMiner.sol) to deterministically mine a CREATE2 salt whose deployed address has low 14 bits (`Hooks.ALL_HOOK_MASK = 0x3FFF`) equal to `PEARL_HOOK_FLAGS = 0x00CC`:
  - `Hooks.BEFORE_SWAP_FLAG` (`1 << 7`)
  - `Hooks.AFTER_SWAP_FLAG` (`1 << 6`)
  - `Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG` (`1 << 3`)
  - `Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG` (`1 << 2`)
- `HookMiner.find` precomputes `keccak256(bytes.concat(creationCode, constructorArgs))` once and hashes the 85-byte CREATE2 preimage in a fixed `memory-safe` scratch slot so on-chain salt mining inside `LaunchFactory.launch()` incurs zero quadratic memory expansion (~4.6M total launch gas).
- Added `BASE_SEPOLIA_POOL_MANAGER = 0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` and `PEARL_HOOK_FLAGS = 0x00CC` to [`src/PearlsConstants.sol`](./src/PearlsConstants.sol).

### 1.3 Canonical v4 Hook Adapter & Quote-Only Fee Settlement ([`src/PearlHook.sol`](./src/PearlHook.sol), [`src/IPearlHook.sol`](./src/IPearlHook.sol), [`src/PearlHookCore.sol`](./src/PearlHookCore.sol))
- Replaced the mirrored primitive callback signatures in [`src/IPearlHook.sol`](./src/IPearlHook.sol), [`src/PearlHook.sol`](./src/PearlHook.sol), and [`src/PearlHookCore.sol`](./src/PearlHookCore.sol) with canonical `@uniswap/v4-core` `v4.0.0` types (`IHooks`, `IPoolManager`, `PoolKey`, `SwapParams`, `ModifyLiquidityParams`, `BalanceDelta`, `BeforeSwapDelta`, with `SwapParams` and `ModifyLiquidityParams` imported from `@uniswap/v4-core/src/types/PoolOperation.sol`).
- Enforced `Hooks.validateHookPermissions(IHooks(address(this)), getHookPermissions())` in `PearlHook`'s constructor and gated `beforeSwap` / `afterSwap` with `onlyPoolManager`.
- **Architectural Note — Uniswap v4 Specified vs. Unspecified Delta Split across the 4 Swap Directions:**
  In Uniswap v4's [`Hooks.sol`](./lib/v4-core/src/libraries/Hooks.sol) (`lines 294–312`), `afterSwap` returns a single `int128` that `PoolManager` applies **exclusively** to the swap's **unspecified** currency (`hookDeltaUnspecified`), whereas `hookDeltaSpecified` is sourced **exclusively** from `beforeSwap`'s `BeforeSwapDelta.getSpecifiedDelta()`. Because Pearls charges the post-gate 30 bps fee **strictly in the quote asset** across all 4 swap directions (and never in the launched token):
  1. **When the quote asset is the unspecified currency (`isQuoteSpecified(params) == false` — Case 2: Sell exact-in, Case 3: Buy exact-out):**
     `afterSwap` resolves `poolQuote` from `delta`, calls `fee = core.recordSwap(poolQuote)` (enforcing the launch-window max-swap guard and computing the 30 bps fee if the gate was already crossed prior to the swap), calls `poolManager.take(quoteCurrency, core.treasury(), fee)`, and returns `fee.toInt128()` as `hookDeltaUnspecified`.
  2. **When the quote asset is the specified currency (`isQuoteSpecified(params) == true` — Case 1: Buy exact-in, Case 4: Sell exact-out):**
     - Below the gate (and on the gate-crossing swap itself), `core.feeActive()` is `false`: `beforeSwap` returns `ZERO_DELTA` and `afterSwap` records `poolQuote` in `core.recordSwap(poolQuote)` (which returns `0` fee and latches `feeActive = true` once cumulative volume reaches `volumeThresholdQuote`).
     - Once `core.feeActive()` is `true`: `beforeSwap` computes `fee = core.quoteFee(specifiedQuote, true)`, settles the quote fee to the treasury via `poolManager.take(quoteCurrency, core.treasury(), fee)`, and returns `toBeforeSwapDelta(fee.toInt128(), 0)`. `afterSwap` verifies the swap did not partially fill (`actualQuote == specifiedQuote`, reverting with `PartialFillWithFee` if a price limit cut the swap short so a swapper is never overcharged), records `specifiedQuote` in `core.recordSwap(specifiedQuote)`, and returns `0`.

### 1.4 Factory Integration ([`src/LaunchFactory.sol`](./src/LaunchFactory.sol))
- Updated `LaunchFactory.launch()` to mine a valid CREATE2 salt via `HookMiner.find(address(this), PEARL_HOOK_FLAGS, ...)` and deploy `PearlHook{salt: hookSalt}` wired to `POOL_MANAGER`.
- Added `address(POOL_MANAGER)` to `LaunchToken`'s initial `capExempt` array (expanding the exemption list from 5 to 6 addresses per spec §4 so seeding liquidity and swapping into the pool during the wallet-cap window do not trip the per-wallet cap on `PoolManager`).

---

## 2. Test Counts & Verification Results

### 2.1 Foundry Suite (`forge test -vv`) — **50 Passed, 0 Failed**
| Suite | File | Passing | Failing | Notes |
|---|---|---:|---:|---|
| `PearlsTest` | [`test/Pearls.t.sol`](./test/Pearls.t.sol) | 22 | 0 | Factory launch, bps splits, certificate, wallet cap, locker (Abyssal & Timed ≥180d), vesting vault, airdrop distributor (0.0194 ETH fee + Merkle claims). |
| `AttestationRegistryTest` | [`test/AttestationRegistry.t.sol`](./test/AttestationRegistry.t.sol) | 8 | 0 | Content-hash anchoring, issuer gate, duplicate protection, reverse lookup. |
| `PearlHookTest` | [`test/PearlHook.t.sol`](./test/PearlHook.t.sol) | 13 | 0 | Gate math, crossing-swap zero fee, fuzz monotonicity (256 runs), launch guard, `HookMiner` CREATE2 permission validation, `onlyPoolManager`, 4-case delta resolution. |
| `PearlHookForkTest` | [`test/PearlHook.t.sol`](./test/PearlHook.t.sol) | 7 | 0 | **Spec §7.3 Base Sepolia Fork Matrix** (block `49,250,000`, chain ID `84532`) against live `PoolManager` (`0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408`): all 4 direction cases × pre-gate / crossing / post-gate (`quoteIsCurrency0 = false` and `true`), launch guard enforcement & expiry across all 4 directions, and end-to-end `LaunchFactory.launch()` -> pool init -> liquidity -> swaps. |
| **Total** | | **50** | **0** | **43 unit/fuzz + 7 Base Sepolia fork tests** |

### 2.2 Symbolic Verification (`halmos --contract PearlHalmosTest`) — **5 Passed, 0 Failed**
Full output in [`docs/halmos-2026-10-23.txt`](./docs/halmos-2026-10-23.txt); triage in [`docs/audit-triage-2026-10-23.md`](./docs/audit-triage-2026-10-23.md).
- `check_locker_abyssal_principal_never_leaves(uint256,address)` — **PASS**
- `check_locker_timed_principal_never_leaves_before_unlock(uint256,address)` — **PASS**
- `check_hook_quoteFee_bounds(uint256,bool)` — **PASS**
- `check_hook_stateful_gate_and_fee_bounds(uint256,uint256)` — **PASS**
- `check_distributor_pays_leaf_at_most_once(uint256,address,uint256)` — **PASS**

### 2.3 Static Analysis (`slither` & `aderyn`)
- **Slither (`0.11.6`, [`docs/slither-2026-10-23.txt`](./docs/slither-2026-10-23.txt)):** **0 High, 0 Medium** (13 Low/Informational findings triaged in [`docs/audit-triage-2026-10-23.md`](./docs/audit-triage-2026-10-23.md)).
- **Aderyn (`0.6.8`, [`docs/aderyn-2026-10-23.md`](./docs/aderyn-2026-10-23.md)):** 2 High false positives (permissionless ERC-20 `claim()`/`release()` flagged by a generic `msg.sender` heuristic, and `nonReentrant` view check `IERC721.ownerOf` in `LaunchLocker.deposit`) and 4 Low/Informational items; all triaged in [`docs/audit-triage-2026-10-23.md`](./docs/audit-triage-2026-10-23.md).

---

## 3. Remaining Gaps & Pre-Deployment Gates

1. **Multi-network `PoolManager` parameterization (pre-mainnet / local Anvil pool rehearsal):**
   - `LaunchFactory.POOL_MANAGER` is currently bound to the canonical Base Sepolia `PoolManager` (`0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408`). Before any future mainnet build or standalone non-forked Anvil pool test, `poolManager` can either be passed as an immutable `LaunchFactory` constructor argument (alongside `treasury`) or resolved by chain ID (`84532` vs `8453`). Left as a constant in `LaunchFactory` for this pass to preserve the zero-config constructor signature `new LaunchFactory(treasury)` expected by `script/Deploy.s.sol` and `test/Pearls.t.sol`.
2. **Base Sepolia Rehearsal Launch (Spec §11 Step 4 — Gated on D'Vaughn's Authorization):**
   - Nothing has been broadcast or deployed. When D'Vaughn authorizes a Base Sepolia rehearsal deploy, `TREASURY` must be set to a **throwaway test Safe** (never the real treasury), followed by a rehearsal token launch and a 4-direction swap verification on the live testnet pool.
3. **Plus+ / CoinGuard Off-Chain Suite (Spec §10 — Out of Scope for This Pass):**
   - Remains design-only in `spec.md` §10 per handoff instructions.
