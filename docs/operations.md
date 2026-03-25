# Operations Guide

## Daily Update Workflow

Workflow file:

- `.github/workflows/daily-update.yml`

Expected outcome:

- new repository candidates are fetched
- new analyses are appended to `data/projects.json`
- latest stats are written to `data/stats.json`
- the current daily slice is written to `data/daily/<date>.json`
- a run log is written to `data/logs/<date>.json`

## Manual Re-analysis

Workflow file:

- `.github/workflows/re-analyze.yml`

Use this when:

- a repository analysis is obviously stale
- model output needs to be refreshed
- prompt changes require recomputing a specific repository

Input format:

- `owner/repo`

## CI Expectations

Workflow file:

- `.github/workflows/ci.yml`

CI should confirm:

- lint is clean
- utility tests pass
- production build still succeeds

## Secrets

Expected secrets for automation:

- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`

Store them only in GitHub Actions secrets. Never commit them into the repository.

## Provider Selection

- Daily workflow defaults to `AI_PROVIDER=gemini`
- Manual re-analysis workflow accepts:
  - `provider`
  - `model`

`model` is optional and overrides the default model configured for the selected provider.

## Maintenance Checklist

- review scheduled workflow runs
- inspect generated daily logs for failures
- refresh docs when workflows or scripts change
- add tests when deterministic utility behavior changes
- close or triage issues so repository stewardship remains visible
