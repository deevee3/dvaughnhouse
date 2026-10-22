# Attestations in ThinkTank OS — Witness v1 / v2

**Status:** V1 shipped 2026-10-22 (commit `551fcd1`). V2 shipped 2026-10-22 (commit `dcaef87`).
**Concept source:** `~/workspace/your_files/attestation-layer/concept.md` (2026-10-13; model settled 2026-10-22, see below).
**Owner direction (2026-10-22):** attestation is a main feature of ThinkTank OS, not a side concept.
**Owner direction (v2, 2026-10-22):** attestation must be embedded in the manuscript process, authorized users must be able to manually enter information and attest (pipeline and standalone subjects), and attestations must be able to get on chain via Pearls.
**Credits v1 (2026-10-22, built — working tree):** STANZA-backed credit ledger per the owner's blueprint — see "Credits (STANZA)" below.

## The model (settled by the owner, 2026-10-22)

1. **Publishing is a permanent record.** When a user publishes, they are permanently recording their submission on **SpinWave, a project of Glenride**. Publication is the act of recording, not a reversible draft state.
2. **SpinWave is the database.** Manuscripts and attestation certificates are stored physically on SpinWave — the permanent store of record. ThinkTank OS is the working surface; SpinWave is where the records live.
3. **STANZA is the on-Base representation.** The records are verifiable and represented by **STANZA on Base**. The Pearls AttestationRegistry anchors the hashes on Base; STANZA is the public representation of that proof layer. **Mechanic decided 2026-10-22: STANZA represents via the Pearls registry** — the registry deploys with the STANZA treasury Safe (`0x0f166D7631350dE1F9c4190dEA4fAE9565B19231`) as its on-chain `ISSUER`, so anchors are made by the STANZA Safe. No certificate tokens are minted per attestation at launch; they remain a possible later layer.
4. **Attestations are prepaid from budgets.** A study's or project's budget pays for its attestations up front. Attestation is a budgeted line item.
5. **Vendor requirement.** Attestation is positioned to be a likely vendor requirement of study design — sponsors will require it as part of the study's vendor setup.

Queued build implications: publish-time immutable record snapshot (the SpinWave record) in ThinkTank OS; a per-project attestation budget/credit module; the STANZA representation mechanic per the owner's pick.

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

## SpinWave records — the permanent publish-time snapshot

Per the settled model, publishing **is** recording: the submission is
permanently recorded on **SpinWave, a project of Glenride** — the database
of record for manuscripts and attestation certificates. ThinkTank OS makes
that permanence a system property, not a policy:

- **What a record is:** a row in `manuscript_records` (migration
  `2026_10_22_000003`) holding the manuscript id, a `version`, a
  `record_hash`, a JSONB `snapshot` (title, abstract, author name, word
  count, brief SHA-256 when a synthesized brief exists, the three
  compliance booleans, `published_at`), who recorded it, and timestamps.
- **When it is created:** when a manuscript transitions **into**
  `published` — `PortfolioMatrixController::updateStatus` (the only status
  transition path) calls `App\Services\SpinWave\RecordService::recordPublication()`
  with the acting user, serialized under a row lock. Unpublishing and all
  other transitions create nothing.
