# GitHub Explorer

[![CI](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/ci.yml)
[![Daily Update](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/daily-update.yml/badge.svg)](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/daily-update.yml)
[![Re-analyze](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/re-analyze.yml/badge.svg)](https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/re-analyze.yml)

`GitHub Explorer` is a public curation dashboard for discovering promising GitHub projects, with a focus on AI, agent tooling, developer workflows, and fast-moving open-source trends.

It combines GitHub search, README ingestion, model-generated interpretation, and daily snapshots into a small maintainer-friendly workflow:

- Fetch trending and classic repositories from GitHub every day.
- Analyze new repositories into structured summaries instead of raw links.
- Surface use cases, positioning, quick-start signals, and "vibe coding" fit.
- Keep historical data in-repo so results are reviewable and reproducible.
- Provide a lightweight UI for filtering, reading, and triaging projects quickly.

## Why This Project Exists

GitHub trending pages are useful, but they are noisy for maintainers, indie builders, and AI-tooling explorers who need to answer practical questions fast:

- Is this project actually active?
- Who is it for?
- What problem does it solve?
- Is it worth reviewing now, or later?
- Does it fit a current workflow around coding agents, automation, or developer tooling?

`GitHub Explorer` turns raw repository discovery into a daily maintainer workflow.

## What It Does

### Daily collection

The scheduled workflow fetches four kinds of repositories:

- daily trending
- weekly trending
- rising-by-stars
- classic/high-signal repositories

### Structured interpretation

For newly discovered repositories, the pipeline reads the repository metadata and README, then writes a normalized analysis including:

- positioning
- target audience
- likely use cases
- quick-start hints
- competitor context
- category
- community activity notes
- vibe-coding score

### Review-oriented UI

The Next.js app lets you:

- browse today's trending projects
- switch between weekly, new-stars, vibe-coding, classic, and favorites views
- search across descriptions and analysis fields
- sort by stars, activity, creation time, and vibe-coding score
- mark repositories as favorite or read

## Stack

- Next.js 16
- React 19
- TypeScript
- GitHub API via `@octokit/rest`
- OpenAI-compatible model backends for structured analysis
- GitHub Actions for scheduled updates

## Quick Start

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment

Create a local `.env.local` file if you want to run analysis locally:

```bash
GITHUB_TOKEN=your_github_token
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

`GITHUB_TOKEN` is used for repository search and metadata.

`AI_PROVIDER` selects the analysis backend. Supported values currently include:

- `gemini`
- `vertex-gemini`
- `deepseek`
- `openai`
- `openrouter`

Repository defaults:

- daily update workflow defaults to `deepseek`
- manual `re-analyze` workflow defaults to `vertex-gemini`

`GEMINI_API_KEY` is used when `AI_PROVIDER=gemini`.

`vertex-gemini` uses Vertex AI with Application Default Credentials instead of an API key. Authenticate locally with `gcloud auth application-default login`, or set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON file. The project/location can be provided via `VERTEX_GEMINI_PROJECT` / `VERTEX_GEMINI_LOCATION` or the standard `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` environment variables.

Optional provider-specific keys:

```bash
GEMINI_API_KEY=your_gemini_api_key
VERTEX_GEMINI_PROJECT=your_google_cloud_project_id
VERTEX_GEMINI_LOCATION=us-central1
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
AI_MODEL=optional_model_override
```

`AI_MODEL` can override the default model configured for the selected provider.

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev`: start the local Next.js app
- `npm run build`: generate version metadata and build production assets
- `npm run start`: run the production build
- `npm run lint`: run ESLint
- `npm run test`: run repository unit tests

## Maintainer Workflows

### Scheduled daily refresh

`.github/workflows/daily-update.yml` runs every day and:

1. fetches candidate repositories from GitHub
2. enriches new entries with structured analysis
3. updates `data/projects.json`, `data/stats.json`, and daily snapshots
4. commits generated data back to the repository

### Manual re-analysis

`.github/workflows/re-analyze.yml` lets the maintainer re-run analysis for a specific repository with `owner/repo` input.

### Continuous verification

`.github/workflows/ci.yml` validates core repository behavior on every push and pull request by running:

- install
- lint
- tests
- production build

## Data Layout

- `data/projects.json`: canonical analyzed project records
- `data/stats.json`: stats and repository health metadata
- `data/daily/*.json`: daily snapshots for trend slices
- `data/logs/*.json`: job execution logs

## Repository Structure

```text
app/
  components/     UI components
  lib/            shared types, config, data utilities, storage helpers
data/             generated project data, stats, logs, and snapshots
docs/             plans and maintainer-facing documentation
scripts/          ingestion, analysis, and utility scripts
.github/workflows automation and CI
tests/            unit tests for core utilities
```

## Contributing

Contributions are welcome, especially in these areas:

- better ranking and filtering signals
- clearer analysis prompts and validation
- additional repository health heuristics
- UX improvements for fast triage workflows
- performance and data-quality improvements

Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

If you find a vulnerability or a secret-handling issue, please use the process in [SECURITY.md](./SECURITY.md).

## Maintainer Notes

- Primary maintainer: [`@liutao773680119-cmyk`](https://github.com/liutao773680119-cmyk)
- Repository control is documented in [`CODEOWNERS`](./.github/CODEOWNERS)
- Project operation notes for applications and repository stewardship live in [docs/maintainer-brief.md](./docs/maintainer-brief.md)
- System design is summarized in [docs/architecture.md](./docs/architecture.md)
- Workflow operation guidance is documented in [docs/operations.md](./docs/operations.md)

## Roadmap

- Add more explainable ranking signals beyond stars
- Support multi-model analysis backends behind a stable interface
- Expose snapshot history directly in the UI
- Add regression tests around pipeline JSON contracts
- Make generated project insights easier to export and share

## Status

This repository is actively maintained. The public workflows, generated daily data, and CI checks are intended to make maintenance visible rather than implicit.
