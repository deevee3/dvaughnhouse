# Attestations in ThinkTank OS — Witness v1

**Status:** Built, working tree only (not yet committed, pushed, or deployed).
**Concept source:** `~/workspace/your_files/attestation-layer/concept.md` (2026-10-13).
**Owner direction (2026-10-22):** attestation is a main feature of ThinkTank OS, not a side concept.

## What it is

**Proof, not promises.** Glenride is the attestation authority for work published
through ThinkTank OS. An attestation is a signed record containing:

- **The claim** — what was done, produced, or asserted
- **The evidence** — the trail behind it (sources, files, compliance checks), recorded at issuance
- **The verifier** — who checked it (in v1, a Glenride editor or orchestrator)
- **The timestamp** — when it was issued

Attestation is the final step of the manuscript pipeline:
`submitted → ai_synthesized → human_polish → published → attested`.

## V1 rules

1. **Gate:** a manuscript can only be attested when its status is `published`
   **and** all three compliance checks are verified (`isComplianceVerified()`:
   ethics, transparency, citations). The service throws a `DomainException`
   otherwise; there is no override in v1.
2. **Issuance:** Glenride only. The issuer must be a user whose role can polish
   manuscripts (`canIssueAttestations()` = `canPolishManuscripts()` —
   orchestrator, admin, or editor). Authors cannot attest their own work into
   existence by self-signing; an editor/orchestrator signs.
3. **Subject hash:** SHA-256 of the synthesized brief file if it exists on the
   local disk, else the raw manuscript file, else a canonical string of
   title | abstract | author id | published_at.
4. **Signature:** HMAC-SHA256 (key = `APP_KEY`) over the canonical JSON payload
   of `public_id`, `attestable_type`, `attestable_id`, `subject_hash`, and
   `issued_at`. Verification recomputes it and compares with `hash_equals`.
   This is a signed database record, **not** a blockchain record.
5. **Idempotency:** if an active attestation already exists for the same
   subject with the same subject hash, issuance returns that record instead of
   creating a duplicate. A changed brief (new hash) can receive a new attestation.
6. **Public ID:** `GLR-AT-<year>-<6 uppercase alphanumerics>`, unique.
7. **Challenge:** any signed-in user can challenge an attestation in force with
   stated grounds (minimum 10 characters). Challenging flips an `issued`
   attestation to `challenged`, in public, immediately. Challenges are listed
   on the public record with the challenger's name and grounds.
8. **Revocation:** issuers only, with a recorded reason and timestamp. Revoked
   attestations stay in the registry, visibly revoked — records are not deleted
   to hide them.
9. **No chain in v1.** On-chain anchoring is a later step, taken when there is
   volume worth anchoring (see Pearls note below).

## Data model

Migration: `database/migrations/2026_10_22_000001_create_attestations_tables.php`

### `attestations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary | |
| `public_id` | string, unique | `GLR-AT-YYYY-XXXXXX` |
| `attestable_type` / `attestable_id` | uuid morphs | v1 subject is `App\Models\Manuscript`; the morph keeps essays/digests attestable later |
| `subject_title` | string | snapshot at issuance |
| `claim` | text | the attested claim |
| `evidence_manifest` | json, nullable | compliance flags, word count, status, published_at, `raw_file_sha256`, `brief_sha256` when files exist |
| `subject_hash` | string | SHA-256 hex of the subject |
| `signature` | string | HMAC-SHA256 hex |
| `verifier_id` | foreign uuid → users | who signed |
| `issuer_name` | string, default `Glenride` | |
| `method` | string, default `editorial_review_v1` | |
| `status` | string, default `issued` | `issued` \| `challenged` \| `revoked` |
| `issued_at` | timestamp | |
| `anchor_platform` | string, nullable | anchor-ready field — see below |
| `anchor_chain` | string, nullable | anchor-ready field |
| `anchor_contract` | string, nullable | anchor-ready field |
| `anchor_tx` | string, nullable | anchor-ready field |
| `anchored_at` | timestamp, nullable | anchor-ready field |
| `revoked_at` | timestamp, nullable | |
| `revocation_reason` | string, nullable | |
| timestamps | | |

### `attestation_challenges`

`id` (uuid), `attestation_id` (fk, cascade delete), `challenger_id` (fk → users),
`grounds` (text), `status` (`open` \| `upheld` \| `dismissed`, default `open`),
`resolution_note` (text, nullable), timestamps.

### Models

- `App\Models\Attestation` — `attestable()` morphTo, `verifier()`, `challenges()`,
  `scopeActive()`, `isActive()`, `isAnchored()`, `signatureFingerprint()`.
