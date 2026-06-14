// ============================================================
// engine.mjs — VERBATIM pooling engine extracted from
// TruthCert-PairwisePro app.js (mahmood726-cyber/truthcert-pairwisepro).
// Only the pure pairwise meta-analysis pooling functions are taken:
//   helpers (sum, pnorm/qnorm, pt/qt, regularizedBeta, ...),
//   tau2 estimators (DL, REML, ProfileLikelihood, PM),
//   calculatePooledEstimate (IV pooled mu + Wald CI),
//   calculateHKSJ (Hartung-Knapp-Sidik-Jonkman CI).
// The TruthCert governance/HMAC/verdict overlay is intentionally excluded.
// A document stub is provided so the snippet loads under Node.
// ============================================================
const document = { getElementById: () => ({ value: '0.05' }) };

function sum(e) {
  return e.reduce((e, t) => e + t, 0)
}

function mean(e) {
  return sum(e) / e.length
}

function variance(e) {
  const t = mean(e);
  return sum(e.map(e => Math.pow(e - t, 2))) / (e.length - 1)
}

function std(e) {
  return Math.sqrt(variance(e))
}

function harmonicMean(e) {
  const t = e.filter(e => e > 0);
  if (0 === t.length) return NaN;
  const n = sum(t.map(e => 1 / e));
  return t.length / n
}

function pnorm(e) {
  const t = e < 0 ? -1 : 1,
    n = Math.abs(e) / Math.sqrt(2),
    a = 1 / (1 + .3275911 * n);
  return .5 * (1 + t * (1 - ((((1.061405429 * a - 1.453152027) * a + 1.421413741) * a - .284496736) * a + .254829592) * a * Math.exp(-n * n)))
}