- **Idempotent re-publish:** if the content is unchanged since the latest
  record (the recomputed hash equals the latest record's hash), no
  duplicate version is written. A content change re-published later earns
  the next version — history is a chain of versions, never an edit.
- **Hash parity:** the record hash is `AttestationService::subjectHash()`
  itself — same inputs, same precedence (synthesized brief file, else raw
  file, else canonical `title | abstract | author id | published_at`).
  So a record created at publish carries exactly the `subject_hash` an
  attestation will bear for unchanged content, and attestations bind back
  to the record: `issue()` adds `spinwave_record` (`record_id`, `version`,
  `record_hash`) to the evidence manifest when a record exists.
- **Append-only:** `ManuscriptRecord` throws on update, and on delete
  while its manuscript exists. The only removal is the database cascade
  when the manuscript itself is deleted.
- **Backfill:** `php artisan spinwave:backfill-records` creates v1 records
  for manuscripts published before recording shipped, keeping each
  manuscript's existing `published_at`. For an already-attested brief with
  unchanged content, the backfilled record hash equals the attestation's
  `subject_hash`.
- **Where records surface:** the Matrix Editorial Studio shows a
  "SpinWave Record" block (version, short hash, recorded date, or
  "Not recorded — recording happens at publish."); the public Library
  brief page prints "Recorded on SpinWave · v{n} · {date} · {short hash}"
  under the attestation seal; the landing page appends
  "SpinWave record v{n}" to a featured brief's meta line when present.

## Credits (TTOS) — the STANZA-backed prepaid budget ledger

Per the settled model, **attestations are prepaid from budgets**: a study's
or project's budget pays for its attestations up front. The credit system
(owner blueprint, adopted 2026-10-22) makes that real: the credit unit is
**TTOS** (ThinkTank OS credits) — STANZA-backed service credits, held in an
off-chain relational ledger that syncs with on-chain STANZA deposits —
on-chain microtransactions per service call would be cost-prohibitive and
slow.

### Rate and formulas

- **Fixed internal rate:** `75 TTOS = $1.00 USD`
  (`config('credits.credits_per_usd') = 75`, so `V_cr = 1/75 USD`). The
  fixed rate isolates the ledger from token volatility: STANZA's price is
  dynamic (paired with wTAO on Base), but once a deposit is converted, the
  TTOS balance does not float.
- **Deposit allocation:**
  `TTOS Allocated = STANZA Deposited × STANZA Price USD × 75`.
  Example: 250,000 STANZA at $0.0004 = $100 → 7,500 TTOS.
- **Service cost:** `Cost_cr = C_op / V_cr`, where `C_op` is the raw
  operational cost of one service execution (compute/API + hosting
  overhead). The **attestation price** is
  `config('credits.attestation_price_credits') = 75` TTOS ($1.00 of
  service; owner decision, 2026-10-22).

### Accounts and ledger (migration `2026_10_22_000004`)

- **`credit_accounts`** — a study/project budget: `name`, optional owner
  `user_id`, optional `wallet_address` (the deposit sender this budget is
  matched by), and a `balance` column kept in sync **inside the same
  transaction** as every ledger write (never recomputed from a sum on read).
- **`credit_transactions`** — the append-only ledger: signed `amount`
  (+ in / − out), `type`
  (`deposit|grant|attestation|adjustment|refund`), and for deposits the
  chain evidence (`blockchain_tx_hash`, `log_index`, `token_amount`,
  `token_price_usd`). `UNIQUE(blockchain_tx_hash, log_index)` — a chain
  deposit can be credited exactly once; manual rows carry a null hash.
- **`manuscripts.credit_account_id`** — a manuscript may link to one
  account (set at intake; the intake form offers an optional account
  select). `App\Services\Credits\CreditService` is the only writer:
  `grant()`, `recordDeposit()` (idempotent per tx + log index),
  `debitForAttestation()`, and `refund()` all lock the account row and
  round to 2 decimals at every write.

### Attestation debit semantics

`AttestationService::issue()` wraps record creation and the debit in **one
database transaction**. When the manuscript has a `credit_account_id` and
`config('credits.enforce_balance')` is `true` (the default), a **newly
created** attestation debits the account the attestation price
(`type = attestation`, `reference = <public_id>`); an insufficient balance
throws `DomainException` — the attestation rolls back with it and the
issuer sees the 422/error through the existing store path. Idempotent
re-issuance (an existing active attestation returned for the same subject
hash) is **never** charged. Manuscripts with **no** credit account are
never debited or blocked — the existing flow, including already-published
briefs, is unaffected. Manual standalone attestations
(`issueManual()`) are not debited in v1.

### Deposit paths

1. **Manual record (today's prepaid-study path):** the study sends STANZA
   to the deposit address (`config('credits.deposit_address')`, default
   the STANZA treasury Safe) and an orchestrator records the confirmed
   deposit on `/credits` with the tx hash, STANZA amount, and the USD
   price used — `recordDeposit()` allocates the credits.
2. **Watcher pipeline (built, off by default):** `App\Jobs\WatchStanzaDeposits`
   (run via `php artisan credits:watch-deposits`, or dispatch the job)
   polls `eth_getLogs` on Base for STANZA `Transfer` events **to** the
   deposit address, matches senders to accounts by `wallet_address`, and
   credits through the same idempotent `recordDeposit()`. It keeps its
   block cursor in the cache (database store) with a 12-block reorg
   buffer, and is defensive: RPC failure is logged, never fatal. The
   price source is **manual** (`config('credits.stanza_price_usd')`,
   env `CREDITS_STANZA_PRICE_USD`) until the STANZA pool has real
   liquidity — when no price is configured the watcher skips crediting
   and logs a warning rather than inventing one. Enable with
   `CREDITS_WATCHER_ENABLED=true`.
3. **Grants:** orchestrators can also grant credits directly
   (`POST /credits/{account}/grant`) for operator-funded budgets.

### Administration

`/credits` (index: balances, account creation, grant + deposit forms,
recent activity) and `/credits/{account}` (full ledger) are restricted to
**orchestrator/admin** roles (403 otherwise), enforced in
`CreditController`; the nav link renders only for those roles.

### Refunds (policy decided by the owner, 2026-10-22)

**Unused TTOS are refundable back to STANZA.** The policy:

- **Price basis:** the STANZA quantity is computed at the **lower of the
  original price and the current market price**. The original price is
  the account's weighted-average deposit price (priced `deposit` ledger
  rows, weighted by STANZA amount). Accounts with no priced deposits
  (grant-funded) refund at the **current** price as the basis — no
  gain/loss adjustment. `STANZA out = TTOS / 75 / basis`.
  Worked example: refunding 150 TTOS with an original average price of
  $0.002 and a current price of $0.003 → basis $0.002 → 150 / 75 / 0.002
  = **1,000 STANZA out**. (If the current price had fallen to $0.001, the
  basis would be $0.001 and the refund would pay 2,000 STANZA.)
- **Eligibility:** a refund tied to an attestation becomes eligible only
  **after midnight (America/New_York) on the day of that attestation** —
  i.e. from 00:00 the following day, New York time. `CreditService::refund()`
  enforces this against the attestation's `issued_at`; refunds with no
  attestation attached carry no time gate.
- **Execution (v1):** orchestrator-executed and recorded. The STANZA
  payout itself is a transfer from the treasury Safe performed **outside
  the app**; the orchestrator records the refund at
  `POST /credits/{account}/refund` (`credits.refund`) with the current
  price, the optional attestation public ID, and the payout tx hash when
  sent. The ledger row is `type = refund`, `amount = −TTOS`,
  `token_amount = STANZA out`, `token_price_usd = basis`. A refund at an
  unknown (zero/missing) current price is refused — the system never
  refunds at an invented price.

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
  `isAttested()`, `records()` / `latestRecord()` (SpinWave records).
- `App\Models\ManuscriptRecord` — the append-only publish-time snapshot
  (see "SpinWave records" above); `manuscript()`, `recorder()`.
- `User`: `attestations()` (as verifier), `canIssueAttestations()`.
- `App\Services\SpinWave\RecordService` — `recordPublication()`.
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
