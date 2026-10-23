# Attestation Anchoring — Deploy Runbook

**Contract:** `src/AttestationRegistry.sol` · **Status:** built + unit-tested + proven on
local Anvil (see `docs/attestation-registry-anvil-proof.md`). **Not deployed anywhere.**
Deployment is the owner's gate, in the order given below — Sepolia first, mainnet only
after a third-party audit.

---

## 1. What the contract does

`AttestationRegistry` is the on-chain anchor for Glenride attestations issued by
ThinkTank OS ("Witness"):

- **Hashes only.** An anchor stores a SHA-256 subject hash, the attestation's public ID
  (e.g. `GLR-AT-2026-XXXXXX`), the issuer address, and the block timestamp. No manuscript
  content, no evidence, no personal data ever goes on-chain.
- **One privileged address.** The constructor takes a single `issuer_` — the Glenride
  issuer address (in production, the Glenride issuer Safe). It is stored as the immutable
  `ISSUER` and is the only address that can call `anchor()`. There is no owner, no setter,
  no pause, no proxy, no upgrade path, and no way to edit or delete a record once anchored.
- **One anchor per public ID.** Anchoring the same public ID twice reverts
  (`AlreadyAnchored`). The same subject hash may be anchored under a second public ID
  (e.g. a re-issued attestation); the reverse lookup `publicIdOf(hash)` keeps returning
  the **first** public ID anchored for that hash.
- **Reads are public.** `recordOf(publicId)` → `(subjectHash, issuer, anchoredAt, exists)`,
  `isAnchored(publicId)`, `publicIdOf(subjectHash)`. Anyone can verify an attestation
  against the chain without asking Glenride.
- **ThinkTank OS stays the record of truth.** The chain proves *when* a hash was anchored
  and *by whom*. The attestation itself — claim, evidence, verifier, status, challenges,
  revocations — lives in ThinkTank OS. Lifecycle changes are never mirrored on-chain.

## 2. Sepolia deploy (owner-run)

The deploy script **refuses every chain except Base Sepolia (84532) and local Anvil
(31337)** — it cannot deploy to mainnet even by accident.

### Step 1 — Choose the deployer wallet

Create a fresh wallet (or use an existing testnet wallet) in your wallet app / CLI.
**Testnet key only** — this wallet never needs to hold real funds, and the key should be
one you would be comfortable discarding. Keep the private key out of this repo, out of
chat, and out of any committed file: you will pass it through an environment variable at
run time only (Step 4).

### Step 2 — Fund it with Sepolia ETH

Send a small amount of **Base Sepolia** ETH to the deployer address from a faucet
(search "Base Sepolia faucet" — e.g. the Coinbase Developer Platform / Alchemy / QuickNode
faucets). Deployment costs well under 0.01 Sepolia ETH at typical testnet gas prices.
The deployer does **not** need to be the issuer — it only pays for the deployment.

### Step 3 — Decide the issuer address

`ATTESTATION_ISSUER` becomes immutable the moment the contract deploys. For the Sepolia
phase, use a **throwaway test Safe or EOA** you control — anchoring on Sepolia is a
rehearsal. (The Sepolia choice does not carry over.) **For mainnet the issuer is DECIDED
(2026-10-22): the STANZA treasury Safe, `0x0f166D7631350dE1F9c4190dEA4fAE9565B19231`** —
STANZA represents the records via this registry, so the anchors are made by the STANZA
Safe itself. Anchoring from a Safe means each anchor is a Safe transaction (executed via
the Safe app or a Safe-compatible flow), not a plain EOA call.

### Step 4 — Deploy

From the repo root, in a shell where Foundry is on PATH:

