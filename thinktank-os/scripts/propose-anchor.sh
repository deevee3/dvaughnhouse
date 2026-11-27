#!/usr/bin/env bash
# Build a Safe transaction payload for anchoring one attestation.
#
# Custody Option A (2026-11-26): on-chain anchoring goes through the
# Glenride/STANZA Safe, never a stored hot wallet key. This script
# only BUILDS the payload (to / value / data / operation). Proposing
# and signing it in the Safe app is the Safe owner's step.
#
# Usage:
#   propose-anchor.sh <registry-address> <public-id> <subject-hash-hex>
#
# The registry must be an AttestationRegistry whose immutable ISSUER
# is the Safe (mainnet design: STANZA treasury Safe
# 0x0f166D7631350dE1F9c4190dEA4fAE9565B19231). The current Base
# Sepolia rehearsal registry (0x9acaf7183c58dfa84985bc9df190a8fddb697945)
# has an EOA issuer, so Safe execution against it reverts NotIssuer;
# it is useful for calldata simulation only.
set -euo pipefail

export PATH="$HOME/.foundry/bin:$PATH"

REGISTRY="${1:?registry address required}"
PUBLIC_ID="${2:?public id required}"
SUBJECT_HASH="${3:?subject hash (hex, with or without 0x) required}"
SUBJECT_HASH="0x${SUBJECT_HASH#0x}"

DATA="$(cast calldata "anchor(bytes32,string)" "$SUBJECT_HASH" "$PUBLIC_ID")"

cat <<JSON
{
  "safe": "0x0f166D7631350dE1F9c4190dEA4fAE9565B19231",
  "to": "$REGISTRY",
  "value": "0",
  "data": "$DATA",
  "operation": 0,
  "public_id": "$PUBLIC_ID",
  "subject_hash": "$SUBJECT_HASH"
}
JSON

echo "Next (Safe owner): open the Safe app -> New transaction -> Transaction Builder," >&2
echo "enter to=$REGISTRY value=0 data=$DATA, propose, sign, execute." >&2
echo "After execution, record it in ThinkTank OS via AttestationService::recordAnchor." >&2
