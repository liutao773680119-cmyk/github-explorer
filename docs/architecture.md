# Architecture Overview

## Goal

`github-explorer` is designed to make GitHub repository discovery reviewable, filterable, and maintainable.

It has two main responsibilities:

1. collect and enrich repository data
2. present that data in a lightweight review UI

## System Shape

### 1. Data ingestion

The ingestion pipeline lives under `scripts/`.

Primary entrypoints:

- `scripts/fetch-and-analyze.ts`
- `scripts/re-analyze.ts`

Responsibilities:

- search GitHub for candidate repositories
- fetch repository stats and README content
- call the configured model backend for structured analysis
- write canonical JSON outputs under `data/`

### 2. Canonical data

Tracked JSON files are part of the product contract:

- `data/projects.json`
- `data/stats.json`
- `data/daily/*.json`
- `data/logs/*.json`

The application reads these files directly at build time or request time, which keeps the product simple to deploy and easy to audit.

### 3. Frontend application

The UI lives under `app/`.

Key modules:

- `app/page.tsx`: loads the latest data snapshot
- `app/components/HomePage.tsx`: client-side filtering and view state
- `app/lib/data.ts`: deterministic merge, search, sort, and tab filtering logic
- `app/lib/types.ts`: JSON contracts and shared application types

### 4. Automation

GitHub Actions is the operational backbone:

- `daily-update.yml` keeps repository data fresh
- `re-analyze.yml` supports maintainer-triggered reprocessing
- `ci.yml` verifies lint, tests, and build behavior

## Design Principles

- Keep the pipeline inspectable.
- Favor tracked outputs over hidden state.
- Put deterministic logic in pure utilities where tests are cheap.
- Keep maintainer workflows explicit and documented.
- Optimize for low-friction stewardship of a public repository.