```bash
export BASE_SEPOLIA_RPC_URL=<your Base Sepolia RPC URL>
export ATTESTATION_ISSUER=<the issuer address from Step 3>
export DEPLOYER_KEY=<deployer private key — typed/pasted by you, here only>

# Dry run first (no broadcast — simulates and prints the target address):
forge script script/DeployAttestationRegistry.s.sol:DeployAttestationRegistry \
  --rpc-url $BASE_SEPOLIA_RPC_URL

# For real, only on your word:
forge script script/DeployAttestationRegistry.s.sol:DeployAttestationRegistry \
  --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

Write down the printed `AttestationRegistry deployed at:` address and the deploy
transaction hash (also saved under `broadcast/…/84532/run-latest.json` — that file
contains no keys, but treat the whole `broadcast/` folder as operational records).

Then unset the key from your shell history's reach: `unset DEPLOYER_KEY` (and prefer a
shell with history disabled for the export line, or a leading space before `export`).

### Step 5 — Rehearse an anchor

From the **issuer** address (Step 3), call `anchor(subjectHash, publicId)` once with a
test attestation's real ThinkTank OS subject hash and public ID, then read it back:

```bash
cast call <REGISTRY> "recordOf(string)(bytes32,address,uint256,bool)" "<PUBLIC_ID>" \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

Confirm the returned hash, issuer, and timestamp match ThinkTank OS. Only then wire the
registry address into ThinkTank OS (next section).

## 3. How ThinkTank OS records an anchor

ThinkTank OS attestation records already carry nullable anchor fields. When an attestation
is issued and anchored, the OS fills them in — anchoring never changes the attestation
itself:

| Field | Value |
|---|---|
| `anchor_platform` | `pearls` |
| `anchor_chain` | `base-sepolia` (testnet) or `base` (mainnet) |
| `anchor_contract` | The deployed `AttestationRegistry` address |
| `anchor_tx` | The `anchor()` transaction hash |
| `anchored_at` | The anchor block's timestamp |

Until an attestation is anchored, these stay null and its verification page says so
("Not anchored"). The OS computes the subject hash; the issuer (Safe) signs the anchor
transaction; the OS records the resulting contract/tx afterward. If an anchor transaction
fails, the attestation remains valid off-chain — it is simply not yet anchored, and the
anchor can be retried (the contract's `AlreadyAnchored` guard makes a retry safe: if the
first attempt actually landed, the retry reverts instead of double-anchoring).

## 4. The mainnet gate (plain terms)

**Do not deploy this contract to Base mainnet yet.** The gate, in order:

1. **Third-party audit first.** Pearls' standing invariant (spec §9) is a public review
   path before mainnet: the zero-cost floor (Foundry tests — done; Slither — run for the
   core, to be re-run including this contract) plus a **third-party audit / public review**
   of the contracts that will hold mainnet state. The registry is small and boring on
   purpose, but "small and boring" is a claim an auditor verifies, not a substitute for one.
2. **Owner decision.** Mainnet deployment happens only on the owner's explicit word,
   with the **real Glenride issuer Safe** as `ATTESTATION_ISSUER`.
3. **Same steps, real chain.** The procedure is identical to §2, against Base mainnet
   (chain ID 8453) with real ETH for gas — a few dollars at typical Base fees. Note the
   current deploy script **will refuse chain 8453 by design**; lifting that refusal is
   itself part of the gated step (a deliberate, reviewed one-line change at audit sign-off,
   not something to flip casually).

Until all three are done, anchoring lives on Sepolia as a rehearsal, and unanchored
attestations remain fully valid — the chain anchor is a public proof layer, not a
precondition for an attestation to exist.

## 5. Gas shape

- **One anchor transaction per attestation.** The `anchor()` call measured on Anvil:
  **136,944 gas** (first anchor for a fresh public ID + fresh subject hash; repeat-shape
  anchors are the same order). At Base's typical fees that is a fraction of a cent per
  attestation.
- **Batching is a future optimization — not built.** If attestation volume ever makes
  per-attestation transactions worth consolidating, a batch anchor (Merkle root of many
  subject hashes in one transaction) can be designed then, as its own reviewed contract.
  Do not bolt it onto this registry: the one-ID-one-record shape is what makes public
  verification trivially readable.
