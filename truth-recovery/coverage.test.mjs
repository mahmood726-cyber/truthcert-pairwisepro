// node --test truth-recovery/coverage.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCell } from './harness.mjs';
import { qt, pt, calculateHKSJ, estimateTau2_DL } from './engine.mjs';

// 1. Numerical helpers match R/metafor (load-bearing for HKSJ t-CI).
test('qt/pt match R reference values', () => {
  assert.ok(Math.abs(qt(0.975, 4) - 2.7764451) < 1e-4, 'qt(.975,4)');
  assert.ok(Math.abs(pt(2, 10) - 0.9633062) < 1e-5, 'pt(2,10)');
});

// 2. Under no selection, HKSJ recovers ~nominal 95% coverage of the true mu.
test('HKSJ ~nominal coverage under no selection (small k)', () => {
  const r = runCell({ mu: 0.30, tau2: 0.05, k: 5, scenario: 'none', nRep: 4000, seed: 7 });
  const hksj = r.methods.REML.hksjCover;
  assert.ok(hksj >= 0.93 && hksj <= 0.975, `HKSJ coverage ${hksj} not ~0.95`);
});

// 3. DL/REML + Wald UNDER-covers at small k, and HKSJ beats it by several pp.
test('Wald under-covers; HKSJ recovers truth (HKSJ - Wald >= ~3pp)', () => {
  const r = runCell({ mu: 0.30, tau2: 0.05, k: 5, scenario: 'none', nRep: 4000, seed: 11 });
  const m = r.methods.DL;
  assert.ok(m.waldCover < 0.93, `Wald coverage ${m.waldCover} should under-cover`);
  assert.ok(m.hksjCover - m.waldCover >= 0.03,
    `HKSJ should beat Wald by >=3pp, got ${(m.hksjCover - m.waldCover).toFixed(3)}`);
});

// 4. Strong publication selection biases pooled mu upward and wrecks coverage
//    for ALL methods (pooling cannot undo selection — honest negative).
test('strong step-selection inflates bias and collapses coverage', () => {
  const r = runCell({ mu: 0.30, tau2: 0.05, k: 8, scenario: 'step_strong', nRep: 3000, seed: 3 });
  assert.ok(r.methods.REML.bias > 0.10, `expected upward bias, got ${r.methods.REML.bias}`);
  assert.ok(r.methods.REML.hksjCover < 0.75,
    `expected coverage collapse under selection, got ${r.methods.REML.hksjCover}`);
});

// 5. HKSJ q<1 floor: bounded q must never produce a CI narrower than tau2=0 IV.
test('HKSJ q<1 is floored to 1 (never narrows below DL Wald)', () => {
  // Homogeneous-ish data -> q_raw < 1 likely; ensure bounded flag honored.
  const yi = [0.30, 0.31, 0.29, 0.30, 0.305];
  const vi = [0.05, 0.05, 0.05, 0.05, 0.05];
  const t2 = estimateTau2_DL(yi, vi).tau2;
  const mu = 0.301;
  const h = calculateHKSJ(yi, vi, mu, t2);
  assert.ok(h.q_hksj >= 1, `q must be floored to >=1, got ${h.q_hksj}`);
  assert.ok(h.ci_upper > h.ci_lower, 'CI must be ordered');
});
