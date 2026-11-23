#!/usr/bin/env bash
# Publish one issuance-chain anchor to the public repository.
#
# The anchor record (chain head + chain digest) is produced by the
# ThinkTank OS container, written into the thinktank-os repo under
# docs/attestation-anchors/, committed, and pushed to both remotes.
# The public commit is the independent witness: its existence and
# time are recorded by infrastructure Glenride does not control.
#
# Idempotent: when the chain head is already anchored, nothing is
# committed and nothing is pushed.
#
# Runs weekly via the thinktank-anchor.timer systemd user timer.
# The script never touches a private key; the anchor contains only
# public chain data (sequence, hashes, public ID, timestamps).
set -euo pipefail

TREE_A="$HOME/projects/thinktank-os"
TREE_B="$HOME/projects/dvaughnhouse/thinktank-os"
ANCHOR_DIR="$TREE_A/docs/attestation-anchors"

cd "$TREE_B"

# Produce the anchor record from the live chain (container reads the DB).
anchor_json="$(docker compose exec -T app php artisan attestations:anchor-chain --print)"
seq="$(printf '%s' "$anchor_json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["seq"])')"

mkdir -p "$ANCHOR_DIR"
anchor_file="$ANCHOR_DIR/anchor-seq-$seq.json"

if [ -f "$anchor_file" ]; then
    existing_digest="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["chain_digest"])' "$anchor_file")"
    new_digest="$(printf '%s' "$anchor_json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["chain_digest"])')"
    if [ "$existing_digest" = "$new_digest" ]; then
        echo "Chain head seq $seq is already anchored with the same digest. Nothing to do."
        exit 0
    fi
    echo "WARNING: anchor file for seq $seq exists with a DIFFERENT digest. Refusing to overwrite history." >&2
    exit 1
fi

printf '%s' "$anchor_json" > "$anchor_file"

cd "$TREE_A"
git add "docs/attestation-anchors/anchor-seq-$seq.json"
git commit -m "Anchor issuance chain head (seq $seq)

Weekly independent preservation anchor for the Glenride attestation
issuance log. Chain digest and head hash recorded in the anchor file."
git push https://github.com/deevee3/thinktank-os.git main
git push https://github.com/Glenride/thinktank-os.git main

echo "Anchored chain head seq $seq and pushed to both remotes."
