# CI helper scripts (tools/ci)

This folder contains small helper scripts used when iterating on GitHub Actions runs and artifacts locally.
They are convenience tools for debugging CI failures and downloading artifacts from runs.

All scripts are written for PowerShell on Windows; some work under bash with minor edits.

Files
- `monitor_fast.ps1` — watch the latest run for the current branch and download artifacts on failure (uses `gh` CLI).
- `wait_and_download_run.ps1` — wait for a specific run number to finish, then download artifacts to `artifacts/run-<number>`.
- `download_artifact_by_url.ps1` — download a single artifact archive via its archive URL (uses `GITHUB_TOKEN` or `gh auth token`).
- `download_artifacts_for_run.ps1` — helper that prefers `gh run download` and falls back to per-artifact URL download.
- `curl_download_artifact.ps1` — curl-based artifact downloader (alternate when Invoke-WebRequest has issues).

Quick examples (PowerShell)

# 1) Monitor the latest run for current branch and download artifacts if it fails
.
.
# Usage (example):
# .\tools\ci\monitor_fast.ps1 -Branch 'ci/harden-all-fks-20251112' -Workflow 'ci-e2e-clean.yml'

# 2) Wait for a specific run and download artifacts
# .\tools\ci\wait_and_download_run.ps1 -RunNumber 123

# 3) If `gh run download` fails, download artifacts by URL (you will need an auth token)
# Get a token (or `gh auth token`) and set env var GITHUB_TOKEN first in PowerShell:
# $env:GITHUB_TOKEN = $(gh auth token)
# .\tools\ci\download_artifact_by_url.ps1 -ArtifactUrl "https://api.github.com/.../zip" -OutDir "artifacts/manual"

# 4) curl-based download (alternate)
# .\tools\ci\curl_download_artifact.ps1 -ArtifactUrl "https://..." -OutDir "artifacts/manual"

Notes
- These scripts assume `gh` (GitHub CLI) is installed and authenticated. `gh auth login` or `gh auth token` can be used.
- `GITHUB_TOKEN` environment variable may be required for direct downloads (the scripts call `gh auth token` when available).
- The `tmp/` directory is used for runtime artifacts (logs and markers) and remains ignored by git; helper tooling moved to `tools/ci/`.

If you want additional wrappers (e.g., automatic extraction + search for `seed_admin.log`), tell me which pattern you prefer and I can add it.