- `App\Models\AttestationChallenge` — `attestation()`, `challenger()`.
- `Manuscript`: `attestations()`, `latestAttestation()`, `activeAttestation()`,
  `isAttested()`.
- `User`: `attestations()` (as verifier), `canIssueAttestations()`.
- `App\Services\Attestation\AttestationService` — `subjectHash()`,
  `evidenceManifest()`, `issue()`, `verifySignature()`, `revoke()`.

## Pearls anchor-ready fields (tentative)

Owner decision (2026-10-22, tentative): **Pearls is the tentative future
on-chain anchoring layer.** Precise framing: Pearls is not a blockchain — Base
is the chain, and Pearls is the launch platform / contract system on Base.

V1 therefore carries the anchor-ready columns above (`anchor_platform`,
`anchor_chain`, `anchor_contract`, `anchor_tx`, `anchored_at`) and leaves them
**null at issuance**. When anchoring is built, the expected values are
`anchor_platform = 'pearls'` and `anchor_chain = 'base'`, and only the
**subject hash** would be anchored on-chain — never the manuscript content.

This is **tentative, not a public promise**. The public verification page says
exactly: "Not anchored — anchoring via Pearls on Base is tentative and comes
when volume warrants." V1 is not blocked by Pearls: the Pearls core is
Sepolia/local-only and unaudited, and any mainnet step remains the owner's gate.

## Routes

| Method | Path | Name | Access |
|---|---|---|---|
| GET | `/attestations` | `attestations.index` | public registry |
| POST | `/attestations/verify` | `attestations.verify` | public lookup by public ID or subject hash (registered before show) |
| GET | `/attestations/{key}` | `attestations.show` | public record (key = public ID or uuid) |
| POST | `/manuscripts/{manuscript}/attestations` | `attestations.store` | auth; issuers only |
| POST | `/attestations/{attestation}/challenges` | `attestations.challenge` | auth; any signed-in user, active records only |
| POST | `/attestations/{attestation}/revoke` | `attestations.revoke` | auth; issuers only, active records only |

Note: uuid lookups guard with `Str::isUuid()` before querying the uuid primary
key — querying a uuid column with a `GLR-AT-…` string errors on Postgres.

## Surfaces

- **Public registry** — `Pages/Attestations/Index.jsx`: what an attestation is
  (claim / evidence / verifier / timestamp), verify-by-code form, counts,
  attestation cards, honest empty state.
- **Public record** — `Pages/Attestations/Show.jsx`: status, signature-verified
  indicator, claim, evidence manifest, full subject hash, signature
  fingerprint, on-chain anchor line, challenges list, challenge form
  (signed-in), revoke form (issuers).
- **Library seal** — `Components/AttestationSeal.jsx` on `Library/Show`
  ("Witnessed by Glenride" with public ID, status, date, verifier and a verify
  link; a plain "Not yet attested" block when there is none), and a
  "Witnessed by Glenride · {public_id}" line on `Library/Index` cards.
- **Issuance** — Portfolio Matrix editorial modal: current attestation state,
  eligibility note, and an Issue Attestation button for issuers (JSON response
  for the axios caller, redirect for Inertia posts).
- **Navigation** — InstitutionalHeader carries an Attestations link between
  Thesis and Essays.

## How a reader verifies a record

1. Open the attested work in the Vanguard Library and follow its
   "Verify this attestation" link — or go to `/attestations` and enter the
   public ID or subject hash.
2. The record page shows **✓ Signature verified** only when the HMAC signature
   recomputes exactly against the stored claim data.
3. To check the work itself: hash the published brief (SHA-256) and compare it
   to the subject hash on the record. A match means the work in front of you is
   the exact work Glenride attested — not a later edit wearing its name.
4. Check the status and the challenges list before relying on a record: a
   `challenged` or `revoked` record says so in public.

## Open decisions (owner's, deliberately not decided by this build)

1. **Council co-signing** — do Glenride Council members attest as individuals,
   or does the Council attest as a body? V1 is Glenride-editor-only.
2. **Pearls/Base anchoring lock-in** — whether Pearls on Base becomes the
   anchor, when volume warrants it, and what contract/registry form it takes.
3. **Challenge economics** — v1 challenges are free and reputational. Staking
   to challenge (and slashing bad attestations) needs real mechanism design.
4. **Pre-publish issuance** — v1 requires `published`. Whether an attestation
   can be issued during human polish (and revealed at publish) is open.
5. **First attested product beyond manuscripts** — the morph supports essays,
   the drug-shortage digest, and other Glenride output; order is the owner's call.
6. **Revenue** — who pays for attestation at scale (producer, reader, platform)
   is undecided.
