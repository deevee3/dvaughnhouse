# Agent Guidelines for dvaughnhouse / thinktank-os

## Mandatory Pre-Commit Language Check
Before committing any copy or branding changes, **ALWAYS** run:
```bash
bash thinktank-os/check-language.sh
```
from the repository root (or `bash check-language.sh` inside `thinktank-os/`).

### Rules:
1. **Never commit if `thinktank-os/check-language.sh` fails** (exit code non-zero).
2. **Banned Patterns**:
   - `sovereign`
   - `Glenride Institute` (use "Glenride", "independent, AI-native think tank")
   - `tenfold`
   - `air-gapped`
   - `indigo-` (use burnt sienna / `#E97451` palette instead)
   - Hex colors: `#4f46e5`, `#6366f1`, `#c7d2fe`, `#818cf8`
3. If banned terms are found in public-facing copy (`resources/js/Pages`, `resources/standards`, `resources/sops`, `resources/essays`, `resources/views`, `routes`), resolve them before staging and committing.
