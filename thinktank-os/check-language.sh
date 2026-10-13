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
)

# Public-facing copy paths (relative to thinktank-os/).
PATHS=(
  "resources/js/Pages"
  "resources/standards"
  "resources/sops"
  "resources/essays"
  "resources/views"
  "routes"
)

# Legitimate exceptions (substring match on the grep output line).
# - power-wisdom-gap essay: discusses the sovereign ban explicitly + cites
#   peer-reviewed "digital sovereignty" literature. Not branding copy.
# - Auth pages: Laravel Breeze defaults (login/register), not brand surfaces.
# - Manuscripts / Portfolio / Profile: internal tooling behind auth.
#   Public rebrand pass pending; not customer-facing brand surfaces.
EXCEPTIONS=(
  "resources/essays/power-wisdom-gap"
  "resources/js/Pages/Auth"
  "resources/js/Pages/Manuscripts"
  "resources/js/Pages/Portfolio"
  "resources/js/Pages/Profile"
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
  done < <(grep -rni -F --include='*.jsx' --include='*.js' --include='*.php' --include='*.md' --include='*.html' --include='*.blade.php' -e "$word" "${PATHS[@]}" 2>/dev/null)
done

if [ "$fail" -eq 0 ]; then
  echo "Language check passed: no banned words in public copy."
else
  echo "Language check FAILED: remove the flagged language before committing."
fi
exit "$fail"
