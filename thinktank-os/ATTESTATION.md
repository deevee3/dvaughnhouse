# Attestations in ThinkTank OS — Witness v1 / v2

**Status:** V1 shipped 2026-10-22 (commit `551fcd1`). V2 built, working tree only (not yet committed, pushed, or deployed).
**Concept source:** `~/workspace/your_files/attestation-layer/concept.md` (2026-10-13).
**Owner direction (2026-10-22):** attestation is a main feature of ThinkTank OS, not a side concept.
**Owner direction (v2, 2026-10-22):** attestation must be embedded in the manuscript process, authorized users must be able to manually enter information and attest (pipeline and standalone subjects), and attestations must be able to get on chain via Pearls.

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

## V2 — embedded, manual, and anchor-ready

### Embedded in the manuscript process

Attestation is no longer a side panel action; it is the visible final step of
the pipeline (`submitted → ai_synthesized → human_polish → published → attested`):

- **Kanban card chips (Portfolio Matrix):** every card shows its attestation
  state — `Attested · GLR-AT-…` when an active attestation exists, or a muted
  `Not attested` chip on published cards. The board controller eager-loads each
  manuscript's active attestation (`issued`/`challenged`, latest first).
- **Publish → attest prompt:** when a transition to `published` succeeds, the
  Editorial Studio automatically opens for that manuscript; when the user can
  issue attestations, the toast reads "Published — now attest it from the
  Glenride Attestation panel."
- **Issue as a form, in the flow:** the Matrix attestation panel is an inline
  form — claim textarea (prefilled with the default claim and editable),
  optional evidence notes, and an optional evidence URL — posted to
  `attestations.store`. Entered evidence is merged into the evidence manifest
  under `manual_evidence` (`notes`, `urls`). The attested state additionally
  carries the on-chain anchor UI (below).
- **Manuscripts index:** each row carries an Attestation chip
  (`Attested · {public_id}` / `Not attested` for published / `—` otherwise),
  backed by the same constrained eager-load in `ManuscriptController@index`.
- **Intake:** the manuscript intake compliance section states plainly that
  after publication a Glenride editor attests the work — attestation is the
  final step of the pipeline.

### Manual entry

Authorized users only (`canIssueAttestations()` — orchestrator, admin, editor;
403 otherwise) can attest from **`/attestations/create`** (`Pages/Attestations/Create`,
behind auth, linked from the registry for issuers and from the Matrix header):

1. **From a manuscript** — pick a published manuscript, edit the claim,
   add evidence notes / a URL, and issue through the same
   `attestations.store` endpoint and gate as the Matrix form
   (`entered_via = pipeline`, `subject_kind = manuscript`).
2. **Manual entry (standalone)** — for subjects not in the manuscript
   pipeline. Fields: `subject_title` (required, max 500), `claim` (required,
   min 10), `subject_kind` (`manuscript|report|dataset|external_work|other`),
   optional evidence notes, optional evidence URLs, and an optional
   `subject_hash_override` (64-character hex). Posted to
   `attestations.storeManual` → `AttestationService::issueManual()`:
   - `attestable_type` / `attestable_id` are **null**; `entered_via = manual`;
     `method = manual_entry_v1`; issuer is Glenride; the public ID format and
     HMAC-SHA256 signature are identical to pipeline issuance (for standalone
     records the signature payload carries empty attestable type/id strings).
   - **Hash rules:** `subject_hash` is the validated override when supplied,
     otherwise SHA-256 of the canonical JSON of title, claim, kind, evidence
     notes, and the sorted evidence URLs.
   - `evidence_manifest` is the entered data itself (title, kind, entry path,
     notes, URLs, and whether an override was supplied).
   - Issuance is idempotent per subject hash for active records, matching v1.
   - On success the user is redirected to the public record
     (`attestations.show`), which now displays the subject kind and the entry
     path ("Manual entry" vs "Manuscript pipeline").

### On-chain anchor recording

Anchoring is performed via the **Pearls AttestationRegistry** on Base
(hash-only: only the subject hash goes on chain, never content). ThinkTank OS
is ready to record and display the result:

- `AttestationService::recordAnchor()` sets `anchor_platform` (default
  `pearls`), `anchor_chain` (default `base`), `anchor_contract`, `anchor_tx`,
  and `anchored_at`.
