# Pearls — Static Analysis & Symbolic Verification Triage

**Date:** 2026-10-23  
**Scope:** All 12 contracts/interfaces/libraries in `src/` (`PearlsConstants.sol`, `HookMiner.sol`, `IPearlHook.sol`, `PearlHookCore.sol`, `PearlHook.sol`, `LaunchFactory.sol`, `LaunchToken.sol`, `LaunchCertificate.sol`, `LaunchLocker.sol`, `VestingVault.sol`, `AirdropDistributor.sol`, `AttestationRegistry.sol`)  
**Raw Reports:**
- Slither (`0.11.6`): [`docs/slither-2026-10-23.txt`](./slither-2026-10-23.txt)
- Aderyn (`0.6.8`): [`docs/aderyn-2026-10-23.md`](./aderyn-2026-10-23.md)
- Halmos (`0.3.3`): [`docs/halmos-2026-10-23.txt`](./halmos-2026-10-23.txt)

---

## 1. Slither (`0.11.6`) — Triage Summary

- **High:** 0
- **Medium:** 0
- **Low / Informational:** 13 detector results across 5 detector categories

| Detector | Location | Severity | Disposition & Rationale |
|---|---|---|---|
| `incorrect-equality` | `VestingVault.release()` (`amount == 0`) | Low / Info | **By design (False Positive).** Guards against a zero-value release when `releasable() == 0`, reverting with `NothingToRelease()` rather than emitting an empty transfer/event. |
| `reentrancy-events` | `AirdropDistributor.claim`, `LaunchLocker.collectFees`, `LaunchLocker.withdrawPrincipal`, `VestingVault.release`, `LaunchFactory.launch` | Low / Info | **Safe (CEI + `nonReentrant`).** All state mutations occur strictly before external calls, and stateful entrypoints (`claim`, `collectFees`, `withdrawPrincipal`, `release`) carry OpenZeppelin `nonReentrant`. Emitting events after `safeTransfer` / `safeTransferFrom` ensures events are only emitted if the transfer succeeds. |
| `timestamp` | `LaunchLocker.withdrawPrincipal`, `VestingVault.vestedAmount`, `VestingVault.release` | Low / Info | **Acceptable.** Timestamps are compared against multi-day/multi-month schedules (≥180-day lock floor, vesting cliffs/durations); L2 sequencer drift of seconds is immaterial. |
| `assembly` | `HookMiner.find` | Informational | **Reviewed & memory-safe.** Uses `assembly ("memory-safe")` over a 96-byte scratch region at `mload(0x40)` to hash the 85-byte CREATE2 preimage without bumping the free-memory pointer on each loop iteration, avoiding ~24M gas of quadratic memory expansion during `LaunchFactory.launch()`. |
| `cyclomatic-complexity` | `LaunchFactory._validate` | Informational | **Acceptable.** Sequential guard clauses validating all immutable launch parameters upfront before any state change or deployment. |
| `too-many-digits` | `HookMiner.find`, `LaunchFactory.launch` | Informational | **Acceptable.** Standard 20-byte address mask (`0xffffffffffffffffffffffffffffffffffffffff`) and `0xff` CREATE2 prefix. |

---

## 2. Aderyn (`0.6.8`) — Triage Summary

During triage, two initial Aderyn warnings on `HookMiner.sol` (`abi.encodePacked(creationCode, constructorArgs)` and `shl(160, 0xff)`) and Slither `unused-return` warnings on `PearlHook.sol` / `LaunchFactory.sol` were eliminated in code by switching to `bytes.concat(creationCode, constructorArgs)`, using the pre-shifted `0xff0000000000000000000000000000000000000000` constant, and asserting the return values of `core.recordSwap()` and `HookMiner.find()`.

Remaining findings in `docs/aderyn-2026-10-23.md`:

| ID | Title | Location | Disposition & Rationale |
|---|---|---|---|
| `H-1` | ETH transferred without address checks | `AirdropDistributor.claim`, `VestingVault.release` | **False Positive (By Design).** Neither function transfers ETH (both transfer ERC-20 tokens). `claim()` is permissionless so any caller/relayer can submit a valid Merkle proof, with `account` cryptographically bound in the leaf `keccak256(abi.encodePacked(index, account, amount))`. `release()` is permissionless so anyone can trigger vesting payout, with tokens always sent to the immutable `beneficiary`. |
| `H-2` | Reentrancy: State change after external call | `LaunchLocker.deposit` | **False Positive (Mitigated).** Protected by `nonReentrant` and the one-shot `hasPosition` latch; the external call `IERC721(collection).ownerOf(tokenId)` is a view check confirming the locker already holds the LP NFT before recording `positionCollection`, `positionTokenId`, and `hasPosition = true`. |
| `L-1` / `L-2` | Large Numeric Literal / Literal Instead of Constant | `LaunchFactory`, `PearlHook`, `PearlHookCore`, `AirdropDistributor` | **Informational.** Standard basis-point denominator (`10_000`), protocol fee (`30` bps), bitmap word size (`256`), and `BalanceDelta` 128-bit packing shifts. |
| `L-3` | `PUSH0` Opcode | All `src/*.sol` | **Informational.** Target chain is Base (`evm_version = "cancun"` in `foundry.toml`), which natively supports `PUSH0`. |
| `L-4` | Unspecific Solidity Pragma (`^0.8.24`) | All `src/*.sol` | **Informational.** Compiler is pinned to `solc = "0.8.24"` in `foundry.toml`. |

---

## 3. Halmos (`0.3.3`) — Symbolic Verification Summary (Spec §9)

Suite: [`test/PearlHalmos.t.sol`](../test/PearlHalmos.t.sol)  
Command: `halmos --contract PearlHalmosTest`  
Result: **5 passed, 0 failed (1.61s)**

| Spec §9 Invariant | Symbolic Test | Paths | Time | Result |
|---|---|---|---|---|
| **(i) Locker principal cannot leave before `unlockTime`** | `check_locker_abyssal_principal_never_leaves(uint256,address)` | 2 | 0.02s | **PASS** — Principal never leaves an Abyssal locker at any timestamp for any caller. |
| **(i) Locker principal cannot leave before `unlockTime`** | `check_locker_timed_principal_never_leaves_before_unlock(uint256,address)` | 5 | 0.18s | **PASS** — Principal never leaves a Timed locker before `unlockTime` or to any non-creator caller. |
| **(ii) Hook fee is 0 below gate and ≤ 30 bps of quote above it** | `check_hook_quoteFee_bounds(uint256,bool)` | 5 | 0.45s | **PASS** — Pure `quoteFee` is `0` pre-gate and `(quoteAmount * 30) / 10_000 <= quoteAmount` post-gate. |
| **(ii) Hook fee is 0 below gate and ≤ 30 bps of quote above it** | `check_hook_stateful_gate_and_fee_bounds(uint256,uint256)` | 8 | 0.54s | **PASS** — Stateful `recordSwap` charges `0` pre-gate and on the crossing swap, and charges exact `30 bps` (rounded down) once the gate is active. |
| **(iii) Distributor pays a leaf at most once** | `check_distributor_pays_leaf_at_most_once(uint256,address,uint256)` | 9 | 0.29s | **PASS** — Any claimed index sets the bitmap bit and causes any second claim for that index to revert without moving tokens. |