function qnorm(e) {
  if (e <= 0) return -1 / 0;
  if (e >= 1) return 1 / 0;
  if (.5 === e) return 0;
  const t = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
    n = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
    a = [-.007784894002430293, -.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
    s = [.007784695709041462, .3224671290700398, 2.445134137142996, 3.754408661907416],
    i = .02425;
  let r, o;
  return e < i ? (r = Math.sqrt(-2 * Math.log(e)), (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) / ((((s[0] * r + s[1]) * r + s[2]) * r + s[3]) * r + 1)) : e <= .97575 ? (r = e - .5, o = r * r, (((((t[0] * o + t[1]) * o + t[2]) * o + t[3]) * o + t[4]) * o + t[5]) * r / (((((n[0] * o + n[1]) * o + n[2]) * o + n[3]) * o + n[4]) * o + 1)) : (r = Math.sqrt(-2 * Math.log(1 - e)), -(((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) / ((((s[0] * r + s[1]) * r + s[2]) * r + s[3]) * r + 1))
}

function dnorm(e) {
  return Math.exp(-.5 * e * e) / Math.sqrt(2 * Math.PI)
}

function gamma(e) {
  if (e < .5) return Math.PI / (Math.sin(Math.PI * e) * gamma(1 - e));
  e -= 1;
  const t = [.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -.13857109526572012, 9984369578019572e-21, 1.5056327351493116e-7];
  let n = t[0];
  for (let a = 1; a < 9; a++) n += t[a] / (e + a);
  const a = e + 7 + .5;
  return Math.sqrt(2 * Math.PI) * Math.pow(a, e + .5) * Math.exp(-a) * n
}

function lgamma(e) {
  if (e <= 0) return 1 / 0;
  const t = [.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -.13857109526572012, 9984369578019572e-21, 1.5056327351493116e-7];
  if (e < .5) return Math.log(Math.PI / Math.sin(Math.PI * e)) - lgamma(1 - e);
  e -= 1;
  let n = t[0];
  for (let a = 1; a < 9; a++) n += t[a] / (e + a);
  const a = e + 7 + .5;
  return .5 * Math.log(2 * Math.PI) + (e + .5) * Math.log(a) - a + Math.log(n)
}

function betainc(e, t, n) {
  if (0 === n) return 0;
  if (1 === n) return 1;
  if (n > (e + 1) / (e + t + 2)) return 1 - betainc(t, e, 1 - n);
  const a = lgamma(e) + lgamma(t) - lgamma(e + t),
    s = Math.exp(Math.log(n) * e + Math.log(1 - n) * t - a) / e;
  let i = 1,
    r = 1,
    o = 0;
  for (let a = 0; a <= 200; a++) {
    const s = 2 * a;
    let l = 0 === a ? 1 : a * (t - a) * n / ((e + s - 1) * (e + s));
    o = 1 + l * o, Math.abs(o) < 1e-30 && (o = 1e-30), o = 1 / o, r = 1 + l / r, Math.abs(r) < 1e-30 && (r = 1e-30), i *= o * r, l = -(e + a) * (e + t + a) * n / ((e + s) * (e + s + 1)), o = 1 + l * o, Math.abs(o) < 1e-30 && (o = 1e-30), o = 1 / o, r = 1 + l / r, Math.abs(r) < 1e-30 && (r = 1e-30);
    const d = o * r;
    if (i *= d, Math.abs(d - 1) < 1e-14) break
  }
  return s * i
}

function gammainc(e, t) {
  if (t < 0 || e <= 0) return NaN;
  if (0 === t) return 0;
  if (t < e + 1) {
    let n = 1 / e,
      a = 1 / e;
    for (let s = 1; s < 100 && (a *= t / (e + s), n += a, !(Math.abs(a) < 1e-14 * Math.abs(n))); s++);
    return n * Math.exp(-t + e * Math.log(t) - lgamma(e))
  }
  let n = t + 1 - e,
    a = 1 / 1e-30,
    s = 1 / n,
    i = s;
  for (let t = 1; t < 100; t++) {
    const r = -t * (t - e);
    n += 2, s = r * s + n, Math.abs(s) < 1e-30 && (s = 1e-30), a = n + r / a, Math.abs(a) < 1e-30 && (a = 1e-30), s = 1 / s;
    const o = s * a;
    if (i *= o, Math.abs(o - 1) < 1e-14) break
  }
  return 1 - Math.exp(-t + e * Math.log(t) - lgamma(e)) * i
}

function dt(e, t) {
  return Math.exp(lgamma((t + 1) / 2) - lgamma(t / 2)) / Math.sqrt(t * Math.PI) * Math.pow(1 + e * e / t, -(t + 1) / 2)
}

function pt(t, df) {
  // Student's t CDF using regularized incomplete beta function
  // Validated against R/metafor: pt(2, 10) = 0.9633062
  if (df <= 0) return NaN;
  if (!isFinite(df)) return pnorm(t);
  if (t === 0) return 0.5;

  // For large df, use normal approximation
  if (df > 10000) {
    return pnorm(t);
  }

  const x = df / (df + t * t);
  const ib = regularizedBeta(x, df / 2, 0.5);

  // pt(t, df) = 1 - 0.5 * I_x(df/2, 0.5) for t > 0
  // pt(t, df) = 0.5 * I_x(df/2, 0.5) for t < 0
  return t > 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

function regularizedBeta(x, a, b) {
  // Regularized incomplete beta function I_x(a,b)
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // Use continued fraction expansion
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
  
  // Use symmetry relation for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }
  
  // Continued fraction (Lentz algorithm)
  let f = 1e-30;
  let c = f;
  let d = 0;
  
  for (let m = 0; m <= 200; m++) {
    let am, bm;
    if (m === 0) {
      am = 1;
    } else if (m % 2 === 0) {
      const m2 = m / 2;
      am = m2 * (b - m2) * x / ((a + m - 1) * (a + m));
    } else {
      const m2 = (m - 1) / 2;
      am = -((a + m2) * (a + b + m2) * x) / ((a + m - 1) * (a + m));
    }
    bm = 1;
    
    d = bm + am * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    
    c = bm + am / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    
    f = f * d * c;
    
    if (Math.abs(d * c - 1) < 1e-10) break;
  }
  
  return front * f / a;
}

function qt(e, t) {
  if (e <= 0) return -1 / 0;
  if (e >= 1) return 1 / 0;
  if (.5 === e) return 0;
  if (t <= 0) return NaN;
  let n = qnorm(e);
  for (let a = 0; a < 20; a++) {
    const a = pt(n, t) - e,
      s = dt(n, t);
    if (Math.abs(s) < 1e-15) break;
    const i = a / s;
    if (n -= i, Math.abs(i) < 1e-10 * (1 + Math.abs(n))) break
  }
  return n
}
const tQuantile = qt,
  tCDF = pt,
  chiSquareCDF = pchisq,
  normalCDF = pnorm;

function pchisq(e, t) {
  return e < 0 ? 0 : t <= 0 ? NaN : gammainc(t / 2, e / 2)
}

function dchisq(e, t) {
  if (e < 0) return 0;
  if (t <= 0) return NaN;
  const n = t / 2;
  return Math.pow(e, n - 1) * Math.exp(-e / 2) / (Math.pow(2, n) * gamma(n))
}

function qchisq(e, t) {
  if (e <= 0) return 0;
  if (e >= 1) return 1 / 0;
  if (t <= 0) return NaN;
  const n = 2 / (9 * t);
  let a = t * Math.pow(1 - n + qnorm(e) * Math.sqrt(n), 3);
  a = Math.max(.001, a);
  for (let n = 0; n < 20; n++) {
    const n = pchisq(a, t) - e,
      s = dchisq(a, t);
    if (Math.abs(s) < 1e-15) break;
    const i = n / s;
    if (a = Math.max(.001, a - i), Math.abs(i) < 1e-10 * a) break
  }
  return a
}
let _spareNormal = null;

function randn() {
  if (null !== _spareNormal) {
    const e = _spareNormal;
    return _spareNormal = null, e
  }
  let e, t, n;
  do {
    e = 2 * Math.random() - 1, t = 2 * Math.random() - 1, n = e * e + t * t
  } while (n >= 1 || 0 === n);
  const a = Math.sqrt(-2 * Math.log(n) / n);
  return _spareNormal = t * a, e * a
}

const CONFIG = { REML_DAMPING: .7, MAX_ITERATIONS: 100, CONVERGENCE_TOL: 1e-8 };
function estimateTau2_DL(e, t) {
  const n = e.length,
    a = t.map(e => 1 / e),
    s = sum(a),
    i = sum(a.map(e => e * e)),
    r = sum(e.map((e, t) => a[t] * e)) / s,
    o = sum(e.map((e, t) => a[t] * Math.pow(e - r, 2))),
    l = s - i / s;
  return {
    tau2: Math.max(0, (o - (n - 1)) / l),
    Q: o,
    df: n - 1,
    C: l,
    method: "DL",
    converged: !0
  }
}

function estimateTau2_REML(e, t, n = 100, a = 1e-8) {
  e.length;
  const s = estimateTau2_DL(e, t);
  let i = s.tau2;

  function r(n) {
    const a = t.map(e => 1 / (e + n)),
      s = sum(a),
      i = sum(e.map((e, t) => a[t] * e)) / s,
      r = sum(e.map((e, t) => a[t] * Math.pow(e - i, 2)));
    return -.5 * (sum(t.map(e => Math.log(e + n))) + Math.log(s) + r)
  }
  i < 1e-10 && (i = .01);
  let o = 1 / 0,
    l = 1 / 0,
    d = 0,
    c = CONFIG.REML_DAMPING,
    u = r(i);
  for (let s = 0; s < n; s++) {
    const n = t.map(e => 1 / (e + i)),
      p = sum(n),
      m = sum(e.map((e, t) => n[t] * e)) / p,
      h = n.map(e => e * e),
      v = e.map(e => Math.pow(e - m, 2)),
      g = -.5 * p + .5 * sum(h.map((e, t) => e * v[t])),
      f = .5 * sum(h);
    if (f < 1e-12) return {
      tau2: Math.max(0, i),
      converged: !1,
      iterations: s,
      method: "REML",
      warning: "Fisher information near zero - model may be misspecified"
    };
    let _ = g / f;
    const y = Math.max(2 * i, 1);
    _ = Math.sign(_) * Math.min(Math.abs(_), y);
    let b = i + c * _;
    b = Math.max(1e-10, b);
    let x = r(b),
      w = 0;
    for (; x < u - 1e-8 && w < 5;) c *= .5, b = i + c * _, b = Math.max(1e-10, b), x = r(b), w++;
    if (s > 2) {
      const e = Math.sign(i - o),
        t = Math.sign(o - l);
      if (0 !== e && 0 !== t && e !== t && (d++, c *= .8, d > 5)) {
        const e = (i + o + l) / 3;
        return {
          tau2: Math.max(0, e),
          converged: !1,
          iterations: s,
          method: "REML",
          warning: "Averaged due to oscillation - consider PM or DL estimator"
        }
      }
    }
    if (Math.abs(b - i) < a * Math.max(1, i)) return {
      tau2: Math.max(0, b),
      converged: !0,
      iterations: s + 1,
      method: "REML",
      loglik: x
    };
    l = o, o = i, i = b, u = x, c = Math.min(CONFIG.REML_DAMPING, 1.1 * c)
  }
  const p = estimateTau2_ProfileLikelihood(e, t, i);
  return p.converged ? {
    ...p,
    note: "Fisher scoring failed, used profile likelihood"
  } : {
    tau2: s.tau2,
    converged: !1,
    iterations: n,
    method: "REML",
    warning: "REML failed to converge - using DL estimate. DL may underestimate Ã„² by 20-40% in some cases. Consider using PM estimator for this dataset.",
    fallback: "DL"
  }
}

function estimateTau2_ProfileLikelihood(e, t, n = null, a = 50) {
  e.length;

  function s(n) {
    const a = t.map(e => 1 / (e + n)),
      s = sum(a),
      i = sum(e.map((e, t) => a[t] * e)) / s,
      r = sum(e.map((e, t) => a[t] * Math.pow(e - i, 2)));
    return -.5 * (sum(t.map(e => Math.log(e + n))) + Math.log(s) + r)
  }
  const i = n || estimateTau2_DL(e, t).tau2,
    r = Math.max(10 * i, 5);
  let o = 0,
    l = s(0);
  for (let e = 1; e <= 50; e++) {
    const t = e / 50 * r,
      n = s(t);
    n > l && (l = n, o = t)
  }
  let d = Math.max(0, o - r / 50),
    c = o + r / 50;
  const u = (1 + Math.sqrt(5)) / 2;
  for (let e = 0; e < a && !(c - d < 1e-8); e++) {
    const e = c - (c - d) / u,
      t = d + (c - d) / u;
    s(e) > s(t) ? c = t : d = e
  }
  const p = (d + c) / 2;
  return {
    tau2: Math.max(0, p),
    converged: !0,
    method: "Profile Likelihood",
    loglik: s(p)
  }
}

function estimateTau2_PM(e, t, n = 100, a = 1e-8) {
  const s = e.length;
  let i = estimateTau2_DL(e, t).tau2;
  const r = t.map(e => 1 / e),
    o = sum(r),
    l = sum(e.map((e, t) => r[t] * e)) / o;
  // Q_of_tau2 helper - computes Q statistic for given tau2
  const Q_of_tau2 = (tau2) => {
    const w = t.map(v => 1 / (v + tau2));
    const W = sum(w);
    const theta_w = sum(e.map((yi, idx) => w[idx] * yi)) / W;
    return sum(e.map((yi, idx) => w[idx] * Math.pow(yi - theta_w, 2)));
  };
  if (Q_of_tau2(0) <= s - 1) return {
    tau2: 0,
    converged: !0,
    iterations: 0,
    method: "PM"
  };
  for (let n = 0; n < 20; n++) {
    const r = t.map(e => 1 / (e + i)),
      o = sum(r),
      l = sum(e.map((e, t) => r[t] * e)) / o,
      d = sum(e.map((e, t) => r[t] * Math.pow(e - l, 2)));
    if (Math.abs(d - (s - 1)) < a) return {
      tau2: i,
      converged: !0,
      iterations: n + 1,
      method: "PM"
    };
    const c = o - sum(r.map(e => e * e)) / o;
    i = Math.max(0, i + (d - (s - 1)) / c)
  }
  let d = 0;
  const c = e.map(e => Math.pow(e - l, 2)),
    u = 10 * Math.max(...c);
  let p = Math.max(10 * i, u, 100),
    m = 0;
  for (; Q_of_tau2(p) > s - 1 && p < 1e6 && m++ < 30;) p *= 2;
  for (let e = 0; e < 100; e++) {
    const t = (d + p) / 2,
      n = Q_of_tau2(t);
    if (Math.abs(n - (s - 1)) < a || p - d < a) return {
      tau2: t,
      converged: !0,
      iterations: e + 21,
      method: "PM"
    };
    n > s - 1 ? d = t : p = t
  }
  return {
    tau2: (d + p) / 2,
    converged: !1,
    iterations: 121,
    method: "PM",
    warning: "Bisection did not fully converge"
  }
}

function resolveGenQWeights(e, t = "", n = null) {
  if (Array.isArray(n) && n.length === e.length && n.every(e => isFinite(e) && e > 0)) return n.map(e => Number(e));
  const a = String(t || "").toUpperCase();
  if ("GENQ" === a || "GENQM" === a) {
    const t = e.map(e => 1 / e);
    if (t.every(e => isFinite(e) && e > 0)) return t
  }
  return null
}


function estimateTau2(e, t, n = "REML") {
  const a = { DL: estimateTau2_DL, REML: estimateTau2_REML, PM: estimateTau2_PM, PL: estimateTau2_ProfileLikelihood };
  return (a[n] || a.REML)(e, t);
}
function calculatePooledEstimate(e, t, n = 0, a = null, s = null) {
  e.length;
  let i = n,
    r = a,
    o = s;
  "object" == typeof n && null !== n && (i = isFinite(n.tau2) ? Number(n.tau2) : 0, r = r || n.method || null, Array.isArray(n.weights) && (o = n.weights));
  isFinite(i) && i >= 0 || (i = 0);
  const l = resolveGenQWeights(t, r, o);
  let d, c, u, p;
  if (l) {
    c = l, u = sum(c), d = sum(e.map((e, t) => c[t] * e)) / u;
    const n = sum(e.map((e, n) => c[n] * c[n] * (t[n] + i))) / (u * u);
    if (!(isFinite(n) && n >= 0)) return {
      theta: NaN,
      se: NaN,
      ci_lower: NaN,
      ci_upper: NaN,
      z: NaN,
      p_value: NaN,
      weights: c,
      weights_pct: c.map(e => e / u * 100)
    };
    p = Math.sqrt(n)
  } else c = t.map(e => 1 / (e + i)), u = sum(c), d = sum(e.map((e, t) => c[t] * e)) / u, p = Math.sqrt(1 / u);
  const m = 1.959964,
    h = p > 0 ? d / p : NaN;
  return {
    theta: d,
    se: p,
    ci_lower: d - m * p,
    ci_upper: d + m * p,
    z: h,
    p_value: isFinite(h) ? 2 * (1 - pnorm(Math.abs(h))) : NaN,
    weights: c,
    weights_pct: c.map(e => e / u * 100)
  }
}


// Alias for backward compatibility - pooledEstimate_RE was referenced but not defined
const pooledEstimate_RE = calculatePooledEstimate;
// Make globally accessible
if (typeof window !== 'undefined') window.pooledEstimate_RE = pooledEstimate_RE;

function calculateHKSJ(e, t, n, a, s = .05) {
  const i = e.length,
    r = t.map(e => 1 / (e + a)),
    o = sum(r),
    l = sum(e.map((e, t) => r[t] * Math.pow(e - n, 2))) / (i - 1),
    d = l < 1,
    c = Math.max(1, l),
    u = Math.sqrt(c / o),
    p = i - 1,
    m = qt(1 - s / 2, p),
    h = n / u;
  return {
    se_hksj: u,
    ci_lower: n - m * u,
    ci_upper: n + m * u,
    t_stat: h,
    p_value: 2 * (1 - pt(Math.abs(h), p)),
    df: p,
    q_hksj: c,
    q_raw: l,
    q_bounded: d,
    warning: d ? "HKSJ q < 1 (bounded to 1): suggests possible model misspecification or Ã„² overestimation" : null
  }
}

export { sum, mean, variance, pnorm, qnorm, pt, qt, pchisq,
         estimateTau2_DL, estimateTau2_REML, estimateTau2_PM, estimateTau2_ProfileLikelihood,
         estimateTau2, calculatePooledEstimate, calculateHKSJ };
