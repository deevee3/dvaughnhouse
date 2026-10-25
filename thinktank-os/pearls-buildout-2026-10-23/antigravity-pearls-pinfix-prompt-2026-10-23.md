# Antigravity task — Pearls: fix the false v4.0.0 pin and the SwapParams references
_Written by Janine 2026-10-23 at D'Vaughn's request. Paste-ready._

---

TASK: The Pearls build-out (PearlHook Uniswap v4 adapter + audit suite) passes 50/50 tests against the libraries actually vendored in the tree, but the tree's v4-core is NOT the canonical v4.0.0 release the report and `foundry.lock` claim. Restore the true pin, fix the type references that break against it, re-run the full verification suite against the real release, correct the report, and commit + push the tree.

WORKDIR: ~/projects/dvaughnhouse/thinktank-os/pearls-buildout-2026-10-23/pearls (the Foundry project). The report is BUILD-OUT-REPORT.md in the parent folder. Note: the build-out folder is currently UNTRACKED in the parent repo (deevee3/dvaughnhouse) — see step 5.

CURRENT STATE (verified by Janine 2026-10-23 — don't re-derive):
- `git -C lib/v4-core rev-parse HEAD` = e50237c43811bd9b526eff40f26772152a42daba — a pre-release snapshot, NOT v4.0.0.
- The canonical v4.0.0 tag is 59d3ecf53afa9264a16bba0e38f4c5d2231f80bc. `foundry.lock` and BUILD-OUT-REPORT.md §1.1 claim the tree is pinned to it. That claim is currently false.
- `lib/v4-periphery` is fine: actual rev 3779387e5d296f39df543d23524b050f89a62917 matches its lock entry. Verify it anyway in step 1.
- Why it matters: in the real v4.0.0 release, `SwapParams` moved out of `IPoolManager` into `src/types/PoolOperation.sol`. Against the restored pin the current code does not compile (solc Error 7920 at src/IPearlHook.sol:51 — Janine proved this).
- Everything else about the build verified good: 43 unit/fuzz + 7 Base Sepolia fork tests pass against the vendored snapshot; Halmos 5/5; the delta architecture, 0x00CC flag decomposition, and PartialFillWithFee guard are correct. Do not redesign anything.

FIX:
1. Restore the pin: fetch the v4.0.0 tag in lib/v4-core and check out 59d3ecf53afa9264a16bba0e38f4c5d2231f80bc. Confirm `git -C lib/v4-core rev-parse HEAD` prints exactly that. Confirm lib/v4-periphery HEAD is 3779387e5d296f39df543d23524b050f89a62917 (restore it too if it has drifted). Make `foundry.lock` reflect the actual revs.
2. Fix every `IPoolManager.SwapParams` reference — grep shows 7 sites: src/IPearlHook.sol (lines 51, 64), src/PearlHook.sol (lines 150, 192, 213), src/PearlHookCore.sol (lines 156, 164). Line numbers may shift as you edit; work from `grep -rn "IPoolManager.SwapParams" src/` until it returns nothing. In each file, import `SwapParams` from v4-core's `types/PoolOperation.sol` (match the import-prefix style the file already uses for other v4-core types) and use the unqualified `SwapParams` type. Change nothing else — no logic, no signatures beyond the type source, no constants.
3. `forge build` must compile clean against the restored pin.
4. Re-run the whole suite against the real v4.0.0 pin and save fresh outputs under docs/ (dated filenames, same style as the existing audit docs):
   - Unit/fuzz: `forge test --no-match-contract PearlHookForkTest` → expect 43 passed / 0 failed.
   - Fork: `forge test --match-contract PearlHookForkTest` with BASE_SEPOLIA_RPC_URL=https://sepolia.base.org → expect 7 passed / 0 failed.
   - Halmos: all 5 checks pass.
   - Slither: no High/Medium findings (the known informational high-cyclomatic-complexity note on LaunchFactory._validate is pre-triaged, not new).
   If any count differs from the above, STOP and report the discrepancy — do not adjust tests or expectations to make counts fit.
5. Correct the record, then commit + push:
   - Amend BUILD-OUT-REPORT.md §1.1 (or add a dated correction addendum directly under it) so the pin statement matches reality: v4-core at v4.0.0 / 59d3ecf, verified by a clean build + full suite re-run on 2026-10-23.
   - Create branch `pearls-buildout` in the parent repo (deevee3/dvaughnhouse). Commit the pearls-buildout-2026-10-23 tree: vendor lib/ contents as plain files (strip the nested .git directories inside lib/* before adding), include src/, test/, script/, docs/, foundry.toml, foundry.lock, remappings if present, and BUILD-OUT-REPORT.md; exclude out/ and cache/. Push the branch. Do NOT commit to main and do NOT merge.

DO NOT:
- Do not deploy anything — no Sepolia rehearsal, no broadcast. Deployment stays gated on the owner's explicit authorization with a throwaway test Safe as treasury.
- Do not touch POOL_MANAGER parameterization (the Base Sepolia constant in LaunchFactory) — that is a separate, later task.
- Do not change hook logic, fee math, flag values, or the PoolManager address constant.
- Do not edit the canonical folder ~/workspace/your_files/pearls/ on Janine's side — she syncs it from your pushed branch after her own re-verification.

VERIFY + REPORT (final summary must include):
- `git -C lib/v4-core rev-parse HEAD` and `git -C lib/v4-periphery rev-parse HEAD` after the fix.
- forge build result; exact test counts (unit/fuzz, fork) and Halmos result against the restored pin; Slither severity summary.
- The grep proof: `grep -rn "IPoolManager.SwapParams" src/` returns nothing.
- Branch name, commit hash, and confirmation the push succeeded.
- Anything that did not match the expected counts, stated plainly.
