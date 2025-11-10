# Bundle baseline & CI comparison

This document explains how we store a visualizer baseline and how CI compares a PR build to the baseline.

Where baselines live
- Tracked baselines are stored under `baselines/<timestamp>-<sha>/` and contain at least:
  - `dashboard-visualizer.html` — the rollup-plugin-visualizer output from a known-good build
  - `visualizer-report.md` — the human-readable report produced by `tools/parse_visualizer.js`

Quick commands

- List baselines:
  - `node tools/baseline_manager.js list`
- Set an active baseline (copies the folder to `baselines/active`):
  - `node tools/baseline_manager.js set baselines/20251110_170523-b4f573a`
- Compare current build to baseline (default threshold 10% increase):
  - `VISUALIZER_THRESHOLD_PERCENT=10 node tools/compare_visualizer.js --baseline baselines/20251110_170523-b4f573a --current tmp/artifacts-19227603274/dashboard-visualizer.html`

CI integration

The intended CI flow:
1. Build dashboard with ANALYZE=true and upload `dashboard-visualizer.html` as an artifact.
2. Checkout repository to read `baselines/active` (or a named baseline folder).
3. Run `node tools/compare_visualizer.js --baseline baselines/active --current tmp/dashboard-visualizer.html`.
4. If the comparator exits non-zero, fail the job and comment the summary on the PR.

Notes
- The comparator looks for vendor assets by default using regex `vendor_`. You can change this by setting `VISUALIZER_VENDOR_REGEX` in the workflow.
- Threshold is a percent increase over baseline (default 10%). A baseline of 0 will treat any current gzip >0 as 100% increase and will fail if threshold <100%.
