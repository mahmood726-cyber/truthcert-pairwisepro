// ============================================================
// harness.mjs — Truth-recovery coverage harness for the
// TruthCert-PairwisePro pooling engine.
//
// Inject a KNOWN (mu, tau2) random-effects model (+ optional
// publication selection) via the seeded DGP, then measure how often
// each pooling method's 95% interval covers the TRUE mu. Also bias
// and prediction-interval coverage of a future true theta.
//
// All pooling uses the repo's OWN extracted functions — nothing is
// re-implemented here.
// ============================================================
import { generate, makeRng } from './dgp.mjs';
import {
  estimateTau2, calculatePooledEstimate, calculateHKSJ, qt,
} from './engine.mjs';

const Z = 1.959964;

// One replicate: fit and return interval-membership flags + bias.
function fitOnce(yi, vi, muTrue, tau2Method) {
  const t2 = estimateTau2(yi, vi, tau2Method).tau2;
  const pooled = calculatePooledEstimate(yi, vi, t2);
  const mu = pooled.theta;

  // (a) DL/REML/PM + Wald (normal) CI
  const waldLo = pooled.ci_lower, waldHi = pooled.ci_upper;
  const waldCover = muTrue >= waldLo && muTrue <= waldHi ? 1 : 0;

  // (b) same tau2 + HKSJ CI
  const h = calculateHKSJ(yi, vi, mu, t2);
  const hksjCover = muTrue >= h.ci_lower && muTrue <= h.ci_upper ? 1 : 0;

  // (c) prediction interval for a NEW true theta ~ N(mu, tau2):
  //     mu_hat +/- t_{k-1} * sqrt(se^2 + tau2)   (Cochrane v6.5, t_{k-1})
  const k = yi.length;
  const piSe = Math.sqrt(pooled.se * pooled.se + t2);
  const tcrit = k > 1 ? qt(0.975, k - 1) : NaN;
  const piLo = mu - tcrit * piSe, piHi = mu + tcrit * piSe;

  return { mu, waldCover, hksjCover, waldWidth: waldHi - waldLo,
           hksjWidth: h.ci_upper - h.ci_lower, piLo, piHi, qBounded: h.q_bounded };
}

export function runCell({ mu = 0.30, tau2 = 0.05, k = 8, scenario = 'none',
                          nRep = 4000, seed = 12345, tau2Methods = ['DL', 'REML', 'PM'] }) {
  const rng = makeRng(seed);
  const acc = {};
  for (const m of tau2Methods) acc[m] = { wald: 0, hksj: 0, bias: 0, waldW: 0, hksjW: 0, qBnd: 0 };
  let piCover = 0, piDenom = 0, degenerate = 0;

  for (let r = 0; r < nRep; r++) {
    const { yi, vi, info } = generate(mu, tau2, k, scenario, rng);
    if (info.degenerate) degenerate++;
    // a fresh future true theta for PI coverage (uses REML as reference fit)
    const futureTheta = mu + Math.sqrt(tau2) * (Math.SQRT2 * inverseErf(2 * rng() - 1));
    for (const m of tau2Methods) {
      const f = fitOnce(yi, vi, mu, m);
      acc[m].wald += f.waldCover;
      acc[m].hksj += f.hksjCover;
      acc[m].bias += (f.mu - mu);
      acc[m].waldW += f.waldWidth;
      acc[m].hksjW += f.hksjWidth;
      acc[m].qBnd += f.qBounded ? 1 : 0;
      if (m === 'REML') {
        if (Number.isFinite(f.piLo)) {
          piDenom++;
          if (futureTheta >= f.piLo && futureTheta <= f.piHi) piCover++;
        }
      }
    }
  }

  const out = { mu, tau2, k, scenario, nRep, degenerate, methods: {} };
  for (const m of tau2Methods) {
    out.methods[m] = {
      waldCover: acc[m].wald / nRep,
      hksjCover: acc[m].hksj / nRep,
      bias: acc[m].bias / nRep,
      waldWidth: acc[m].waldW / nRep,
      hksjWidth: acc[m].hksjW / nRep,
      qBoundedFrac: acc[m].qBnd / nRep,
    };
  }
  out.piCoverREML = piDenom ? piCover / piDenom : NaN;
  return out;
}

// Inverse error function (Winitzki approximation) for drawing the future theta.
function inverseErf(x) {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const t1 = 2 / (Math.PI * a) + ln / 2;
  return Math.sign(x) * Math.sqrt(Math.sqrt(t1 * t1 - ln / a) - t1);
}

// CLI: print a sweep table when run directly.
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].endsWith('harness.mjs')) {
  const cells = [
    { k: 5,  tau2: 0.05, scenario: 'none' },
    { k: 8,  tau2: 0.05, scenario: 'none' },
    { k: 20, tau2: 0.05, scenario: 'none' },
    { k: 5,  tau2: 0.10, scenario: 'none' },
    { k: 8,  tau2: 0.05, scenario: 'step_strong' },
    { k: 8,  tau2: 0.05, scenario: 'copas_strong' },
  ];
  console.log('mu=0.30 | 95% target | nRep=4000\n');
  console.log('k  tau2  scenario      | method  Wald%  HKSJ%   bias    qBnd%');
  console.log('-'.repeat(72));
  for (const c of cells) {
    const r = runCell({ mu: 0.30, ...c });
    for (const m of ['DL', 'REML', 'PM']) {
      const x = r.methods[m];
      console.log(
        `${String(c.k).padEnd(2)} ${c.tau2.toFixed(2)}  ${c.scenario.padEnd(13)} | ` +
        `${m.padEnd(6)} ${(x.waldCover * 100).toFixed(1).padStart(5)} ` +
        `${(x.hksjCover * 100).toFixed(1).padStart(6)} ` +
        `${x.bias.toFixed(4).padStart(7)} ${(x.qBoundedFrac * 100).toFixed(0).padStart(5)}`);
    }
    console.log(`   PI coverage (REML, t_{k-1}): ${(r.piCoverREML * 100).toFixed(1)}%`);
    console.log('-'.repeat(72));
  }
}
