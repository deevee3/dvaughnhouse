# AttestationRegistry — Local Anvil Proof

**Date:** 2026-10-22 · **Chain:** local Anvil only (chain ID 31337) · **NOT a deployment.**
Nothing here touched Sepolia or mainnet. The accounts and keys below are Anvil's
well-known, public, throwaway defaults — they hold no real funds and secure nothing.

## What was proven

The full anchoring round-trip on a local chain: deploy `AttestationRegistry` with a
throwaway issuer → issuer anchors a subject hash under public ID `GLR-AT-2026-TEST01` →
the record reads back exactly (hash, issuer, timestamp) via `recordOf`, `isAnchored`,
and `publicIdOf` → a non-issuer anchor attempt reverts with `NotIssuer`.

## Setup

```bash
export PATH="$HOME/.foundry/bin:$PATH"
anvil --port 8545 --chain-id 31337
cast chain-id --rpc-url http://127.0.0.1:8545
# → 31337
```

Accounts (Anvil defaults): deployer **and** issuer = account #0
`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (key `0xac0974…f2ff80`, public/throwaway).
Non-issuer control = account #1 `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.

## Deploy (via the repo script)

```bash
cd ~/workspace/your_files/pearls
export DEPLOYER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export ATTESTATION_ISSUER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
forge script script/DeployAttestationRegistry.s.sol:DeployAttestationRegistry \
  --rpc-url http://127.0.0.1:8545 --broadcast
```

Result:

- **Registry:** `0x5FbDB2315678afecb367f032d93f642f64180aa3`
- **Deploy tx:** `0x78adaf23bf390fe490878720d0d2e887b2fd296f5a78d90331666b490d492e04`
- Script output: `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.`
- `cast call … "ISSUER()(address)"` → `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` ✓

## Anchor

Sample subject hash = SHA-256 of the string `GLR-AT-2026-TEST01 subject`:

```
printf 'GLR-AT-2026-TEST01 subject' | sha256sum
# adcb1cdef2eae9c4073473048850bee91c0ea40f3433ae7b68937956ba8354b7
```

```bash
cast send 0x5FbDB2315678afecb367f032d93f642f64180aa3 \
  "anchor(bytes32,string)" \
  0xadcb1cdef2eae9c4073473048850bee91c0ea40f3433ae7b68937956ba8354b7 \
  "GLR-AT-2026-TEST01" \
  --private-key $DEPLOYER_KEY --rpc-url http://127.0.0.1:8545
```

Result: **status 1 (success)**, block 2, gasUsed **136944**,
tx `0x0377694c83ed5075d87f818a57924b5c122868e790036a52a411318f0ca1a017`.
The `Attested` event was emitted with topics `[event-sig, subjectHash, issuer]` and data
encoding `(publicId="GLR-AT-2026-TEST01", timestamp)`.

## Read-backs

```bash
cast call $REG "recordOf(string)(bytes32,address,uint256,bool)" "GLR-AT-2026-TEST01"
# 0xadcb1cdef2eae9c4073473048850bee91c0ea40f3433ae7b68937956ba8354b7
# 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# 1792648247            (= 2026-10-22 05:50:47 UTC, the anchor block's timestamp)
# true

cast call $REG "isAnchored(string)(bool)" "GLR-AT-2026-TEST01"   # → true
cast call $REG "publicIdOf(bytes32)(string)" $HASH               # → "GLR-AT-2026-TEST01"
cast call $REG "isAnchored(string)(bool)" "GLR-AT-2026-NOPE99"   # → false
```

## Negative control

Anchoring from Anvil account #1 (not the issuer) reverts before broadcast:

```
Error: Failed to estimate gas: … execution reverted: custom error 0x54ec5063: NotIssuer
```

## Unit tests

`forge test` (full suite, same day): **41 passed, 0 failed** — 33 pre-existing Pearls
tests plus 8 new `AttestationRegistry` tests (happy path + read-backs + event fields,
non-issuer revert, duplicate public-ID revert, same-hash two-IDs with first-wins
reverse lookup, zero-issuer constructor revert, empty lookups).

Anvil was shut down after this proof was captured.
