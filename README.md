# TruthCert-PairwisePro v1.0

**Browser-based evidence synthesis platform with meta-analysis, TruthCert verdict system, and integrated HTA.**

## Quick Start

1. Download `TruthCert-PairwisePro-v1.0.html` and the `vendor/` folder
2. Open the HTML file in Chrome, Firefox, Safari, or Edge
3. Click **Demos** to load sample data, then **Run Analysis**

No installation, no server, no programming required.

## Features

- **17 heterogeneity estimators** (DL, REML, PM, ML, HS, SJ, EB, and more)
- **6 effect size types** (OR, RR, RD, SMD/Hedges' g, MD, HR, proportions, correlations)
- **12+ publication bias methods** (Egger, trim-and-fill, Copas, PET-PEESE, and more)
- **TruthCert verdict system** --- 12-point threat assessment with quantified operating characteristics
- **S14-HTA+ module** --- ICER, NMB, PSA, EVPI, CEAC, tornado diagrams
- **WebR in-browser validation** --- verify results against R metafor directly in the browser
- **GRADE assessment** --- structured certainty-of-evidence evaluation
- **Export** --- R, Python, JSON, CSV, Excel, PDF, Word

## Validation

109/109 tests passed against R metafor v4.4-0. Run `tests/validate_pairwisepro.R` to verify independently.

## Citation

> Ahmad M, Kumar N, Dar B, Khan L, Woo A. TruthCert-PairwisePro v1.0: a browser-based evidence synthesis platform. *F1000Research*. 2026. [DOI pending]

## License

MIT
