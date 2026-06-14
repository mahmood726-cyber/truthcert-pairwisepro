# Truth-Recovery Validation — TruthCert-PairwisePro

**Repo:** mahmood726-cyber/truthcert-pairwisepro
**Engine under test:** app.js (1.05 MB) — the pairwise meta-analysis pooling core
behind TruthCert-PairwisePro-v1.0.html. The TruthCert governance / HMAC / verdict
overlay was EXCLUDED; only the pure pooling estimators were extracted.
**Date:** 2026-06-14 · seeded known-(mu, tau2) RE DGP + publication selection,
95% target, nRep=4000, mu=0.30.

## VERDICT: GENUINE METHODS ENGINE — PASS (one default recommendation)

Real pairwise MA engine: 17 tau2 estimators (DL, REML, PM, ML, SJ, EB, ...), IV
pooling, HKSJ, Q-profile tau2 CI, bivariate/3-level/cumulative/survival extensions.
Extracted functions VERBATIM. Helpers validated vs R: qt(0.975,4)=2.7764
(R 2.7764451), pt(2,10)=0.9633060 (R 0.9633062).

## Measured coverage of the true mu (95% target)

| k  | tau2 | scenario      | method | Wald % | HKSJ % | bias    |
|----|------|---------------|--------|--------|--------|---------|
| 5  | 0.05 | none          | DL     | 89.1   | 96.2   | +0.0003 |
| 5  | 0.05 | none          | REML   | 88.2   | 96.2   | +0.0003 |
| 8  | 0.05 | none          | DL     | 88.9   | 94.3   | +0.0018 |
| 20 | 0.05 | none          | DL     | 92.4   | 94.6   | -0.0004 |
| 5  | 0.10 | none          | REML   | 86.4   | 94.9   | -0.0005 |
| 8  | 0.05 | step_strong   | REML   | 37.3   | 55.5   | +0.195  |
| 8  | 0.05 | copas_strong  | REML   | 78.1   | 87.3   | +0.108  |

## Findings

1. DL/REML/PM + Wald (normal) CI UNDER-COVERS at small k — 86-89% vs 95% nominal at
   k=5-8 (textbook anti-conservatism with few studies).
2. HKSJ recovers the truth. Same tau2, Hartung-Knapp t_{k-1} CI lifts coverage to
   ~94-96%: +6-8 pp at k=5, +5 pp at k=8 — exactly as predicted. Nominal across tau2/k.
3. q<1 floor correct. calculateHKSJ bounds the scale to max(1,q) (app.js:2569) and uses
   qt(1-alpha/2, k-1), not qnorm — matches small-k rules. Bounded fired 34-69% of reps,
   never inverted/narrowed below IV.
4. Bias ~0 under no selection (|bias|<0.002) for all estimators; gap is purely CI-width,
   which HKSJ fixes.
5. Publication selection — HONEST NEGATIVE. Strong step selection: bias +0.195, coverage
   ~37% Wald / ~55% HKSJ. Strong Copas: bias +0.108, ~78/87%. No tau2/CI choice undoes
   selection; pooling recovers the published mean, not the unconditional truth. Correct
   and expected — a limitation of pooling, not a bug.
6. PI coverage of a future true theta (REML, t_{k-1}, Cochrane v6.5) is 84-89% under no
   selection — slightly low at smallest k, consistent with known small-k PI under-coverage;
   NOT over-covering.

## Recommendation

- HKSJ is already the default CI (settings.hksj = true) — the correct truth-recovering
  choice; keep it.
- Default tau2 estimator is DL (settings.tau2Method = "DL"). Coverage was fine because
  HKSJ carries the CI, but per the small-k rule DL can underestimate tau2 for k<10;
  recommend defaulting to REML or PM for k<10 while retaining HKSJ. (REML/PM coverage
  here was indistinguishable from DL once HKSJ is on.)
- Surface a caveat that pooling recovers the published mean; pair the pooled estimate
  with the engine's existing selection-model / PET-PEESE diagnostics under suspected bias.

Reproduce: node truth-recovery/harness.mjs ; node --test truth-recovery/coverage.test.mjs (5/5 pass).
