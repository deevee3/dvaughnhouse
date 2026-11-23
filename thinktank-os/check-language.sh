#!/usr/bin/env bash
# check-language.sh — fail if banned branding language appears in public-facing copy.
#
# D'Vaughn's hard language rules live here. Run before committing:
#   bash thinktank-os/check-language.sh        (from the repo root)
#   cd thinktank-os && bash check-language.sh  (from thinktank-os/)
#
# Exit 0 = clean. Exit 1 = banned language found (listed on stdout).
set -uo pipefail

# Resolve the thinktank-os dir regardless of where the script is called from.
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Banned patterns (case-insensitive, fixed strings).
# Brand Guidelines PDF 2026-11-20 (canonical) lexicon bans + the earlier
# bans (#00C805, #FF5000, no two-letter machine-intelligence abbreviation
# in product copy — the abbreviation is word-boundary only, so it is
# checked by hand with grep -w before commit, not by this fixed-string
# script). "Hype" also matches "hypercompetition" and the SOP's
# legitimate "No hype beyond the evidence" line; both files are excepted
# below. "Next-gen" appears only in the excepted essay's citation.
BANNED=(
  "sovereign"
  "Glenride Institute"
  "tenfold"
  "air-gapped"
  "indigo-"
  "#4f46e5"
  "#6366f1"
  "#c7d2fe"
  "#818cf8"
  "Tokenomics wizard"
  "To the moon"
  "Frictionless"
  "Next-gen"
  "Game-changer"
  "Trustless magic"
  "Synergy"
  "Ape in"
  "Hype"
  "#00C805"
  "#FF5000"
)

# Superseded Tress palettes, banned on Tress surfaces only: the ORDER-02
# sienna (#E97451 / #B84A2B) and Pons values are still the Glenride
# essays/standards accent, so they are NOT global bans. The gold
# (#D4AF37) and signal orange (#FF6B2B) are Tress-only too.
TRESS_BANNED=(
  "#F5F5F7"
  "#0C1500"
  "#E97451"
  "#B84A2B"
  "#D4AF37"
  "#FF6B2B"
)

# Public-facing copy paths (relative to thinktank-os/).
PATHS=(
  "resources/js/Pages"
  "resources/js/Components/InstitutionalHeader.jsx"
  "resources/standards"
  "resources/sops"
  "resources/essays"
  "resources/views"
  "routes"
  "resources/js/TressColumn"
  "resources/tress-landing"
  "public/tress-column-assets"
)

# Tress-only paths for the superseded-palette bans.
TRESS_PATHS=(
  "resources/js/TressColumn"
  "resources/js/Pages/TressColumn"
  "resources/js/Pages/TradingTerminal"
  "resources/js/Pages/OpsConsole"
  "resources/js/Pages/PlusPortal"
  "resources/tress-landing"
  "public/tress-column-assets"
  "resources/css/tress-tokens.css"
)

# Legitimate exceptions (substring match on the grep output line).
# - power-wisdom-gap essay: discusses the sovereign ban explicitly + cites
#   peer-reviewed "digital sovereignty" literature. Not branding copy.
# - Auth pages: Laravel Breeze defaults (login/register), not brand surfaces.
# - Manuscripts / Portfolio / Profile: internal tooling behind auth.
#   Public rebrand pass pending; not customer-facing brand surfaces.
# - sop-outline: legitimate "No hype beyond the evidence" line, not hype copy.
EXCEPTIONS=(
  "resources/essays/power-wisdom-gap"
  "resources/js/Pages/Auth"
  "resources/js/Pages/Manuscripts"
  "resources/js/Pages/Portfolio"
  "resources/js/Pages/Profile"
  "resources/sops/sop-outline"
)

fail=0
for word in "${BANNED[@]}"; do
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    skip=0
    for ex in "${EXCEPTIONS[@]}"; do
      case "$match" in
        *"$ex"*) skip=1; break ;;
      esac
    done
    if [ "$skip" -eq 0 ]; then
      echo "BANNED: '$word' -> $match"
      fail=1
    fi
  done < <(grep -rni -F --include='*.jsx' --include='*.js' --include='*.php' --include='*.md' --include='*.html' --include='*.blade.php' --include='*.css' -e "$word" "${PATHS[@]}" 2>/dev/null)
done

# Superseded Tress palettes: Tress surfaces only, no exceptions.
for word in "${TRESS_BANNED[@]}"; do
  while IFS= read -r match; do
    [ -z "$match" ] && continue
    echo "BANNED (Tress palette): '$word' -> $match"
    fail=1
  done < <(grep -rni -F --include='*.jsx' --include='*.js' --include='*.php' --include='*.md' --include='*.html' --include='*.blade.php' --include='*.css' -e "$word" "${TRESS_PATHS[@]}" 2>/dev/null)
done

if [ "$fail" -eq 0 ]; then
  echo "Language check passed: no banned words in public copy."
else
  echo "Language check FAILED: remove the flagged language before committing."
fi
exit "$fail"