- `POST /attestations/{attestation}/anchor` (`attestations.recordAnchor`,
  issuers only) validates the transaction hash (`0x` + 64 hex), the contract
  address (`0x` + 40 hex), and the chain (`base` or `base-sepolia`). It
  returns JSON for the Matrix axios caller and a redirect for Inertia posts.
- **Surfaces:** the Matrix attested panel shows an "On-chain anchor" block —
  short tx + chain (+ contract) when anchored, a small anchor form
  (tx hash, contract, chain select) for issuers when not, and "Not anchored"
  otherwise. The public record page shows platform · chain · tx · contract ·
  anchored date when an anchor exists.
- **Config status:** the OS records anchors; it does not send transactions.
  The registry contract deploy is gated — Sepolia first, third-party audit
  before mainnet — and until an anchor is recorded the public page keeps the
  honest "Not anchored" line.

## Data model

Migration: `database/migrations/2026_10_22_000001_create_attestations_tables.php`

### `attestations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary | |
| `public_id` | string, unique | `GLR-AT-YYYY-XXXXXX` |
| `attestable_type` / `attestable_id` | uuid morphs, **nullable in v2** | v1 subject is `App\Models\Manuscript`; null for standalone manual subjects (migration `2026_10_22_000002_attestation_v2`) |
| `subject_kind` | string, default `manuscript` (v2) | `manuscript` \| `report` \| `dataset` \| `external_work` \| `other` |
| `entered_via` | string, default `pipeline` (v2) | `pipeline` \| `manual` |
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
  `evidenceManifest()`, `issue()` (v2: claim override + `manual_evidence`),
  `issueManual()` (v2: standalone subjects, `manual_entry_v1`),
  `recordAnchor()` (v2: Pearls/Base anchor recording),
  `verifySignature()`, `revoke()`.

## Pearls anchor-ready fields (tentative)

Owner decision (2026-10-22, tentative): **Pearls is the tentative future
on-chain anchoring layer.** Precise framing: Pearls is not a blockchain — Base
is the chain, and Pearls is the launch platform / contract system on Base.

V1 therefore carries the anchor-ready columns above (`anchor_platform`,
`anchor_chain`, `anchor_contract`, `anchor_tx`, `anchored_at`) and leaves them
**null at issuance**. The expected values are `anchor_platform = 'pearls'`
and `anchor_chain = 'base'`, and only the **subject hash** is anchored
on-chain — never the manuscript content. **V2 status:** the OS side of
anchoring is built (see "On-chain anchor recording" above) — anchoring is
performed via the Pearls AttestationRegistry and recorded in ThinkTank OS.
The contract deploy itself remains gated: Sepolia first, audit before mainnet.

This is **tentative, not a public promise**. The public verification page says
exactly: "Not anchored — anchoring via Pearls on Base is tentative and comes
when volume warrants." V1 is not blocked by Pearls: the Pearls core is
Sepolia/local-only and unaudited, and any mainnet step remains the owner's gate.

## Routes

| Method | Path | Name | Access |
|---|---|---|---|
| GET | `/attestations` | `attestations.index` | public registry (passes `canIssue` for the New attestation link) |
| GET | `/attestations/create` | `attestations.create` | auth; issuers only — **registered before** `attestations.show` so `create` is not captured as a key |
| POST | `/attestations/manual` | `attestations.storeManual` | auth; issuers only (standalone manual subjects) |
| POST | `/attestations/{attestation}/anchor` | `attestations.recordAnchor` | auth; issuers only (record Pearls/Base anchor) |
| POST | `/attestations/verify` | `attestations.verify` | public lookup by public ID or subject hash (registered before show) |
| GET | `/attestations/{key}` | `attestations.show` | public record (key = public ID or uuid) |
| POST | `/manuscripts/{manuscript}/attestations` | `attestations.store` | auth; issuers only; accepts optional `claim`, `evidence_notes`, `evidence_urls[]` |
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
- **Issuance (v2)** — embedded in the process: Kanban card chips, a
  publish → attest prompt that opens the Editorial Studio, and an inline
  claim/evidence form in the Matrix attestation panel (JSON response for the
  axios caller, redirect for Inertia posts). Plus the manual entry page at
  `/attestations/create` (from-manuscript and standalone modes), an
  Attestation chip on the Manuscripts index, and anchor recording in the
  Matrix panel. The public record shows subject kind + entry path.
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
