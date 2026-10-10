# SOP-009 · International Standards for Data Harmonization

**Status:** DRAFT v0.1 · 2026-10-10 · Not binding until approved
**Owner:** Department Director (Research) · **Approver:** President

## Purpose

Data structured to international standards can be pooled, compared, audited, and submitted to regulators. Data structured to local habit cannot. Glenride builds datasets others must be able to trust and combine — so Glenride builds to the harmonized standards from the start, not as a retrofit before submission.

## Scope

Any dataset Glenride builds, evaluates, licenses, or publishes — clinical or otherwise. Standards are applied at protocol/design stage; retrofitting is a documented exception, not the plan.

## Procedure

1. **The harmonized framework: ICH.** The International Council for Harmonisation sets the shared technical expectations across the US, EU, Japan, and other member regulators. The working set:
   - **ICH E6(R3)** — Good Clinical Practice: how trials are designed, conducted, recorded, and reported (adopted January 2025).
   - **ICH E8(R1)** — General Considerations for Clinical Studies: quality-by-design principles for the overall development plan.
   - **ICH E9** — Statistical Principles for Clinical Trials: how analyses are planned and reported so results mean what they claim.
   When Glenride evaluates a development program, these are the yardsticks — check the program against them explicitly.

2. **The data standards: CDISC.** The Clinical Data Interchange Standards Consortium defines how clinical data is structured end to end. Apply the right standard at the right stage:
   - **CDASH** — how data is *collected* (case report form standards). Start here; collection defines everything downstream.
   - **SDTM** — how data is *tabulated* for submission (one record per finding per subject per visit logic).
   - **ADaM** — how data is *analyzed* (analysis-ready datasets traceable to SDTM).
   - **CDISC Controlled Terminology** — the shared vocabulary across all three. Free text where a controlled term exists is a defect.
   Data that moves CDASH → SDTM → ADaM with full traceability is submission-grade. Data that can't trace back to its collection is not.

3. **Controlled vocabularies for safety and medications.** Adverse events coded in **MedDRA**; medications coded in **WHODrug** (or documented equivalent). Verbatim terms are retained alongside codes — the code never replaces the original report.

4. **Design-stage application.** The data-standards decision is made when the protocol or analysis plan is written (see SOP-001 and the data-management SOPs), not when the dataset is "done." The DMP names the standards, versions, and dictionaries up front.

5. **Evaluation work.** When Glenride evaluates someone else's dataset or trial data, the assessment states which standards the data meets, which it doesn't, and what that gap costs in usability — explicitly, in the study record. "Non-standard" is a finding, not a footnote.

## Records

- Standards, versions, and dictionaries declared in each study's DMP.
- Traceability documentation (collection → tabulation → analysis) for datasets Glenride builds.
- Standards-gap assessments for datasets Glenride evaluates.

## Review

Annually, or when ICH or CDISC publishes revisions that change the working set.

## Basis

ICH E6(R3), E8(R1), E9; CDISC CDASH/SDTM/ADaM standards and Controlled Terminology; FAIR data principles (standards are how data becomes interoperable and reusable).
